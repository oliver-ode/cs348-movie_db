import pandas as pd

# Read the first CSV file with columns (tmdbId, tmdbTitle)
input_csv1 = 'tmdbMovies.csv'
df1 = pd.read_csv(input_csv1)

# Drop duplicates to keep only the first occurrence of each tmdbTitle
df1 = df1.drop_duplicates(subset='tmdbTitle', keep='first')

# Read the second CSV file with column (tmdbTitle)
input_csv2 = 'tmdbPopularMovies.csv'
df2 = pd.read_csv(input_csv2)

# Perform the join on tmdbTitle
merged_df = pd.merge(df1, df2, on='tmdbTitle', how='inner')

# Select only the tmdbId column
result_df = merged_df[['tmdbId']]

# Save the result to a new CSV file
output_csv = 'result_tmdb_ids_unique.csv'
result_df.to_csv(output_csv, index=False)

print(f"Resulting tmdbId saved to {output_csv}")
