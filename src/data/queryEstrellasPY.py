import http.client as httplib
import urllib.parse as urllib
import time
from xml.dom.minidom import parseString
import csv
import math

host = "gea.esac.esa.int"
port = 443
pathinfo = "/tap-server/tap/async"

# Get the data of a planet by name
name = "Kepler-22 b"
raQuery = 0.0
decQuery = 0.0
xQuery = 0.0
yQuery = 0.0
zQuery = 0.0
with open("exoplanetsCleaned.csv", "r") as csvfile:
    reader = csv.reader(csvfile)
    # Get the header (first row)
    header = next(reader)
    pl_name_index = header.index("pl_name")
    # Find the indexes of columns
    ra_index = header.index("ra")
    dec_index = header.index("dec")
    x_index = header.index("X")
    y_index = header.index("Y")
    z_index = header.index("Z")

    for row in reader:          
        pl_name_value = str(row[pl_name_index])
        if pl_name_value == name:  
            raQuery = float(row[ra_index])
            decQuery = float(row[dec_index])
            xQuery = float(row[x_index])
            yQuery = float(row[y_index])  
            zQuery = float(row[z_index])  

          
# Construct query          
query = f"""
WITH DistanceCalc AS (
    SELECT 
        gaia_source.solution_id, 
        gaia_source.ra, 
        gaia_source.dec,
        gaia_source.parallax,
        gaia_source.phot_g_mean_mag,
        gaia_source.teff_gspphot
    FROM 
        gaiadr3.gaia_source 
    WHERE 
        gaia_source.ra BETWEEN 0 AND 360 
        AND gaia_source.dec BETWEEN 0 AND 360
        AND gaia_source.parallax IS NOT NULL 
        AND gaia_source.parallax > 0 
        AND gaia_source.teff_gspphot IS NOT NULL
)

SELECT TOP 2000         
    solution_id, 
    ra, 
    dec,
    parallax,
    phot_g_mean_mag,
    teff_gspphot,
    (1000 / parallax) * TAN(DISTANCE(POINT(ra, dec), POINT(289.217, 47.88)) * PI() / 180) AS distance_in_parsecs
FROM DistanceCalc;
"""
# Create job (this part remains unchanged)
params = urllib.urlencode({
    "REQUEST": "doQuery",
    "LANG": "ADQL",
    "FORMAT": "votable_plain",
    "PHASE": "RUN",
    "JOBNAME": "Any name (optional)",
    "JOBDESCRIPTION": "Any description (optional)",
    "QUERY": query
})

headers = {
    "Content-type": "application/x-www-form-urlencoded",
    "Accept": "text/plain"
}

connection = httplib.HTTPSConnection(host, port)
connection.request("POST", pathinfo, params, headers)

# Status
response = connection.getresponse()
location = response.getheader("location")
jobid = location[location.rfind('/') + 1:]
connection.close()

# Check job status (this part remains unchanged)
while True:
    connection = httplib.HTTPSConnection(host, port)
    connection.request("GET", pathinfo + "/" + jobid)
    response = connection.getresponse()
    data = response.read()
    dom = parseString(data)
    phaseElement = dom.getElementsByTagName('uws:phase')[0]
    phaseValueElement = phaseElement.firstChild
    phase = phaseValueElement.toxml()
    if phase == 'COMPLETED':
        break
    time.sleep(0.2)
connection.close()

# Get results
connection = httplib.HTTPSConnection(host, port)
connection.request("GET", pathinfo + "/" + jobid + "/results/result")
response = connection.getresponse()
data = response.read().decode('iso-8859-1')

# Parse the VOTable
dom = parseString(data)

# Get column names
columns = []
for field in dom.getElementsByTagName('FIELD'):
    columns.append(field.getAttribute('name'))

# Get row data
rows = []
for row in dom.getElementsByTagName('TR'):
    row_data = []
    for cell in row.getElementsByTagName('TD'):
        row_data.append(cell.firstChild.nodeValue)
    rows.append(row_data)

# Save to CSV
output_file_name = "output_data.csv"
with open(output_file_name, "w", newline='') as csvfile:
    writer = csv.writer(csvfile)
    writer.writerow(columns)  # write the header
    writer.writerows(rows)     # write the rows

print("Data saved in: " + output_file_name)

#Operate over values
# Planet data
x_planet = xQuery
y_planet = yQuery
z_planet = zQuery

# Variables to store luminosity and radius values for normalization
luminosity_relative_values = []
radius_relative_values = []

# List to store the results for final printing
results = []

with open("output_data.csv", "r") as csvfile:
    reader = csv.reader(csvfile)
    
    # Get the header (first row)
    header = next(reader)
    
    # Find the indexes of columns
    parallax_index = header.index("parallax")
    ra_index = header.index("ra")
    dec_index = header.index("dec")
    phot_g_mean_mag_index = header.index("phot_g_mean_mag")
    teff_gspphot_index = header.index("teff_gspphot")
    
    # Loop through the rows in the CSV
    for row in reader:
        if len(row) > teff_gspphot_index:  # Check if the row has enough columns
            try:
                # X, Y, Z coordinates from Star
                parallax_value = float(row[parallax_index])
                ra_value = float(row[ra_index])
                dec_value = float(row[dec_index])
                
                x_star = math.cos(math.radians(dec_value)) * math.cos(math.radians(ra_value)) * (1000.0 / parallax_value)
                y_star = math.cos(math.radians(dec_value)) * math.sin(math.radians(ra_value)) * (1000.0 / parallax_value)
                z_star = math.sin(math.radians(dec_value)) * (1000.0 / parallax_value)
                
                # Calculates X, Y, Z coordinates from a star relative to an exoplanet
                delta_x = x_planet - x_star
                delta_y = y_planet - y_star
                delta_z = z_planet - z_star
                
                # Relative Distance between objects
                relative_distance = math.sqrt(delta_x**2 + delta_y**2 + delta_z**2)
                
                # Distance from an exoplanet to a star
                x_star_relative = x_star - x_planet
                y_star_relative = y_star - y_planet
                z_star_relative = z_star - z_planet
                
                # Calculates absolute luminosity / brightness then the apparent 
                luminosity_value = float(row[phot_g_mean_mag_index])
                luminosity = luminosity_value - 5 * (math.log10(1000.0 / parallax_value) - 1)	
                luminosity_relative = luminosity / relative_distance**2
                
                # Store the luminosity_relative value for later normalization
                luminosity_relative_values.append(luminosity_relative)

                # Calculates absolute radius then apparent
                temperature = float(row[teff_gspphot_index])
                radius = math.sqrt(luminosity / (4 * math.pi * temperature**4 * 0.0000000567))
                radius_relative = 2 * math.atan(radius / relative_distance)

                # Store the radius_relative value for later normalization
                radius_relative_values.append(radius_relative)

                # Store results for final printing
                results.append((x_star_relative, y_star_relative, z_star_relative))
                
            except ValueError:
                print(f"Warning: Could not convert value '{row[teff_gspphot_index]}' to float.")

# Normalize luminosity_relative and radius_relative
if luminosity_relative_values:
    min_luminosity = min(luminosity_relative_values)
    max_luminosity = max(luminosity_relative_values)
    normalized_luminosity = [(value - min_luminosity) / (max_luminosity - min_luminosity) for value in luminosity_relative_values]
    # Multiply values by 10 if they are smaller than 0.01
    normalized_luminosity = [value * 10 if value < 0.01 else value for value in normalized_luminosity]

if radius_relative_values:
    min_radius = min(radius_relative_values)
    max_radius = max(radius_relative_values)
    normalized_radius = [(value - min_radius) / (max_radius - min_radius) for value in radius_relative_values]
    # Multiply values by 10 if they are smaller than 0.1
    normalized_radius = [value * 10 if value < 0.1 else value for value in normalized_radius]

# Save into csv
output_file = "stars.csv"

# Open the CSV file for writing
with open(output_file, mode='w', newline='') as csvfile:
    writer = csv.writer(csvfile)
    
    # Write the header (optional)
    writer.writerow(['X', 'Y', 'Z', 'Normalized Luminosity', 'Normalized Radius'])
    
    # Write the data
    for i, result in enumerate(results):
        writer.writerow([
            f"{result[0]:.5f}",
            f"{result[1]:.5f}",
            f"{result[2]:.5f}",
            f"{normalized_luminosity[i]:.5f}",
            f"{normalized_radius[i]:.5f}"
        ])

print(f"Data written to {output_file}")