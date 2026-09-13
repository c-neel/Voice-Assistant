# GLS NEXUS — AI Meeting Intelligence & Task Automation

> **MEETING → INTELLIGENCE → ACTION → EXECUTION**

GLS NEXUS is an AI-powered platform that transforms meetings and documents into structured minutes, actionable tasks, smart recommendations, and automated reminders.

## Architecture

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Python FastAPI, Faster-Whisper, PyMuPDF
- **Database**: Supabase PostgreSQL + pgvector
- **AI Engine**: Google Gemini Flash (Structured JSON output)

## Features

- **Upload Documents**: Extract text from PDF, DOCX, TXT, CSV, MD.
- **Voice Meetings**: Record audio directly in the browser and transcribe using Faster-Whisper.
- **Unified AI Pipeline**: Generates Executive Summary, Detailed Summary, Actionable Tasks, Decisions, and Insights.
- **Task Automation**: Reviews AI-generated tasks, identifies deadlines and assignees, and syncs to a dashboard.
- **RAG Assistant**: Ask questions about your past meetings using semantic vector search.

## Setup Instructions

### 1. Database Setup
1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Run `database/schema.sql` in the SQL editor.
3. Run `database/policies.sql` to enforce Row Level Security.
4. Optional: Run `database/seed.sql` for demo data.

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```
Edit backend `.env` with your API keys (Supabase, Gemini).

Start backend:
```bash
uvicorn app.main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local
```
Edit frontend `.env.local` with your Supabase public URL and anon key.

Start frontend:
```bash
npm run dev
```

## Security

- All database tables enforce Row Level Security (`user_id = auth.uid()`).
- Supabase tokens are verified server-side in FastAPI middleware.
- AI is instructed to treat user documents as untrusted content to prevent prompt injection.
