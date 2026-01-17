-- Add publishedEventId for cross-app publishing to renaissance-events
ALTER TABLE tournaments ADD COLUMN publishedEventId INTEGER;
