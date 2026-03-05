import fitz

def extract_pdf_text(file_bytes):

    doc = fitz.open(stream=file_bytes, filetype="pdf")

    pages = []

    for page in doc:

        txt = page.get_text()

        if txt.strip():

            pages.append(txt)

    doc.close()

    return "\n".join(pages)