DROP PROCEDURE IF EXISTS insert_season_episode;
-- Stored Procedure
DELIMITER $$
--
-- Prozeduren
--
CREATE DEFINER=root@localhost PROCEDURE insert_season_episode (
    IN d_fk_episode INT(10)
  , IN d_fk_season INT(10)
  , IN d_number INT(11)
)
BEGIN

/**
  Author:		Yvo Keller
  Date:			Dezember 2017
  Version:	1.0

  Description: Insert New Season Into Database if it doesnt exist yet
  Call: call insert_season_episode(100001, 100001, 1)
**/

INSERT INTO tbl_season_episode (fk_episode, fk_season, number)
  SELECT d_fk_episode, d_fk_season, d_number FROM DUAL
    WHERE NOT EXISTS
      (SELECT fk_episode FROM tbl_season_episode
        WHERE fk_episode = d_fk_episode
        AND fk_season = d_fk_season
        AND number = d_number);
  SET @last_id = LAST_INSERT_ID();
  SELECT @last_id;
END$$

DELIMITER;
