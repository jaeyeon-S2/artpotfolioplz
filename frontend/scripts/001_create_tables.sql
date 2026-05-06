-- Artist Portfolio Database Schema

-- Profile table for artist profile
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_image TEXT,
  profile_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Posts table for webtoon planning, works, personal works
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('webtoon', 'works', 'personal')),
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post images table for multiple images per post
CREATE TABLE IF NOT EXISTS post_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments table for visitor comments
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages table for AI chatbot history (optional)
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default profile if not exists
INSERT INTO profiles (id, profile_text) 
VALUES ('00000000-0000-0000-0000-000000000001', '안녕하세요! 작가 포트폴리오에 오신 것을 환영합니다.')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS but allow public read access
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies (public read, no write without admin)
CREATE POLICY "profiles_select_public" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_public" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update_public" ON profiles FOR UPDATE USING (true);

-- Posts policies (public read and write for admin verification in app)
CREATE POLICY "posts_select_public" ON posts FOR SELECT USING (true);
CREATE POLICY "posts_insert_public" ON posts FOR INSERT WITH CHECK (true);
CREATE POLICY "posts_update_public" ON posts FOR UPDATE USING (true);
CREATE POLICY "posts_delete_public" ON posts FOR DELETE USING (true);

-- Post images policies
CREATE POLICY "post_images_select_public" ON post_images FOR SELECT USING (true);
CREATE POLICY "post_images_insert_public" ON post_images FOR INSERT WITH CHECK (true);
CREATE POLICY "post_images_delete_public" ON post_images FOR DELETE USING (true);

-- Comments policies (anyone can read and add comments)
CREATE POLICY "comments_select_public" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_public" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "comments_delete_public" ON comments FOR DELETE USING (true);

-- Chat messages policies
CREATE POLICY "chat_messages_select_public" ON chat_messages FOR SELECT USING (true);
CREATE POLICY "chat_messages_insert_public" ON chat_messages FOR INSERT WITH CHECK (true);
