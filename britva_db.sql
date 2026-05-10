-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Хост: 127.0.0.1
-- Время создания: Май 10 2026 г., 23:01
-- Версия сервера: 10.4.32-MariaDB
-- Версия PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `britva_db`
--

-- --------------------------------------------------------

--
-- Структура таблицы `appointments`
--

CREATE TABLE `appointments` (
  `id` int(11) NOT NULL,
  `client_name` varchar(255) NOT NULL,
  `client_phone` varchar(20) NOT NULL,
  `barber_id` int(11) DEFAULT NULL,
  `appointment_date` datetime DEFAULT current_timestamp(),
  `service_id` int(11) DEFAULT NULL,
  `client_comment` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `appointments`
--

INSERT INTO `appointments` (`id`, `client_name`, `client_phone`, `barber_id`, `appointment_date`, `service_id`, `client_comment`) VALUES
(14, 'куц', '+380321321321', 1, '2026-07-28 12:54:00', 1, '');

-- --------------------------------------------------------

--
-- Структура таблицы `barbers`
--

CREATE TABLE `barbers` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `rank` varchar(100) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `photo_url` varchar(255) DEFAULT NULL,
  `experience` varchar(50) DEFAULT NULL,
  `specialization` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `barbers`
--

INSERT INTO `barbers` (`id`, `name`, `rank`, `bio`, `photo_url`, `experience`, `specialization`) VALUES
(1, 'Олександр Степашко', 'Топ-барбер', 'Майстер класичної стрижки та небезпечного гоління. Досвід 7 років.', 'https://i.postimg.cc/D00qGYYN/photo-2026-05-10-20-47-07.jpg', '5 років', 'Експерт з догляду за бородою та класичних стрижок'),
(2, 'Маркус Тейлор', 'Старший майстер', 'Король фейдів. Робить ідеальні переходи.', 'https://i.postimg.cc/63jZBf5V/photo-2026-05-10-20-47-06.jpg', '3 роки', 'Майстер сучасних технік фейду та Hair Tattoo'),
(3, 'Микита Феничко', 'Барбер', 'Класичні стрижки та догляд за бородою.', 'https://i.postimg.cc/BvJPDVj8/photo-2026-05-10-20-47-03.jpg', '4 роки', 'Майстер подовжених стрижок та класичного гоління');

-- --------------------------------------------------------

--
-- Структура таблицы `barber_absences`
--

CREATE TABLE `barber_absences` (
  `id` int(11) NOT NULL,
  `barber_id` int(11) DEFAULT NULL,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `reason` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Структура таблицы `services`
--

CREATE TABLE `services` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `duration` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Дамп данных таблицы `services`
--

INSERT INTO `services` (`id`, `name`, `price`, `duration`) VALUES
(1, 'Чоловіча стрижка', 500.00, '1 год'),
(2, 'Стрижка бороди', 300.00, '30 хв'),
(3, 'Комплекс (Стрижка + Борода)', 700.00, '1.5 год'),
(4, 'Королівське гоління', 400.00, '45 хв');

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `barber_id` (`barber_id`),
  ADD KEY `service_id` (`service_id`);

--
-- Индексы таблицы `barbers`
--
ALTER TABLE `barbers`
  ADD PRIMARY KEY (`id`);

--
-- Индексы таблицы `barber_absences`
--
ALTER TABLE `barber_absences`
  ADD PRIMARY KEY (`id`),
  ADD KEY `barber_id` (`barber_id`);

--
-- Индексы таблицы `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT для сохранённых таблиц
--

--
-- AUTO_INCREMENT для таблицы `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT для таблицы `barbers`
--
ALTER TABLE `barbers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT для таблицы `barber_absences`
--
ALTER TABLE `barber_absences`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT для таблицы `services`
--
ALTER TABLE `services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Ограничения внешнего ключа сохраненных таблиц
--

--
-- Ограничения внешнего ключа таблицы `appointments`
--
ALTER TABLE `appointments`
  ADD CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`barber_id`) REFERENCES `barbers` (`id`),
  ADD CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`);

--
-- Ограничения внешнего ключа таблицы `barber_absences`
--
ALTER TABLE `barber_absences`
  ADD CONSTRAINT `barber_absences_ibfk_1` FOREIGN KEY (`barber_id`) REFERENCES `barbers` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
