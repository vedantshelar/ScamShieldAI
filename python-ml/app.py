# python-ml/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os

app = Flask(__name__)
CORS(app)

# Load the trained AI Model when the server starts
MODEL_PATH = 'scam_model.pkl'

if os.path.exists(MODEL_PATH):
    print("🧠 Loading ScamShield AI Model...")
    ai_model = joblib.load(MODEL_PATH)
else:
    print("⚠️ WARNING: scam_model.pkl not found. Run train_model.py first!")
    ai_model = None

@app.route('/analyze', methods=['POST'])
def analyze_text():
    data = request.get_json()
    message = data.get('message', '')

    if not message:
        return jsonify({"error": "No message provided"}), 400

    if ai_model is None:
        return jsonify({"error": "AI model not loaded on server."}), 500

    # 1. Ask the ML model to predict (1 = Scam, 0 = Safe)
    # Convert numpy integer to native Python int for JSON serialization
    prediction = int(ai_model.predict([message])[0])
    
    # 2. Get the confidence probability
    probabilities = ai_model.predict_proba([message])[0]
    confidence_score = round(max(probabilities) * 100)

    # 3. Streamlined response for React
    result = {
        "is_scam": True if prediction == 1 else False,
        "confidence_score": f"{confidence_score}%"
    }

    return jsonify(result)

if __name__ == '__main__':
    app.run(port=5000, debug=True)