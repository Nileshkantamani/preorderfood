from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, String, UniqueConstraint
from sqlalchemy.orm import relationship

from ..database import Base


class UserRole:
    CUSTOMER = "customer"
    RESTAURANT = "restaurant"
    ADMIN = "admin"


class RestaurantStatus:
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class OrderStatus:
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"


class PaymentStatus:
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    # Email verification flag. Existing users will be treated as verified
    # by default via the database default.
    is_verified = Column(Boolean, default=True, nullable=False)

    customer = relationship("Customer", back_populates="user", uselist=False)
    restaurant = relationship("Restaurant", back_populates="user", uselist=False)


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    name = Column(String, nullable=False)
    phone = Column(String, nullable=False)

    user = relationship("User", back_populates="customer")
    orders = relationship("Order", back_populates="customer")


class Restaurant(Base):
    __tablename__ = "restaurants"

    id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    restaurant_name = Column(String, nullable=False)
    business_phone = Column(String, nullable=False)
    state = Column(String, nullable=False)
    city = Column(String, nullable=False)
    address = Column(String, nullable=False)
    # Google Maps share link for the restaurant location
    maps_link = Column(String, nullable=True)
    pincode = Column(String, nullable=False)
    opening_time = Column(String, nullable=False)
    closing_time = Column(String, nullable=False)
    menu = Column(JSON, nullable=False)
    # Visibility flag so restaurants can temporarily hide themselves (e.g. holidays)
    is_visible = Column(Boolean, default=True, nullable=False)
    status = Column(String, default=RestaurantStatus.PENDING, index=True)
    rejection_reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="restaurant")
    orders = relationship("Order", back_populates="restaurant")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    arrival_time = Column(DateTime, nullable=False)
    number_of_people = Column(Integer, nullable=False)
    items = Column(JSON, nullable=False)  # [{item_name, quantity, price}]
    total_amount = Column(Integer, nullable=False)
    status = Column(String, default=OrderStatus.PENDING, index=True)
    payment_status = Column(String, default=PaymentStatus.PENDING)
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="orders")
    restaurant = relationship("Restaurant", back_populates="orders")


class Feedback(Base):
    __tablename__ = "feedback"
    __table_args__ = (UniqueConstraint("order_id", name="uq_feedback_order"),)

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, unique=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    restaurant_rating = Column(Integer, nullable=False)
    food_rating = Column(Integer, nullable=False)
    comment = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    order = relationship("Order")
    customer = relationship("Customer")
    restaurant = relationship("Restaurant")


class EmailOTP(Base):
    __tablename__ = "email_otps"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    code = Column(String, nullable=False)
    purpose = Column(String, nullable=False)  # e.g. "verify_email" or "reset_password"
    expires_at = Column(DateTime, nullable=False)
    attempts = Column(Integer, default=0, nullable=False)
    resend_count = Column(Integer, default=0, nullable=False)
    consumed = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


__all__ = [
    "User",
    "Customer",
    "Restaurant",
    "Order",
    "Feedback",
    "EmailOTP",
    "UserRole",
    "RestaurantStatus",
    "OrderStatus",
    "PaymentStatus",
]
