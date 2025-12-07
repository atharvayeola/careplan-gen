# Database Connection Info for pgAdmin

## Connection Details
- **Host:** `localhost`
- **Port:** `5433` (not 5432!)
- **Database:** `careplan_db`
- **Username:** `careplan_user`  
- **Password:** `careplan_password`

## Tables Created by Migration 0002

After running the migrations, these tables should exist:

1. **careplan_careplan** - Updated with new fields:
   - `version` (integer)
   - `is_edited` (boolean)
   - `edit_count` (integer)
   - `order_id` (UUID FK)
   - `updated_at` (timestamp)

2. **careplan_careplanfeedback** - NEW table:
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

## How to Refresh pgAdmin

1. **Right-click** on your database connection in pgAdmin
2. Click **"Refresh"**
3. Or **disconnect and reconnect** to the database
4. Navigate to: **Servers → YourConnection → Databases → careplan_db → Schemas → public → Tables**

## If Tables Still Don't Appear

Run this SQL query in pgAdmin's query tool:

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
```

## Quick Verification Query

```sql
-- This should return the new columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'careplan_careplan'
ORDER BY ordinal_position;
```

The tables ARE there - migrations confirmed with `[X] 0002_careplan_edit_count_careplan_is_edited_and_more`
