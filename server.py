from flask import Flask, request, jsonify
from predict import predict_image
from werkzeug.utils import secure_filename
from flask_cors import CORS # Necessary to work with Chrome extension

app = Flask(__name__)
# Enable cors
CORS(app) 

@app.route('/')
def hello_world():
    print("server running successfully")
    return "", 204

@app.route('/predict', methods=['POST'])
def predict():
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}, 400)
    
    file_img = request.files['image']
    file_name = secure_filename(file_img.filename)

    result = predict_image(file_img)
    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)   


'''
Accessing server from Chrome Extension:
    const formData = new FormData();
    formData.append('image', yourImageBlob);

    fetch('http://localhost:5000/predict', {
    method: 'POST',
    body: formData,
    })
    .then(res => res.json())
    .then(data => {
    console.log("Deepfake Result:", data);
    });
'''