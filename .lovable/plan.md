## Plan: Store Code Team Sharing & User Roles

### Database Changes (SQL for user to run manually in Supabase)

1. **Create `stores` table** — holds store codes (e.g. "OW-STC")
2. **Create `store_members` table** — links users to stores with roles (Rep, Admin, Service, Manager)
3. **Update RLS policies** on accounts/contacts/interactions/follow_ups to filter by store membership instead of individual `user_id`
4. **Add `store_id` column** to all data tables (accounts, contacts, interactions, follow_ups)

### App Code Changes

1. **Update Auth signup flow** — add store code + role selection fields
2. **After signup, auto-join** the user to the store matching the code
3. **Update `supabase-store.ts`** — use `store_id` instead of `user_id` for all inserts
4. **Update seed function** — seed data under the store, not individual user
5. **Add role context** — expose current user's role in AuthContext for future permission checks
6. **Show role in sidebar/header** — display user's role badge

### How It Works
- User signs up with email, password, store code, and role
- If store code exists, they join it; if it's the first user with that code, the store is created
- All users under "OW-STC" see the same accounts, contacts, interactions, and follow-ups
- Roles are stored for future permission gating (e.g., only Admin can delete)
