# DeFakeIt
SWECC Hackathon Project

## setup

1. Clone this repository and cd into it

2. Install the required dependencies:
- (Probably best to create a specific env for this project)

```
pip install -r requirements.txt
```
(macOS only)
```
pip install -r requirements-mac.txt
```

3. Run the application:
```
python server.py --port 5001
```

4. Test through terminal:
```
python test_model.py /path/to/img.jpg
```

## extension set up
5. Open Chrome and go to chrome://extensions/
6. Enable Developer mode (toggle in the top-right)
7. Load unpacked and select the project’s extension/ folder. (You should now see “DeFakeIt” in your list of extensions!)
8. Click the puzzle-piece icon in Chrome’s toolbar, then click the pin icon next to DeFakeIt to make it visible. Click the DeFakeIt icon to open its popup.
9. Now test it! Click "Capture Screenshot," "Browse" to choose a local image file, or copy and paste an image. Then wait for a couple seconds, and on the bottom, there will be a popup with the probability that the picture is a deepfake!
