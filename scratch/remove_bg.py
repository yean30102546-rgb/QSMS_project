import sys
from rembg import remove
from PIL import Image

def process(input_path, output_path):
    input_image = Image.open(input_path)
    output_image = remove(input_image)
    output_image.save(output_path)

if len(sys.argv) > 2:
    try:
        print(f"Processing custom background removal: {sys.argv[1]} -> {sys.argv[2]}")
        process(sys.argv[1], sys.argv[2])
        print("Done!")
    except Exception as e:
        print(f"Error: {e}")
else:
    try:
        print("Processing default mascot...")
        process(r'C:\Users\tatsanai.bu\.gemini\antigravity-ide\brain\f6dde8bb-6e5e-434b-9a93-0127e5860f0a\media__1780030401714.jpg', r'C:\Workplace\QSMS_project\public\img\nongbeepa_default.png')
        print("Processing happy mascot...")
        process(r'C:\Users\tatsanai.bu\.gemini\antigravity-ide\brain\f6dde8bb-6e5e-434b-9a93-0127e5860f0a\media__1780030433388.jpg', r'C:\Workplace\QSMS_project\public\img\nongbeepa_happy.png')
        print("Done!")
    except Exception as e:
        print(f"Error: {e}")
