from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Order, Restaurant, RestaurantStatus, Feedback
from ..schemas import (
    RejectOrderRequest,
    RestaurantOrderResponse,
    RestaurantProfileResponse,
    RestaurantSingleOrderResponse,
    RestaurantProfileUpdate,
    RestaurantMenuUpdate,
    FeedbackResponse,
)
from ..utils.auth import get_current_restaurant

router = APIRouter(prefix="/restaurant", tags=["restaurant"])


@router.get("/orders", response_model=list[RestaurantOrderResponse])
def get_restaurant_orders(db: Session = Depends(get_db), restaurant_user=Depends(get_current_restaurant)):
    restaurant: Restaurant = restaurant_user.restaurant
    if restaurant.status != RestaurantStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Restaurant is not approved to view orders",
        )
    orders = db.query(Order).filter(Order.restaurant_id == restaurant.id).all()
    result: list[RestaurantOrderResponse] = []
    for o in orders:
        result.append(
            RestaurantOrderResponse(
                order_id=o.id,
                customer_name=o.customer.name,
                arrival_time=o.arrival_time,
                people=o.number_of_people,
                items=o.items,
                total=o.total_amount,
                status=o.status,
            )
        )
    return result


@router.post("/order/{order_id}/accept")
def accept_order(order_id: int, db: Session = Depends(get_db), restaurant_user=Depends(get_current_restaurant)):
    restaurant: Restaurant = restaurant_user.restaurant
    order = db.query(Order).filter(Order.id == order_id, Order.restaurant_id == restaurant.id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.status != "PENDING":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order cannot be accepted (not pending)")
    order.status = "ACCEPTED"
    db.commit()
    return {"message": "Order accepted"}


@router.post("/order/{order_id}/reject")
def reject_order(
    order_id: int,
    payload: RejectOrderRequest,
    db: Session = Depends(get_db),
    restaurant_user=Depends(get_current_restaurant),
):
    restaurant: Restaurant = restaurant_user.restaurant
    order = db.query(Order).filter(Order.id == order_id, Order.restaurant_id == restaurant.id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    if order.status != "PENDING":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Order cannot be rejected (not pending)")
    order.status = "REJECTED"
    db.commit()
    return {"message": "Order rejected"}


@router.get("/profile", response_model=RestaurantProfileResponse)
def get_restaurant_profile(db: Session = Depends(get_db), restaurant_user=Depends(get_current_restaurant)):
    restaurant: Restaurant = restaurant_user.restaurant
    orders = db.query(Order).filter(Order.restaurant_id == restaurant.id).all()
    revenue = sum(o.total_amount for o in orders if o.payment_status == "COMPLETED")
    pending_orders = sum(1 for o in orders if o.status == "PENDING")
    accepted_orders = sum(1 for o in orders if o.status == "ACCEPTED")
    rejected_orders = sum(1 for o in orders if o.status == "REJECTED")
    completed_orders = sum(1 for o in orders if o.status == "COMPLETED")
    average_order_value = revenue / completed_orders if completed_orders > 0 else 0.0
    decision_total = accepted_orders + rejected_orders
    acceptance_rate = (accepted_orders / decision_total * 100.0) if decision_total > 0 else 0.0
    member_since = restaurant.user.created_at

    # Ensure menu is always a dict with at least an empty categories list
    raw_menu = restaurant.menu or {}
    if not isinstance(raw_menu, dict):
        raw_menu = {}
    safe_menu = {"categories": raw_menu.get("categories", [])}

    return RestaurantProfileResponse(
        restaurant_name=restaurant.restaurant_name,
        business_phone=restaurant.business_phone,
        address=restaurant.address,
        city=restaurant.city,
        state=restaurant.state,
        pincode=restaurant.pincode,
        opening_time=restaurant.opening_time,
        closing_time=restaurant.closing_time,
        is_visible=restaurant.is_visible,
        revenue=revenue,
        orders_count=len(orders),
        status=restaurant.status,
        pending_orders=pending_orders,
        accepted_orders=accepted_orders,
        rejected_orders=rejected_orders,
        completed_orders=completed_orders,
        acceptance_rate=acceptance_rate,
        average_order_value=average_order_value,
        member_since=member_since,
        menu=safe_menu,
    )


@router.put("/profile", response_model=RestaurantProfileResponse)
def update_restaurant_profile(
    payload: RestaurantProfileUpdate,
    db: Session = Depends(get_db),
    restaurant_user=Depends(get_current_restaurant),
):
    restaurant: Restaurant = restaurant_user.restaurant
    restaurant.restaurant_name = payload.restaurant_name
    restaurant.business_phone = payload.business_phone
    restaurant.state = payload.state
    # Normalize city to Title Case for consistency
    restaurant.city = payload.city.title()
    restaurant.address = payload.address
    restaurant.pincode = payload.pincode
    restaurant.opening_time = payload.opening_time
    restaurant.closing_time = payload.closing_time
    restaurant.is_visible = payload.is_visible

    db.commit()
    db.refresh(restaurant)

    return get_restaurant_profile(db=db, restaurant_user=restaurant_user)


@router.put("/menu", response_model=RestaurantProfileResponse)
def update_restaurant_menu(
    payload: RestaurantMenuUpdate,
    db: Session = Depends(get_db),
    restaurant_user=Depends(get_current_restaurant),
):
    restaurant: Restaurant = restaurant_user.restaurant
    restaurant.menu = payload.menu
    db.commit()
    db.refresh(restaurant)

    return get_restaurant_profile(db=db, restaurant_user=restaurant_user)


@router.get("/order/{order_id}", response_model=RestaurantSingleOrderResponse)
def get_restaurant_order(order_id: int, db: Session = Depends(get_db), restaurant_user=Depends(get_current_restaurant)):
    restaurant: Restaurant = restaurant_user.restaurant
    if restaurant.status != RestaurantStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Restaurant is not approved to view orders",
        )

    order = db.query(Order).filter(Order.id == order_id, Order.restaurant_id == restaurant.id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    return RestaurantSingleOrderResponse(
        order_id=order.id,
        customer_name=order.customer.name,
        customer_phone=order.customer.phone,
        created_at=order.created_at,
        arrival_time=order.arrival_time,
        people=order.number_of_people,
        items=order.items,
        total=order.total_amount,
        status=order.status,
        payment_status=order.payment_status,
    )


@router.get("/orders/{order_id}/feedback", response_model=FeedbackResponse)
def get_order_feedback_for_restaurant(
    order_id: int,
    db: Session = Depends(get_db),
    restaurant_user=Depends(get_current_restaurant),
):
    """Allow a restaurant to view feedback left for one of its orders.

    The restaurant must own the order. If no feedback exists, return 404.
    """

    restaurant: Restaurant = restaurant_user.restaurant
    order = (
        db.query(Order)
        .filter(Order.id == order_id, Order.restaurant_id == restaurant.id)
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
