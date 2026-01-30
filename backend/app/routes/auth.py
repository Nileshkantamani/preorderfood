from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Customer, Restaurant, RestaurantStatus, User, UserRole
from ..schemas import (
    CustomerRegisterRequest,
    ErrorResponse,
    LoginRequest,
    RestaurantRegisterRequest,
    Token,
)
from ..utils.auth import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register/customer", response_model=Token, responses={400: {"model": ErrorResponse}})
def register_customer(payload: CustomerRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "VALIDATION_ERROR",
                "message": "Email already exists",
                "field": "email",
            },
        )

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=UserRole.CUSTOMER,
    )
    db.add(user)
    db.flush()

    customer = Customer(id=user.id, name=payload.name, phone=payload.phone)
    db.add(customer)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.id, "role": user.role})

    return {"token": token, "user": {"id": user.id, "role": user.role}, "role": user.role}


@router.post("/register/restaurant", responses={400: {"model": ErrorResponse}})
def register_restaurant(payload: RestaurantRegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "EMAIL_EXISTS",
                "message": "Email already registered",
                "field": "email",
            },
        )

    # Basic phone and pincode validation (length already enforced by schema)
    if not payload.phone.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "VALIDATION_ERROR",
                "message": "Phone must contain only digits",
                "field": "phone",
            },
        )

    if not payload.pincode.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "VALIDATION_ERROR",
                "message": "Pincode must contain only digits",
                "field": "pincode",
            },
        )

    # Validate opening and closing time: closing must be after opening
    try:
        open_parts = [int(x) for x in payload.opening_time.split(":")[:2]]
        close_parts = [int(x) for x in payload.closing_time.split(":")[:2]]
        open_minutes = open_parts[0] * 60 + open_parts[1]
        close_minutes = close_parts[0] * 60 + close_parts[1]
        if close_minutes <= open_minutes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "VALIDATION_ERROR",
                    "message": "Closing time must be after opening time",
                    "field": "closing_time",
                },
            )
    except (ValueError, IndexError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "VALIDATION_ERROR",
                "message": "Invalid time format",
                "field": "opening_time",
            },
        )

    # Basic menu validation: at least one category and one item per category, prices > 0
    menu = payload.menu or {}
    categories = menu.get("categories") or []
    if not categories:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_MENU",
                "message": "At least one category is required",
                "field": "menu",
            },
        )

    category_names = set()
    for cat in categories:
        name = (cat.get("name") or "").strip()
        if len(name) < 2:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INVALID_MENU",
                    "message": "Category name must be at least 2 characters",
                    "field": "menu",
                },
            )
        if name in category_names:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INVALID_MENU",
                    "message": "Duplicate category name",
                    "field": "menu",
                },
            )
        category_names.add(name)

        items = cat.get("items") or []
        if not items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "INVALID_MENU",
                    "message": "Each category must have at least one item",
                    "field": "menu",
                },
            )
        item_names = set()
        for item in items:
            item_name = (item.get("name") or "").strip()
            if len(item_name) < 2:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "code": "INVALID_MENU",
                        "message": "Item name must be at least 2 characters",
                        "field": "menu",
                    },
                )
            if item_name in item_names:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "code": "INVALID_MENU",
                        "message": "Duplicate item name in category",
                        "field": "menu",
                    },
                )
            item_names.add(item_name)

            price = item.get("price")
            if not isinstance(price, int) or price <= 0 or price > 99999:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail={
                        "code": "INVALID_MENU",
                        "message": "Item price must be a positive integer",
                        "field": "menu",
                    },
                )

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        role=UserRole.RESTAURANT,
    )
    db.add(user)
    db.flush()

    restaurant = Restaurant(
        id=user.id,
        restaurant_name=payload.restaurant_name,
        business_phone=payload.phone,
        state=payload.state,
        city=payload.city,
        address=payload.address,
        pincode=payload.pincode,
        opening_time=payload.opening_time,
        closing_time=payload.closing_time,
        menu=payload.menu,
        status=RestaurantStatus.PENDING,
    )
    db.add(restaurant)
    db.commit()
    db.refresh(restaurant)

    return {
        "message": "Restaurant registration submitted for approval",
        "restaurant_id": restaurant.id,
        "status": restaurant.status,
    }


@router.post("/login", response_model=Token, responses={401: {"model": ErrorResponse}})
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "INVALID_CREDENTIALS",
                "message": "Invalid email or password",
                "field": "email",
            },
        )

    # Enforce restaurant approval before issuing a token. Restaurants with
    # status other than APPROVED are not allowed to log in.
    if user.role == UserRole.RESTAURANT and user.restaurant is not None:
        if user.restaurant.status != RestaurantStatus.APPROVED:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "RESTAURANT_NOT_APPROVED",
                    "message": "Restaurant not approved yet",
                },
            )

    token = create_access_token({"sub": user.id, "role": user.role})
    user_payload: dict = {"id": user.id, "email": user.email, "role": user.role}

    # Enrich restaurant user payload with name and status for frontend
    # redirects. At this point the restaurant is guaranteed to be APPROVED
    # because of the guard above.
    if user.role == UserRole.RESTAURANT and user.restaurant is not None:
        user_payload["restaurant_name"] = user.restaurant.restaurant_name
        user_payload["status"] = user.restaurant.status

    return {"token": token, "user": user_payload, "role": user.role}
