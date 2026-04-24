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
    "https://ai-quizz-genmultimodal.vercel.app",
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ----------------------------
# Routes
# ----------------------------
@app.get("/")
def home():
    return {"message": "API running"}

@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(router)
