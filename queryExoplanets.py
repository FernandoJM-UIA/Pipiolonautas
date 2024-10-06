import pandas as pd
import numpy as np

# Load the CSV file
df = pd.read_csv('./converted_coordinates.csv')  # Replace with your actual CSV file path
# Initialize counts and first occurrences for each octant
octant_counts = {
    'Octant 1 (x>0, y>0, z>0)': {'count': 0, 'first_row': None},
    'Octant 2 (x>0, y>0, z<0)': {'count': 0, 'first_row': None},
    'Octant 3 (x>0, y<0, z>0)': {'count': 0, 'first_row': None},
    'Octant 4 (x>0, y<0, z<0)': {'count': 0, 'first_row': None},
    'Octant 5 (x<0, y>0, z>0)': {'count': 0, 'first_row': None},
    'Octant 6 (x<0, y>0, z<0)': {'count': 0, 'first_row': None},
    'Octant 7 (x<0, y<0, z>0)': {'count': 0, 'first_row': None},
    'Octant 8 (x<0, y<0, z<0)': {'count': 0, 'first_row': None}
}

# Iterate through each row and count the octants
for index, row in df.iterrows():
    # Access the X, Y, and Z columns directly
    x, y, z = row['X'], row['Y'], row['Z']
    
    # Count the octants based on the coordinates
    if x > 0 and y > 0 and z > 0:
        octant_counts['Octant 1 (x>0, y>0, z>0)']['count'] += 1
        if octant_counts['Octant 1 (x>0, y>0, z>0)']['first_row'] is None:
            octant_counts['Octant 1 (x>0, y>0, z>0)']['first_row'] = row
    elif x > 0 and y > 0 and z < 0:
        octant_counts['Octant 2 (x>0, y>0, z<0)']['count'] += 1
        if octant_counts['Octant 2 (x>0, y>0, z<0)']['first_row'] is None:
            octant_counts['Octant 2 (x>0, y>0, z<0)']['first_row'] = row
    elif x > 0 and y < 0 and z > 0:
        octant_counts['Octant 3 (x>0, y<0, z>0)']['count'] += 1
        if octant_counts['Octant 3 (x>0, y<0, z>0)']['first_row'] is None:
            octant_counts['Octant 3 (x>0, y<0, z>0)']['first_row'] = row
    elif x > 0 and y < 0 and z < 0:
        octant_counts['Octant 4 (x>0, y<0, z<0)']['count'] += 1
        if octant_counts['Octant 4 (x>0, y<0, z<0)']['first_row'] is None:
            octant_counts['Octant 4 (x>0, y<0, z<0)']['first_row'] = row
    elif x < 0 and y > 0 and z > 0:
        octant_counts['Octant 5 (x<0, y>0, z>0)']['count'] += 1
        if octant_counts['Octant 5 (x<0, y>0, z>0)']['first_row'] is None:
            octant_counts['Octant 5 (x<0, y>0, z>0)']['first_row'] = row
    elif x < 0 and y > 0 and z < 0:
        octant_counts['Octant 6 (x<0, y>0, z<0)']['count'] += 1
        if octant_counts['Octant 6 (x<0, y>0, z<0)']['first_row'] is None:
            octant_counts['Octant 6 (x<0, y>0, z<0)']['first_row'] = row
    elif x < 0 and y < 0 and z > 0:
        octant_counts['Octant 7 (x<0, y<0, z>0)']['count'] += 1
        if octant_counts['Octant 7 (x<0, y<0, z>0)']['first_row'] is None:
            octant_counts['Octant 7 (x<0, y<0, z>0)']['first_row'] = row
    elif x < 0 and y < 0 and z < 0:
        octant_counts['Octant 8 (x<0, y<0, z<0)']['count'] += 1
        if octant_counts['Octant 8 (x<0, y<0, z<0)']['first_row'] is None:
            octant_counts['Octant 8 (x<0, y<0, z<0)']['first_row'] = row

# Print the counts and first rows for each octant to the console
print("Counts of planets in each coordinate octant and the first row:")
for octant, data in octant_counts.items():
    print(f"{octant}: Count = {data['count']}, First Row = {data['first_row']}")