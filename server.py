from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/')

def hello_world():
    return 'Hello World'

if __name__ == '__main__':
    app.run()   


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