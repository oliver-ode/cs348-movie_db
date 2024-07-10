DELIMITER //

CREATE PROCEDURE giveUpFill(
    IN challenge_date DATE,
    IN user_cookie CHAR(36)
)
begin 
    declare guessCount int;

    select COUNT(*) into guessCount
    from guesses
    where challengeDate = challenge_date
      and userCookie = user_cookie;

    while guessCount < 10 do
        insert ignore into guesses(challengeDate, userCookie, guessNumber, mlID)
        values (challenge_date, user_cookie, -1 * (guessCount + 1) , 1);
        set guessCount = guessCount + 1;
    end while;
end //

DELIMITER ;