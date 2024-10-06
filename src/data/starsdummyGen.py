import csv
import random
import math

# Number of stars to generate and the minimum distance threshold
num_stars = 2000
min_distance_threshold = 300  # Minimum distance from origin (0, 0, 0)

# Function to calculate normalized luminosity based on distance from (0, 0, 0)
def calculate_luminosity(x, y, z):
    distance = math.sqrt(x**2 + y**2 + z**2)
    max_distance = math.sqrt(3 * (1000 ** 2))  # Max distance assuming range [-1000, 1000] for X, Y, Z
    normalized_distance = distance / max_distance
    return 1 - normalized_distance  # Higher luminosity for stars closer to (0,0,0)


# Modified function to generate star coordinates ensuring distance > threshold
def generate_position_within_threshold(threshold):
    while True:
        x = random.uniform(-1000, 1000)
        y = random.uniform(-1000, 1000)
        z = random.uniform(-1000, 1000)
        distance = math.sqrt(x**2 + y**2 + z**2)
        if distance > threshold:
            return x, y, z

# Generate CSV data with the distance threshold
with open('./stars_dummy.csv', mode='w', newline='') as file:
    writer = csv.writer(file)
    writer.writerow(['X', 'Y', 'Z', 'Normalized Luminosity', 'Normalized Radius'])
    
    for _ in range(num_stars):
        # Generate coordinates beyond the minimum distance threshold
        x, y, z = generate_position_within_threshold(min_distance_threshold)
        
        # Calculate normalized luminosity based on distance from (0, 0, 0)
        luminosity = calculate_luminosity(x, y, z)
        
        # Random radius between 0.1 and 1
        radius = random.uniform(0.1, 1.0)
        
        # Write row to CSV
        writer.writerow([x, y, z, round(luminosity, 4), round(radius, 4)])

'./stars_dummy.csv'
