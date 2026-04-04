import json
import os
import re
import sys
import logging
import random
from groq import Groq
from dotenv import load_dotenv

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
    text = re.sub(r"[•●▪]", " ", text)
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
# AI CALLERS & PROMPTS
# ==============================

SYSTEM_MASTER = "You are an expert exam question setter and evaluator."
SYSTEM_REPAIR = "You are a JSON repair assistant."
SYSTEM_ADAPTIVE = "You are an adaptive learning quiz generator."

MASTER_PROMPT_TEMPLATE = """Generate a high-quality quiz strictly based on the provided content.

IMPORTANT RULES:
- Output MUST be strictly valid JSON
- Do NOT include any explanation outside JSON
- Follow schema EXACTLY
- Do NOT generate malformed or incomplete data
- If unsure, internally fix before output

QUESTION QUALITY:
- Questions must test understanding, not just memory
- Include tricky but logical distractors
- Avoid ambiguity
- Ensure all options are meaningful

EXPLANATION QUALITY:
- Make explanations clear and concise
- Explain WHY correct answer is correct
- Explain WHY each wrong option is incorrect thoroughly

JSON SCHEMA:
{{
  "topics": ["extracted topic 1", "extracted topic 2"],
  "questions": [
    {{
      "id": 1,
      "type": "mcq",
      "question": "string",
      "topic": "string",
      "difficulty": "easy | medium | hard",
      "options": {{
        "A": "string",
        "B": "string",
        "C": "string",
        "D": "string"
      }},
      "correct_answer": "A | B | C | D",
      "explanation": {{
        "correct": "string",
        "incorrect": {{
          "A": "string",
          "B": "string",
          "C": "string",
          "D": "string"
        }}
      }}
    }}
  ]
}}

CONTENT:
{content}

Topic required: {topic}
Difficulty logic: {guide}
Expected Difficulty Parameter: {difficulty}

Generate exactly {count} questions strictly matching the {difficulty} difficulty.
"""

REPAIR_PROMPT_TEMPLATE = """The following output is invalid or malformed JSON.

Fix it strictly according to the schema below.
Do NOT change meaning.
Do NOT add new content.
Only correct formatting issues.

SCHEMA:
{{
  "topics": ["string"],
  "questions": [
    {{
      "id": 1,
      "type": "mcq",
      "question": "string",
      "topic": "string",
      "difficulty": "easy | medium | hard",
      "options": {{
        "A": "string",
        "B": "string",
        "C": "string",
        "D": "string"
      }},
      "correct_answer": "A | B | C | D",
      "explanation": {{
        "correct": "string",
        "incorrect": {{
          "A": "string",
          "B": "string",
          "C": "string",
          "D": "string"
        }}
      }}
    }}
  ]
}}

BROKEN_JSON:
{broken_json}
"""

def _call_ai_json(prompt, system_prompt=SYSTEM_MASTER, temperature=0.3):
    resp = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt}
        ],
        max_tokens=3000,
        temperature=temperature,
        response_format={"type": "json_object"},
    )
    return resp.choices[0].message.content.strip()

def safe_generate_json(prompt, system_prompt, temperature):
    """Attempt generation, and if parsing fails, autonomously invoke REPAIR agent."""
    raw_output = ""
    try:
        raw_output = _call_ai_json(prompt, system_prompt, temperature)
        data = json.loads(raw_output)
        # Assuming schema returns 'questions' and 'topics'. Return the full object or default to questions array
        if "questions" in data:
            return data
        return data
    except json.JSONDecodeError as e:
        log.warning(f"JSON Parse failed, invoking REPAIR AGENT. Error: {e}")
        repair_prompt = REPAIR_PROMPT_TEMPLATE.format(broken_json=raw_output)
        try:
            repaired_output = _call_ai_json(repair_prompt, SYSTEM_REPAIR, temperature=0.1)
            data = json.loads(repaired_output)
            if "questions" in data:
                return data
            return data
        except Exception as retry_e:
            log.error(f"Repair Agent failed hopelessly: {retry_e}")
            raise Exception("Irrecoverable generation format.")

# ==============================
# DIFFICULTY CONFIG
# ==============================

DIFFICULTY_CONFIG = {
    "Easy": {
        "temperature": 0.2,
        "guide": "Generate DIRECT FACT questions only."
    },
    "Medium": {
        "temperature": 0.3,
        "guide": "Generate conceptual questions that require deeper deductive reasoning."
    },
    "Hard": {
        "temperature": 0.4,
        "guide": """
MANDATORY format for EVERY question body:
State a premise or scenario, followed by:
Which of the following statements are correct?
1. Statement 1
2. Statement 2
3. Statement 3

The A/B/C/D block MUST map to specific combinations (e.g., "A": "1 only", "B": "1 and 2 only", etc.)
"""
    }
}

# ==============================
# QUESTION GENERATION
# ==============================

def generate_questions(topic, difficulty, count, content, history_stats=None):
    # Dynamic Adaptive Difficulty overrides basic requests.
    system_prompt_to_use = SYSTEM_MASTER
    adaptive_header = ""
    
    if history_stats and history_stats.get("weak_topics"):
        system_prompt_to_use = SYSTEM_ADAPTIVE
        acc = int(history_stats.get("accuracy", 0))
        # Override Difficulty Logic if history warrants it
        if acc < 50:
             difficulty = "Easy"
        elif acc <= 75:
             difficulty = "Medium"
        else:
             difficulty = "Hard"
             
        adaptive_header = f"""
USER PERFORMANCE:
- Weak Topics: {history_stats.get("weak_topics")}
- Accuracy: {acc}%

INSTRUCTIONS:
- Focus more on weak topics
- Adjust difficulty to {difficulty} to match performance threshold.
- Maintain question quality.
"""

    cfg = DIFFICULTY_CONFIG.get(difficulty, DIFFICULTY_CONFIG["Medium"])
    chunks = chunk_text(content)
    questions = []
    
    per_chunk = max(1, count // len(chunks))
    if per_chunk > 10: per_chunk = 10 

    for idx, chunk in enumerate(chunks):
        if len(questions) >= count: break

        prompt = adaptive_header + MASTER_PROMPT_TEMPLATE.format(
            content=chunk,
            topic=topic,
            guide=cfg["guide"],
            difficulty=difficulty,
            count=per_chunk
        )

        try:
            result = safe_generate_json(prompt, system_prompt_to_use, cfg["temperature"])
            
            # The result now contains 'topics' and 'questions' based on schema
            questions_list = result.get("questions", []) if isinstance(result, dict) else result
            
            if isinstance(questions_list, list):
                for q in questions_list:
                    if isinstance(q, dict) and "correct_answer" in q:
                        questions.append(q)
            elif isinstance(questions_list, dict):
                if "correct_answer" in questions_list:
                    questions.append(questions_list)

        except Exception as e:
            log.warning(f"Chunk failed: {e}")

    return questions[:count]

# ==============================
# PERFORMANCE ANALYTICS
# ==============================

def analyze_performance(questions, answers, topic):
    score = 0
    total = len(questions)

    for i, q in enumerate(questions):
        correct_key = str(q.get("correct_answer", "")).strip().upper()
        # Ensure answers map to explicit char.
        user_ans = str(answers[i]).strip().upper()
        if user_ans == correct_key:
            score += 1

    percentage = (score / total) * 100 if total > 0 else 0

    if percentage >= 80:
        grade = "A"
    elif percentage >= 60:
        grade = "B"
    elif percentage >= 40:
        grade = "C"
    else:
        grade = "D"

    return {
        "score": score,
        "total": total,
        "grade": grade,
        "strengths": ["Conceptual understanding improving"],
        "weak_areas": ["Review incorrect questions"],
        "study_tip": "Revise topic again and practice similar questions."
    }