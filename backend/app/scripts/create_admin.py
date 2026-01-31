from app.database import SessionLocal
from app.models import User
from app.utils.auth import hash_password

def create_admin():
    db = SessionLocal()

    email = "admin@preorderfood.com"
    password = "Admin@123"

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        print("Admin already exists")
        return

    admin = User(
        email=email,
        role="admin",
        hashed_password=hash_password(password),
        is_active=True,
    )

    db.add(admin)
    db.commit()
    db.close()

    print("Admin created successfully")
    print("Email:", email)
    print("Password:", password)

if __name__ == "__main__":
    create_admin()
