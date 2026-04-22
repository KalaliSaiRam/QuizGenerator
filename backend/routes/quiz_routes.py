from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Header
from ai_engine.engine import process_input, generate_questions, analyze_performance
from pydantic import BaseModel
from docx import Document
from PIL import Image
import pdfplumber
import tempfile
import os
import pymongo
import datetime
import bcrypt
from dotenv import load_dotenv

load_dotenv()

# ----------------------------
# Database setup
# ----------------------------
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")

try:
    mongo_client = pymongo.MongoClient(MONGO_URI)
    db = mongo_client["quiz_database"]
    history_collection = db["history"]
    users_collection = db["users"]
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")
    history_collection = None
    users_collection = None

router = APIRouter()

# ----------------------------
# PDF Extraction (SAFE)
# ----------------------------
def extract_pdf(file_path):
    text = ""
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text += page.extract_text() or ""
    return text

# ----------------------------
# DOCX Extraction
# ----------------------------
def extract_docx(file_path):
    doc = Document(file_path)
    parts = []

    for para in doc.paragraphs:
        if para.text.strip():
            parts.append(para.text.strip())

    for table in doc.tables:
        for row in table.rows:
            row_text = " ".join(
                cell.text.strip() for cell in row.cells if cell.text.strip()
            )
            if row_text:
                parts.append(row_text)

    return "\n".join(parts)

# ----------------------------
# Image Extraction (DISABLED OCR)
# ----------------------------
def extract_image(file_path):
    return "Image OCR not supported in deployed version"

# ----------------------------
# Adaptive Feature Helpers
# ----------------------------
def get_user_performance_stats(user_id: str):
    if history_collection is None or not user_id:
        return None
    try:
        rows = list(history_collection.find(
            {"user_id": user_id},
            {"topic": 1, "percentage": 1, "_id": 0}
        ))
        if not rows:
            return None

        total_acc = sum([r.get("percentage", 0) for r in rows]) / len(rows)

        topic_scores = {}
        for r in rows:
            t = r.get("topic", "Unknown")
            topic_scores.setdefault(t, []).append(r.get("percentage", 0))

        weak_topics = [
            t for t, scores in topic_scores.items()
            if sum(scores) / len(scores) < 60
        ]

        return {
            "accuracy": total_acc,
            "weak_topics": ", ".join(weak_topics) if weak_topics else None
        }

    except Exception as e:
        print("Performance stats error:", e)
        return None

# ----------------------------
# Models
# ----------------------------
class UserSignup(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

# ----------------------------
# Auth APIs
# ----------------------------
@router.post("/signup")
async def signup(user: UserSignup):
    if users_collection is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    existing = users_collection.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = bcrypt.hashpw(user.password.encode(), bcrypt.gensalt())

    new_user = {
        "name": user.name,
        "email": user.email,
        "password": hashed_pw.decode(),
        "created_at": datetime.datetime.utcnow()
    }

    res = users_collection.insert_one(new_user)

    return {"user_id": str(res.inserted_id), "name": user.name}

@router.post("/login")
async def login(user: UserLogin):
    if users_collection is None:
        raise HTTPException(status_code=500, detail="Database not connected")

    record = users_collection.find_one({"email": user.email})
    if not record:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not bcrypt.checkpw(user.password.encode(), record["password"].encode()):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    return {"user_id": str(record["_id"]), "name": record.get("name", "User")}

# ----------------------------
# Generate Quiz
# ----------------------------
@router.post("/generate-quiz")
async def generate_quiz(
    file: UploadFile = File(...),
    topic: str = Form(...),
    difficulty: str = Form(...),
    count: int = Form(...),
    x_user_id: str = Header(None)
):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    suffix = os.path.splitext(file.filename)[1].lower()

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp.write(await file.read())
        tmp_path = tmp.name

    if suffix == ".pdf":
        text = extract_pdf(tmp_path)
    elif suffix in [".docx", ".doc"]:
        text = extract_docx(tmp_path)
    elif suffix in [".png", ".jpg", ".jpeg"]:
        text = extract_image(tmp_path)
    else:
        os.remove(tmp_path)
        raise HTTPException(status_code=400, detail="Unsupported file format")

    os.remove(tmp_path)

    try:
        pipe = process_input(text)
        stats = get_user_performance_stats(x_user_id)

        questions = generate_questions(
            topic,
            difficulty,
            count,
            pipe["content"],
            history_stats=stats
        )

        return {
            "questions": questions,
            "word_count": pipe["word_count"],
            "chunks": pipe["num_chunks"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ----------------------------
# Submit Quiz
# ----------------------------
class SubmitQuizData(BaseModel):
    questions: list
    answers: list
    topic: str

@router.post("/submit-quiz")
async def submit_quiz(data: SubmitQuizData, x_user_id: str = Header(None)):
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    result = analyze_performance(data.questions, data.answers, data.topic)

    percentage = (
        (result["score"] / result["total"]) * 100
        if result["total"] > 0 else 0
    )

    if history_collection is not None:
        history_collection.insert_one({
            "user_id": x_user_id,
            "topic": data.topic,
            "score": result["score"],
            "total": result["total"],
            "grade": result["grade"],
            "percentage": percentage,
            "timestamp": datetime.datetime.utcnow()
        })

    return result

# ----------------------------
# History
# ----------------------------
@router.get("/history")
async def get_history(x_user_id: str = Header(None)):
    if history_collection is None:
        return {"history": []}

    if not x_user_id:
        raise HTTPException(status_code=401, detail="Unauthorized")

    rows = list(history_collection.find({"user_id": x_user_id}).sort("timestamp", -1))

    history_list = []
    for row in rows:
        row["id"] = str(row["_id"])
        del row["_id"]

        if isinstance(row.get("timestamp"), datetime.datetime):
            row["timestamp"] = row["timestamp"].isoformat() + "Z"

        history_list.append(row)

    return {"history": history_list}
