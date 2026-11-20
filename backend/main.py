
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import patients

app = FastAPI(
    title="Health Prediction API",
    description="Patient Health Prediction and Management System",
    version="1.0.0"
)

# Allow Next.js frontend to communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(patients.router)


@app.get("/")
def home():
    return {
        "message": "Health Prediction API is running successfully!"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
