from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.quiz_routes import router

app = FastAPI()

origins = [
    "https://quiz-generator-frontend-kappa.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "API running"}

@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(router)
