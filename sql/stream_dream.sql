-- phpMyAdmin SQL Dump
-- version 4.5.2
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Erstellungszeit: 30. Dez 2017 um 17:00
-- Server-Version: 10.1.19-MariaDB
-- PHP-Version: 5.6.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Datenbank: `stream_dream`
--
CREATE DATABASE IF NOT EXISTS `stream_dream2` DEFAULT CHARACTER SET utf8 COLLATE utf8_general_ci;
USE `stream_dream2`;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `tbl_episode`
--

DROP TABLE IF EXISTS `tbl_episode`;
CREATE TABLE `tbl_episode` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `thumbnail` varchar(255) NOT NULL,
  `src` varchar(255) NOT NULL,
  `description` TEXT,
  `released` varchar(255),
  `year` int(4),
  `country` varchar(255),
  `language` varchar(255)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `tbl_season`
--

DROP TABLE IF EXISTS `tbl_season`;
CREATE TABLE `tbl_season` (
  `id` int(10) UNSIGNED NOT NULL,
  `fk_series` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `order_number` int(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `tbl_season_episode`
--

DROP TABLE IF EXISTS `tbl_season_episode`;
CREATE TABLE `tbl_season_episode` (
  `id` int(10) UNSIGNED NOT NULL,
  `fk_episode` int(10) UNSIGNED NOT NULL,
  `fk_season` int(10) UNSIGNED NOT NULL,
  `number` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `tbl_series`
--

DROP TABLE IF EXISTS `tbl_series`;
CREATE TABLE `tbl_series` (
  `id` int(10) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `genre` varchar(255) NOT NULL,
  `thumbnail` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `tbl_user`
--

DROP TABLE IF EXISTS `tbl_user`;
CREATE TABLE `tbl_user` (
  `id` int(10) UNSIGNED NOT NULL,
  `username` varchar(30) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `registration_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Tabellenstruktur für Tabelle `tbl_watchlist`
--

DROP TABLE IF EXISTS `tbl_watchlist`;
CREATE TABLE `tbl_watchlist` (
  `id` int(10) UNSIGNED NOT NULL,
  `fk_episode` int(10) UNSIGNED DEFAULT NULL,
  `fk_user` int(10) UNSIGNED DEFAULT NULL,
  `plays_count` varchar(30) NOT NULL,
  `watch_time` varchar(255) NOT NULL,
  `last_watched` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Indizes der exportierten Tabellen
--

--
-- Indizes für die Tabelle `tbl_episode`
--
ALTER TABLE `tbl_episode`
  ADD PRIMARY KEY (`id`);

--
-- Indizes für die Tabelle `tbl_season`
--
ALTER TABLE `tbl_season`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_series` (`fk_series`);

--
-- Indizes für die Tabelle `tbl_season_episode`
--
ALTER TABLE `tbl_season_episode`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_episode` (`fk_episode`),
  ADD KEY `fk_season` (`fk_season`);

--
-- Indizes für die Tabelle `tbl_series`
--
ALTER TABLE `tbl_series`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indizes für die Tabelle `tbl_user`
--
ALTER TABLE `tbl_user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indizes für die Tabelle `tbl_watchlist`
--
ALTER TABLE `tbl_watchlist`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_episode` (`fk_episode`),
  ADD KEY `fk_user` (`fk_user`);

--
-- AUTO_INCREMENT für exportierte Tabellen
--

--
-- AUTO_INCREMENT für Tabelle `tbl_episode`
--
ALTER TABLE `tbl_episode`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100000;
--
-- AUTO_INCREMENT für Tabelle `tbl_season`
--
ALTER TABLE `tbl_season`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100000;
--
-- AUTO_INCREMENT für Tabelle `tbl_season_episode`
--
ALTER TABLE `tbl_season_episode`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100000;
--
-- AUTO_INCREMENT für Tabelle `tbl_series`
--
ALTER TABLE `tbl_series`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100000;
--
-- AUTO_INCREMENT für Tabelle `tbl_user`
--
ALTER TABLE `tbl_user`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100000;
--
-- AUTO_INCREMENT für Tabelle `tbl_watchlist`
--
ALTER TABLE `tbl_watchlist`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=100000;
--
-- Constraints der exportierten Tabellen
--

--
-- Constraints der Tabelle `tbl_season`
--
ALTER TABLE `tbl_season`
  ADD CONSTRAINT `tbl_season_ibfk_1` FOREIGN KEY (`fk_series`) REFERENCES `tbl_series` (`id`);

--
-- Constraints der Tabelle `tbl_season_episode`
--
ALTER TABLE `tbl_season_episode`
  ADD CONSTRAINT `tbl_season_episode_ibfk_1` FOREIGN KEY (`fk_episode`) REFERENCES `tbl_episode` (`id`),
  ADD CONSTRAINT `tbl_season_episode_ibfk_2` FOREIGN KEY (`fk_season`) REFERENCES `tbl_season` (`id`);

--
-- Constraints der Tabelle `tbl_watchlist`
--
ALTER TABLE `tbl_watchlist`
  ADD CONSTRAINT `tbl_watchlist_ibfk_1` FOREIGN KEY (`fk_episode`) REFERENCES `tbl_episode` (`id`),
  ADD CONSTRAINT `tbl_watchlist_ibfk_2` FOREIGN KEY (`fk_user`) REFERENCES `tbl_user` (`id`);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
