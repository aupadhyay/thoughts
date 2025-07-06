CREATE TABLE `thoughts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content` text NOT NULL,
	`timestamp` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
