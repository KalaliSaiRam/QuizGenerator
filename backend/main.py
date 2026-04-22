from fastapi.middleware.cors import CORSMiddleware

origins = [
    "https://quiz-generator-frontend-kappa.vercel.app",
    "http://localhost:3000"  # optional (for local testing)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,   # MUST be specific
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
