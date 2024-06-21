import pandas as pd
import re

# Read the original CSV file
input_csv = 'movies.csv'
df = pd.read_csv(input_csv)

# Extract the year from the title and create a new column for it
def extract_year(title):
    match = re.search(r'\((\d{4})\)', title)
    return match.group(1) if match else None

df['year'] = df['title'].apply(extract_year)

# Remove the " (year)" part from the title
def remove_year_from_title(title):
    return re.sub(r'\s\(\d{4}\)$', '', title)

df['clean_title'] = df['title'].apply(remove_year_from_title)

# Create the first table with columns: movieId, clean_title as title, and year
table1 = df[['movieId', 'clean_title', 'year']]
table1.columns = ['movieId', 'title', 'year']  # Rename the clean_title column back to title
table1_csv = 'table1.csv'
table1.to_csv(table1_csv, index=False)

# Create the second table with columns: movieId and genre
# Explode the genres into separate rows
df['genres'] = df['genres'].str.split('|')
table2 = df.explode('genres')[['movieId', 'genres']]
table2.columns = ['movieId', 'genre']
table2_csv = 'table2.csv'
table2.to_csv(table2_csv, index=False)

print(f"Table 1 saved to {table1_csv}")
print(f"Table 2 saved to {table2_csv}")
