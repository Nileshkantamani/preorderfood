"""Pydantic schema definitions for the PreOrderFood backend.

This package defines all API request/response models used across the
application. It mirrors the previous ``schemas.py`` module so that
imports like ``from app.schemas import AdminRestaurantDetail`` work
consistently.
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field

from ..models import OrderStatus, PaymentStatus, RestaurantStatus, UserRole


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
    maps_link: str
    pincode: str = Field(..., min_length=6, max_length=6)
    opening_time: str
    closing_time: str
    email: EmailStr
    password: str = Field(..., min_length=8)
    menu: dict
    is_visible: bool = True


class EmailAvailabilityRequest(BaseModel):
    email: EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RestaurantSummary(BaseModel):
    id: int
    restaurant_name: str
    city: str
    address: str
    business_phone: str
    opening_time: str
    closing_time: str
    is_visible: bool
    maps_link: str


class AdminRestaurantUpdate(BaseModel):
    restaurant_name: str
    business_phone: str
    state: str
    city: str
    address: str
    pincode: str
    opening_time: str
    closing_time: str
    status: str
    is_visible: bool


class AdminUserSummary(BaseModel):
    id: int
    email: EmailStr
    role: str
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AdminOrderSummary(BaseModel):
    id: int
    customer_id: int
    restaurant_id: int
    total_amount: int
    status: str
    payment_status: str
    created_at: datetime

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
    is_visible: bool
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
    is_visible: bool

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
    restaurant_phone: str
    items: list
    total: int
    status: str

    # Feedback flags used by customer order list
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
    opening_time: str
    closing_time: str
    is_visible: bool
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
    is_visible: bool


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


class EmailVerificationRequest(BaseModel):
    email: EmailStr
    code: str


class ResendVerificationRequest(BaseModel):
    email: EmailStr


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    code: str
    new_password: str = Field(..., min_length=8)


class ChangeEmailRequest(BaseModel):
    new_email: EmailStr


class VerifyChangeEmailRequest(BaseModel):
    new_email: EmailStr
    code: str


class ChangePhoneRequest(BaseModel):
    new_phone: str = Field(..., min_length=10, max_length=10)


class VerifyChangePhoneRequest(BaseModel):
    new_phone: str = Field(..., min_length=10, max_length=10)
    code: str


class ChangePasswordStartRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8)


class ChangePasswordVerifyRequest(BaseModel):
    code: str
    new_password: str = Field(..., min_length=8)


__all__ = [
    "Token",
    "ErrorResponse",
    "CustomerRegisterRequest",
    "RestaurantMenuItem",
    "RestaurantMenuCategory",
    "RestaurantRegisterRequest",
    "LoginRequest",
    "RestaurantSummary",
    "AdminRestaurantDetail",
    "PendingRestaurant",
    "OrderItem",
    "CreateOrderRequest",
    "OrderResponse",
    "RestaurantOrderResponse",
    "RestaurantSingleOrderResponse",
    "PaymentRequest",
    "PaymentResponse",
    "RejectRestaurantRequest",
    "RejectOrderRequest",
    "CustomerProfileResponse",
    "RestaurantProfileResponse",
    "RestaurantProfileUpdate",
    "RestaurantMenuUpdate",
    "FeedbackCreate",
    "FeedbackResponse",
    "RestaurantRatingsSummary",
    "EmailVerificationRequest",
    "ResendVerificationRequest",
    "ForgotPasswordRequest",
    "ResetPasswordRequest",
    "ChangeEmailRequest",
    "VerifyChangeEmailRequest",
    "ChangePhoneRequest",
    "VerifyChangePhoneRequest",
    "ChangePasswordStartRequest",
    "ChangePasswordVerifyRequest",
]
