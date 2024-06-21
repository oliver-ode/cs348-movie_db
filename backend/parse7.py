import pandas as pd

def find_unique_imdbIds(table1_csv, table2_csv, output_csv=None):
    # Read the two CSV files
    table1 = pd.read_csv(table1_csv)
    table2 = pd.read_csv(table2_csv)

    # Get the imdbId values from table2
    imdbIds_in_table2 = set(table2['imdbID'].unique())

    # Find imdbId values in table1 that are not in table2
    unique_imdbIds = table1[~table1['imdbID'].isin(imdbIds_in_table2)]

    # If an output file is specified, save the result to a CSV file
    if output_csv:
        unique_imdbIds.to_csv(output_csv, index=False)

    return unique_imdbIds

# Example usage
table1_csv = 'new_imdbActors.csv'
table2_csv = 'idLinks.csv'
output_csv = 'unique_imdbIds.csv'
unique_imdbIds_df = find_unique_imdbIds(table1_csv, table2_csv, output_csv)

# Print the unique imdbIds
# print(unique_imdbIds_df[['imdbID']])
