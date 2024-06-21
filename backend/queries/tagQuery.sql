-- Set the variable for the challenge date
SET @challenge_date = '2024-06-19'; -- Adjust date as necessary
SET @cookie = '11bf5b37-e0b8-42e0-8dcf-dc8c4aefc000'; -- Adjust user cookie as necessary
SET @guess_number = 1; -- Adjust guess number as necessary

-- Step 1: Retrieve the tagIDs and tagScores of guessed movie
WITH guess_tags AS (
    SELECT ts.tagID, ts.score
    FROM tagScore ts
    JOIN guesses g ON ts.mlID = g.mlID
    WHERE g.challengeDate = @challenge_date 
        AND g.cookie = @cookie
        AND g.guessNumber = @guess_number
        AND ts.score > 0.7
)

-- Step 2: Retrieve the tagIDs and tagScores of movie of the day
WITH motd_tags AS (
    SELECT ts.tagID, ts.score
    FROM tagScore ts
    JOIN dailyMovies dm ON ts.mlID = dm.mlID
    WHERE dm.challengeDate = @challenge_date AND ts.score > 0.7
)

WITH join_tags AS (
    SELECT gt.tagID, mt.score
    FROM guess_tags gt
    JOIN motd_tags mt ON gt.tagID = mt.tagID
)

-- Step 3: Get the top three tags for the movie of the day
SELECT t.tagTitle
FROM tags t
JOIN join_tags jt ON t.tagID = jt.tagID
ORDER BY jt.score DESC
LIMIT 3 \G
