
# python-ml/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline

app = Flask(__name__)
CORS(app)

# ==========================================
# 1. LOAD ALL AI MODELS AT STARTUP
# ==========================================
print("🚀 Booting up ScamShieldAI ML Hub...")

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

# ==========================================
# 2. THE DYNAMIC ROUTING API
# ==========================================
@app.route('/analyze', methods=['POST'])
def analyze_text():
    data = request.get_json()
    message = data.get('message', '')
    
    # 🌟 NEW: Get the category from React/Node, default to 'Not sure'
    category = data.get('category', 'Not sure') 

    if not message:
        return jsonify({"error": "No message provided"}), 400

    if general_model is None:
        return jsonify({"error": "Critical: General AI model not loaded on server."}), 500

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
            "expert_used": category # Bonus: Let the frontend know which brain was used!
        }

        return jsonify(result)
        
    except Exception as e:
        print(f"🔴 Flask Analysis Error: {e}")
        return jsonify({"error": "Failed to analyze message via ML models."}), 500


# ==========================================
# 3. CONTINUOUS LEARNING: AUTO-RETRAIN PIPELINE
# ==========================================
@app.route('/retrain', methods=['POST'])
def retrain_models():
    print("\n🚨 URGENT: Node.js triggered Continuous Learning Pipeline!")
    
    # We must declare these as global so we can update the active brains in memory!
    global general_model, bank_model, bank_vectorizer, da_model, da_vectorizer, otp_model, otp_vectorizer
    
    try:
        incoming_data = request.json.get('data', [])
        if not incoming_data:
            return jsonify({"error": "No training data provided"}), 400

        print(f"📥 Received {len(incoming_data)} new verified threat records.")

        # 1. GROUP THE NEW DATA BY CATEGORY
        # We need to know which CSV file to append each message to.
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

        # 2. APPEND AND RETRAIN ONLY THE AFFECTED MODELS
        for cat, info in datasets.items():
            if len(info['new_rows']) > 0:
                csv_file = info['csv']
                print(f"🔄 Updating {cat} model... Adding {len(info['new_rows'])} rows to {csv_file}")
                
                # A. Append new rows to the CSV file
                new_df = pd.DataFrame(info['new_rows'])
                # If file exists, append without header. If not, create it with header.
                write_mode = 'a' if os.path.exists(csv_file) else 'w'
                header = False if os.path.exists(csv_file) else True
                new_df.to_csv(csv_file, mode=write_mode, header=header, index=False)
                
                # B. Load the entire updated dataset for retraining
                df = pd.read_csv(csv_file).dropna()
                X = df['message']
                y = df['label']
                
                # C. Retrain the specific model
                if cat == 'Not sure':
                    # The General Model uses a Pipeline
                    model = make_pipeline(
                        TfidfVectorizer(stop_words='english', ngram_range=(1, 2), max_features=5000),
                        LogisticRegression(max_iter=1000)
                    )
                    model.fit(X, y)
                    joblib.dump(model, 'scam_model.pkl')
                    general_model = model # Update active memory!
                    
                else:
                    # The Expert Models use separate Vectorizers and Classifiers
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
    
    
if __name__ == '__main__':
    app.run(port=5000, debug=True)