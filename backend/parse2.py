import pandas as pd # type: ignore
import zipfile

# Define file paths
file_path = 'tmdbMovie.csv'
output_csv_path = 'tmdb_id_title.csv'

df = pd.read_csv(file_path)

df = df[['id', 'title']].rename(columns={'id': 'tmdbId', 'title': 'tmdbTitle'})

df.to_csv(output_csv_path, index=False)

print(f"Modified CSV has been saved to {output_csv_path}")