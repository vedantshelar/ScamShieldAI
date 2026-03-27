# python-ml/train_model.py

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import make_pipeline
from sklearn.metrics import classification_report, accuracy_score
from sklearn.linear_model import LogisticRegression
import joblib

print("📂 Loading dataset...")

# Load dataset
df = pd.read_csv('scam_dataset.csv')

# Remove empty rows
df = df.dropna()

# Features and labels
X = df['message']
y = df['label']

# Check distribution
print("\n📊 Label Distribution:")
print(y.value_counts())

print("\n🔀 Splitting data (Stratified)...")

# Stratified split (important for balanced training)
X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print("\n🤖 Training Machine Learning Model...")

# Improved model pipeline
model = make_pipeline(
    TfidfVectorizer(
        stop_words='english',
        ngram_range=(1, 2),   # BIG improvement (captures phrases)
        max_features=5000
    ),
    LogisticRegression(max_iter=1000)
)

# Train model
model.fit(X_train, y_train)

print("\n📈 Evaluating Model...")

# Predictions
predictions = model.predict(X_test)

# Accuracy
accuracy = accuracy_score(y_test, predictions)

print(f"\n✅ Model trained successfully! Accuracy: {accuracy * 100:.2f}%")

print("\n📊 Detailed Classification Report:")
print(classification_report(y_test, predictions))

# Save model
joblib.dump(model, 'scam_model.pkl')

print("\n💾 Model saved as 'scam_model.pkl'")