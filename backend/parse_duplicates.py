import pandas as pd

def filter_table1_by_table2(table1_csv, table2_csv, output_csv):
    # Read the two CSV files
    table1 = pd.read_csv(table1_csv)
    table2 = pd.read_csv(table2_csv)

    # Get the movieId values from table2
    movieIds_to_remove = table2['tmdbId'].unique()

    # Filter out the rows from table1 that contain movieId in table2
    filtered_table1 = table1[~table1['tmdbID'].isin(movieIds_to_remove)]

    # Save the filtered DataFrame to a new CSV file
    filtered_table1.to_csv(output_csv, index=False)

# Example usage
table1_csv = 'tmdbPopularMovies.csv'
table2_csv = 'get_duplicate_tmdbIds.csv'
output_csv = 'new_tmdbPopularMovies.csv'
filter_table1_by_table2(table1_csv, table2_csv, output_csv)
