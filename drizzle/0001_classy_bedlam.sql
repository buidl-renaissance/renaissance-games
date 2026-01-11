CREATE TABLE `games` (
	`id` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`isTeamGame` integer DEFAULT false NOT NULL,
	`playersPerTeam` integer DEFAULT 1 NOT NULL,
	`minPlayers` integer NOT NULL,
	`maxPlayers` integer NOT NULL,
	`eliminationRules` text NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `games_type_unique` ON `games` (`type`);--> statement-breakpoint
CREATE TABLE `match_results` (
	`id` text PRIMARY KEY NOT NULL,
	`matchId` text NOT NULL,
	`submittedBy` text NOT NULL,
	`claimedWinnerId` text NOT NULL,
	`participant1Score` integer NOT NULL,
	`participant2Score` integer NOT NULL,
	`isOrganizerOverride` integer DEFAULT false NOT NULL,
	`confirmedAt` integer,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`matchId`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`submittedBy`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`claimedWinnerId`) REFERENCES `tournament_participants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` text PRIMARY KEY NOT NULL,
	`tournamentId` text NOT NULL,
	`bracketType` text DEFAULT 'winners' NOT NULL,
	`round` integer NOT NULL,
	`position` integer NOT NULL,
	`participant1Id` text,
	`participant2Id` text,
	`winnerId` text,
	`loserId` text,
	`participant1Score` integer DEFAULT 0,
	`participant2Score` integer DEFAULT 0,
	`status` text DEFAULT 'pending' NOT NULL,
	`nextMatchId` text,
	`loserNextMatchId` text,
	`scheduledTime` integer,
	`startedAt` integer,
	`completedAt` integer,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updatedAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`tournamentId`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`participant1Id`) REFERENCES `tournament_participants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`participant2Id`) REFERENCES `tournament_participants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`winnerId`) REFERENCES `tournament_participants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`loserId`) REFERENCES `tournament_participants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` text PRIMARY KEY NOT NULL,
	`teamId` text NOT NULL,
	`userId` text NOT NULL,
	`joinedAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `teams` (
	`id` text PRIMARY KEY NOT NULL,
	`tournamentId` text NOT NULL,
	`name` text NOT NULL,
	`captainId` text NOT NULL,
	`isComplete` integer DEFAULT false NOT NULL,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updatedAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`tournamentId`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`captainId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tournament_participants` (
	`id` text PRIMARY KEY NOT NULL,
	`tournamentId` text NOT NULL,
	`userId` text,
	`teamId` text,
	`status` text DEFAULT 'registered' NOT NULL,
	`seed` integer,
	`finalPlacement` integer,
	`registeredAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updatedAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`tournamentId`) REFERENCES `tournaments`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`teamId`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tournaments` (
	`id` text PRIMARY KEY NOT NULL,
	`gameId` text NOT NULL,
	`organizerId` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`minParticipants` integer NOT NULL,
	`maxParticipants` integer NOT NULL,
	`eliminationType` text,
	`entryFee` integer DEFAULT 0,
	`prizePool` integer DEFAULT 0,
	`prizeDistribution` text,
	`bestOf` integer DEFAULT 1 NOT NULL,
	`registrationDeadline` integer,
	`startTime` integer,
	`endTime` integer,
	`location` text,
	`createdAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	`updatedAt` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`gameId`) REFERENCES `games`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`organizerId`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `users` ADD `role` text DEFAULT 'user' NOT NULL;