CREATE TABLE knowledge_audit (
  audit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  action TEXT NOT NULL,
  knowledge_id UUID NULL REFERENCES knowledge(knowledge_id),

  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  domain TEXT,

  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);
