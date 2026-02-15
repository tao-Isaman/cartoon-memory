-- Add template_name column to track which style template was used for each generation
ALTER TABLE cartoon_generations ADD COLUMN template_name TEXT;
