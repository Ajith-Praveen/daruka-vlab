"""
DARUKA VLab — YOLOv8 Fire Detection Backend
Flask server that runs YOLOv8 inference on webcam frames
and returns detection results as JSON.

Usage:
  pip install -r requirements.txt
  python app.py

Endpoint:
  GET  /detect  → Returns JSON array of detections
  POST /detect  → Accepts base64 image, returns detections

Response format:
  [
    {
      "label": "fire",
      "confidence": 0.84,
      "bbox": [x1, y1, x2, y2]
    }
  ]
"""

import json
import base64
import numpy as np
import cv2
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ===== MODEL LOADING =====
model = None

def load_model():
    """Load YOLOv8 fire detection model."""
    global model
    try:
        from ultralytics import YOLO
        model = YOLO("../models/fire-yolov8.pt")
        print("[DARUKA] YOLOv8 fire detection model loaded.")
    except FileNotFoundError:
        print("[DARUKA] Warning: fire-yolov8.pt not found. Using simulation mode.")
        model = None
    except Exception as e:
        print(f"[DARUKA] Model load error: {e}. Using simulation mode.")
        model = None

# ===== CAMERA =====
camera = None

def get_camera():
    """Initialize webcam capture."""
    global camera
    if camera is None:
        camera = cv2.VideoCapture(0)
        if not camera.isOpened():
            print("[DARUKA] Warning: Camera not available.")
            camera = None
    return camera


# ===== DETECTION ENDPOINT =====
@app.route("/detect", methods=["GET"])
def detect_get():
    """Capture frame from webcam and run YOLOv8 inference."""
    cam = get_camera()

    if model is None or cam is None:
        # Simulation fallback: return synthetic detection
        return jsonify(generate_simulated_detection())

    ret, frame = cam.read()
    if not ret:
        return jsonify([])

    results = model(frame, verbose=False)
    detections = parse_results(results)
    return jsonify(detections)


@app.route("/detect", methods=["POST"])
def detect_post():
    """Accept base64 image and run inference."""
    data = request.get_json()
    if not data or "image" not in data:
        return jsonify({"error": "No image provided"}), 400

    # Decode base64 image
    try:
        img_data = base64.b64decode(data["image"])
        nparr = np.frombuffer(img_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    if model is None:
        return jsonify(generate_simulated_detection())

    results = model(frame, verbose=False)
    detections = parse_results(results)
    return jsonify(detections)


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "model_loaded": model is not None,
        "camera_available": get_camera() is not None
    })


# ===== HELPERS =====
def parse_results(results):
    """Parse YOLOv8 results into JSON-friendly format."""
    detections = []
    for result in results:
        for box in result.boxes:
            x1, y1, x2, y2 = box.xyxy[0].tolist()
            conf = float(box.conf[0])
            cls = int(box.cls[0])
            label = result.names[cls] if cls in result.names else "fire"

            detections.append({
                "label": label,
                "confidence": round(conf, 4),
                "bbox": [int(x1), int(y1), int(x2), int(y2)]
            })
    return detections


def generate_simulated_detection():
    """Generate simulated detection for demo without model/camera."""
    import random
    if random.random() < 0.4:
        return [{
            "label": "fire",
            "confidence": round(random.uniform(0.45, 0.95), 2),
            "bbox": [
                random.randint(50, 300),
                random.randint(50, 200),
                random.randint(350, 600),
                random.randint(250, 450)
            ]
        }]
    return []


# ===== MAIN =====
if __name__ == "__main__":
    load_model()
    print("[DARUKA] Starting Flask server on http://localhost:5000")
    print("[DARUKA] Endpoints: GET /detect, POST /detect, GET /health")
    app.run(host="0.0.0.0", port=5000, debug=False)
