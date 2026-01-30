from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Restaurant, RestaurantStatus, User
from ..schemas import AdminRestaurantDetail, PendingRestaurant, RejectRestaurantRequest
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


# Optional: Test endpoint to verify JWT auth is working
@router.get("/test-auth")
def test_auth(current_user: User = Depends(get_current_user)):
    return {
        "message": "Auth works!",
        "user_id": current_user.id,
        "role": current_user.role,
        "email": current_user.email
    }