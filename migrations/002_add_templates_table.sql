CREATE TABLE templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  image_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active templates" ON templates FOR SELECT USING (is_active = TRUE);

INSERT INTO templates (slug, name, filename, storage_path, image_url, is_active, sort_order) VALUES
  ('pink_tone', 'โทนชมพู', 'pink_tone.png', 'templates/pink_tone.png', '', TRUE, 1),
  ('dark_pink_tone', 'โทนชมพูเข้ม', 'dark_pink_tone.jpg', 'templates/dark_pink_tone.jpg', '', TRUE, 2),
  ('pastel_paper_tone', 'โทนพาสเทล', 'pastel_paper_tone.jpg', 'templates/pastel_paper_tone.jpg', '', TRUE, 3),
  ('cool_paper_tone', 'โทนเย็น', 'cool_paper_tone.jpg', 'templates/cool_paper_tone.jpg', '', TRUE, 4),
  ('orage_pink_tone', 'โทนส้มชมพู', 'orage_pink_tone.jpg', 'templates/orage_pink_tone.jpg', '', TRUE, 5),
  ('dark_tone', 'โทนเข้ม', 'dark_tone.jpg', 'templates/dark_tone.jpg', '', TRUE, 6),
  ('white_tone', 'โทนขาว', 'white_tone.jpg', 'templates/white_tone.jpg', '', TRUE, 7);
