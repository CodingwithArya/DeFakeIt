import numpy as np
from PIL import Image
import io
import os
from mesonet_model.classifiers import Meso4, MesoInception4
# from tensorflow.keras.preprocessing.image import ImageDataGenerator

# function to load in model with given weights
def load_model(model_type='Meso4', model_path=None):
    """
    Load a MesoNet model
    
    Args:
        model_type: 'Meso4' or 'MesoInception4'
        model_path: Path to the model weights, if None uses default
    
    Returns:
        Loaded model
    """    
    if model_type == 'Meso4':
        classifier = Meso4()
        default_path = 'mesonet_model/weights/New-Meso4_DF.h5'
    else:  # MesoInception4
        classifier = MesoInception4()
        default_path = 'mesonet_model/weights/MesoInception_DF.h5'
    
    model_path = model_path or default_path

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model weights not found at {model_path}")

    classifier.load(model_path)
    classifier.model.save(r'C:\Users\misha\OneDrive - UW\Documents\sweccathon\DeFakeIt\mesonet_model\weights\New-Meso4_DF.h5')

    # ~ CODE FOR RETRAINING MODEL ~
    # train_dir = r'C:\Users\misha\OneDrive - UW\Documents\sweccathon\DeFakeIt\mesonet_model\Dataset\Test'
    # train_datagen = ImageDataGenerator(rescale=1./255, validation_split=0.2)

    # train_generator = train_datagen.flow_from_directory(
    #     train_dir,
    #     target_size=(256, 256),
    #     batch_size=32,
    #     class_mode='binary',
    #     subset='training'
    # )

    # val_generator = train_datagen.flow_from_directory(
    #     train_dir,
    #     target_size=(256, 256),
    #     batch_size=32,
    #     class_mode='binary',
    #     subset='validation'
    # )

    # classifier.model.fit(
    #     train_generator,
    #     epochs=10,
    #     validation_data=val_generator
    # )

    # classifier.model.save_weights(r'C:\Users\misha\OneDrive - UW\Documents\sweccathon\DeFakeIt\mesonet_model\weights\Meso4_DF_Updated.weights.h5')
    
    return classifier

# function to process image before giving it to model
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

# function to get prediction - takes processed image and gives to model and returns result
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
    # loading in classifier model 
    classifier = load_model(model_type)
    
    # dealing with different types of image input formats
    if isinstance(image_input, str):  # if input is file path
        img = Image.open(image_input)
    elif hasattr(image_input, 'read'):  # if input is file object
        img = Image.open(image_input)
    elif isinstance(image_input, bytes):  # if input is bytes
        img = Image.open(io.BytesIO(image_input))
    else:
        raise ValueError("Unsupported image input type")
    
    # calling preprocessing and prediction functions
    img_arr = preprocess_image(img)
    pred_score = classifier.predict(img_arr)[0][0]
    
    # creating dictionary to hold parts of result
    result = {
        "score": float(pred_score),
        "label": "fake" if pred_score < threshold else "real",
        "confidence": float(abs(pred_score - 0.5) * 2)  # 0 to 1 confidence
    }
    
    # returning final result
    return result