import pandas as pd

# Read the input CSV file
input_csv = 'table2.csv'
df = pd.read_csv(input_csv)

# Get all unique genres from the Genre column
unique_genres = df['genre'].unique()

# Create a DataFrame from the unique genres
unique_genres_df = pd.DataFrame(unique_genres, columns=['genre'])

# Save the unique genres to a new CSV file
output_csv = 'unique_genres.csv'
unique_genres_df.to_csv(output_csv, index=False)

print(f"Unique genres saved to {output_csv}")
