import pandas as pd
import numpy as np

# Load the stars data from the CSV
csv_file_path = './constellations_stars.csv'
stars_df = pd.read_csv(csv_file_path)

# Default distance to stars (in light-years)
distance_to_star = 1  # You can change this to any other distance if needed

# Function to convert RA and Dec to XYZ coordinates
def convert_ra_dec_to_xyz(ra, dec, distance):
    # Convert degrees to radians
    ra_rad = np.radians(ra)
    dec_rad = np.radians(dec)
    
    # Calculate XYZ coordinates
    x = distance * np.cos(dec_rad) * np.cos(ra_rad)
    y = distance * np.cos(dec_rad) * np.sin(ra_rad)
    z = distance * np.sin(dec_rad)
    
    return x, y, z

# Apply conversion to each star in the DataFrame
stars_df[['X', 'Y', 'Z']] = stars_df.apply(lambda row: convert_ra_dec_to_xyz(row['RA'], row['Dec'], distance_to_star), axis=1, result_type='expand')

# Save the updated DataFrame with XYZ coordinates to a new CSV
output_csv_file_path = './constellations_stars_xyz.csv'
stars_df.to_csv(output_csv_file_path, index=False)

output_csv_file_path