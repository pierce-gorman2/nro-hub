# NRO Hub — Setup Guide

## 1. Supabase Project

1. Create a new project at https://supabase.com
2. Go to **SQL Editor** and run the entire contents of `supabase_schema.sql`
3. Copy your **Project URL** and **anon public key** from Settings → API

## 2. Environment Variables

Edit `.env` in the project root:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## 3. Create Users

In Supabase → **Authentication → Users → Invite user** (or use the signup flow):

- To make a user an **admin**, after they sign up, go to the `profiles` table and set their `role` column to `'admin'`
- Default role for new signups is `'member'`

You can also pre-set the role at invite time by adding metadata:
```json
{ "role": "admin" }
```

## 4. Run Locally

```bash
npm install
npm run dev
```

App runs at http://localhost:5173

## 5. Build for Production

```bash
npm run build
```

Output in `dist/` — deploy to Vercel, Netlify, or any static host.

---

## Database Tables

| Table | Purpose |
|---|---|
| `profiles` | User info + role (admin/member) |
| `nro_assignments` | Calendar blocks: team, market, phase, dates |
| `updates` | Admin announcements |
| `daily_schedules` | Phase run-of-show templates |
| `documents` | Linked docs organized by market |

## Markets & Teams

- **Markets:** Kansas, Nashville, San Antonio
- **Teams:** Team A, Team B, Team C
- **Phases:** Travel, Training, Soft Open, Grand Opening
