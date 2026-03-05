import json
import os
import re
import sys
import logging
import random
from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()


# ==============================
# CONFIG
# ==============================

API_KEY = os.getenv("GROQ_API_KEY")
MODEL = "llama-3.3-70b-versatile"

client = Groq(api_key=API_KEY)

MIN_WORDS = 200
MAX_CHARS_PER_CHUNK = 3000
MAX_TOTAL_CHARS = 12000
CHUNK_OVERLAP = 200

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("upsc")

# ==============================
# TEXT CLEANING
# ==============================

def clean_text(text):

    text = text.encode("utf-8", errors="ignore").decode("utf-8")

    text = re.sub(r"(?m)^\s*\d{1,4}\s*$", "", text)

    text = re.sub(r"\n+", " ", text)
    text = re.sub(r"\s+", " ", text)

# remove weird bullet fragments from DOCX
    text = re.sub(r"[•●▪]", " ", text)

# remove multiple separators
    text = re.sub(r"\|+", " ", text)

    return text.strip()

def validate_content(text):

    words = text.split()

    if len(words) < MIN_WORDS:
        raise ValueError(
            f"Insufficient content: {len(words)} words. Minimum required is {MIN_WORDS}"
        )

# ==============================
# TOKEN GUARD
# ==============================

def estimate_tokens(text):
    return len(text) // 4


def apply_token_guard(text):

    if len(text) > MAX_TOTAL_CHARS:

        text = text[:MAX_TOTAL_CHARS]

        lp = text.rfind(".")

        if lp > MAX_TOTAL_CHARS * 0.8:
            text = text[:lp + 1]

    return text

# ==============================
# CHUNKING
# ==============================

def chunk_text(text):

    if len(text) <= MAX_CHARS_PER_CHUNK:
        return [text]

    chunks = []

    start = 0

    while start < len(text):

        end = start + MAX_CHARS_PER_CHUNK

        if end >= len(text):

            chunks.append(text[start:])
            break

        b = text.rfind(".", start, end)

        if b == -1:
            b = end

        chunks.append(text[start:b + 1])

        start = b + 1 - CHUNK_OVERLAP

    return chunks


# ==============================
# INPUT PIPELINE
# ==============================

def process_input(raw_text):

    cleaned = clean_text(raw_text)

    validate_content(cleaned)

    guarded = apply_token_guard(cleaned)

    chunks = chunk_text(guarded)

    return {
        "content": guarded,
        "chunks": chunks,
        "word_count": len(guarded.split()),
        "token_est": estimate_tokens(guarded),
        "num_chunks": len(chunks),
    }


# ==============================
# AI CALLERS
# ==============================

def _call_ai(prompt, temperature=0.3):

    resp = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=2048,
        temperature=temperature,
    )

    return resp.choices[0].message.content.strip()


def _call_ai_json(prompt, temperature=0.3):

    try:

        resp = client.chat.completions.create(
            model=MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2048,
            temperature=temperature,
            response_format={"type": "json_object"},
        )

        raw = resp.choices[0].message.content.strip()

        return json.loads(raw)

    except Exception:

        raw = _call_ai(prompt, temperature)

        clean = raw.replace("```json", "").replace("```", "").strip()

        try:
            return json.loads(clean)

        except:

            s = clean.find("[")
            e = clean.rfind("]") + 1

            if s != -1 and e > s:

                return json.loads(clean[s:e])

            raise ValueError("Bad JSON response from model")


# ==============================
# DIFFICULTY CONFIG
# ==============================

DIFFICULTY_CONFIG = {

"Easy": {
"temperature":0.2,
"guide":"""
Generate DIRECT FACT questions only.
"""
},

"Medium":{
"temperature":0.3,
"guide":"""
Generate 2 statement elimination questions.
"""
},

"Hard":{
"temperature":0.35,
"guide":"""
MANDATORY format for EVERY question:

Which of the following statements are correct?

1.
2.
3.

A) 1 only
B) 2 and 3 only
C) 1 and 3 only
D) 1,2 and 3
"""
}

}

# ==============================
# FORMAT VALIDATOR
# ==============================

def validate_statement_format(q):

    question = q.get("question","")

    if "1." not in question:
        return False

    if "2." not in question:
        return False

    if "3." not in question:
        return False

    return True


# ==============================
# QUESTION GENERATION
# ==============================

def generate_questions(topic, difficulty, count, content):

    cfg = DIFFICULTY_CONFIG[difficulty]

    chunks = chunk_text(content)

    questions = []

    per_chunk = max(1, count // len(chunks))

    for chunk in chunks:

        prompt = f"""
You are a strict UPSC exam question setter.

=== CONTENT ===
{chunk}
=== END ===

Topic: {topic}

Difficulty: {difficulty}

{cfg["guide"]}

Generate exactly {per_chunk} questions.

Return JSON array:
[
{{"question":"...",
"options":["A) ...","B) ...","C) ...","D) ..."],
"correct":0,
"explanation":"..."
}}
]
"""

        try:

            result = _call_ai_json(prompt, cfg["temperature"])

            if isinstance(result, dict):

                for v in result.values():

                    if isinstance(v, list):
                        result = v
                        break

            for q in result:

                if not isinstance(q, dict):
                    continue

                if difficulty == "Hard":

                    if not validate_statement_format(q):
                        log.warning("Skipping malformed statement question")
                        continue

                questions.append(q)

        except Exception as e:

            log.warning(f"Chunk failed: {e}")

    return questions[:count]