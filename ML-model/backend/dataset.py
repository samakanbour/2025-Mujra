#This script generates a synthetic dataset of 20,000 flood risk samples for different zones in Dubai based on environmental conditions and saves it to a CSV file for machine learning use.

import pandas as pd
import numpy as np


np.random.seed(42)

# Define a DataFrame with basic information about different zones in Dubai
zones_df = pd.DataFrame({
    'zone': [
        'Deira', 'Bur Dubai', 'Dubai Marina', 'Jebel Ali', 'Expo 2020 Site', 'Downtown Dubai',
        'Dubai Creek Harbour', 'Al Quoz Industrial', 'Dubai Silicon Oasis', 'Mirdif',
        'Al Barsha', 'International City'
    ],
    'lat': [
        25.276987, 25.253174, 25.08, 25.01016, 24.95351, 25.197197,
        25.204849, 25.1357, 25.1212, 25.2203, 25.1078, 25.1634
    ],
    'lon': [
        55.296249, 55.297916, 55.14, 55.062446, 55.038, 55.274376,
        55.342674, 55.2311, 55.3773, 55.4162, 55.2077, 55.4179
    ],
    'elevation': [4, 3.5, 6, 11, 12, 5, 3, 7, 9, 8, 7.5, 6.5],
    'urban_density': [2, 2, 2, 0, 0, 2, 2, 1, 1, 1, 1, 1],
    'rainfall': [55, 50, 42, 20, 25, 60, 58, 35, 36, 48, 40, 45]
})

# Define the number of synthetic data samples to generate
n_samples = 20000
samples = []

# Generate synthetic samples
for _ in range(n_samples):
    # Randomly select one zone from the predefined zones
    zone_row = zones_df.sample(n=1).iloc[0]
    
    # Randomly generate environmental features
    relative_humidity = np.random.uniform(30, 100)
    wind_speed = np.random.uniform(0, 10)
    cloud_coverage = np.random.uniform(0, 1)
    bright_sunshine = np.random.uniform(0, 12)
    avg_temp = np.random.uniform(15, 45)
    
    # Calculate a synthetic flood probability based on environmental factors and zone properties
    flood_probability = (
        0.4 * (zone_row['rainfall'] / 100) +
        0.25 * (relative_humidity / 100) +
        0.15 * cloud_coverage +
        0.1  * (1 - bright_sunshine / 12) +
        0.05 * (1 - (zone_row['elevation'] / 15)) +
        0.05 * (zone_row['urban_density'] / 2)
    )
    
    # Classify as flood (1) or no flood (0) based on threshold of 0.5
    flood = 1 if flood_probability > 0.5 else 0

    # Add the sample to the list
    samples.append({
        'Zone': zone_row['zone'],
        'Latitude': zone_row['lat'],
        'Longitude': zone_row['lon'],
        'Elevation': zone_row['elevation'],
        'Urban Density': zone_row['urban_density'],
        'Rainfall': zone_row['rainfall'],
        'Relative_Humidity': relative_humidity,
        'Wind_Speed': wind_speed,
        'Cloud_Coverage': cloud_coverage,
        'Bright_Sunshine': bright_sunshine,
        'Avg Temp': avg_temp,
        'Flood?': flood,      # Flood label (redundant with 'Flood Risk')
        'Flood Risk': flood   # Same flood label
    })

# Convert all samples into a single DataFrame
final_df = pd.DataFrame(samples)

# Save the dataset to a CSV file
final_df.to_csv('../data/dubai_flood_dataset_20k.csv', index=False)

# Display first few rows to confirm
print(final_df.head())
print("\n 20,000 samples created and saved to 'dubai_flood_dataset_20k.csv'!")
