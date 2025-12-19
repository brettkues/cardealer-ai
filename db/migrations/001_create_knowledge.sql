CREATE TABLE knowledge (
  knowledge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  domain TEXT NOT NULL CHECK (domain IN ('sales', 'fi')),
  department TEXT,

  title TEXT,
  content TEXT NOT NULL,
  content_hash TEXT NOT NULL,

  authority TEXT NOT NULL CHECK (authority IN (
    'approved',
    'reference',
    'personal'
  )),

  scope TEXT NOT NULL CHECK (scope IN ('global', 'user')),
  owner_user_id UUID NULL,

  status TEXT NOT NULL CHECK (status IN (
    'active',
    'replaced',
    'expired',
    'deleted'
  )),

  effective_date DATE NULL,
  expires_at TIMESTAMP NULL,

  replaces_knowledge_id UUID NULL REFERENCES knowledge(knowledge_id),

  added_by_user_id UUID NOT NULL,
  added_at TIMESTAMP NOT NULL DEFAULT NOW()
);
