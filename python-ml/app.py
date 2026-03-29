
# python-ml/app.py
import numpy as np # 🌟 NEW: Required for numerical stability checks
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os
import re # 🌟 Added for SMS preprocessing
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline

app = Flask(__name__)
# Upgraded CORS to allow communication from Node.js (Port 4000)
CORS(app, resources={r"/*": {"origins": "http://localhost:4000"}})  # change to real host


# ==========================================
# 1. LOAD ALL AI MODELS AT STARTUP
# ==========================================
print("\n🛡️ ScamShieldAI Neural Core Initializing...")

# Define global variables for the models
general_model = None
bank_model = None; bank_vectorizer = None
da_model = None; da_vectorizer = None
otp_model = None; otp_vectorizer = None

def load_expert_model(model_name, vec_name=None):
    if os.path.exists(model_name):
        model = joblib.load(model_name)
        vectorizer = joblib.load(vec_name) if vec_name and os.path.exists(vec_name) else None
        print(f"✅ Loaded {model_name}")
        return model, vectorizer
    else:
        print(f"⚠️ WARNING: {model_name} not found.")
        return None, None

try:
    # General Model (Pipeline - no separate vectorizer needed)
    general_model, _ = load_expert_model('scam_model.pkl')
    
    # Expert Models (Require both model and vectorizer)
    bank_model, bank_vectorizer = load_expert_model('bank_model.pkl', 'bank_vectorizer.pkl')
    da_model, da_vectorizer = load_expert_model('digital_arrest_model.pkl', 'digital_arrest_vectorizer.pkl')
    otp_model, otp_vectorizer = load_expert_model('otp_model.pkl', 'otp_vectorizer.pkl')
    
except Exception as e:
    print(f"🔴 ERROR during model loading: {e}")

print("🛡️ Neural Core Online and Listening.\n")


# ==========================================
# 🌟 UPDATED UTILITY: SMS PREPROCESSING & NUMERICAL SAFETY
# Standardizing text improves accuracy, and we proactively fix NaN errors.
# ==========================================
def preprocess_sms_text(text):
    """Applies necessary cleaning to the raw SMS text."""
    if not text: return ""
    text = text.lower() # Lowercase
    text = re.sub(r'https?://\S+|www\.\S+', ' url_placeholder ', text) # Hide URLs
    text = re.sub(r'\d+', ' number_placeholder ', text) # Hide numbers
    text = re.sub(r'[^\w\s]', '', text) # Remove punctuation
    return text.strip()

def run_expert_internal_analysis(message, model, vectorizer=None):
    """Utility to handle vectorization, safe probability logic, and NaN fallback."""
    if not model:
        return {'ml_label': 0, 'ml_score': 0.0, 'status': 'expert_offline'}

    # 1. Clean raw SMS
    clean_text = preprocess_sms_text(message)
    
    try:
        if vectorizer:
            # Expert models need vectorization
            numeric_text = vectorizer.transform([clean_text])
            
            # 🌟 NEW: Proactively check the matrix for non-finite values
            if not np.all(np.isfinite(numeric_text.data)):
                print(f"⚠️ Numerical instability detected in TF-IDF matrix. Forcing safe score.")
                return {'ml_label': 0, 'ml_score': 0.0, 'status': 'numerical_instability_fixed'}
            
            probability_scam = model.predict_proba(numeric_text)[0][1]
            
        else:
            # General model uses Pipeline
            probability_scam = model.predict_proba([clean_text])[0][1]
        
        # 🌟 NEW: Check the prediction result for NaN before return
        if np.isnan(probability_scam) or np.isinf(probability_scam):
            print(f"⚠️ Mathematical instability (NaN/Inf) detected. Forcing safe score fallback.")
            probability_scam = 0.0
        
        # 3. Create label safely
        try:
            label = 1 if probability_scam > 0.5 else 0
        except TypeError:
            print("⚠️ TypeError during label calculation. Forcing safe fallback.")
            label = 0
        
        return {
            'ml_label': label,
            'ml_score': round(float(probability_scam), 4),
            'status': 'success'
        }
        
    except Exception as e:
        print(f"🔴 Prediction Core Error: {e}")
        return {'ml_label': 0, 'ml_score': 0.0, 'status': f'prediction_error: {str(e)}'}


# ==========================================
# 2. DYNAMIC ROUTING API (For Live Scanner, etc)
# ==========================================
@app.route('/analyze', methods=['POST'])
def analyze_text():
    data = request.get_json()
    message = data.get('message', '')
    category = data.get('category', 'Not sure') 

    if not message: return jsonify({"error": "No message provided"}), 400
    if general_model is None: return jsonify({"error": "Critical: General AI not loaded."}), 500

    try:
        # --- MODEL ROUTER LOGIC ---
        if category == 'Bank' and bank_model and bank_vectorizer:
            print(f"🧠 Routing to: Bank Expert Model for message: '{message[:30]}...'")
            numeric_text = bank_vectorizer.transform([message])
            prediction = int(bank_model.predict(numeric_text)[0])
            probabilities = bank_model.predict_proba(numeric_text)[0]
            
        elif category == 'Digital arrest' and da_model and da_vectorizer:
            print(f"🧠 Routing to: Digital Arrest Expert Model for message: '{message[:30]}...'")
            numeric_text = da_vectorizer.transform([message])
            prediction = int(da_model.predict(numeric_text)[0])
            probabilities = da_model.predict_proba(numeric_text)[0]
            
        elif category == 'OTP' and otp_model and otp_vectorizer:
            print(f"🧠 Routing to: OTP Expert Model for message: '{message[:30]}...'")
            numeric_text = otp_vectorizer.transform([message])
            prediction = int(otp_model.predict(numeric_text)[0])
            probabilities = otp_model.predict_proba(numeric_text)[0]
            
        else: 
            # Fallback for 'Not sure' OR if an expert model file is missing
            print(f"🧠 Routing to: General Threat Model (Fallback) for message: '{message[:30]}...'")
            prediction = int(general_model.predict([message])[0])
            probabilities = general_model.predict_proba([message])[0]

        # --- CALCULATE CONFIDENCE ---
        confidence_score = round(max(probabilities) * 100)

        # --- RESPONSE ---
        result = {
            "is_scam": True if prediction == 1 else False,
            "confidence_score": f"{confidence_score}%",
            "expert_used": category
        }
        return jsonify(result)
    except Exception as e:
        print(f"🔴 Flask Analysis Error: {e}")
        return jsonify({"error": "Failed to analyze message via ML models."}), 500


# ==========================================
# 🌟 ENDPOINTS: FOR SMS SIMULATOR (MODULAR EXPERTS)
# ==========================================

@app.route('/predict/bank', methods=['POST'])
def predict_bank_sms():
    data = request.get_json()
    message = data.get('message', '')
    print(f"🏦 [Bank Expert] analyzing raw SMS text...")
    result = run_expert_internal_analysis(message, bank_model, bank_vectorizer)
    return jsonify(result)

@app.route('/predict/otp', methods=['POST'])
def predict_otp_sms():
    data = request.get_json()
    message = data.get('message', '')
    print(f"🔐 [OTP Expert] analyzing raw SMS text...")
    result = run_expert_internal_analysis(message, otp_model, otp_vectorizer)
    return jsonify(result)

@app.route('/predict/da', methods=['POST'])
def predict_da_sms():
    data = request.get_json()
    message = data.get('message', '')
    print(f"👮 [DA Expert] analyzing raw SMS text...")
    result = run_expert_internal_analysis(message, da_model, da_vectorizer)
    return jsonify(result)

@app.route('/predict/general', methods=['POST'])
def predict_general_sms():
    data = request.get_json()
    message = data.get('message', '')
    print(f"📦 [General Expert] analyzing raw SMS text...")
    result = run_expert_internal_analysis(message, general_model)
    return jsonify(result)


# ==========================================
# 3. CONTINUOUS LEARNING: AUTO-RETRAIN PIPELINE
# ==========================================
@app.route('/retrain', methods=['POST'])
def retrain_models():
    print("\n🚨 URGENT: Node.js triggered Continuous Learning Pipeline!")
    global general_model, bank_model, bank_vectorizer, da_model, da_vectorizer, otp_model, otp_vectorizer
    try:
        incoming_data = request.json.get('data', [])
        if not incoming_data:
            return jsonify({"error": "No training data provided"}), 400

        print(f"📥 Received {len(incoming_data)} new verified threat records.")

        datasets = {
            'Bank': {'csv': 'bank_dataset.csv', 'new_rows': []},
            'OTP': {'csv': 'otp_dataset.csv', 'new_rows': []},
            'Digital arrest': {'csv': 'digital_arrest_dataset.csv', 'new_rows': []},
            'Not sure': {'csv': 'scam_dataset.csv', 'new_rows': []}
        }

        for item in incoming_data:
            cat = item.get('category', 'Not sure')
            if cat in datasets:
                datasets[cat]['new_rows'].append({'message': item['message'], 'label': item['label']})
            else:
                datasets['Not sure']['new_rows'].append({'message': item['message'], 'label': item['label']})

        for cat, info in datasets.items():
            if len(info['new_rows']) > 0:
                csv_file = info['csv']
                print(f"🔄 Updating {cat} model... Adding {len(info['new_rows'])} rows to {csv_file}")
                
                new_df = pd.DataFrame(info['new_rows'])
                write_mode = 'a' if os.path.exists(csv_file) else 'w'
                header = False if os.path.exists(csv_file) else True
                new_df.to_csv(csv_file, mode=write_mode, header=header, index=False)
                
                df = pd.read_csv(csv_file).dropna()
                X = df['message']
                y = df['label']
                
                if cat == 'Not sure':
                    model = make_pipeline(
                        TfidfVectorizer(stop_words='english', ngram_range=(1, 2), max_features=5000),
                        LogisticRegression(max_iter=1000)
                    )
                    model.fit(X, y)
                    joblib.dump(model, 'scam_model.pkl')
                    general_model = model 
                    
                else:
                    vec = TfidfVectorizer(stop_words='english', ngram_range=(1, 2), max_features=5000)
                    X_numeric = vec.fit_transform(X)
                    
                    model = LogisticRegression(max_iter=1000)
                    model.fit(X_numeric, y)
                    
                    if cat == 'Bank':
                        joblib.dump(model, 'bank_model.pkl')
                        joblib.dump(vec, 'bank_vectorizer.pkl')
                        bank_model, bank_vectorizer = model, vec
                    elif cat == 'Digital arrest':
                        joblib.dump(model, 'digital_arrest_model.pkl')
                        joblib.dump(vec, 'digital_arrest_vectorizer.pkl')
                        da_model, da_vectorizer = model, vec
                    elif cat == 'OTP':
                        joblib.dump(model, 'otp_model.pkl')
                        joblib.dump(vec, 'otp_vectorizer.pkl')
                        otp_model, otp_vectorizer = model, vec

        print("✅ Models retrained and loaded into active memory successfully!")
        return jsonify({"message": "Continuous learning cycle complete. Models are now smarter."})

    except Exception as e:
        print(f"🔴 Critical Retraining Error: {e}")
        return jsonify({"error": str(e)}), 500
    
@app.route('/', methods=['GET'])
def check_neural_core():
    loaded_experts = []
    if bank_model: loaded_experts.append('Bank')
    if otp_model: loaded_experts.append('OTP')
    if da_model: loaded_experts.append('Digital Arrest')
    if general_model: loaded_experts.append('General')
    
    return jsonify({
        "status": "online",
        "message": "ScamShieldAI Neural Core is Listening.",
        "active_experts": loaded_experts
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)