import pandas as pd

# Specify the input and output file paths
table1_csv = 'idLinks.csv'
table2_csv = 'new_imdbActors.csv'
output_csv = 'checkActors.csv'

# Read the two CSV files
table1 = pd.read_csv(table1_csv)
table2 = pd.read_csv(table2_csv)

# Identify imdbId values in table1 that are not in table2
missing_imdbIds = table1[~table1['imdbID'].isin(table2['imdbID'])]

# Append the missing imdbIds to table2
updated_table2 = pd.concat([table2, missing_imdbIds], ignore_index=True)

# Save the updated table2 to a new CSV file
missing_imdbIds.to_csv(output_csv, index=False)
