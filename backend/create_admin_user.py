from app.database import SessionLocal
from app.models import User, UserRole
from app.utils.auth import hash_password


ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "admin123"


def main() -> None:
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == ADMIN_EMAIL).first()

        if existing:
            # Ensure the existing user is an admin and its password hash is
            # compatible with the current bcrypt-based password hasher.
            updated = False
            if existing.role != UserRole.ADMIN:
                existing.role = UserRole.ADMIN
                updated = True

            # If the stored hash does not look like a bcrypt hash, re-hash
            # the password with the current hasher so that login works.
            if not str(existing.password_hash).startswith("$2"):
                existing.password_hash = hash_password(ADMIN_PASSWORD)
                updated = True

            if updated:
                db.add(existing)
                db.commit()
                print(
                    f"Updated existing admin user with email {ADMIN_EMAIL} "
                    f"(id={existing.id})."
                )
            else:
                print(
                    f"Admin user with email {ADMIN_EMAIL} already exists "
                    f"(id={existing.id})."
                )
            return

        user = User(
            email=ADMIN_EMAIL,
            password_hash=hash_password(ADMIN_PASSWORD),
            role=UserRole.ADMIN,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        print("Created admin user:")
        print(f"  email: {ADMIN_EMAIL}")
        print(f"  password: {ADMIN_PASSWORD}")
        print(f"  id: {user.id}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
