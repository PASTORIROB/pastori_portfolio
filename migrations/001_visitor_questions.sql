create table if not exists visitor_questions (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  ip_hash text not null,
  question text not null,
  answer text not null
);
create index if not exists visitor_questions_ip_time on visitor_questions (ip_hash, created_at);
