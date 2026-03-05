from fastapi import APIRouter, UploadFile, File, Form
from ai_engine.engine import process_input, generate_questions

import fitz
from docx import Document
from PIL import Image
import pytesseract

import tempfile
import os

pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
router = APIRouter()


# ----------------------------
# PDF Extraction
# ----------------------------
def extract_pdf(file_path):

    doc = fitz.open(file_path)

    pages = []

    for page in doc:
        text = page.get_text()

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
# Image OCR Extraction
# ----------------------------
def extract_image(file_path):

    img = Image.open(file_path)

    if img.mode != "RGB":
        img = img.convert("RGB")

    text = pytesseract.image_to_string(img)

    return text


# ----------------------------
# API Route
# ----------------------------
@router.post("/generate-quiz")
async def generate_quiz(
    file: UploadFile = File(...),
    topic: str = Form(...),
    difficulty: str = Form(...),
    count: int = Form(...)
):

    suffix = os.path.splitext(file.filename)[1].lower()

    # Save file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:

        content = await file.read()

        tmp.write(content)

        tmp_path = tmp.name

    # Detect file type
    if suffix == ".pdf":

        text = extract_pdf(tmp_path)

    elif suffix == ".docx":

        text = extract_docx(tmp_path)

    elif suffix in [".png", ".jpg", ".jpeg"]:

        text = extract_image(tmp_path)

    else:

        return {"error": "Unsupported file format"}

    # Run your AI pipeline
    pipe = process_input(text)

    questions = generate_questions(
        topic,
        difficulty,
        count,
        pipe["content"]
    )

    return {
        "questions": questions,
        "word_count": pipe["word_count"],
        "chunks": pipe["num_chunks"]
    }