
from database import engine

try:
    with engine.connect() as connection:
        print("MySQL connection successful!")
        print("Health Prediction Database is connected.")

except Exception as error:
    print("Database connection failed:", error)
