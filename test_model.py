#!/usr/bin/env python3
"""
Simple script to test the DeepFake detection model on a single image.
Entirely from Claude, could be faulty causing inaccurate results?
"""

import argparse
import os
import sys
from predict import predict_image

def main():
    # Parse command line arguments
    parser = argparse.ArgumentParser(description='Test DeepFake detection on an image')
    parser.add_argument('image_path', type=str, help='Path to the image file')
    parser.add_argument('--model', type=str, choices=['Meso4', 'MesoInception4'], 
                        default='Meso4', help='Model to use for detection')
    args = parser.parse_args()
    
    # Check if the file exists
    if not os.path.exists(args.image_path):
        print(f"Error: The file {args.image_path} does not exist.")
        sys.exit(1)
    
    # Run prediction
    print(f"Analyzing image {args.image_path} using {args.model} model...")
    
    try:
        result = predict_image(args.image_path, model_type=args.model)
        
        # Print results in a nice format
        print("\n===== DEEPFAKE DETECTION RESULTS =====")
        print(f"VERDICT: {'FAKE' if result['label'] == 'fake' else 'REAL'}")
        print(f"Raw Score: {result['score']:.4f} (higher values indicate fake)")
        print(f"Confidence: {result['confidence']*100:.1f}%")
        print("=====================================")
        
        if result['label'] == 'fake':
            print("⚠️  This image appears to be manipulated!")
        else:
            print("✅ This image appears to be authentic.")
            
    except Exception as e:
        print(f"Error analyzing image: {str(e)}")
        sys.exit(1)

if __name__ == '__main__':
    main() 