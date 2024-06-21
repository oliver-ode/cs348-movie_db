import pandas as pd

def filter_tmdbIds_by_table2(table1_csv, table2_csv, output_csv):
    # Read the two CSV files
    table1 = pd.read_csv(table1_csv)
    table2 = pd.read_csv(table2_csv)

    # Get the tmdbId values from table2
    tmdbIds_in_table2 = set(table2['tmdbID'].unique())

    # Filter out rows in table1 where tmdbId does not exist in table2
    filtered_table1 = table1[table1['tmdbID'].isin(tmdbIds_in_table2)]

    # Save the filtered DataFrame to a new CSV file
    filtered_table1.to_csv(output_csv, index=False)

# Example usage
table1_csv = 'new_tmdbPopularMovies.csv'
table2_csv = 'idLinks.csv'
output_csv = 'movies_with_only_valid_tmdbs.csv'
filter_tmdbIds_by_table2(table1_csv, table2_csv, output_csv)