import json
import pandas as pd
import matplotlib.pyplot as plt

all_data = []

# 1. Loop through carpark1.json to carpark10.json
for i in range(1, 11):
    filename = f"carpark{i}.json"
    
    try:
        with open(filename, 'r') as f:
            data = json.load(f)
            
            # Filter for LTA and grab the fields
            for lot in data['value']:
                if lot.get('Agency') == 'LTA':
                    all_data.append({
                        'Snapshot': i,  # The file number acts as our time sequence
                        'CarParkID': lot['CarParkID'],
                        'Development': lot['Development'],
                        'AvailableLots': lot['AvailableLots']
                    })
    except FileNotFoundError:
        print(f"Warning: {filename} not found. Make sure all 10 files are in the same folder.")

# 2. Convert to a pandas DataFrame
df = pd.DataFrame(all_data)

# 3. Determine the Approximate Maximum Lots per Carpark
# Group by the carpark name and find the highest available lot count across the 10 files
max_lots = df.groupby('Development')['AvailableLots'].max().reset_index()
max_lots = max_lots.rename(columns={'AvailableLots': 'MaxObservedLots'})

print("--- Max Observed Lots per LTA Carpark (Across 10 Snapshots) ---")
print(max_lots.to_string(index=False))
print("\nGenerating graph...")


# 4. Graphing the Data Over Time (Snapshots 1 to 10)
plt.figure(figsize=(14, 8))

# Get a list of unique LTA carparks
lta_carparks = df['Development'].unique()

# Plot a line for each carpark
for carpark in lta_carparks:
    subset = df[df['Development'] == carpark]
    plt.plot(subset['Snapshot'], subset['AvailableLots'], marker='o', label=carpark)

# Formatting the graph
plt.title('LTA Carpark Available Lots Over Time', fontsize=16)
plt.xlabel('Time Sequence (File 1 to 10)', fontsize=12)
plt.ylabel('Available Lots', fontsize=12)

# Ensure the X-axis only shows whole numbers 1 through 10
plt.xticks(range(1, 11)) 

# Push legend outside the graph so it doesn't cover the lines
plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left') 
plt.grid(True, linestyle='--', alpha=0.6)
plt.tight_layout()

# Display the graph
plt.show()