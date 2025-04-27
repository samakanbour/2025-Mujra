
# Load a trained flood risk model to predict flood probabilities for different regions.
# Assigns a risk color (Red, Yellow, Green) and saves results to a CSV file.

# Import required libraries
import pandas as pd
import numpy as np
import joblib

# Load the previously trained model and scaler
model = joblib.load('flood_risk_model.pkl')
scaler = joblib.load('scaler.pkl')

# Load new region data for prediction
regions_data = pd.read_csv('../data/region_data.csv')

# Define the feature columns used for prediction
features = ['Relative_Humidity', 'Wind_Speed', 'Cloud_Coverage', 'Bright_Sunshine',
            'Avg Temp', 'Elevation', 'Urban Density', 'Rainfall']

# Extract features and apply the same scaling as training
region_features = regions_data[features]
region_features_scaled = scaler.transform(region_features)

# Predict flood probabilities for each region
region_probs = model.predict_proba(region_features_scaled)[:, 1]

# Add flood probability to the dataset
regions_data['Flood Probability'] = region_probs

# Define a function to assign risk colors based on probability thresholds
def assign_risk_color(prob):
    if prob >= 0.7:
        return 'Red'    # High risk
    elif prob >= 0.4:
        return 'Yellow' # Moderate risk
    else:
        return 'Green'  # Low risk

# Apply risk color assignment to each region
regions_data['Flood Risk Color'] = regions_data['Flood Probability'].apply(assign_risk_color)

# Save the updated dataset to a new CSV file
regions_data.to_csv('../data/region_flood_predictions.csv', index=False)

# Print a confirmation message and display relevant columns
print("\nPredictions completed. Saved to 'data/region_flood_predictions.csv'.")
print(regions_data[['Zone', 'Flood Probability', 'Flood Risk Color']])