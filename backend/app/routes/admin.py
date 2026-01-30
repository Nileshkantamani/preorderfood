from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Restaurant, RestaurantStatus, User, Order, Customer, Feedback, OrderStatus
from ..schemas import (
    AdminRestaurantDetail,
    PendingRestaurant,
    RejectRestaurantRequest,
    AdminRestaurantUpdate,
    AdminUserSummary,
    RestaurantMenuUpdate,
    AdminOrderSummary,
)
from ..utils.auth import get_current_admin, get_current_user

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/pending-restaurants", response_model=list[PendingRestaurant])
def get_pending_restaurants(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    restaurants = (
        db.query(Restaurant)
        .filter(Restaurant.status == RestaurantStatus.PENDING)
        .order_by(Restaurant.created_at.desc())
        .all()
    )
    return restaurants


@router.get("/restaurants/{restaurant_id}", response_model=AdminRestaurantDetail)
def get_restaurant_detail(restaurant_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")
    return restaurant


@router.get("/restaurants", response_model=list[AdminRestaurantDetail])
def list_all_restaurants(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    restaurants = db.query(Restaurant).order_by(Restaurant.created_at.desc()).all()
    return restaurants


@router.post("/approve/{restaurant_id}")
def approve_restaurant(restaurant_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")
    restaurant.status = RestaurantStatus.APPROVED
    db.commit()
    return {"message": "Approved"}


@router.post("/reject/{restaurant_id}")
def reject_restaurant(
    restaurant_id: int,
    payload: RejectRestaurantRequest,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")
    restaurant.status = RestaurantStatus.REJECTED
    restaurant.rejection_reason = payload.reason
    db.commit()
    return {"message": "Rejected"}


@router.put("/restaurants/{restaurant_id}", response_model=AdminRestaurantDetail)
def update_restaurant_as_admin(
    restaurant_id: int,
    payload: AdminRestaurantUpdate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")

    restaurant.restaurant_name = payload.restaurant_name
    restaurant.business_phone = payload.business_phone
    restaurant.state = payload.state
    restaurant.city = payload.city
    restaurant.address = payload.address
    restaurant.pincode = payload.pincode
    restaurant.opening_time = payload.opening_time
    restaurant.closing_time = payload.closing_time
    restaurant.status = payload.status
    restaurant.is_visible = payload.is_visible

    db.commit()
    db.refresh(restaurant)
    return restaurant


@router.put("/restaurants/{restaurant_id}/menu", response_model=AdminRestaurantDetail)
def update_restaurant_menu_as_admin(
    restaurant_id: int,
    payload: RestaurantMenuUpdate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    restaurant = db.query(Restaurant).filter(Restaurant.id == restaurant_id).first()
    if not restaurant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Restaurant not found")

    restaurant.menu = payload.menu
    db.commit()
    db.refresh(restaurant)
    return restaurant


@router.get("/users", response_model=list[AdminUserSummary])
def list_users(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return users


@router.delete("/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.role == "admin":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete admin users")

    # Find related customer/restaurant and their orders
    customer = db.query(Customer).filter(Customer.id == user.id).first()
    restaurant = db.query(Restaurant).filter(Restaurant.id == user.id).first()

    order_query = db.query(Order)
    if customer:
        order_query = order_query.filter(Order.customer_id == customer.id)
    if restaurant:
        order_query = order_query.union(
            db.query(Order).filter(Order.restaurant_id == restaurant.id)
        )
    orders = order_query.all()
    order_ids = [o.id for o in orders]

    if order_ids:
        db.query(Feedback).filter(Feedback.order_id.in_(order_ids)).delete(synchronize_session=False)
        db.query(Order).filter(Order.id.in_(order_ids)).delete(synchronize_session=False)

    if customer:
        db.delete(customer)
    if restaurant:
        db.delete(restaurant)

    db.delete(user)
    db.commit()
    return {"message": "User and related data deleted"}


@router.get("/orders", response_model=list[AdminOrderSummary])
def list_orders(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    orders = db.query(Order).order_by(Order.created_at.desc()).all()
    return orders


@router.delete("/orders/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    db.query(Feedback).filter(Feedback.order_id == order.id).delete(synchronize_session=False)
    db.delete(order)
    db.commit()
    return {"message": "Order deleted"}


@router.post("/orders/{order_id}/approve")
def approve_order(order_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    order.status = OrderStatus.ACCEPTED
    db.commit()
    db.refresh(order)
    return order


@router.post("/orders/{order_id}/reject")
def reject_order(order_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    order.status = OrderStatus.REJECTED
    db.commit()
    db.refresh(order)
    return order


@router.get("/users/{user_id}/orders", response_model=list[AdminOrderSummary])
def list_orders_for_user(user_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    """Return all orders related to a given user (either as customer or restaurant)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Customers and restaurants share the same id as the user record
    customer = db.query(Customer).filter(Customer.id == user.id).first()
    restaurant = db.query(Restaurant).filter(Restaurant.id == user.id).first()

    query = db.query(Order)
    if customer and restaurant:
        # Extremely rare, but if both exist, include both sets of orders
        query = query.filter(
            (Order.customer_id == customer.id) | (Order.restaurant_id == restaurant.id)
        )
    elif customer:
        query = query.filter(Order.customer_id == customer.id)
    elif restaurant:
        query = query.filter(Order.restaurant_id == restaurant.id)
    else:
        # User exists but has no customer/restaurant profile; no orders
        return []

    orders = query.order_by(Order.created_at.desc()).all()
    return orders


# Optional: Test endpoint to verify JWT auth is working
@router.get("/test-auth")
def test_auth(current_user: User = Depends(get_current_user)):
    return {
        "message": "Auth works!",
        "user_id": current_user.id,
        "role": current_user.role,
        "email": current_user.email
    }