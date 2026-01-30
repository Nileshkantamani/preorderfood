from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field

from .models import OrderStatus, PaymentStatus, RestaurantStatus, UserRole


class Token(BaseModel):
    token: str
    user: dict
    role: str


class ErrorResponse(BaseModel):
    class ErrorDetail(BaseModel):
        code: str
        message: str
        field: Optional[str] = None

    error: ErrorDetail


class CustomerRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=10)
    password: str = Field(..., min_length=8)


class RestaurantMenuItem(BaseModel):
    name: str
    price: int = Field(..., gt=0)


class RestaurantMenuCategory(BaseModel):
    name: str
    items: List[RestaurantMenuItem]


class RestaurantRegisterRequest(BaseModel):
    restaurant_name: str = Field(..., min_length=3, max_length=100)
    phone: str = Field(..., min_length=10, max_length=10)
    state: str
    city: str
    address: str
    pincode: str = Field(..., min_length=6, max_length=6)
    opening_time: str
    closing_time: str
    email: EmailStr
    password: str = Field(..., min_length=8)
    menu: dict


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RestaurantSummary(BaseModel):
    id: int
    restaurant_name: str
    city: str
    business_phone: str
    opening_time: str
    closing_time: str

    class Config:
        from_attributes = True


class AdminRestaurantDetail(BaseModel):
    id: int
    restaurant_name: str
    business_phone: str
    state: str
    city: str
    address: str
    pincode: str
    opening_time: str
    closing_time: str
    status: str
    created_at: datetime
    menu: dict
    rejection_reason: Optional[str] = None

    class Config:
        from_attributes = True


class PendingRestaurant(BaseModel):
    id: int
    restaurant_name: str
    city: str
    business_phone: str
    status: str
    created_at: datetime
    menu: dict

    class Config:
        from_attributes = True


class OrderItem(BaseModel):
    item_name: str
    quantity: int
    price: int


class CreateOrderRequest(BaseModel):
    restaurant_id: int
    arrival_time: datetime
    people: int = Field(..., ge=1, le=20)
    items: List[OrderItem]
    total: int


class OrderResponse(BaseModel):
    order_id: int
    restaurant_name: str
    items: list
    total: int
    status: str

    # Feedback flags
    can_give_feedback: bool = False
    has_feedback: bool = False


class RestaurantOrderResponse(BaseModel):
    order_id: int
    customer_name: str
    arrival_time: datetime
    people: int
    items: list
    total: int
    status: str


class RestaurantSingleOrderResponse(BaseModel):
    order_id: int
    customer_name: str
    customer_phone: str
    created_at: datetime
    arrival_time: datetime
    people: int
    items: list
    total: int
    status: str
    payment_status: str


class PaymentRequest(BaseModel):
    order_id: int
    amount: int
    method: str


class PaymentResponse(BaseModel):
    status: str


class RejectRestaurantRequest(BaseModel):
    reason: str = Field(..., min_length=3)


class RejectOrderRequest(BaseModel):
    reason: str = Field(..., min_length=10, max_length=500)


class CustomerProfileResponse(BaseModel):
    name: str
    email: EmailStr
    phone: str


class RestaurantProfileResponse(BaseModel):
    restaurant_name: str
    business_phone: str
    address: str
    city: str
    state: str
    pincode: str
    revenue: int
    orders_count: int
    status: str
    pending_orders: int
    accepted_orders: int
    rejected_orders: int
    completed_orders: int
    acceptance_rate: float
    average_order_value: float
    member_since: datetime
    menu: dict


class RestaurantProfileUpdate(BaseModel):
    restaurant_name: str
    business_phone: str
    state: str
    city: str
    address: str
    pincode: str
    opening_time: str
    closing_time: str


class RestaurantMenuUpdate(BaseModel):
    menu: dict


class FeedbackCreate(BaseModel):
    restaurant_rating: int = Field(..., ge=1, le=5)
    food_rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = None


class FeedbackResponse(BaseModel):
    order_id: int
    restaurant_id: int
    restaurant_rating: int
    food_rating: int
    comment: Optional[str] = None
    created_at: datetime


class RestaurantRatingsSummary(BaseModel):
    restaurant_id: int
    average_restaurant_rating: float
    average_food_rating: float
    total_feedback_count: int

