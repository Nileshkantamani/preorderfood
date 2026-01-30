from datetime import datetime, timedelta
import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Customer, EmailOTP, Restaurant, RestaurantStatus, User, UserRole
from ..schemas import (
    ChangeEmailRequest,
    ChangePasswordStartRequest,
    ChangePasswordVerifyRequest,
    ChangePhoneRequest,
    CustomerRegisterRequest,
    EmailVerificationRequest,
    ErrorResponse,
    ForgotPasswordRequest,
    LoginRequest,
    ResetPasswordRequest,
    ResendVerificationRequest,
    RestaurantRegisterRequest,
    Token,
    VerifyChangeEmailRequest,
    VerifyChangePhoneRequest,
)
from ..utils.auth import create_access_token, get_current_user, hash_password, verify_password
from ..utils.email import send_otp_email

router = APIRouter(prefix="/auth", tags=["auth"])


OTP_EXPIRY_MINUTES = 10
OTP_ATTEMPT_LIMIT = 5
OTP_RESEND_LIMIT = 3


def _generate_otp_code() -> str:
    # Secure random 4-digit numeric code.
    return "".join(str(secrets.randbelow(10)) for _ in range(4))


def _create_or_replace_otp(db: Session, user: User, purpose: str, override_email: str | None = None) -> None:
    """Create a new OTP for the user and purpose, invalidating previous ones.

    If ``override_email`` is provided, the OTP email is sent to that address
    instead of the user's currently registered email. The OTP itself is still
    stored against the user and purpose only, so DB schema remains unchanged.
    """
    # Invalidate previous OTPs for this user/purpose
    db.query(EmailOTP).filter(
        EmailOTP.user_id == user.id,
        EmailOTP.purpose == purpose,
        EmailOTP.consumed.is_(False),
    ).update({EmailOTP.consumed: True}, synchronize_session=False)

    code = _generate_otp_code()
    expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)

    otp = EmailOTP(
        user_id=user.id,
        code=code,
        purpose=purpose,
        expires_at=expires_at,
        attempts=0,
        resend_count=0,
        consumed=False,
    )
    db.add(otp)
    db.flush()

    # Send without exposing the code via API.
    to_email = override_email or user.email
    send_otp_email(to_email, code, purpose)


def _get_active_otp(db: Session, user: User, purpose: str) -> EmailOTP | None:
    return (
        db.query(EmailOTP)
        .filter(
            EmailOTP.user_id == user.id,
            EmailOTP.purpose == purpose,
            EmailOTP.consumed.is_(False),
        )
        .order_by(EmailOTP.created_at.desc())
        .first()
    )


@router.post("/register/customer", responses={400: {"model": ErrorResponse}})
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
        is_verified=False,
    )
    db.add(user)
    db.flush()

    customer = Customer(id=user.id, name=payload.name, phone=payload.phone)
    db.add(customer)
    db.commit()
    db.refresh(user)

    # Create and send verification OTP.
    _create_or_replace_otp(db, user, purpose="verify_email")
    db.commit()

    return {
        "message": "Registration successful. Please verify your email using the OTP sent.",
        "email": user.email,
    }


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
        is_verified=False,
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

    # Send verification OTP to restaurant owner email.
    _create_or_replace_otp(db, user, purpose="verify_email")
    db.commit()

    return {
        "message": "Restaurant registration submitted. Please verify your email using the OTP sent.",
        "restaurant_id": restaurant.id,
        "status": restaurant.status,
        "email": user.email,
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


@router.post("/verify-email")
def verify_email(payload: EmailVerificationRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        # Do not reveal whether the email exists.
        return {"message": "If an account exists, it will be verified when a valid code is provided."}

    otp = _get_active_otp(db, user, purpose="verify_email")
    if not otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "OTP_REQUIRED", "message": "No active verification code. Please request a new one."},
        )

    if datetime.utcnow() > otp.expires_at:
        otp.consumed = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "OTP_EXPIRED", "message": "Verification code has expired."},
        )

    if otp.attempts >= OTP_ATTEMPT_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "OTP_ATTEMPT_LIMIT", "message": "Too many incorrect attempts. Please request a new code."},
        )

    if otp.code != payload.code:
        otp.attempts += 1
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "OTP_INCORRECT", "message": "Incorrect verification code."},
        )

    # Successful verification
    otp.consumed = True
    user.is_verified = True
    db.commit()

    return {"message": "Email verified successfully."}


@router.post("/resend-verification")
def resend_verification(payload: ResendVerificationRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        # Do not reveal whether the email exists.
        return {"message": "If an account exists and is not verified, a new code has been sent."}

    if user.is_verified:
        return {"message": "Email already verified."}

    otp = _get_active_otp(db, user, purpose="verify_email")
    if otp and otp.resend_count >= OTP_RESEND_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "OTP_RESEND_LIMIT", "message": "Resend limit reached. Please try again later."},
        )

    # Either there is no active OTP or resend is within limit; create a new one.
    _create_or_replace_otp(db, user, purpose="verify_email")

    # Track resend count on the newest OTP
    latest = _get_active_otp(db, user, purpose="verify_email")
    if latest:
        latest.resend_count = (latest.resend_count or 0) + 1
    db.commit()

    return {"message": "If an account exists and is not verified, a new code has been sent."}


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if user:
        _create_or_replace_otp(db, user, purpose="reset_password")
        db.commit()

    # Always respond generically.
    return {"message": "If an account exists for this email, a reset code has been sent."}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        # Generic response to avoid email enumeration.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_RESET", "message": "Invalid email or code."},
        )

    otp = _get_active_otp(db, user, purpose="reset_password")
    if not otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "OTP_REQUIRED", "message": "No active reset code. Please request a new one."},
        )

    if datetime.utcnow() > otp.expires_at:
        otp.consumed = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "OTP_EXPIRED", "message": "Reset code has expired."},
        )

    if otp.attempts >= OTP_ATTEMPT_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "OTP_ATTEMPT_LIMIT", "message": "Too many incorrect attempts. Please request a new code."},
        )

    if otp.code != payload.code:
        otp.attempts += 1
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "OTP_INCORRECT", "message": "Incorrect reset code."},
        )

    # Success: update password and consume OTP.
    user.password_hash = hash_password(payload.new_password)
    otp.consumed = True
    db.commit()

    return {"message": "Password reset successfully."}


@router.post("/profile/change-email/request")
def request_change_email(
    payload: ChangeEmailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Do not allow using the same email
    new_email = payload.new_email
    if new_email == current_user.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "EMAIL_SAME_AS_CURRENT",
                "message": "New email must be different from current email.",
                "field": "new_email",
            },
        )

    # Ensure email is not already taken
    existing = db.query(User).filter(User.email == new_email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "EMAIL_EXISTS",
                "message": "Email already registered",
                "field": "new_email",
            },
        )

    # Send OTP to the NEW email address while associating it with the current user
    _create_or_replace_otp(db, current_user, purpose="change_email", override_email=new_email)
    db.commit()

    return {"message": "If the email is valid, a verification code has been sent to it."}


@router.post("/profile/change-email/verify")
def verify_change_email(
    payload: VerifyChangeEmailRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_email = payload.new_email

    # Ensure target email is not already taken by someone else
    existing = db.query(User).filter(User.email == new_email, User.id != current_user.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "EMAIL_EXISTS",
                "message": "Email already registered",
                "field": "new_email",
            },
        )

    otp = _get_active_otp(db, current_user, purpose="change_email")
    if not otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "OTP_REQUIRED", "message": "No active code. Please request a new one."},
        )

    if datetime.utcnow() > otp.expires_at:
        otp.consumed = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "OTP_EXPIRED", "message": "Verification code has expired."},
        )

    if otp.attempts >= OTP_ATTEMPT_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "OTP_ATTEMPT_LIMIT",
                "message": "Too many incorrect attempts. Please request a new code.",
            },
        )

    if otp.code != payload.code:
        otp.attempts += 1
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "OTP_INCORRECT", "message": "Incorrect verification code."},
        )

    # Success: update email on user and consume OTP
    current_user.email = new_email
    otp.consumed = True
    db.commit()

    return {"message": "Email updated successfully."}


@router.post("/profile/change-phone/request")
def request_change_phone(
    payload: ChangePhoneRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Basic validation already enforced by schema; ensure numeric only
    if not payload.new_phone.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_PHONE",
                "message": "Phone must contain only digits.",
                "field": "new_phone",
            },
        )

    # OTP goes to currently registered email
    _create_or_replace_otp(db, current_user, purpose="change_phone")
    db.commit()

    return {"message": "If the request is valid, a verification code has been sent to your email."}


@router.post("/profile/change-phone/verify")
def verify_change_phone(
    payload: VerifyChangePhoneRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not payload.new_phone.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_PHONE",
                "message": "Phone must contain only digits.",
                "field": "new_phone",
            },
        )

    otp = _get_active_otp(db, current_user, purpose="change_phone")
    if not otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "OTP_REQUIRED", "message": "No active code. Please request a new one."},
        )

    if datetime.utcnow() > otp.expires_at:
        otp.consumed = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "OTP_EXPIRED", "message": "Verification code has expired."},
        )

    if otp.attempts >= OTP_ATTEMPT_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "OTP_ATTEMPT_LIMIT",
                "message": "Too many incorrect attempts. Please request a new code.",
            },
        )

    if otp.code != payload.code:
        otp.attempts += 1
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "OTP_INCORRECT", "message": "Incorrect verification code."},
        )

    # Success: update phone number on the related profile and consume OTP.
    if current_user.role == UserRole.CUSTOMER and current_user.customer is not None:
        current_user.customer.phone = payload.new_phone
    elif current_user.role == UserRole.RESTAURANT and current_user.restaurant is not None:
        current_user.restaurant.business_phone = payload.new_phone
    else:
        # For roles without a phone field, just consume OTP without changes.
        otp.consumed = True
        db.commit()
        return {"message": "Phone change not applicable for this user."}

    otp.consumed = True
    db.commit()

    return {"message": "Phone updated successfully."}


@router.post("/profile/change-password/request")
def request_change_password(
    payload: ChangePasswordStartRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate current password before sending OTP
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "INVALID_CURRENT_PASSWORD",
                "message": "Current password is incorrect.",
                "field": "current_password",
            },
        )

    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "PASSWORD_TOO_SHORT",
                "message": "New password must be at least 8 characters.",
                "field": "new_password",
            },
        )

    _create_or_replace_otp(db, current_user, purpose="change_password")
    db.commit()

    return {"message": "If the credentials are valid, a verification code has been sent to your email."}


@router.post("/profile/change-password/verify")
def verify_change_password(
    payload: ChangePasswordVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if len(payload.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "PASSWORD_TOO_SHORT",
                "message": "New password must be at least 8 characters.",
                "field": "new_password",
            },
        )

    otp = _get_active_otp(db, current_user, purpose="change_password")
    if not otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "OTP_REQUIRED", "message": "No active code. Please request a new one."},
        )

    if datetime.utcnow() > otp.expires_at:
        otp.consumed = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "OTP_EXPIRED", "message": "Verification code has expired."},
        )

    if otp.attempts >= OTP_ATTEMPT_LIMIT:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "OTP_ATTEMPT_LIMIT",
                "message": "Too many incorrect attempts. Please request a new code.",
            },
        )

    if otp.code != payload.code:
        otp.attempts += 1
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "OTP_INCORRECT", "message": "Incorrect verification code."},
        )

    # Success: update password and consume OTP
    current_user.password_hash = hash_password(payload.new_password)
    otp.consumed = True
    db.commit()

    return {"message": "Password updated successfully."}
