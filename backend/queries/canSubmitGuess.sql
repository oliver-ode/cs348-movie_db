
-- Create the stored procedure to insert a user guess
DELIMITER //

CREATE PROCEDURE InsertUserGuess(
    IN p_challengeDate DATE,
    IN p_userCookie CHAR(36),
    IN p_mlID INT
)
BEGIN
    DECLARE guessCount INT;

    -- Check the number of guesses the user has made for the given date
    SELECT COUNT(*) INTO guessCount
    FROM guesses
    WHERE challengeDate = p_challengeDate
      AND userCookie = p_userCookie;

    -- If the user has made less than 10 guesses, insert the new guess
    IF guessCount < 10 THEN
        INSERT INTO guesses (challengeDate, userCookie, guessNumber, mlID)
        VALUES (p_challengeDate, p_userCookie, guessCount + 1, p_mlID);
    ELSE
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'User has exceeded the maximum number of guesses for the day';
    END IF;
END //

DELIMITER ;
