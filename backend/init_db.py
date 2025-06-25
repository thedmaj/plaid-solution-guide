import os
from app.database import engine, Base
from app.models.user import User, UserRole
from app.models.chat import ChatSession, ChatMessage
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.auth import get_password_hash

def init_db():
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create a database session
    db = SessionLocal()
    
    try:
        # Check if admin user exists
        admin = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin:
            # Create admin user
            admin_user = User(
                email="admin@example.com",
                password_hash=get_password_hash("admin123"),  # Change this in production!
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            print("Admin user created successfully!")
        else:
            print("Admin user already exists.")
            
    except Exception as e:
        print(f"Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    print("Database initialization complete!") 