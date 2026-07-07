from pdf2docx import Converter

pdf_file = r"c:\Users\tatsanai.bu\Downloads\QSMS_SOM_โครงการค้นหาอันตรายในพื้นที่การทำงาน (Near Miss) - signed.pdf"
docx_file = r"c:\Users\tatsanai.bu\Downloads\QSMS_SOM_Near_Miss_Template.docx"

try:
    cv = Converter(pdf_file)
    cv.convert(docx_file)
    cv.close()
    print(f"Successfully converted to {docx_file}")
except Exception as e:
    print(f"Error: {e}")
