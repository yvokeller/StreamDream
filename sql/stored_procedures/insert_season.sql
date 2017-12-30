DROP PROCEDURE IF EXISTS insert_season;
-- Stored Procedure
DELIMITER $$
--
-- Prozeduren
--
CREATE DEFINER=root@localhost PROCEDURE insert_season (
    IN d_fk_series INT(10)
  , IN d_name VARCHAR(255)
  , IN d_order_number INT(10)
)
BEGIN

/**
  Author:		Yvo Keller
  Date:			Dezember 2017
  Version:	1.0

  Description: Insert New Season Into Database if it doesnt exist yet
  Call: call insert_season(100001, 'Season 2', 2)
**/

INSERT INTO tbl_season (fk_series, name, order_number)
  SELECT d_fk_series, d_name, d_order_number FROM DUAL
    WHERE NOT EXISTS
      (SELECT name FROM tbl_season
        WHERE order_number = d_order_number
        AND fk_series = d_fk_series);
  SET @last_id = LAST_INSERT_ID();
  SELECT @last_id;
END$$

DELIMITER;
