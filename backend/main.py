from fastapi.middleware.cors import CORSMiddleware

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
