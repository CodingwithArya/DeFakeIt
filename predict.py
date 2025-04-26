import numpy as np
from PIL import Image
import io
import os
from mesonet_model.classifiers import Meso4, MesoInception4

def load_model(model_type='Meso4', model_path=None):
    """
    Load a MesoNet model
    
    Args:
        model_type: 'Meso4' or 'MesoInception4'
        model_path: Path to the model weights, if None uses default
    
    Returns:
        Loaded model
    """
    
    # CLAUDE CODE, suggested different models
    
    if model_type == 'Meso4':
        classifier = Meso4()
        default_path = 'mesonet_model/weights/Meso4_DF.h5'
    else:  # MesoInception4
        classifier = MesoInception4()
        default_path = 'mesonet_model/weights/MesoInception_DF.h5'
    
    model_path = model_path or default_path
    
    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model weights not found at {model_path}")
    
    classifier.load(model_path)
    return classifier

def preprocess_image(img):
    """
    Preprocess an image for MesoNet model
    
    Args:
        img: PIL Image object
    
    Returns:
        Preprocessed numpy array ready for prediction
    """
    
    # Changed up Mishas code here just syntactically
    img = img.convert('RGB').resize((256, 256))
    img_arr = np.asarray(img) / 255.0
    return img_arr.reshape((1, 256, 256, 3))

def predict_image(image_input, model_type='Meso4', threshold=0.5):
    """
    Predict if an image is real or fake using MesoNet
    
    Args:
        image_input: Can be a file path, file object, or bytes
        model_type: 'Meso4' or 'MesoInception4'
        threshold: Classification threshold (0 to 1)
    
    Returns:
        Dictionary with prediction results
    """
    # Load the classifier
    classifier = load_model(model_type)
    
    # Handle different input types
    if isinstance(image_input, str):  # File path
        img = Image.open(image_input)
    elif hasattr(image_input, 'read'):  # File object
        img = Image.open(image_input)
    elif isinstance(image_input, bytes):  # Bytes
        img = Image.open(io.BytesIO(image_input))
    else:
        raise ValueError("Unsupported image input type")
    
    # Preprocess and predict
    img_arr = preprocess_image(img)
    pred_score = classifier.predict(img_arr)[0][0]
    
    # Create result dictionary
    result = {
        "score": float(pred_score),
        "label": "fake" if pred_score > threshold else "real",
        "confidence": float(abs(pred_score - 0.5) * 2)  # 0 to 1 confidence
    }
    
    return result