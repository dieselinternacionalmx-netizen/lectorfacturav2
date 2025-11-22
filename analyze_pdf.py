import sys
import subprocess

def install(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package])

try:
    import pdfplumber
except ImportError:
    print("Installing pdfplumber...")
    install("pdfplumber")
    import pdfplumber

pdf_path = r"d:\DIESEL INT\lector_factura_nov2025\EJEMPLOS XML\FA0000030601.pdf"

with pdfplumber.open(pdf_path) as pdf:
    first_page = pdf.pages[0]
    text = first_page.extract_text()
    print("--- TEXT EXTRACTION ---")
    print(text)
    print("-----------------------")
    
    # Also try to extract tables if any
    print("--- TABLE EXTRACTION ---")
    tables = first_page.extract_tables()
    for table in tables:
        for row in table:
            print(row)
    print("------------------------")
