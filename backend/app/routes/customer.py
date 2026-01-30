from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Customer, Order, Restaurant, RestaurantStatus, Feedback
from ..schemas import (
    CreateOrderRequest,
    CustomerProfileResponse,
    FeedbackCreate,
    FeedbackResponse,
    OrderResponse,
    PaymentRequest,
    PaymentResponse,
    RestaurantRatingsSummary,
    RestaurantSummary,
)
from ..utils.auth import get_current_customer

router = APIRouter(tags=["customer"])


@router.get("/restaurants", response_model=list[RestaurantSummary])
def list_restaurants(db: Session = Depends(get_db)):
    restaurants = (
        db.query(Restaurant)
        .filter(Restaurant.status == RestaurantStatus.APPROVED, Restaurant.is_visible.is_(True))
        .order_by(Restaurant.restaurant_name.asc())
        .all()
    )
    return restaurants


@router.get("/restaurants/{restaurant_id}")
def get_restaurant(restaurant_id: int, db: Session = Depends(get_db)):
    restaurant = db.query(Restaurant).filter(
        Restaurant.id == restaurant_id,
        Restaurant.status == RestaurantStatus.APPROVED,
        Restaurant.is_visible.is_(True),
    ).first()
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")
    return restaurant


@router.get("/menu/{restaurant_id}")
def get_menu(restaurant_id: int, db: Session = Depends(get_db)):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        return {"categories": []}
    return restaurant.menu


@router.post("/order", response_model=dict)
def create_order(
    payload: CreateOrderRequest,
    db: Session = Depends(get_db),
    customer=Depends(get_current_customer),
):
    # Validate restaurant exists and is approved
    restaurant = db.query(Restaurant).filter(Restaurant.id == payload.restaurant_id, Restaurant.status == RestaurantStatus.APPROVED).first()
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid restaurant")

    # Validate arrival time: future and roughly within opening/closing hours (basic check)
    now = datetime.utcnow()
    # Require at least 20 minutes lead time
    min_allowed = now + timedelta(minutes=20)
    if payload.arrival_time < min_allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Arrival time must be at least 20 minutes from now",
        )

    # Basic hour-only comparison assuming opening_time/closing_time are HH:MM
    try:
        open_h, open_m = map(int, restaurant.opening_time.split(":")[:2])
        close_h, close_m = map(int, restaurant.closing_time.split(":")[:2])
        arrival_local_hour = payload.arrival_time.hour
        arrival_local_minute = payload.arrival_time.minute
        if not ((arrival_local_hour > open_h or (arrival_local_hour == open_h and arrival_local_minute >= open_m)) and (
            arrival_local_hour < close_h or (arrival_local_hour == close_h and arrival_local_minute <= close_m)
        )):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Restaurant is closed at that time.",
            )
    except ValueError:
        # If parsing fails, skip hours validation
        pass

    if not payload.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="At least one item required")

    items_json = [item.model_dump() for item in payload.items]

    order = Order(
        customer_id=customer.customer.id,
        restaurant_id=payload.restaurant_id,
        arrival_time=payload.arrival_time,
        number_of_people=payload.people,
        items=items_json,
        total_amount=payload.total,
    )
    db.add(order)
    db.commit()
    db.refresh(order)

    return {"order_id": order.id, "status": order.status}


@router.post("/payment", response_model=PaymentResponse)
def mock_payment(
    payload: PaymentRequest,
    db: Session = Depends(get_db),
    customer=Depends(get_current_customer),
):
    order = (
        db.query(Order)
        .filter(Order.id == payload.order_id, Order.customer_id == customer.customer.id)
        .first()
    )
    if not order:
        return PaymentResponse(status="failed")

    # Mock: mark as completed if amount matches
    if payload.amount != order.total_amount:
        return PaymentResponse(status="failed")

    order.payment_status = "COMPLETED"
    db.commit()
    return PaymentResponse(status="success")


@router.get("/customer/orders", response_model=list[OrderResponse])
def get_customer_orders(db: Session = Depends(get_db), customer=Depends(get_current_customer)):
    orders = db.query(Order).filter(Order.customer_id == customer.customer.id).all()
    result: list[OrderResponse] = []
    now = datetime.utcnow()

    # Preload feedbacks for these orders
    order_ids = [o.id for o in orders]
    feedback_map: dict[int, Feedback] = {}
    if order_ids:
        feedbacks = db.query(Feedback).filter(Feedback.order_id.in_(order_ids)).all()
        feedback_map = {f.order_id: f for f in feedbacks}

    for o in orders:
        feedback = feedback_map.get(o.id)
        has_feedback = feedback is not None
        can_give_feedback = (now > o.arrival_time) and not has_feedback

        result.append(
            OrderResponse(
                order_id=o.id,
                restaurant_name=o.restaurant.restaurant_name,
                items=o.items,
                total=o.total_amount,
                status=o.status,
                can_give_feedback=can_give_feedback,
                has_feedback=has_feedback,
            )
        )
    return result


@router.get("/orders/{order_id}")
def get_single_order(order_id: int, db: Session = Depends(get_db), customer=Depends(get_current_customer)):
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.customer_id == customer.customer.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


@router.post("/customer/orders/{order_id}/feedback", response_model=FeedbackResponse)
def create_feedback(
    order_id: int,
    payload: FeedbackCreate,
    db: Session = Depends(get_db),
    customer=Depends(get_current_customer),
):
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.customer_id == customer.customer.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    # Ensure arrival time has passed
    if datetime.utcnow() <= order.arrival_time:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Feedback can be submitted only after your arrival time",
        )

    existing = db.query(Feedback).filter(Feedback.order_id == order.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Feedback for this order already exists",
        )

    fb = Feedback(
        order_id=order.id,
        customer_id=customer.customer.id,
        restaurant_id=order.restaurant_id,
        restaurant_rating=payload.restaurant_rating,
        food_rating=payload.food_rating,
        comment=payload.comment,
    )
    db.add(fb)
    db.commit()
    db.refresh(fb)

    return FeedbackResponse(
        order_id=fb.order_id,
        restaurant_id=fb.restaurant_id,
        restaurant_rating=fb.restaurant_rating,
        food_rating=fb.food_rating,
        comment=fb.comment,
        created_at=fb.created_at,
    )


@router.get("/customer/orders/{order_id}/feedback", response_model=FeedbackResponse)
def get_order_feedback(
    order_id: int,
    db: Session = Depends(get_db),
    customer=Depends(get_current_customer),
):
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.customer_id == customer.customer.id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    fb = db.query(Feedback).filter(Feedback.order_id == order.id).first()
    if not fb:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Feedback not found")

    return FeedbackResponse(
        order_id=fb.order_id,
        restaurant_id=fb.restaurant_id,
        restaurant_rating=fb.restaurant_rating,
        food_rating=fb.food_rating,
        comment=fb.comment,
        created_at=fb.created_at,
    )


@router.get("/restaurants/{restaurant_id}/ratings", response_model=RestaurantRatingsSummary)
def get_restaurant_ratings(restaurant_id: int, db: Session = Depends(get_db)):
    from sqlalchemy import func

    q = (
        db.query(
            func.avg(Feedback.restaurant_rating),
            func.avg(Feedback.food_rating),
            func.count(Feedback.id),
        )
        .filter(Feedback.restaurant_id == restaurant_id)
        .first()
    )

    avg_restaurant_rating = float(q[0] or 0.0)
    avg_food_rating = float(q[1] or 0.0)
    count = int(q[2] or 0)

    return RestaurantRatingsSummary(
        restaurant_id=restaurant_id,
        average_restaurant_rating=avg_restaurant_rating,
        average_food_rating=avg_food_rating,
        total_feedback_count=count,
    )


@router.get("/customer/profile", response_model=CustomerProfileResponse)
def get_customer_profile(db: Session = Depends(get_db), customer=Depends(get_current_customer)):
    cust: Customer = customer.customer
    return CustomerProfileResponse(name=cust.name, email=customer.email, phone=cust.phone)


@router.put("/customer/profile", response_model=CustomerProfileResponse)
def update_customer_profile(
    payload: CustomerProfileResponse,
    db: Session = Depends(get_db),
    customer=Depends(get_current_customer),
):
    cust: Customer = customer.customer
    cust.name = payload.name
    cust.phone = payload.phone
    db.commit()
    db.refresh(cust)
    return CustomerProfileResponse(name=cust.name, email=customer.email, phone=cust.phone)
