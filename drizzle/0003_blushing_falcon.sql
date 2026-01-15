DROP INDEX "farcaster_accounts_fid_unique";--> statement-breakpoint
DROP INDEX "games_type_unique";--> statement-breakpoint
DROP INDEX "users_fid_unique";--> statement-breakpoint
DROP INDEX "users_phone_unique";--> statement-breakpoint
ALTER TABLE `users` ALTER COLUMN "fid" TO "fid" text;--> statement-breakpoint
CREATE UNIQUE INDEX `farcaster_accounts_fid_unique` ON `farcaster_accounts` (`fid`);--> statement-breakpoint
CREATE UNIQUE INDEX `games_type_unique` ON `games` (`type`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_fid_unique` ON `users` (`fid`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_phone_unique` ON `users` (`phone`);--> statement-breakpoint
ALTER TABLE `users` ADD `phone` text;--> statement-breakpoint
ALTER TABLE `users` ADD `email` text;--> statement-breakpoint
ALTER TABLE `users` ADD `name` text;--> statement-breakpoint
ALTER TABLE `users` ADD `profilePicture` text;--> statement-breakpoint
ALTER TABLE `users` ADD `accountAddress` text;--> statement-breakpoint
ALTER TABLE `users` ADD `pinHash` text;--> statement-breakpoint
ALTER TABLE `users` ADD `failedPinAttempts` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `users` ADD `lockedAt` integer;--> statement-breakpoint
ALTER TABLE `users` ADD `status` text DEFAULT 'active';