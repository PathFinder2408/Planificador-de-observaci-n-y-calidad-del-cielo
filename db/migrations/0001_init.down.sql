-- Migration 0001: Initial schema rollback (DOWN)

DROP INDEX IF EXISTS idx_favorites_user_id;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS schema_migrations;
