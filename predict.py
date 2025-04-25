from keras.models import load_model as keras_load_model # type: ignore
from PIL import Image
import numpy as np
import io
from mesonet_model.classifiers import Meso4


def predict_image(file_img):
    classifier = Meso4()
    classifier.load('weights/Meso4_DF.h5')

    img = Image.open(file_img).convert('RGB').resize((256, 256))
    img_arr = (np.asarray(img) / 255.0).reshape((1, 256, 256, 3))

    pred = classifier.predict(img_arr)[0][0]

    print(pred)

    if pred > 0.5:
        return { "label": "fake" }
    else:
        return { "label" : "real" }