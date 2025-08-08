from flask import Flask, request, send_file
import barcode
from barcode.writer import ImageWriter
from io import BytesIO

app = Flask(__name__)

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
        return {"error": str(e)}, 500

if __name__ == '__main__':
    app.run(port=5001)

