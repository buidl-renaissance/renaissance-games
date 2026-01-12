CREATE TABLE `tournament_organizers` (
	`id` text PRIMARY KEY NOT NULL,
	`tournamentId` text NOT NULL,
	`userId` text NOT NULL,
	`addedAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`tournamentId`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
