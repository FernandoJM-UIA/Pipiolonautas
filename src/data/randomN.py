import pandas as pd
import numpy as np

# Read the CSV file
df = pd.read_csv('./exoplanets.csv')  # Replace 'your_file.csv' with your actual file name

# Add a new column with random values between 0 and 16
df['random_value'] = np.random.randint(0, 17, size=len(df))

# Save the updated DataFrame to a new CSV file
df.to_csv('updated_file.csv', index=False)  # Replace 'updated_file.csv' with your desired output file name

print("New column added and saved to updated_file.csv")
