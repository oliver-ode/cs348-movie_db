import pandas as pd

def filter_duplicates(input_csv, output_csv):
    # Read the CSV file
    df = pd.read_csv(input_csv)

    # Find the duplicated tmdbIds
    duplicate_tmdbIds = df[df.duplicated('tmdbId', keep=False)]['tmdbId']

    # Filter out the rows with duplicated tmdbIds
    filtered_df = df[df['tmdbId'].isin(duplicate_tmdbIds)]

    # Save the filtered DataFrame to a new CSV file
    filtered_df.to_csv(output_csv, index=False)

# Example usage
input_csv = 'links.csv'
output_csv = 'get_duplicate_tmdbIds.csv'
filter_duplicates(input_csv, output_csv)
