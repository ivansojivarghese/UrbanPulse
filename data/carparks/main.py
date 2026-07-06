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
                        'Snapshot': i,
                        'CarParkID': lot['CarParkID'],
                        'Development': lot['Development'],
                        'AvailableLots': lot['AvailableLots']
                    })
    except FileNotFoundError:
        print(f"Warning: {filename} not found.")

# 2. Convert to a pandas DataFrame
df = pd.DataFrame(all_data)

# 3. Determine the Approximate Maximum Lots per Carpark
max_lots = df.groupby('Development')['AvailableLots'].max().reset_index()
max_lots = max_lots.rename(columns={'AvailableLots': 'MaxObservedLots'})


# ==========================================
# 4A. NEW: Plotting the Table
# ==========================================
fig_table, ax_table = plt.subplots(figsize=(8, 6))

# Hide axes (we only want to see the table, not the graph lines)
ax_table.axis('off')
ax_table.axis('tight')

# Generate the table
table = ax_table.table(
    cellText=max_lots.values, 
    colLabels=['Development (Carpark Name)', 'Max Observed Lots'], 
    loc='center', 
    cellLoc='center'
)

# Style the table
table.auto_set_font_size(False)
table.set_fontsize(10)
table.scale(1.2, 1.5) # Scale columns/rows for better readability

plt.title('Maximum Observed Available Lots per LTA Carpark', fontsize=14, weight='bold', pad=20)


# ==========================================
# 4B. Plotting the Line Graph (Original)
# ==========================================
fig_graph = plt.figure(figsize=(14, 8))
lta_carparks = df['Development'].unique()

for carpark in lta_carparks:
    subset = df[df['Development'] == carpark]
    plt.plot(subset['Snapshot'], subset['AvailableLots'], marker='o', label=carpark)

plt.title('LTA Carpark Available Lots Over Time', fontsize=16)
plt.xlabel('Time Sequence (File 1 to 10)', fontsize=12)
plt.ylabel('Available Lots', fontsize=12)
plt.xticks(range(1, 11)) 
plt.legend(bbox_to_anchor=(1.05, 1), loc='upper left') 
plt.grid(True, linestyle='--', alpha=0.6)
plt.tight_layout()

# Display BOTH the table window and the graph window
plt.show()