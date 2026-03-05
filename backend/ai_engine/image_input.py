import pytesseract
from PIL import Image
import io

def extract_image_text(file_bytes):

    img = Image.open(io.BytesIO(file_bytes))

    if img.mode != "RGB":

        img = img.convert("RGB")

    # text = pytesseract.image_to_string(img)
    data = pytesseract.image_to_data(
    img,
    config="--oem 3 --psm 6",
    output_type=pytesseract.Output.DICT
    )

    words = [
        w for w, conf in zip(data["text"], data["conf"])
        if int(conf) >= 60 and w.strip()
    ]   

    text = " ".join(words)

    return text