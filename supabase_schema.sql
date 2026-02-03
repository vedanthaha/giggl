-- Profiles Table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  username TEXT UNIQUE,
  bio TEXT,
  photo_url TEXT,
  is_online BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chats Table
CREATE TABLE chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT CHECK (type IN ('dm', 'group')),
  name TEXT,
  photo_url TEXT,
  invite_code TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Members Table (Link users to chats)
CREATE TABLE members (
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  status TEXT DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (chat_id, user_id)
);

-- Messages Table
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  text TEXT,
  image_url TEXT,
  voice_url TEXT,
  gif_url TEXT,
  sticker_url TEXT,
  reactions JSONB DEFAULT '{}'::jsonb,
  edited_at TIMESTAMP WITH TIME ZONE,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_for UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies (Enable RLS first)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Profiles: Anyone can view profiles, user can only update their own
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Chats & Members: Only members can view/interact with chats
CREATE POLICY "Users can view chats they belong to" ON chats FOR SELECT
  USING (EXISTS (SELECT 1 FROM members WHERE members.chat_id = chats.id AND members.user_id = auth.uid()));

CREATE POLICY "Users can view members of their chats" ON members FOR SELECT
  USING (EXISTS (SELECT 1 FROM members m2 WHERE m2.chat_id = members.chat_id AND m2.user_id = auth.uid()));

-- Messages: Only members can view and send messages
CREATE POLICY "Users can view messages in their chats" ON messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM members WHERE members.chat_id = messages.chat_id AND members.user_id = auth.uid()));

CREATE POLICY "Users can insert messages in their chats" ON messages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM members WHERE members.chat_id = messages.chat_id AND members.user_id = auth.uid()));

-- Realtime Setup
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;

-- Storage Buckets Setup
-- Note: These might fail if storage schema doesn't exist yet, usually it's pre-configured in Supabase
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true), 
       ('chat-images', 'chat-images', true), 
       ('chat-voice', 'chat-voice', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for Avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage Policies for Chat Images
CREATE POLICY "Authenticated users can view chat images" ON storage.objects FOR SELECT USING (bucket_id = 'chat-images' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can upload chat images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'chat-images' AND auth.role() = 'authenticated');

-- Storage Policies for Chat Voice
CREATE POLICY "Authenticated users can view chat voice" ON storage.objects FOR SELECT USING (bucket_id = 'chat-voice' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can upload chat voice" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'chat-voice' AND auth.role() = 'authenticated');

-- Helper function to check DM existence
CREATE OR REPLACE FUNCTION get_dm_chat(other_user_id UUID)
RETURNS TABLE (id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT c.id
  FROM chats c
  JOIN members m1 ON c.id = m1.chat_id
  JOIN members m2 ON c.id = m2.chat_id
  WHERE c.type = 'dm'
    AND m1.user_id = auth.uid()
    AND m2.user_id = other_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Blocks Table
CREATE TABLE blocks (
  blocker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (blocker_id, blocked_id)
);

-- Reports Table
CREATE TABLE reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  reported_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for Blocks
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own blocks" ON blocks FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "Users can block others" ON blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can unblock others" ON blocks FOR DELETE USING (auth.uid() = blocker_id);

-- RLS for Reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Calls Table for Signaling
CREATE TABLE IF NOT EXISTS calls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  caller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('voice', 'video')),
  state TEXT DEFAULT 'calling' CHECK (state IN ('calling', 'ringing', 'active', 'ended')),
  offer JSONB,
  answer JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ICE Candidates for WebRTC exchange
CREATE TABLE IF NOT EXISTS ice_candidates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  call_id UUID REFERENCES calls(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  candidate JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for Calls & Signaling
ALTER TABLE calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE ice_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view calls they are part of" ON calls FOR SELECT 
  USING (auth.uid() = caller_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can initiate calls" ON calls FOR INSERT 
  WITH CHECK (auth.uid() = caller_id);
CREATE POLICY "Users can update calls they are part of" ON calls FOR UPDATE 
  USING (auth.uid() = caller_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can view ice candidates for their calls" ON ice_candidates FOR SELECT 
  USING (EXISTS (SELECT 1 FROM calls WHERE calls.id = ice_candidates.call_id AND (calls.caller_id = auth.uid() OR calls.receiver_id = auth.uid())));
CREATE POLICY "Users can insert ice candidates" ON ice_candidates FOR INSERT 
  WITH CHECK (auth.uid() = sender_id);

-- Realtime for Calls
ALTER PUBLICATION supabase_realtime ADD TABLE calls;
ALTER PUBLICATION supabase_realtime ADD TABLE ice_candidates;
