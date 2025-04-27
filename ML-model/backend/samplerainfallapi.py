 #Fetch real-time 5-day weather forecast data using OpenWeatherMap API.
# Extract and save the maximum forecasted rainfall for each Dubai zone.
# Import necessary libraries
import requests
import json
import pandas as pd

# Load Dubai zones metadata from a local JSON file
with open('../data/meta.json', 'r') as f:
    dubai_zones = json.load(f)

# OpenWeatherMap API Key (replace with your own if needed)
API_KEY = "8406c6cbddaf9fd766371435feb0ee8f"  

# Define a function to get the maximum forecasted rainfall for a given location
def get_forecasted_rainfall(lat, lon):
    # Build the API request URL
    url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
    response = requests.get(url)
    print(response)  # Print the response status for debugging
    data = response.json()

    # Initialize rainfall to 0
    rainfall = 0
    
    # Check if the response contains forecast data
    if "list" in data:
        # Loop through the first 24 forecast entries (~3-hour intervals = ~3 days)
        for forecast in data["list"][:24]: 
            # Check if rainfall data is present
            if "rain" in forecast and "3h" in forecast["rain"]:
                # Record the maximum rainfall amount seen across forecasts
                rainfall = max(rainfall, forecast["rain"]["3h"])  
    
    return rainfall

# Create a list to store rainfall results for each zone
rainfall_results = []

# Loop through all zones and collect forecasted rainfall data
for zone in dubai_zones:
    rainfall = get_forecasted_rainfall(zone["lat"], zone["lon"])
    rainfall_results.append({
        "zone": zone["zone"],
        "lat": zone["lat"],
        "lon": zone["lon"],
        "elevation": zone["elevation"],
        "urban_density": zone["urban_density"],
        "rainfall": rainfall
    })
    print(f"Zone: {zone['zone']} | Forecasted Rainfall (max next 5 days): {rainfall} mm")

# Convert the collected data into a pandas DataFrame
df = pd.DataFrame(rainfall_results)

# Save the DataFrame to a CSV file
df.to_csv('../data/live_rainfall_data.csv', index=False)

# Print a success message
print("Forecasted rainfall data collected and saved to data/live_rainfall_data.csv")