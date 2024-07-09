DELIMITER //

CREATE PROCEDURE getMOTD(
    IN challenge_date DATE
)
begin 

    select mlID, mlTitle
    from mlMoviesWithYears
    where mlID = (
        select mlID from idLinks where tmdbId = (
            select tmdbID from tmdbPopularMovies where selectID = (
                select selectID from dailyMovies where challengeDate = challenge_date)
        )
    );

end //

DELIMITER ;