DROP PROCEDURE IF EXISTS delete_complete_series;
-- Stored Procedure
DELIMITER $$
--
-- Prozeduren
--
CREATE DEFINER=root@localhost PROCEDURE delete_complete_series (
    IN d_series_name VARCHAR(255)
)
BEGIN

/**
  Author:		Yvo Keller
  Date:			Dezember 2017
  Version:	1.0

  Description: Insert New Season Into Database if it doesnt exist yet
  Call: call delete_complete_series('Name', 'http://link.com/bild', 'http://link.com/video', 'Beschreibung', '30.12.2017', 2017, 'CH', 'Deutsch')
**/

SET @series_id = (SELECT id FROM tbl_series WHERE name = d_series_name);
SET @seas
DELETE FROM tbl_series ser
INNER JOIN tbl_season sea ON sea.fk_series = @series_id
INNER JOIN tbl_season_episode se ON se.fk_season = sea.id
INNER JOIN tbl_episode epi ON epi.id = se.fk_episode
WHERE id = ;

SELECT * FROM tbl_series ser
INNER JOIN tbl_season sea ON sea.fk_series = ser.id
INNER JOIN tbl_season_episode se ON se.fk_season = sea.id
INNER JOIN tbl_episode epi ON epi.id = se.fk_episode
WHERE ser.id = 6 AND sea.id = se.fk_season AND epi.id = se.fk_episode
;

DELETE FROM tbl_series, tbl_season, tbl_season_episode, tbl_episode
INNER JOIN tbl_season ON tbl_season.fk_series = tbl_series.id
INNER JOIN tbl_season_episode ON tbl_season_episode.fk_season = tbl_season.id
INNER JOIN tbl_episode ON tbl_episode.id = tbl_season_episode.fk_episode
WHERE tbl_series.id = 6
	AND tbl_season.id = tbl_season_episode.fk_season
  AND tbl_episode.id = tbl_season_episode.fk_episode
;


INSERT INTO tbl_episode (name, thumbnail, src, description, released, year, country, language)
  SELECT d_name, d_thumbnail, d_src, d_description, d_released, d_year, d_country, d_language FROM DUAL
    WHERE NOT EXISTS
      (SELECT name FROM tbl_episode
        WHERE name = d_name
        AND description = d_description);
  SET @last_id = LAST_INSERT_ID();
  SELECT @last_id AS last_id;
END$$

DELIMITER ;
