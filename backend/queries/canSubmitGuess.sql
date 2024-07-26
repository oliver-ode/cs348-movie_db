SELECT COUNT(*) totalGuesses FROM guesses WHERE challengeDate=CURDATE() AND userCookie=?;

INSERT INTO guesses VALUES (
    CURDATE(), 
    ?, 
    (
        SELECT mgn FROM (
            SELECT COUNT(*)+1 mgn 
            FROM guesses 
            WHERE userCookie=? AND challengeDate=CURDATE() AND guessNumber>0) t), ?)
SELECT
    CASE
        WHEN 
            (SELECT dm.selectID FROM dailyMovies dm WHERE dm.challengeDate = CURDATE()) 
            = 
            (SELECT tm.selectID FROM guesses g 
            JOIN mlMoviesWithYears ml ON g.mlID = ml.mlID 
            JOIN idLinks idl ON ml.mlID = idl.mlID 
            JOIN tmdbPopularMovies tm ON idl.tmdbID = tm.tmdbID 
            WHERE g.guessNumber = 
                (SELECT COUNT(gs.guessNumber) 
                FROM guesses gs WHERE gs.challengeDate = CURDATE() AND 
                    userCookie = ?) AND 
                    g.userCookie = ? AND 
                    g.challengeDate = CURDATE()) 
        THEN 1
    ELSE 0
 END AS isCorrect;
