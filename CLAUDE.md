# Cartoon Gen

Thai-language cartoon image generator. Users sign in with Google, buy credits via Stripe, and generate cartoon versions of their photos using OpenAI. Shares a Supabase backend (auth, profiles, credits) with "The Memory" project.

## Commands

- `npm run dev` - Start development server
- `npm run build` - Production build (also runs TypeScript check)
- `npm run lint` - Run ESLint
- `npx tsc --noEmit` - Type check only

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router), React 19, TypeScript (strict) |
| Styling | Tailwind CSS v4 (CSS-first config in `globals.css` via `@theme inline`) |
| Auth/DB | Supabase (shared project, PostgreSQL + RLS) |
| Payments | Stripe (THB, card + PromptPay), API version `2026-01-28` |
| AI | OpenAI SDK v6 (`gpt-image-1.5` via `images.edit`) |
| Storage | Supabase Storage (`cartoon-images` + `templates` buckets) |
| Icons | Lucide React |
| Fonts | Kanit (body/Thai), Itim (handwriting), Leckerli One (branding) |
| Hosting | Vercel (60s function timeout for `/api/cartoon/generate`) |

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                  Shared Supabase Project              │
│                                                      │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │ Auth     │  │ user_profiles│  │ user_credits   │  │
│  │ (Google) │  │              │  │ credit_txns    │  │
│  └──────────┘  └──────────────┘  │ credit_pkgs   │  │
│                                  └───────────────┘  │
│  ┌──────────────────────┐  ┌──────────────────────┐  │
│  │ cartoon_generations  │  │ Storage: cartoon-    │  │
│  │ templates            │  │ images (originals/   │  │
│  │                      │  │ results) + templates │  │
│  └──────────────────────┘  └──────────────────────┘  │
└──────────────────────────────────────────────────────┘
         ▲                    ▲                ▲
         │                    │                │
┌────────┴────────┐  ┌───────┴───────┐  ┌─────┴──────┐
│  The Memory     │  │  Cartoon App  │  │  Stripe    │
│  (existing)     │  │  (this app)   │  │  Webhooks  │
└─────────────────┘  └───────────────┘  └────────────┘
```

Both products share the same Supabase project: same `auth.users`, `user_profiles`, `user_credits`, `credit_transactions`, `credit_packages`. This app owns `cartoon_generations`, `templates`, `cartoon-images` bucket, and `templates` bucket.

## Project Structure

```
src/
  types/         # TypeScript interfaces (database, profile, credits, cartoon)
  lib/           # Business logic and client factories
    supabase-server.ts  # getSupabaseRouteClient() + getSupabaseServiceClient()
    supabase.ts         # Browser client singleton
    stripe.ts           # getStripe() (lazy init)
    openai.ts           # generateCartoonImage() (lazy init, fetches template via URL)
    credits.ts          # Credit balance, packages, transactions
    profile.ts          # Profile CRUD, completion check, grant credits
    cartoon.ts          # Deduct/refund credits, save generations
    admin.ts            # isAdminEmail(), getAdminUser()
    templates.ts        # Template interface only (data lives in DB)
    upload.ts           # Client-side image resize/compress
    constants.ts        # CARTOON_CREDIT_COST=10, PROFILE_COMPLETION_CREDITS=10
  contexts/      # AuthContext, ToastContext, CreditBalanceContext
  hooks/         # useAuth, useToast, useCreditBalance
  components/    # CartoonCreator, AppBar, AdminAppBar, HeartLoader, ImageWithLoader, Toast, ClientProviders
  app/
    (app)/       # Auth-guarded routes (dashboard, credits, profile, onboarding)
    (admin)/     # Admin-guarded routes (admin dashboard, template management)
    api/         # REST API routes (includes /api/admin/* and /api/templates)
    auth/        # OAuth callback
    login/       # Public login page
    payment/     # Post-checkout pages (success, cancel)
migrations/      # SQL migration files for Supabase
```

## Key Patterns

### Supabase Clients

Two server-side factories in `lib/supabase-server.ts`:
- `getSupabaseRouteClient()` - Cookie-based auth for API routes (respects RLS)
- `getSupabaseServiceClient()` - Service role for admin operations (bypasses RLS)

All API routes use `getSupabaseRouteClient()` for auth verification. Never inline `createServerClient` with cookie boilerplate.

Browser client singleton in `lib/supabase.ts` via `getSupabaseBrowserClient()`.

### Database Types

`src/types/database.ts` must include `Relationships: []` on every table, plus `Views`, `Functions`, `Enums`, `CompositeTypes` on the schema. Without these, Supabase v2.95+ resolves all query types to `never`.

### Lazy Client Init

OpenAI and Stripe clients use getter functions (not module-level constants) to avoid build-time errors when env vars are missing. See `lib/openai.ts` and `lib/stripe.ts`.

### Admin Auth

Admin access is controlled via `ADMIN_EMAILS` env var (comma-separated Gmail addresses). No DB role column needed.

- `lib/admin.ts` — `isAdminEmail(email)` checks against env, `getAdminUser()` gets current user if admin
- `/api/admin/me` — Client-side check returns `{ isAdmin: boolean }`
- `(admin)/layout.tsx` — Client layout calls `/api/admin/me`, redirects non-admins to `/dashboard`
- All `/api/admin/*` routes call `getAdminUser()` first, return 403 if not admin

### Templates (DB-Managed)

Templates are stored in the `templates` DB table + `templates` Storage bucket. No static config.

- Public API: `GET /api/templates` — returns active templates ordered by `sort_order`
- Admin API: full CRUD + reorder + image upload at `/api/admin/templates/*`
- `CartoonCreator` fetches templates from `/api/templates` on mount
- `openai.ts` fetches template image via HTTP URL (not filesystem)
- `generate/route.ts` queries DB for template by ID, falls back to first active template

### Credit System

- 10 credits per cartoon generation, 10 free credits for profile completion
- Deduction uses optimistic locking: `UPDATE ... WHERE balance = currentBalance`
- Credit purchases are idempotent: checks `stripe_checkout_session_id` before inserting
- Profile credit grant is one-time: `WHERE profile_credits_claimed = false`

### Pages with useSearchParams

Must wrap the component using `useSearchParams()` in `<Suspense>` to avoid SSG errors.

## UI Language

All user-facing text is in **Thai**. Keep this consistent when adding new UI.

## Environment Variables

See `.env.example` for required vars: Supabase (3), Stripe (2), OpenAI (1), App URL (1), Admin (1).

- `ADMIN_EMAILS` — Comma-separated admin Gmail addresses (e.g. `admin@gmail.com,admin2@gmail.com`)

Note: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` must be the same values as The Memory project to share auth & data.

---

## Database Schema

### `credit_packages` — Product Catalog

```sql
CREATE TABLE credit_packages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  credits INTEGER NOT NULL,
  price_thb INTEGER NOT NULL,
  price_satang INTEGER NOT NULL,
  discount_percent INTEGER DEFAULT 0,
  is_popular BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Default packages
INSERT INTO credit_packages (name, credits, price_thb, price_satang, discount_percent, is_popular, sort_order)
VALUES
  ('100 เครดิต', 100, 59, 5900, 0, FALSE, 1),
  ('300 เครดิต', 300, 129, 12900, 27, TRUE, 2),
  ('500 เครดิต', 500, 199, 19900, 33, FALSE, 3);

-- RLS: Public read for active packages
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active packages"
  ON credit_packages FOR SELECT
  USING (is_active = TRUE);
```

### `user_credits` — Balance Tracking (one row per user)

```sql
CREATE TABLE user_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  balance INTEGER DEFAULT 0,
  total_purchased INTEGER DEFAULT 0,
  total_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_user_credits_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_credits_updated_at
  BEFORE UPDATE ON user_credits FOR EACH ROW
  EXECUTE FUNCTION update_user_credits_updated_at();

CREATE INDEX idx_user_credits_user_id ON user_credits(user_id);

ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own credits" ON user_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own credits" ON user_credits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credits" ON user_credits FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### `credit_transactions` — Immutable Audit Log

```sql
CREATE TABLE credit_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'use', 'refund')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  package_id UUID REFERENCES credit_packages,
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  memory_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_user_created ON credit_transactions(user_id, created_at DESC);
CREATE INDEX idx_credit_transactions_stripe_session ON credit_transactions(stripe_checkout_session_id);

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON credit_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### `user_profiles` — User Data

```sql
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  phone TEXT,
  birthday DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  job TEXT,
  relationship_status TEXT CHECK (relationship_status IN ('single', 'dating', 'married', 'other')),
  occasion_type TEXT CHECK (occasion_type IN ('valentine', 'anniversary', 'birthday', 'other')),
  profile_credits_claimed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
```

### `cartoon_generations` — Generation History

```sql
CREATE TABLE cartoon_generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  original_image_url TEXT,
  cartoon_image_url TEXT,
  credits_used INTEGER DEFAULT 10,
  prompt TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cartoon_generations_user_id ON cartoon_generations(user_id);
CREATE INDEX idx_cartoon_generations_user_created ON cartoon_generations(user_id, created_at DESC);

ALTER TABLE cartoon_generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own generations" ON cartoon_generations FOR SELECT USING (auth.uid() = user_id);
```

### `templates` — Cartoon Style Templates (DB-Managed)

```sql
CREATE TABLE templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  image_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active templates" ON templates FOR SELECT USING (is_active = TRUE);
```

### Storage Bucket

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('cartoon-images', 'cartoon-images', TRUE);

CREATE POLICY "Public read cartoon images" ON storage.objects
  FOR SELECT USING (bucket_id = 'cartoon-images');
CREATE POLICY "Authenticated users upload cartoon images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'cartoon-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users delete own cartoon images" ON storage.objects
  FOR DELETE USING (bucket_id = 'cartoon-images' AND auth.uid()::text = (storage.foldername(name))[2]);
```

Folder structure: `cartoon-images/originals/{userId}/{timestamp}-{random}.webp` and `cartoon-images/results/{userId}/{timestamp}-{random}.png`

**Templates bucket:**

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('templates', 'templates', TRUE);

CREATE POLICY "Public read templates" ON storage.objects
  FOR SELECT USING (bucket_id = 'templates');
```

Folder structure: `templates/{slug}.{ext}`

---

## API Routes

### Credits

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/credits/packages` | GET | No | List active credit packages |
| `/api/credits/balance?userId=xxx` | GET | Yes | Get user's credit balance |
| `/api/credits/checkout` | POST | Yes | Create Stripe checkout session |
| `/api/credits/transactions?userId=xxx&limit=20&offset=0` | GET | Yes | Paginated transaction history |

### Cartoon

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/cartoon/generate` | POST | Yes | Generate cartoon (costs 10 credits, 60s timeout) |
| `/api/cartoon/history?userId=xxx&limit=9&offset=0` | GET | Yes | Paginated gallery |
| `/api/cartoon/delete` | POST | Yes | Delete generation + storage files |

### Profile

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/profile?userId=xxx` | GET | Yes | Get profile + completion status |
| `/api/profile` | POST | Yes | Create/update profile (upsert) |
| `/api/profile/claim-credits` | POST | Yes | Claim 10 free credits for complete profile |

### Payments

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/payment/verify` | POST | Yes | Verify Stripe session, add credits |
| `/api/webhook/stripe` | POST | No* | Stripe webhook (*verified via signature) |

### Templates (Public)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/templates` | GET | No | List active templates ordered by sort_order |

### Admin

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/admin/me` | GET | Admin | Check if current user is admin |
| `/api/admin/stats` | GET | Admin | Dashboard stats (users, generations, credits, template usage) |
| `/api/admin/templates` | GET | Admin | List all templates (including inactive) |
| `/api/admin/templates` | POST | Admin | Create new template |
| `/api/admin/templates/[id]` | PATCH | Admin | Update template fields |
| `/api/admin/templates/[id]` | DELETE | Admin | Delete template + storage file |
| `/api/admin/templates/reorder` | PUT | Admin | Bulk update sort_order |
| `/api/admin/templates/upload` | POST | Admin | Upload template image to Storage |

### Auth

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/callback` | GET | OAuth callback: exchange code → check profile → redirect |

---

## Generation Flow

```
POST /api/cartoon/generate (multipart/form-data, max 10MB, JPG/PNG/WebP)

1. Authenticate user
2. Resolve template from DB (by templateId, fallback to first active)
3. Deduct 10 credits (optimistic lock)
   └── Insufficient balance → 400 { error, balance }
4. Convert uploaded file to Buffer
5. Fetch template image from Supabase Storage URL
6. Call OpenAI images.edit with template + user image
7. Upload original → cartoon-images/originals/{userId}/{timestamp}.webp
8. Upload result → cartoon-images/results/{userId}/{timestamp}.png
9. Save to cartoon_generations (status: 'completed', templateName: slug)
10. Return { success, generation, newBalance }

On failure at steps 4-9:
   ├── Refund 10 credits
   ├── Save to cartoon_generations (status: 'failed')
   └── Return 500 { error, refunded: true }
```

---

## Auth Flow

Login → Google OAuth → `/auth/callback` → check `user_profiles` → new user → `/onboarding`, existing → `/dashboard`

---

## Stripe Checkout Flow

1. Client calls `POST /api/credits/checkout` with `{ packageId, userId }`
2. Server creates Stripe checkout session (card + promptpay, THB)
3. Client redirects to Stripe
4. On success, Stripe redirects to `/payment/success?session_id=xxx`
5. Success page calls `POST /api/payment/verify` (fallback if webhook hasn't fired)
6. Webhook `POST /api/webhook/stripe` handles `checkout.session.completed` and `async_payment_succeeded`
7. Both paths call `addCredits()` which is idempotent via `stripe_checkout_session_id` check

---

## Cross-Product Considerations

- Credits purchased in either product are available in both (shared `user_credits`)
- Profile completed in either product grants credits once (`profile_credits_claimed` flag)
- Users see the same balance across both products
- Transaction history shows all transactions from both products

---

## Deployment Checklist

- [ ] Verify all Supabase tables, triggers, indexes, and RLS policies exist
- [ ] Run `migrations/002_add_templates_table.sql` for templates table
- [ ] Verify `cartoon-images` storage bucket with policies
- [ ] Create `templates` storage bucket (public) with read policy
- [ ] Upload template images to `templates` bucket, update `image_url` in DB
- [ ] Seed `credit_packages` with default packages
- [ ] Set up Stripe webhook → `/api/webhook/stripe` (events: `checkout.session.completed`, `async_payment_succeeded`, `async_payment_failed`)
- [ ] Add app domain to Supabase Auth → Redirect URLs
- [ ] Set all environment variables in Vercel (including `ADMIN_EMAILS`)
- [ ] Configure custom domain
