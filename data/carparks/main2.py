import json
import pandas as pd
import math

# The exact 41 locations from your list
target_locations = [
    "313@Somerset", "Bedok Mall", "Bt Panjang Plaza", "Bugis+", 
    "CQ @ Clarke Quay", "Centrepoint", "Cineleisure", "Concorde Hotel", 
    "Esplanade", "Far East Plaza", "Funan Mall", "Harbourfront Centre", 
    "Hilton Orchard", "IMM Building", "ION Orchard", "Junction 8", 
    "Lot One", "Marina Square", "Millenia Singapore", "National Gallery", 
    "Ngee Ann City", "Orchard Central", "Orchard Gateway", "Orchard Point", 
    "Paragon", "Plaza Singapura", "Raffles City", "Resorts World", 
    "Sentosa", "Singapore Flyer", "Suntec City", "Tampines Mall", 
    "Tang Plaza", "The Atrium@Orchard", "The Cathay", "The Heeren", 
    "VivoCity P2", "VivoCity P3", "Westgate", "Wheelock Place", "Wisma Atria"
]

all_data = []

# 1. Loop through carpark1.json to carpark10.json
for i in range(1, 11):
    filename = f"carpark{i}.json"
    try:
        with open(filename, 'r') as f:
            data = json.load(f)
            
            # 2. Extract data only if the Development name matches our list
            for lot in data.get('value', []):
                if lot.get('Development') in target_locations:
                    all_data.append({
                        'CarParkID': lot.get('CarParkID'),
                        'Development': lot.get('Development'),
                        'AvailableLots': lot.get('AvailableLots', 0)
                    })
    except FileNotFoundError:
        print(f"Warning: {filename} not found. Skipping...")

if not all_data:
    print("No data found. Please ensure the JSON files are in the same folder.")
else:
    # 3. Load into pandas
    df = pd.DataFrame(all_data)
    
    # 4. Group by CarParkID and Development, then find the exact max
    max_lots_df = df.groupby(['CarParkID', 'Development'])['AvailableLots'].max().reset_index()
    
    # Rename the exact max column
    max_lots_df.rename(columns={'AvailableLots': 'ActualMaxObservedLots'}, inplace=True)
    
    # 5. Create a NEW column for the rounded maximum (rounding UP to nearest 10)
    max_lots_df['RoundedMaxObservedLots'] = max_lots_df['ActualMaxObservedLots'].apply(lambda x: math.ceil(x / 10.0) * 10)
    
    # Sort them alphabetically for a cleaner output
    max_lots_df = max_lots_df.sort_values(by='Development')
    
    # 6. Convert to a list of dictionaries for JSON export
    final_json_data = max_lots_df.to_dict(orient='records')
    
    # 7. Save as a new JSON file
    output_filename = "lta_max_capacities_combined.json"
    with open(output_filename, 'w') as out_file:
        json.dump(final_json_data, out_file, indent=4)
        
    print(f"Success! Processed {len(final_json_data)} locations.")
    print(f"The combined JSON file has been saved as: {output_filename}")