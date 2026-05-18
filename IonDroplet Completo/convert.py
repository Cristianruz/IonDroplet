import fitz
doc = fitz.open(r"C:\Users\alexi\Downloads\iondroplet-backend nv\IonDroplet Logo PDF.pdf")
page = doc.load_page(0)
pix = page.get_pixmap(dpi=300)
pix.save(r"C:\Users\alexi\Downloads\iondroplet-backend nv\iondroplet-backend\IonDroplet\public\logo.png")
