# ml_service/train_digital_arrest.py
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
import joblib

def train_digital_arrest_model():
    print("🚀 1. Loading digital_arrest_dataset.csv...")
    try:
        df = pd.read_csv('digital_arrest_dataset.csv')
    except FileNotFoundError:
        print("❌ Error: digital_arrest_dataset.csv not found! Ensure it is in the ml_service folder.")
        return

    # Clean the data
    df = df.dropna(subset=['message', 'label'])
    print(f"📊 2. Found {len(df)} total messages.")

    # 🌟 THE SAFETY CHECK: Ensure we have both 0 (Safe) and 1 (Scam)
    unique_labels = df['label'].unique()
    if len(unique_labels) < 2:
        print(f"\n❌ CRITICAL ERROR: Your dataset only contains label {unique_labels[0]}!")
        print("A Machine Learning model needs both Safe (0) and Scam (1) examples to learn the difference.")
        print("Please add the missing examples to your CSV and try again.\n")
        return

    # Split data into Features (X) and Labels (y)
    X_text = df['message']
    y = df['label']

    print("🧮 3. Converting text to numbers (TF-IDF)...")
    vectorizer = TfidfVectorizer(stop_words='english', max_features=5000)
    X_numeric = vectorizer.fit_transform(X_text)

    # 80% Training, 20% Testing
    X_train, X_test, y_train, y_test = train_test_split(X_numeric, y, test_size=0.2, random_state=42)

    print("🧠 4. Training the Digital Arrest Expert Model...")
    model = LogisticRegression(max_iter=1000)
    model.fit(X_train, y_train)

    print("🔍 5. Testing the model on unseen data...")
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    print(f"\n✅ Model Accuracy: {accuracy * 100:.2f}%")
    print("-" * 30)
    print(classification_report(y_test, y_pred, target_names=['Safe (0)', 'Scam (1)']))
    print("-" * 30)

    print("💾 6. Saving the Digital Arrest model and vectorizer...")
    
    # 🌟 CRITICAL: Save to new file names so we don't overwrite the Bank model!
    joblib.dump(vectorizer, 'digital_arrest_vectorizer.pkl')
    joblib.dump(model, 'digital_arrest_model.pkl')
    
    print("🎉 Success! digital_arrest_vectorizer.pkl and digital_arrest_model.pkl are ready!")

if __name__ == "__main__":
    train_digital_arrest_model()