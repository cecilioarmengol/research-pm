-- ============================================================
-- ResearchFlow — PostgreSQL / Supabase Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Profiles (extends Supabase auth.users) ────────────────────────────────────
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email       TEXT NOT NULL UNIQUE,
  full_name   TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'pi', 'student')),
  initials    TEXT GENERATED ALWAYS AS (
                upper(substring(full_name from 1 for 1) ||
                      coalesce(substring(full_name from position(' ' in full_name) + 1 for 1), ''))
              ) STORED,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Projects ──────────────────────────────────────────────────────────────────
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status      TEXT NOT NULL DEFAULT 'not_started'
              CHECK (status IN ('not_started', 'in_progress', 'completed', 'delayed')),
  start_date  DATE,
  deadline    DATE,
  tags        TEXT[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Project Stages ────────────────────────────────────────────────────────────
CREATE TABLE project_stages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage_key       TEXT NOT NULL,
  stage_name      TEXT NOT NULL,
  stage_order     SMALLINT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'in_progress', 'completed')),
  estimated_days  SMALLINT,
  start_date      DATE,
  end_date        DATE,
  UNIQUE(project_id, stage_key)
);

-- ── Tasks ─────────────────────────────────────────────────────────────────────
CREATE TABLE tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id     UUID NOT NULL REFERENCES project_stages(id) ON DELETE CASCADE,
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  completed    BOOLEAN NOT NULL DEFAULT FALSE,
  deadline     DATE,
  notes        TEXT,
  assigned_to  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Comments ──────────────────────────────────────────────────────────────────
CREATE TABLE comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Attachments ───────────────────────────────────────────────────────────────
CREATE TABLE attachments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  filename     TEXT NOT NULL,
  file_url     TEXT NOT NULL,
  file_size    INTEGER,
  mime_type    TEXT,
  uploaded_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── Notifications ─────────────────────────────────────────────────────────────
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id  UUID REFERENCES projects(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  read        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX idx_projects_assigned_to  ON projects(assigned_to);
CREATE INDEX idx_projects_status       ON projects(status);
CREATE INDEX idx_stages_project_id     ON project_stages(project_id);
CREATE INDEX idx_tasks_stage_id        ON tasks(stage_id);
CREATE INDEX idx_tasks_project_id      ON tasks(project_id);
CREATE INDEX idx_comments_project_id   ON comments(project_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- ── Auto-update updated_at ────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Row-Level Security ────────────────────────────────────────────────────────
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects       ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications  ENABLE ROW LEVEL SECURITY;

-- Profiles: anyone authenticated can read; only self can update
CREATE POLICY "profiles_read"   ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Projects: admins and PIs see all; students see own
CREATE POLICY "projects_read" ON projects FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'pi'))
  OR assigned_to = auth.uid()
  OR created_by  = auth.uid()
);
CREATE POLICY "projects_write" ON projects FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Stages: same as projects
CREATE POLICY "stages_read" ON project_stages FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM projects p
    WHERE p.id = project_id AND (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','pi'))
      OR p.assigned_to = auth.uid()
    )
  )
);

-- Tasks: students can update tasks on their own projects
CREATE POLICY "tasks_read" ON tasks FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM projects p WHERE p.id = project_id AND (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','pi'))
      OR p.assigned_to = auth.uid()
    )
  )
);
CREATE POLICY "tasks_update" ON tasks FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM projects p WHERE p.id = project_id AND (
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
      OR p.assigned_to = auth.uid()
    )
  )
);

-- Comments: authenticated users can read project comments they have access to; write own
CREATE POLICY "comments_read" ON comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "comments_insert" ON comments FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Notifications: own only
CREATE POLICY "notifications_own" ON notifications FOR ALL TO authenticated USING (user_id = auth.uid());
