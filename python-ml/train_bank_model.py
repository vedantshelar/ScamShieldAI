# ml_service/train_bank_model.py
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
import joblib

def train_model():
    print("🚀 1. Loading bank_model.csv...")
    try:
        df = pd.read_csv('bank_dataset.csv')
    except FileNotFoundError:
        print("❌ Error: bank_dataset.csv not found! Make sure it is in the same folder.")
        return

    # Basic data cleaning: drop empty rows
    df = df.dropna(subset=['message', 'label'])

    print(f"📊 2. Found {len(df)} total messages.")
    
    # Split data into Features (X) and Labels (y)
    X_text = df['message']
    y = df['label']

    print("🧮 3. Converting text to numbers (TF-IDF)...")
    # TfidfVectorizer looks at how often words appear to figure out what is important
    vectorizer = TfidfVectorizer(stop_words='english', max_features=5000)
    X_numeric = vectorizer.fit_transform(X_text)

    # Split into 80% training data and 20% testing data
    X_train, X_test, y_train, y_test = train_test_split(X_numeric, y, test_size=0.2, random_state=42)

    print("🧠 4. Training the Bank Fraud Expert Model...")
    # Logistic Regression is perfect here because it outputs highly accurate probability scores!
    model = LogisticRegression(max_iter=1000)
    model.fit(X_train, y_train)

    print("🔍 5. Testing the model on unseen data...")
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"\n✅ Model Accuracy: {accuracy * 100:.2f}%")
    print("-" * 30)
    print(classification_report(y_test, y_pred, target_names=['Safe (0)', 'Scam (1)']))
    print("-" * 30)

    print("💾 6. Saving the trained model and vectorizer...")
    # We MUST save both the model and the vectorizer! 
    # The Flask API needs the exact same vectorizer to understand new messages later.
    joblib.dump(vectorizer, 'bank_vectorizer.pkl')
    joblib.dump(model, 'bank_model.pkl')
    
    print("🎉 Success! bank_vectorizer.pkl and bank_model.pkl are ready for Flask!")

if __name__ == "__main__":
    train_model()