# Interrail Fleet - functional Supabase build

This package replaces the static preview shell with a real wired build.

## What works in this version
- Login with Supabase Auth email/password
- Add vehicles
- Submit reports
- Mark reports in progress
- Close reports
- Update current mileage/current hours/next oil change when closing
- Keep closed reports visible for 30 days
- Show older closed reports in the archive view
- Show submitted and closed dates

## What is not finished yet
- Photo upload
- Create new auth users from inside the app
- Edit/delete vehicles

## Before you deploy
1. In Supabase SQL Editor, run `supabase-schema.sql`
2. Create your auth user in Supabase Auth
3. Create a profile row for that auth user with role `admin`

### Example profile insert
```sql
insert into public.profiles (id, full_name, role)
select id, 'Admin', 'admin'
from auth.users
where email = 'your-email@example.com'
on conflict (id) do update
set full_name = excluded.full_name,
    role = excluded.role;
```

## Environment variables in Vercel
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Deploy
Upload this whole project to GitHub, then import it into Vercel as a Next.js project.

## Notes
This build uses the logo and the mobile-first layout you approved.
