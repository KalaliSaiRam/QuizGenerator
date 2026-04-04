from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from ai_engine.engine import process_input, generate_questions, analyze_performance
from pydantic import BaseModel
import fitz
from docx import Document
from PIL import Image
import pytesseract
import tempfile
import os
import sqlite3
import datetime

# Database setup
import sqlite3
DB_PATH = "history.db"

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            topic TEXT,
            score INTEGER,
            total INTEGER,
            grade TEXT,
            percentage REAL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

init_db()

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
router = APIRouter()

# ----------------------------
# Enhanced PDF Extraction (with OCR Fallback)
# ----------------------------
def extract_pdf(file_path):
    doc = fitz.open(file_path)
    pages = []

    for page_num in range(len(doc)):
        page = doc.load_page(page_num)
        text = page.get_text()

        # If it's a scanned PDF (e.g. newspaper image), get_text() might be empty.
        # So we convert the page to an image and run OCR!
        if not text.strip():
            pix = page.get_pixmap(dpi=300)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            # Use PSM 6 assuming a single uniform block of text (like a newspaper column).
            text = pytesseract.image_to_string(img, config="--oem 3 --psm 6")
        
        if text.strip():
            pages.append(text)

    doc.close()
    return "\n".join(pages)

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
# Enhanced Image OCR Extraction
# ----------------------------
def extract_image(file_path):
    img = Image.open(file_path)
    if img.mode != "RGB":
        img = img.convert("RGB")
    # Optimize for newspaper/dense text with psm 6
    text = pytesseract.image_to_string(img, config="--oem 3 --psm 6")
    return text

# ----------------------------
# Adaptive Feature Helpers
# ----------------------------
def get_user_performance_stats():
    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        cursor.execute("SELECT topic, percentage FROM history")
        rows = cursor.fetchall()
        conn.close()

        if not rows: return None
        
        total_acc = sum([r["percentage"] for r in rows]) / len(rows)
        
        # Calculate weak topics
        topic_scores = {}
        for r in rows:
            t = r["topic"]
            if t not in topic_scores: topic_scores[t] = []
            topic_scores[t].append(r["percentage"])
            
        weak_topics = []
        for t, scores in topic_scores.items():
            if sum(scores) / len(scores) < 60:
                weak_topics.append(t)
                
        return {
            "accuracy": total_acc,
            "weak_topics": ", ".join(weak_topics) if weak_topics else None
        }
    except Exception as e:
        print("Performance stats error:", e)
        return None

# ----------------------------
# API Routes
# ----------------------------
@router.post("/generate-quiz")
async def generate_quiz(
    file: UploadFile = File(...),
    topic: str = Form(...),
    difficulty: str = Form(...),
    count: int = Form(...)
):
    suffix = os.path.splitext(file.filename)[1].lower()

    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    if suffix == ".pdf":
        text = extract_pdf(tmp_path)
    elif suffix in [".docx", ".doc"]:
        text = extract_docx(tmp_path)
    elif suffix in [".png", ".jpg", ".jpeg"]:
        text = extract_image(tmp_path)
    else:
        os.remove(tmp_path)
        return {"error": "Unsupported file format"}
    
    os.remove(tmp_path)

    pipe = process_input(text)

    # Fetch History to power Adaptive mode
    stats = get_user_performance_stats()

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

@router.post("/submit-quiz")
async def submit_quiz(data: dict):
    questions = data.get("questions")
    answers = data.get("answers")
    topic = data.get("topic")

    result = analyze_performance(questions, answers, topic)
    
    percentage = (result["score"] / result["total"]) * 100 if result["total"] > 0 else 0

    # Save to history DB
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO history (topic, score, total, grade, percentage) VALUES (?, ?, ?, ?, ?)",
        (topic, result["score"], result["total"], result["grade"], percentage)
    )
    conn.commit()
    conn.close()

    return result

@router.get("/history")
async def get_history():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM history ORDER BY timestamp DESC")
    rows = cursor.fetchall()
    conn.close()
    
    history_list = [dict(row) for row in rows]
    return {"history": history_list}