from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.quiz_routes import router

# ----------------------------
# App Initialization
# ----------------------------
app = FastAPI(
    title="Quiz Generator API",
    description="Backend API for AI Quiz Generator",
    version="1.0.0"
)

# ----------------------------
# CORS Configuration
# ----------------------------
origins = [
    "*",  # For development (allow all)
    # Later replace with your frontend URL:
    # "https://your-frontend.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------
# Root Route (Important)
# ----------------------------
@app.get("/")
def home():
    return {
        "message": "Quiz Generator API is running",
        "docs": "/docs"
    }

# ----------------------------
# Health Check (Optional but useful)
# ----------------------------
@app.get("/health")
def health_check():
    return {"status": "ok"}

# ----------------------------
# Include Routes
# ----------------------------
app.include_router(router)
