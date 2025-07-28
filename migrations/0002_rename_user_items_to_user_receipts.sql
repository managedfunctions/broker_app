-- Rename user_items table to user_receipts to be more specific
ALTER TABLE user_items RENAME TO user_receipts;

-- Rename item_id column to receipt_id for clarity
ALTER TABLE user_receipts RENAME COLUMN item_id TO receipt_id;

-- Update the index names
DROP INDEX IF EXISTS idx_user_items_user_id;
DROP INDEX IF EXISTS idx_user_items_item_id;

CREATE INDEX IF NOT EXISTS idx_user_receipts_user_id ON user_receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_receipts_receipt_id ON user_receipts(receipt_id);