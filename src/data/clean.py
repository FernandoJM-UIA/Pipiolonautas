import pandas as pd

# Read the CSV file
df = pd.read_csv('./exoplanetsRandomTexture.csv')  # Replace 'your_file.csv' with your actual file name

# Remove rows where X, Y, or Z are NaN or empty
df = df.dropna(subset=['X', 'Y', 'Z'])

# Save the updated DataFrame to a new CSV file
df.to_csv('exoplanetsCleaned.csv', index=False)  # Replace 'cleaned_file.csv' with your desired output file name

print("Rows with missing values in X, Y, or Z have been removed and saved to cleaned_file.csv")
