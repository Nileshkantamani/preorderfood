from app.database import SessionLocal
from app.models import User, Customer, Restaurant, Order, Feedback, UserRole


def main() -> None:
    db = SessionLocal()
    try:
        # Delete in dependency order: feedback -> orders -> restaurants/customers -> users
        db.query(Feedback).delete()
        db.query(Order).delete()
        db.query(Restaurant).delete()
        db.query(Customer).delete()
        db.query(User).filter(User.role.in_([UserRole.CUSTOMER, UserRole.RESTAURANT])).delete()
        db.commit()
        print("Cleared all customers, restaurants, their orders and feedback; admins kept.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
