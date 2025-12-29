# Trace.dev Backend Architecture

This document outlines the secure, production-ready backend architecture for Trace.dev.

## 1. Core Concept: Strict Isolation
The system is built on an **Absolute Rule**: No data from one project may ever be accessible by another project.
Hierarchy:
`User -> Project -> Container -> [Logs, Keys, Docs, Stats]`

## 2. Infrastructure & Stack
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth (JWT)
- **Logic**: Edge Functions (Deno)
- **Security**: Row Level Security (RLS) + AES-GCM 256 Encryption

## 3. Database Schema
The schema is normalized and RLS-enforced.

### Tables
1.  **`users`**: Extends Supabase Auth.
2.  **`projects`**: The root of isolation. `user_id` is mandatory.
3.  **`daily_logs`**: One log per project per day.
4.  **`api_key_packets`**: Stores **encrypted** secrets.
5.  **`contribution_stats`**: Computed activity scores.

### Row Level Security (RLS)
Rules applied to ALL tables:
- `USING (auth.uid() = user_id)`: Users can only see their own data.
- **Strict Project Access**: Future policies can enforce `project_id` checks if teams are added, but currenly 1-to-1 mapping is enforced.

## 4. Security & Encryption

### API Key Management
**"Secret Zero" Architecture**:
The database NEVER holds plaintext keys.
1.  **Encryption**: Client sends payload to `encrypt-packet` Edge Function.
    - Function verifies JWT.
    - Encrypts using AES-GCM (Key in basic `ENCRYPTION_KEY` env var).
    - Returns encrypted blob.
    - Client saves blob to `api_key_packets`.
2.  **Decryption**: Client calls `decrypt-packet` with `packet_id`.
    - Function verifies JWT & RLS (via `supabase-js` context).
    - Fetches blob -> Decrypts -> Returns value.

### Edge Functions
Located in `supabase/functions/`.
1.  `encrypt-packet`: stateless encryption.
2.  `decrypt-packet`: secure retrieval.
3.  `calculate-stats`: deterministic score calculation.

## 5. Data Flow & Usage

### Adding a new Project
1.  Frontend calls `supabase.from('projects').insert(...)`.
2.  Frontend calls `supabase.from('project_containers').insert(...)`.

### Logging Daily Work
1.  Frontend calls `supabase.from('daily_logs').upsert(...)`.
2.  Trigger updates `updated_at`.

### Calculating Stats
1.  Call `calculate-stats` Edge Function (e.g. via Cron or UI trigger).
2.  Function reads `daily_logs` securely.
3.  Function writes to `contribution_stats`.

## 6. Deployment
1.  **Link**: `supabase link --project-ref <your-ref>`
2.  **Push Schema**: `supabase db push`
3.  **Deploy Functions**: `supabase functions deploy`
4.  **Set Secrets**:
    ```bash
    supabase secrets set ENCRYPTION_KEY=...
    ```

## 7. Scalability
- **Indexes**: Added on `user_id`, `project_id`, `log_date` for O(log n) lookups.
- **Partitioning**: schema is ready for partitioning by `user_id` or `log_date` if table grows >100GB.
- **Edge Functions**: scale automatically to thousands of requests.

## 8. Audit & Compliance
- **Identity**: JWT is the single source of truth.
- **No Plaintext**: Secrets strictly handled in memory only during Edge Function execution.
- **RLS**: Database-level firewall. No application logic error can expose data.
