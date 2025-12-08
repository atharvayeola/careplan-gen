# Database Connection Info for pgAdmin

Use the docker-compose/Postgres service credentials below.

## Connection Details
- **Host:** `localhost`
- **Port:** `5433` (mapped from container 5432)
- **Database:** `lamarhealth`
- **Username:** `user`
- **Password:** `password`

## Tables Created by Migration 0002

After running the migrations, these tables should exist:

1. **careplan_careplan** – updated with new fields:
   - `version` (integer)
   - `is_edited` (boolean)
   - `edit_count` (integer)
   - `order_id` (UUID FK)
   - `updated_at` (timestamp)

2. **careplan_careplanfeedback** – new table:
   - `id` (UUID PK)
   - `care_plan_id` (UUID FK → careplan_careplan)
   - `original_content` (text)
   - `edited_content` (text)
   - `diff_data` (jsonb)
   - `feedback_text` (text)
   - `feedback_categories` (text[])
   - `extracted_issues` (text[])
   - `extracted_suggestions` (text[])
   - `severity` (varchar)
   - `processed_for_prompt` (boolean)
   - `batch_number` (integer, nullable)
   - `extracted_rules` (jsonb, nullable)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)

## Quick Checks in pgAdmin

If tables do not appear after a refresh, run these in the query tool:

```sql
-- Verify migrations table
SELECT * FROM django_migrations WHERE app = 'careplan';

-- List all careplan tables
SELECT tablename FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'careplan%'
ORDER BY tablename;

-- Check careplan_careplanfeedback structure
\d careplan_careplanfeedback;

-- Confirm new columns on careplan_careplan
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'careplan_careplan'
ORDER BY ordinal_position;
```
