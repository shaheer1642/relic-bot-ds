-- Dedupe giveaway logging: store the original GiveawayBot message id and make it unique,
-- so repeated edits of the same ended giveaway can only be logged once
-- (see botv.messageUpdate, INSERT ... ON CONFLICT (source_message_id) DO NOTHING).
-- Existing rows stay NULL (their original messages are deleted); NULLs don't conflict with each other.
-- Must be applied BEFORE deploying the matching code change.
ALTER TABLE botv_giveaways ADD COLUMN IF NOT EXISTS source_message_id varchar;
CREATE UNIQUE INDEX IF NOT EXISTS botv_giveaways_source_message_id_ukey ON botv_giveaways (source_message_id);

-- Rollback:
-- DROP INDEX IF EXISTS botv_giveaways_source_message_id_ukey;
-- ALTER TABLE botv_giveaways DROP COLUMN IF EXISTS source_message_id;
