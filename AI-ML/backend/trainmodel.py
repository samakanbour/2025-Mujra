#Train a Random Forest model to predict flood risk based on weather, elevation, and urban density.
# Saves the model, evaluates performance, and plots flood probability distribution.

# Import necessary libraries
import pandas as pd
import numpy as np
import joblib   
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import roc_auc_score, confusion_matrix, classification_report
import matplotlib.pyplot as plt
import seaborn as sns

# Load the dataset
df = pd.read_csv('../data/dubai_flood_dataset_20k.csv')

# Select features (inputs) and target (output)
features = ['Relative_Humidity', 'Wind_Speed', 'Cloud_Coverage', 'Bright_Sunshine',
            'Avg Temp', 'Elevation', 'Urban Density', 'Rainfall']
X = df[features]
y = df['Flood?']  # Target variable (0: No flood, 1: Flood)

# Standardize the feature values (important for consistent scaling)
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# Split the data into training and testing sets (80% train, 20% test)
X_train, X_test, y_train, y_test = train_test_split(X_scaled, y, test_size=0.2, random_state=42)

# Initialize and train a Random Forest Classifier
model = RandomForestClassifier(random_state=42)
model.fit(X_train, y_train)

# Save the trained model and scaler for future use
joblib.dump(model, 'flood_risk_model.pkl')
joblib.dump(scaler, 'scaler.pkl')

# Predict probabilities of flood on the test set
flood_probabilities = model.predict_proba(X_test)[:, 1]  # Take probability of class 1 (flood)

# Set a custom threshold for classification (default would be 0.5)
threshold = 0.4  
y_pred = (flood_probabilities > threshold).astype(int)

# Print classification metrics
print(f"\nClassification Report (Threshold={threshold}):\n")
print(classification_report(y_test, y_pred))

# Print the confusion matrix
print("\nConfusion Matrix:\n")
print(confusion_matrix(y_test, y_pred))

# Calculate and print ROC AUC Score
roc_auc = roc_auc_score(y_test, flood_probabilities)
print(f"\nROC AUC Score: {roc_auc:.4f}")

# Plot the histogram of predicted flood probabilities
plt.figure(figsize=(10,6))
sns.histplot(flood_probabilities, kde=True, color='blue')
plt.title('Predicted Flood Probabilities')
plt.xlabel('Flood Probability')
plt.ylabel('Frequency')
plt.grid(True)
plt.show()