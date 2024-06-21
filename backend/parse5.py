import pandas as pd

# Function to filter scores
def filter_scores(input_csv, output_csv):
    # Read the input CSV file
    df = pd.read_csv(input_csv)

    # Filter the DataFrame to remove scores less than 0.3
    filtered_df = df[df['score'] >= 0.6]

    # Save the filtered DataFrame to a new CSV file
    filtered_df.to_csv(output_csv, index=False)

    print(f"Filtered scores saved to {output_csv}")

# Example usage
input_csv = 'new_tagScores.csv'
output_csv = 'new_new_filtered_scores.csv'
filter_scores(input_csv, output_csv)
