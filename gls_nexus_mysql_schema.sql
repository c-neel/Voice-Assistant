-- ============================================================
-- GLS NEXUS — MySQL Database Schema
-- For XAMPP / phpMyAdmin
-- ============================================================

CREATE DATABASE IF NOT EXISTS gls_nexus CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gls_nexus;

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url VARCHAR(1024),
    timezone VARCHAR(100) DEFAULT 'UTC',
    notification_preferences JSON,
    google_calendar_connected BOOLEAN DEFAULT FALSE,
    google_calendar_token JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================================
-- 2. MEETINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS meetings (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    meeting_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_seconds INT,
    source ENUM('file_upload', 'voice_recording') NOT NULL,
    status ENUM('processing', 'completed', 'failed', 'partial') DEFAULT 'processing',
    language VARCHAR(10) DEFAULT 'en',
    tags JSON,
    quality_score INT CHECK (quality_score >= 0 AND quality_score <= 100),
    quality_explanation TEXT,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_meetings_user_id ON meetings(user_id);
CREATE INDEX idx_meetings_status ON meetings(status);
CREATE INDEX idx_meetings_created_at ON meetings(created_at);

-- ============================================================
-- 3. MEETING PARTICIPANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS meeting_participants (
    id VARCHAR(36) PRIMARY KEY,
    meeting_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);

CREATE INDEX idx_participants_meeting ON meeting_participants(meeting_id);

-- ============================================================
-- 4. MEETING FILES
-- ============================================================
CREATE TABLE IF NOT EXISTS meeting_files (
    id VARCHAR(36) PRIMARY KEY,
    meeting_id VARCHAR(36) NOT NULL,
    user_id VARCHAR(36) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    storage_path VARCHAR(1024) NOT NULL,
    mime_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_files_meeting ON meeting_files(meeting_id);

-- ============================================================
-- 5. TRANSCRIPTS
-- ============================================================
CREATE TABLE IF NOT EXISTS transcripts (
    id VARCHAR(36) PRIMARY KEY,
    meeting_id VARCHAR(36) NOT NULL,
    full_text LONGTEXT NOT NULL,
    word_count INT,
    language VARCHAR(10) DEFAULT 'en',
    confidence_score FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);

CREATE INDEX idx_transcripts_meeting ON transcripts(meeting_id);

-- ============================================================
-- 6. TRANSCRIPT SEGMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS transcript_segments (
    id VARCHAR(36) PRIMARY KEY,
    transcript_id VARCHAR(36) NOT NULL,
    speaker VARCHAR(100),
    content TEXT NOT NULL,
    start_time FLOAT,
    end_time FLOAT,
    confidence FLOAT,
    segment_index INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transcript_id) REFERENCES transcripts(id) ON DELETE CASCADE
);

CREATE INDEX idx_segments_transcript ON transcript_segments(transcript_id);

-- ============================================================
-- 7. MEETING SUMMARIES
-- ============================================================
CREATE TABLE IF NOT EXISTS meeting_summaries (
    id VARCHAR(36) PRIMARY KEY,
    meeting_id VARCHAR(36) NOT NULL,
    executive_summary TEXT NOT NULL,
    detailed_summary LONGTEXT NOT NULL,
    discussion_points JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);

CREATE INDEX idx_summaries_meeting ON meeting_summaries(meeting_id);

-- ============================================================
-- 8. DECISIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS decisions (
    id VARCHAR(36) PRIMARY KEY,
    meeting_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    decision_maker VARCHAR(255),
    context TEXT,
    impact TEXT,
    confidence_score FLOAT DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);

CREATE INDEX idx_decisions_meeting ON decisions(meeting_id);

-- ============================================================
-- 9. TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    meeting_id VARCHAR(36),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assignee VARCHAR(255),
    status ENUM('pending', 'in_progress', 'completed', 'overdue', 'cancelled') DEFAULT 'pending',
    priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    due_date TIMESTAMP NULL DEFAULT NULL,
    due_date_confirmed BOOLEAN DEFAULT FALSE,
    confidence_score FLOAT DEFAULT 1.0,
    ai_recommendation TEXT,
    source_text TEXT,
    is_ai_generated BOOLEAN DEFAULT TRUE,
    approved BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE SET NULL
);

CREATE INDEX idx_tasks_user ON tasks(user_id);
CREATE INDEX idx_tasks_meeting ON tasks(meeting_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_priority ON tasks(priority);

-- ============================================================
-- 10. REMINDERS
-- ============================================================
CREATE TABLE IF NOT EXISTS reminders (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    task_id VARCHAR(36),
    meeting_id VARCHAR(36),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    remind_at TIMESTAMP NOT NULL,
    reminder_type ENUM('before_deadline', 'at_deadline', 'custom') DEFAULT 'custom',
    is_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE SET NULL
);

CREATE INDEX idx_reminders_user ON reminders(user_id);
CREATE INDEX idx_reminders_remind_at ON reminders(remind_at);
CREATE INDEX idx_reminders_sent ON reminders(is_sent);

-- ============================================================
-- 11. CALENDAR EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS calendar_events (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    task_id VARCHAR(36),
    meeting_id VARCHAR(36),
    google_event_id VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NULL DEFAULT NULL,
    calendar_link VARCHAR(1024),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE SET NULL
);

CREATE INDEX idx_calendar_user ON calendar_events(user_id);
CREATE INDEX idx_calendar_task ON calendar_events(task_id);

-- ============================================================
-- 12. AI INSIGHTS
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_insights (
    id VARCHAR(36) PRIMARY KEY,
    meeting_id VARCHAR(36) NOT NULL,
    insight_type ENUM('risk', 'suggestion', 'recommendation', 'remark', 'follow_up', 'bottleneck', 'process_improvement') NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical'),
    actionable BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);

CREATE INDEX idx_insights_meeting ON ai_insights(meeting_id);
CREATE INDEX idx_insights_type ON ai_insights(insight_type);

-- ============================================================
-- 13. CHAT SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) DEFAULT 'New Conversation',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_chat_sessions_user ON chat_sessions(user_id);

-- ============================================================
-- 14. CHAT MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    role ENUM('user', 'assistant') NOT NULL,
    content TEXT NOT NULL,
    sources JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
);

CREATE INDEX idx_messages_session ON chat_messages(session_id);

-- ============================================================
-- 15. EMBEDDINGS (Simplified since MySQL lacks pgvector)
-- ============================================================
-- We will store the embedding vector as a JSON array or a BLOB.
-- For simplicity and cross-compatibility, we use JSON here.
-- In Python, we will deserialize it and compute cosine similarity using NumPy.
CREATE TABLE IF NOT EXISTS embeddings (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    meeting_id VARCHAR(36),
    content_type ENUM('transcript', 'summary', 'decision', 'task', 'insight') NOT NULL,
    content TEXT NOT NULL,
    embedding JSON, 
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (meeting_id) REFERENCES meetings(id) ON DELETE CASCADE
);

CREATE INDEX idx_embeddings_user ON embeddings(user_id);
CREATE INDEX idx_embeddings_meeting ON embeddings(meeting_id);

-- Note: MySQL does not natively support vector search indexes like pgvector's hnsw.
-- The RAG service will need to fetch all embeddings for the user and compute similarity in Python.
