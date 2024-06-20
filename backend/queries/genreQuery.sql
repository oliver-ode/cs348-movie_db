-- Set the variables for the challenge date and guessed movie title
SET @challenge_date = '2024-06-19'; -- Adjust date as necessary
SET @guessed_movie_title = 'Toy Story'; -- Replace with actual user input

-- Step 1: Retrieve the mlID of today's movie
WITH movie_of_the_day AS (
    SELECT mlID
    FROM dailyMovies
    WHERE challengeDate = @challenge_date
),

-- Step 2: Get genres for the movie of the day
movie_of_the_day_genres AS (
    SELECT genre
    FROM genre
    WHERE mlID = (SELECT mlID FROM movie_of_the_day)
),

-- Step 3: Retrieve the mlID of the guessed movie
guessed_movie AS (
    SELECT mlID
    FROM mlMoviesWithYears
    WHERE mlTitle = @guessed_movie_title
),

-- Step 4: Get genres for the guessed movie
guessed_movie_genres AS (
    SELECT genre
    FROM genre
    WHERE mlID = (SELECT mlID FROM guessed_movie)
)

-- Step 5: Find the overlapping genres
SELECT DISTINCT g.genre
FROM movie_of_the_day_genres g
JOIN guessed_movie_genres gg ON g.genre = gg.genre;
