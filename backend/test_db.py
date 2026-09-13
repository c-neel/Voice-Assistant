from app.database import engine, SessionLocal
from app.database.models import Base, Reminder
from sqlalchemy import text

# Attempt to query Reminders to verify the table exists
try:
    with SessionLocal() as db:
        reminders = db.query(Reminder).all()
        print(f"Table exists! Found {len(reminders)} reminders.")
except Exception as e:
    print(f"Error: {e}")
