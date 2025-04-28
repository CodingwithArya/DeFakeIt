from flask import Flask, request, jsonify
from predict import predict_image
from werkzeug.utils import secure_filename
from flask_cors import CORS 

# creating Flask app and connecting with cors
app = Flask(__name__)
CORS(app) 

# setting default route to success msg for backend check
@app.route('/')
def hello_world():
    print("server running successfully")
    return "", 204

# setting predict route to call predict file that uses model
@app.route('/predict', methods=['POST'])
def predict():
    # checking that image was provided
    if 'image' not in request.files:
        return jsonify({"error": "No image file provided"}, 400)
    
    # getting image from files
    file_img = request.files['image']
    file_name = secure_filename(file_img.filename)

    # using predict.py to get result and sending to front-end
    result = predict_image(file_img)
    return jsonify(result)

# running app, host is 0.0.0.0 so it runs on all addresses and post is 5001 bc AirTunes uses 5000
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)   
