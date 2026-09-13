-- ============================================================
-- GLS NEXUS — Row Level Security Policies
-- Every table enforces user_id = auth.uid()
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transcript_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE POLICY "Users can view own profile"
    ON profiles FOR SELECT
    USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
    ON profiles FOR UPDATE
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- ============================================================
-- MEETINGS
-- ============================================================
CREATE POLICY "Users can view own meetings"
    ON meetings FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create meetings"
    ON meetings FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own meetings"
    ON meetings FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own meetings"
    ON meetings FOR DELETE
    USING (user_id = auth.uid());

-- ============================================================
-- MEETING PARTICIPANTS (via meeting ownership)
-- ============================================================
CREATE POLICY "Users can view participants of own meetings"
    ON meeting_participants FOR SELECT
    USING (meeting_id IN (SELECT id FROM meetings WHERE user_id = auth.uid()));

CREATE POLICY "Users can add participants to own meetings"
    ON meeting_participants FOR INSERT
    WITH CHECK (meeting_id IN (SELECT id FROM meetings WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete participants from own meetings"
    ON meeting_participants FOR DELETE
    USING (meeting_id IN (SELECT id FROM meetings WHERE user_id = auth.uid()));

-- ============================================================
-- MEETING FILES
-- ============================================================
CREATE POLICY "Users can view own files"
    ON meeting_files FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can upload files"
    ON meeting_files FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own files"
    ON meeting_files FOR DELETE
    USING (user_id = auth.uid());

-- ============================================================
-- TRANSCRIPTS (via meeting ownership)
-- ============================================================
CREATE POLICY "Users can view transcripts of own meetings"
    ON transcripts FOR SELECT
    USING (meeting_id IN (SELECT id FROM meetings WHERE user_id = auth.uid()));

CREATE POLICY "Users can create transcripts for own meetings"
    ON transcripts FOR INSERT
    WITH CHECK (meeting_id IN (SELECT id FROM meetings WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete transcripts of own meetings"
    ON transcripts FOR DELETE
    USING (meeting_id IN (SELECT id FROM meetings WHERE user_id = auth.uid()));

-- ============================================================
-- TRANSCRIPT SEGMENTS (via transcript → meeting ownership)
-- ============================================================
CREATE POLICY "Users can view segments of own transcripts"
    ON transcript_segments FOR SELECT
    USING (transcript_id IN (
        SELECT t.id FROM transcripts t
        JOIN meetings m ON t.meeting_id = m.id
        WHERE m.user_id = auth.uid()
    ));

CREATE POLICY "Users can create segments for own transcripts"
    ON transcript_segments FOR INSERT
    WITH CHECK (transcript_id IN (
        SELECT t.id FROM transcripts t
        JOIN meetings m ON t.meeting_id = m.id
        WHERE m.user_id = auth.uid()
    ));

-- ============================================================
-- MEETING SUMMARIES
-- ============================================================
CREATE POLICY "Users can view summaries of own meetings"
    ON meeting_summaries FOR SELECT
    USING (meeting_id IN (SELECT id FROM meetings WHERE user_id = auth.uid()));

CREATE POLICY "Users can create summaries for own meetings"
    ON meeting_summaries FOR INSERT
    WITH CHECK (meeting_id IN (SELECT id FROM meetings WHERE user_id = auth.uid()));

CREATE POLICY "Users can update summaries of own meetings"
    ON meeting_summaries FOR UPDATE
    USING (meeting_id IN (SELECT id FROM meetings WHERE user_id = auth.uid()));

-- ============================================================
-- DECISIONS
-- ============================================================
CREATE POLICY "Users can view decisions of own meetings"
    ON decisions FOR SELECT
    USING (meeting_id IN (SELECT id FROM meetings WHERE user_id = auth.uid()));

CREATE POLICY "Users can create decisions for own meetings"
    ON decisions FOR INSERT
    WITH CHECK (meeting_id IN (SELECT id FROM meetings WHERE user_id = auth.uid()));

-- ============================================================
-- TASKS
-- ============================================================
CREATE POLICY "Users can view own tasks"
    ON tasks FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create tasks"
    ON tasks FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own tasks"
    ON tasks FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own tasks"
    ON tasks FOR DELETE
    USING (user_id = auth.uid());

-- ============================================================
-- TASK DEPENDENCIES (via task ownership)
-- ============================================================
CREATE POLICY "Users can view own task dependencies"
    ON task_dependencies FOR SELECT
    USING (task_id IN (SELECT id FROM tasks WHERE user_id = auth.uid()));

CREATE POLICY "Users can create task dependencies"
    ON task_dependencies FOR INSERT
    WITH CHECK (task_id IN (SELECT id FROM tasks WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own task dependencies"
    ON task_dependencies FOR DELETE
    USING (task_id IN (SELECT id FROM tasks WHERE user_id = auth.uid()));

-- ============================================================
-- REMINDERS
-- ============================================================
CREATE POLICY "Users can view own reminders"
    ON reminders FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create reminders"
    ON reminders FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reminders"
    ON reminders FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own reminders"
    ON reminders FOR DELETE
    USING (user_id = auth.uid());

-- ============================================================
-- CALENDAR EVENTS
-- ============================================================
CREATE POLICY "Users can view own calendar events"
    ON calendar_events FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create calendar events"
    ON calendar_events FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own calendar events"
    ON calendar_events FOR DELETE
    USING (user_id = auth.uid());

-- ============================================================
-- AI INSIGHTS
-- ============================================================
CREATE POLICY "Users can view insights of own meetings"
    ON ai_insights FOR SELECT
    USING (meeting_id IN (SELECT id FROM meetings WHERE user_id = auth.uid()));

CREATE POLICY "Users can create insights for own meetings"
    ON ai_insights FOR INSERT
    WITH CHECK (meeting_id IN (SELECT id FROM meetings WHERE user_id = auth.uid()));

-- ============================================================
-- AI SUGGESTIONS
-- ============================================================
CREATE POLICY "Users can view suggestions of own meetings"
    ON ai_suggestions FOR SELECT
    USING (meeting_id IN (SELECT id FROM meetings WHERE user_id = auth.uid()));

CREATE POLICY "Users can create suggestions for own meetings"
    ON ai_suggestions FOR INSERT
    WITH CHECK (meeting_id IN (SELECT id FROM meetings WHERE user_id = auth.uid()));

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create notifications"
    ON notifications FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications"
    ON notifications FOR DELETE
    USING (user_id = auth.uid());

-- ============================================================
-- CHAT SESSIONS
-- ============================================================
CREATE POLICY "Users can view own chat sessions"
    ON chat_sessions FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create chat sessions"
    ON chat_sessions FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own chat sessions"
    ON chat_sessions FOR DELETE
    USING (user_id = auth.uid());

-- ============================================================
-- CHAT MESSAGES (via session ownership)
-- ============================================================
CREATE POLICY "Users can view messages in own sessions"
    ON chat_messages FOR SELECT
    USING (session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid()));

CREATE POLICY "Users can create messages in own sessions"
    ON chat_messages FOR INSERT
    WITH CHECK (session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid()));

-- ============================================================
-- EMBEDDINGS
-- ============================================================
CREATE POLICY "Users can view own embeddings"
    ON embeddings FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can create embeddings"
    ON embeddings FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own embeddings"
    ON embeddings FOR DELETE
    USING (user_id = auth.uid());

-- ============================================================
-- STORAGE POLICIES
-- ============================================================
-- Meeting files bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('meeting-files', 'meeting-files', false);

CREATE POLICY "Users can upload meeting files"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'meeting-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own meeting files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'meeting-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own meeting files"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'meeting-files' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Audio recordings bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('audio-recordings', 'audio-recordings', false);

CREATE POLICY "Users can upload audio recordings"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own audio recordings"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own audio recordings"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'audio-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);
