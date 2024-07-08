DELIMITER //

create procedure selectMOTD(in challenge_date date)
begin
    declare randid int;

    if (select count(*) from dailyMovies) = 100 then
        delete from dailyMovies
        where selectID = (select min(dm.challengeDate) from dailyMovies dm);
    end if; 

    select FLOOR(1 + (RAND() * 1000)) into randid;
    while randid in (select d.selectID from dailyMovies d)
        set randid = FLOOR(1 + (RAND() * 1000));
    end while;

    insert into dailyMovies(challenge_date, randid);
end

DELIMITER ;
