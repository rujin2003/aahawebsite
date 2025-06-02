-- Make user_id optional in contacts table
ALTER TABLE contacts
ALTER COLUMN user_id DROP NOT NULL;

-- Add an index on email for better query performance
CREATE INDEX IF NOT EXISTS contacts_email_idx ON contacts(email);

-- Add an index on created_at for better sorting performance
CREATE INDEX IF NOT EXISTS contacts_created_at_idx ON contacts(created_at); 