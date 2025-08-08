-- Seed some data for local/preview
insert into jobs (title, description, requirements)
values
  ('Frontend Engineer', 'React, TypeScript, UI', '["React","TypeScript","CSS"]'::jsonb),
  ('Backend Engineer', 'Node.js, SQL', '["Node.js","SQL","API"]'::jsonb),
  ('HR Generalist', null, '[]'::jsonb)
on conflict do nothing;

with j as (select id from jobs where title='Frontend Engineer' limit 1),
     k as (select id from jobs where title='Backend Engineer' limit 1)
insert into candidates (name, email, phone, status, scores, applied_job_id, job_title, skills, work_history, notes)
values
  ('Jane Doe','jane.doe@example.com','+1 555-0101','Reviewed','{"overall":7}'::jsonb,(select id from j),'Frontend Engineer','["React","TypeScript","Tailwind"]'::jsonb,'["UI Engineer at Pixel Co (2022-2024)","Frontend Dev at Webify (2020-2022)"]'::jsonb,''),
  ('John Smith','john.smith@example.com','+1 555-0102','Shortlisted','{"overall":8}'::jsonb,(select id from k),'Backend Engineer','["Node.js","PostgreSQL","Express"]'::jsonb,'["Backend Engineer at API Corp (2021-2024)"]'::jsonb,''),
  ('Emily Chen','emily.chen@example.com','+1 555-0103','New','{"overall":6}'::jsonb,(select id from j),'Frontend Engineer','["JavaScript","CSS","Testing"]'::jsonb,'["Intern at Designify (2023-2024)"]'::jsonb,'')
on conflict do nothing;

insert into employees (name, email, role, start_date, pto_balance) values
  ('Alice Johnson','alice@acme.hr','HR Manager','2021-05-10',12),
  ('Bob Lee','bob@acme.hr','Recruiter','2022-02-01',8),
  ('Carlos Gomez','carlos@acme.hr','Marketing','2020-09-15',14)
on conflict do nothing;
