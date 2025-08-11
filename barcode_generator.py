
from flask import Flask, request, send_file, send_from_directory
import barcode
from barcode.writer import ImageWriter
from io import BytesIO
import os

app = Flask(__name__)

@app.route('/barcodes/<filename>')
def serve_barcode(filename):
    barcode_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'barcodes')
    return send_from_directory(barcode_dir, filename)
@app.route('/generate-barcode', methods=['POST'])
def generate_barcode():
    data = request.json
    code = data.get('code')

    if not code:
        return {"error": "No code provided"}, 400

    try:
        ean = barcode.get('code128', code, writer=ImageWriter())
        buffer = BytesIO()
        ean.write(buffer)
        buffer.seek(0)
        return send_file(buffer, mimetype='image/png')
    except Exception as e:
        import traceback
        print("Error al generar el código de barras:", e)
        traceback.print_exc()
        return {"error": str(e)}, 500

if __name__ == '__main__':
    app.run(port=5001)

