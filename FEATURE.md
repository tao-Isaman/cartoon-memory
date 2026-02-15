# Cartoon Generator - Standalone Product Splitoff

> Extracted from **The Memory** project. This document covers everything needed to build the cartoon generation feature as an independent product, sharing the same Supabase project (auth, profiles, credits).

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Shared Infrastructure](#shared-infrastructure)
- [Database Schema](#database-schema)
- [Authentication System](#authentication-system)
- [User Profile System](#user-profile-system)
- [Credits System](#credits-system)
- [Cartoon Generation System](#cartoon-generation-system)
- [Stripe Integration](#stripe-integration)
- [Image Upload Pipeline](#image-upload-pipeline)
- [API Routes](#api-routes)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Migration Checklist](#migration-checklist)

---

## Architecture Overview

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
│  │                      │  │ images (originals/   │  │
│  │                      │  │ results)             │  │
│  └──────────────────────┘  └──────────────────────┘  │
└──────────────────────────────────────────────────────┘
         ▲                    ▲                ▲
         │                    │                │
┌────────┴────────┐  ┌───────┴───────┐  ┌─────┴──────┐
│  The Memory     │  │  Cartoon App  │  │  Stripe    │
│  (existing)     │  │  (new product)│  │  Webhooks  │
└─────────────────┘  └───────────────┘  └────────────┘
```

Both products share the **same Supabase project**, meaning:
- Same `auth.users` table (Google OAuth)
- Same `user_profiles` table
- Same `user_credits` and `credit_transactions` tables
- Same `credit_packages` catalog
- The new product gets its own `cartoon_generations` table and `cartoon-images` storage bucket (already exist)

---

## Shared Infrastructure

| Component | Details |
|-----------|---------|
| **Database** | Supabase (PostgreSQL with RLS) - shared project |
| **Auth** | Supabase Auth (Google OAuth) - shared |
| **Storage** | Supabase Storage - `cartoon-images` bucket |
| **Payments** | Stripe (Card + PromptPay) - can use same or separate Stripe account |
| **AI** | OpenAI GPT Image 1.5 |
| **Hosting** | Vercel (separate deployment) |

---

## Database Schema

### Shared Tables (already exist in Supabase)

#### `credit_packages` — Product Catalog

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

#### `user_credits` — Balance Tracking (one row per user)

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

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_user_credits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_credits_updated_at
  BEFORE UPDATE ON user_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_user_credits_updated_at();

-- Indexes
CREATE INDEX idx_user_credits_user_id ON user_credits(user_id);

-- RLS: Owner only
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own credits" ON user_credits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own credits" ON user_credits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own credits" ON user_credits FOR INSERT WITH CHECK (auth.uid() = user_id);
```

#### `credit_transactions` — Immutable Audit Log

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
  memory_id UUID,  -- NULL in standalone product (or reference your own entity)
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_user_created ON credit_transactions(user_id, created_at DESC);
CREATE INDEX idx_credit_transactions_stripe_session ON credit_transactions(stripe_checkout_session_id);

-- RLS: Owner read + insert only
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own transactions" ON credit_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON credit_transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
```

#### `user_profiles` — User Data

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

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_user_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_user_profiles_updated_at();

-- Index
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- RLS: Owner only
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
```

### Product-Specific Table

#### `cartoon_generations` — Generation History

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

-- Indexes
CREATE INDEX idx_cartoon_generations_user_id ON cartoon_generations(user_id);
CREATE INDEX idx_cartoon_generations_user_created ON cartoon_generations(user_id, created_at DESC);

-- RLS: Owner read, service role full access
ALTER TABLE cartoon_generations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own generations" ON cartoon_generations FOR SELECT USING (auth.uid() = user_id);
```

### Storage Bucket

```sql
-- Create public bucket for cartoon images
INSERT INTO storage.buckets (id, name, public) VALUES ('cartoon-images', 'cartoon-images', TRUE);

-- Policies
CREATE POLICY "Public read cartoon images" ON storage.objects
  FOR SELECT USING (bucket_id = 'cartoon-images');

CREATE POLICY "Authenticated users upload cartoon images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'cartoon-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users delete own cartoon images" ON storage.objects
  FOR DELETE USING (bucket_id = 'cartoon-images' AND auth.uid()::text = (storage.foldername(name))[2]);
```

**Folder structure:**
```
cartoon-images/
├── originals/{userId}/{timestamp}-{random}.webp   # User uploads
└── results/{userId}/{timestamp}-{random}.png      # AI-generated cartoons
```

---

## Authentication System

### Overview

Both products use the **same Supabase Auth** with Google OAuth. Users sign in once and their session works across both apps (if same Supabase project).

### Browser Client

```typescript
// src/lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let browserClient: SupabaseClient<Database> | null = null;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return browserClient;
}
```

### Server Client (Service Role — bypasses RLS)

```typescript
// src/lib/supabase-server.ts
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export function getSupabaseServiceClient() {
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
```

### Auth Context Provider

```typescript
// src/contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

// Google OAuth sign-in
const signInWithGoogle = async () => {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
};

// Listen for auth state changes
useEffect(() => {
  const supabase = getSupabaseBrowserClient();

  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session);
    setUser(session?.user ?? null);
    setLoading(false);
  });

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    }
  );

  return () => subscription.unsubscribe();
}, []);
```

### OAuth Callback

```typescript
// src/app/auth/callback/route.ts
// Exchanges authorization code for session
// Redirects new users → /onboarding, existing users → /dashboard
```

---

## User Profile System

### TypeScript Interface

```typescript
// src/types/profile.ts
export type Gender = 'male' | 'female' | 'other';
export type RelationshipStatus = 'single' | 'dating' | 'married' | 'other';
export type OccasionType = 'valentine' | 'anniversary' | 'birthday' | 'other';

export interface UserProfile {
  id: string;
  userId: string;
  phone: string | null;
  birthday: string | null;
  gender: Gender | null;
  job: string | null;
  relationshipStatus: RelationshipStatus | null;
  occasionType: OccasionType | null;
  profileCreditsClaimed: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Core Functions

```typescript
// src/lib/profile.ts

// Get user profile
getUserProfile(supabase, userId): Promise<UserProfile | null>

// Check if all 6 fields are filled
isProfileComplete(profile: UserProfile | null): boolean
// Checks: phone, birthday, gender, job, relationshipStatus, occasionType

// Create or update profile
upsertUserProfile(supabase, userId, data): Promise<UserProfile | null>
// Uses upsert with onConflict: 'user_id'

// Grant 10 free credits for completing profile (idempotent)
grantProfileCredits(supabase, userId): Promise<{
  success: boolean;
  alreadyClaimed?: boolean;
  newBalance?: number;
  error?: string;
}>
// Uses optimistic lock: WHERE profile_credits_claimed = false
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/profile?userId=xxx` | GET | Get profile + completion status |
| `/api/profile` | POST | Create or update profile (upsert) |
| `/api/profile/claim-credits` | POST | Claim 10 free credits for complete profile |

---

## Credits System

### Constants

```typescript
// src/lib/constants.ts
export const CARTOON_CREDIT_COST = 10;
export const PROFILE_COMPLETION_CREDITS = 10;
```

### TypeScript Interfaces

```typescript
// src/types/credits.ts
export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceTHB: number;
  priceSatang: number;       // For Stripe (1 THB = 100 satang)
  discountPercent: number;
  isPopular: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserCredits {
  id: string;
  userId: string;
  balance: number;
  totalPurchased: number;
  totalUsed: number;
  createdAt: string;
  updatedAt: string;
}

export type CreditTransactionType = 'purchase' | 'use' | 'refund';

export interface CreditTransaction {
  id: string;
  userId: string;
  type: CreditTransactionType;
  amount: number;            // Positive for purchase/refund, negative for use
  balanceAfter: number;
  packageId: string | null;
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
  memoryId: string | null;
  description: string | null;
  createdAt: string;
}
```

### Core Functions

```typescript
// src/lib/credits.ts

// List active packages (ordered by sort_order)
getActivePackages(supabase): Promise<CreditPackage[]>

// Get single package
getPackageById(supabase, packageId): Promise<CreditPackage | null>

// Get user's current balance (returns 0 if no row)
getUserCreditBalance(supabase, userId): Promise<number>

// Ensure user_credits row exists (upsert, no-op if exists)
ensureUserCreditsRow(supabase, userId): Promise<void>

// Add credits after purchase (IDEMPOTENT - checks stripe session ID)
addCredits(supabase, userId, credits, packageId, stripeSessionId, stripePaymentIntentId): Promise<{
  success: boolean;
  newBalance: number;
}>

// Get paginated transaction history
getCreditTransactions(supabase, userId, limit?, offset?): Promise<{
  transactions: CreditTransaction[];
  total: number;
}>
```

### Credit Balance Global Provider

```typescript
// src/contexts/CreditBalanceContext.tsx
interface CreditBalanceContextType {
  balance: number;
  loading: boolean;
  refresh: () => Promise<void>;
}

// Fetches from /api/credits/balance?userId=xxx
// Auto-refreshes when user changes
// Call refresh() after credit-consuming operations

// Usage in components:
const { balance, loading, refresh } = useCreditBalance();
```

### Critical Patterns

#### Idempotent Credit Addition (prevents duplicate webhook processing)

```typescript
// Before adding credits, check if already processed
const { data: existingTx } = await supabase
  .from('credit_transactions')
  .select('id')
  .eq('stripe_checkout_session_id', stripeSessionId)
  .limit(1);

if (existingTx && existingTx.length > 0) {
  // Already processed — skip
  return { success: true, newBalance: currentBalance };
}
```

#### Optimistic Locking (prevents race conditions on balance updates)

```typescript
// When deducting credits, match current balance in WHERE clause
const { error } = await supabase
  .from('user_credits')
  .update({ balance: newBalance, total_used: newTotalUsed })
  .eq('user_id', userId)
  .eq('balance', currentBalance); // Fails if balance changed concurrently

if (error) {
  // Retry or return error — balance was modified by another request
}
```

---

## Cartoon Generation System

### TypeScript Interface

```typescript
// src/types/cartoon.ts
export interface CartoonGeneration {
  id: string;
  userId: string;
  originalImageUrl: string | null;
  cartoonImageUrl: string | null;
  creditsUsed: number;
  prompt: string | null;
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}
```

### Core Functions

```typescript
// src/lib/cartoon.ts

// Deduct 10 credits with optimistic lock
deductCreditsForCartoon(supabase, userId): Promise<{
  success: boolean;
  newBalance?: number;
  error?: string;
}>

// Refund 10 credits on failure
refundCreditsForCartoon(supabase, userId): Promise<void>

// Save generation record
saveCartoonGeneration(supabase, data): Promise<CartoonGeneration | null>

// Get user's completed generations (paginated)
getUserCartoonGenerations(supabase, userId, limit=9, offset=0): Promise<{
  generations: CartoonGeneration[];
  total: number;
}>
```

### OpenAI Integration

```typescript
// src/lib/openai.ts
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateCartoonImage(
  templateBuffer: Buffer,
  userImageBuffer: Buffer
): Promise<string> {
  // Uses images.edit for style transfer
  const response = await openai.images.edit({
    model: 'gpt-image-1.5',
    image: [
      { data: templateBuffer, filename: 'template.png' },
      { data: userImageBuffer, filename: 'user.png' },
    ],
    prompt: 'Use style of first image apply to second image, Change the background to a soft pastel pink color.',
    size: '1024x1024',
    quality: 'medium',
  });

  // Returns base64 PNG string
  return response.data[0].b64_json!;
}
```

**Style Template:** `public/template/example.png` — the reference cartoon art style image.

### Generation API Flow

```
POST /api/cartoon/generate
```

**Request:** `multipart/form-data` with `file` field (max 10MB, JPG/PNG/WebP)

**Flow:**

```
1. Authenticate user (get userId from session)
2. Deduct 10 credits (optimistic lock)
   └── If insufficient balance → return 400 { error, balance }
3. Load template from public/template/example.png
4. Convert uploaded file to Buffer
5. Call OpenAI generateCartoonImage(template, userImage)
6. Upload original → cartoon-images/originals/{userId}/{timestamp}.webp
7. Upload result → cartoon-images/results/{userId}/{timestamp}.png
8. Save to cartoon_generations (status: 'completed')
9. Return { success: true, generation, newBalance }

On ANY failure at steps 3-8:
   ├── Refund 10 credits automatically
   ├── Save to cartoon_generations (status: 'failed')
   └── Return 500 { error, refunded: true }
```

**Route config:**
```typescript
export const maxDuration = 60; // 60-second timeout for OpenAI generation
```

### History & Delete APIs

```
GET /api/cartoon/history?userId=xxx&limit=9&offset=0
→ { generations: CartoonGeneration[], total: number }

POST /api/cartoon/delete
Body: { generationId: string }
→ Deletes DB record + storage files (originals + results)
```

---

## Stripe Integration

### Setup

```typescript
// src/lib/stripe.ts
import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28',
  typescript: true,
});
```

### Credit Purchase Checkout

```
POST /api/credits/checkout
Body: { packageId: string, userId: string }
```

**Creates Stripe session with:**
```typescript
const session = await stripe.checkout.sessions.create({
  line_items: [{
    price_data: {
      currency: 'thb',
      product_data: {
        name: pkg.name,
        description: `${pkg.credits} เครดิตสำหรับสร้างรูปการ์ตูน`,
      },
      unit_amount: pkg.priceSatang,  // Price in satang (59 THB = 5900)
    },
    quantity: 1,
  }],
  mode: 'payment',
  payment_method_types: ['card', 'promptpay'],
  metadata: {
    type: 'credits',
    package_id: packageId,
    user_id: userId,
    credits: pkg.credits.toString(),
  },
  success_url: `${APP_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=credits`,
  cancel_url: `${APP_URL}/payment/cancel`,
});
```

### Webhook Handler

```
POST /api/webhook/stripe
```

**Events handled:**

| Event | Action |
|-------|--------|
| `checkout.session.completed` | If `metadata.type === 'credits'` → `addCredits()` |
| `checkout.session.async_payment_succeeded` | Same (for PromptPay delayed confirmation) |
| `checkout.session.async_payment_failed` | Log failure |

**Webhook verification:**
```typescript
const sig = request.headers.get('stripe-signature')!;
const event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
```

**Credit addition in webhook (idempotent):**
```typescript
async function handleCreditPurchase(session: Stripe.Checkout.Session) {
  const { user_id, package_id, credits } = session.metadata!;

  await addCredits(
    supabase,
    user_id,
    parseInt(credits),
    package_id,
    session.id,
    session.payment_intent as string
  );
}
```

### Payment Verification (client-side redirect)

```
POST /api/payment/verify
Body: { sessionId: string, type: 'credits' }
```

Called from `/payment/success` page after Stripe redirects back. Acts as a fallback in case the webhook hasn't fired yet.

---

## Image Upload Pipeline

```typescript
// src/lib/upload.ts

// 1. Resize image (max 1200x1200, maintains aspect ratio)
// 2. Convert to WebP (quality: 0.85)
// 3. Generate filename: {timestamp}-{random}.webp
// 4. Upload to Supabase Storage
// 5. Return public URL

async function processImage(file: File): Promise<Blob> {
  // Canvas-based resize + format conversion
  const MAX_WIDTH = 1200;
  const MAX_HEIGHT = 1200;
  const QUALITY = 0.85;
  // ...
}

async function uploadImage(file: File, bucket: string = 'images'): Promise<string> {
  const processed = await processImage(file);
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.webp`;
  const { data } = await supabase.storage
    .from(bucket)
    .upload(filename, processed, { contentType: 'image/webp' });
  return supabase.storage.from(bucket).getPublicUrl(data.path).data.publicUrl;
}
```

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
| `/api/cartoon/history?userId=xxx&limit=9&offset=0` | GET | Yes | Paginated gallery of completed generations |
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

### Auth

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/callback` | GET | OAuth callback → exchange code for session |

---

## Environment Variables

```env
# ── Supabase (shared project) ──────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# ── Stripe ──────────────────────────────────────────
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# ── OpenAI ──────────────────────────────────────────
OPENAI_API_KEY=sk-proj-xxxxx

# ── App ─────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=https://cartoon.yourdomain.com
```

> **Note:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` must be the **same values** as The Memory project to share auth & data.

---

## Project Structure

Recommended structure for the standalone cartoon product:

```
src/
├── app/
│   ├── (app)/                      # Authenticated pages (AppBar layout)
│   │   ├── layout.tsx              # AppBar wrapper
│   │   ├── dashboard/page.tsx      # Cartoon creator + gallery (main page)
│   │   ├── credits/page.tsx        # Buy credits, view balance & history
│   │   ├── profile/page.tsx        # User profile (editable)
│   │   └── onboarding/page.tsx     # New user onboarding
│   ├── api/
│   │   ├── cartoon/
│   │   │   ├── generate/route.ts   # POST: Generate cartoon (10 credits)
│   │   │   ├── history/route.ts    # GET: Paginated gallery
│   │   │   └── delete/route.ts     # POST: Delete generation
│   │   ├── credits/
│   │   │   ├── balance/route.ts    # GET: User balance
│   │   │   ├── checkout/route.ts   # POST: Stripe checkout
│   │   │   ├── packages/route.ts   # GET: Active packages
│   │   │   └── transactions/route.ts # GET: Transaction history
│   │   ├── profile/
│   │   │   ├── route.ts            # GET/POST: Profile CRUD
│   │   │   └── claim-credits/route.ts # POST: 10 free credits
│   │   ├── payment/
│   │   │   ├── verify/route.ts     # POST: Verify Stripe session
│   │   │   └── status/route.ts     # GET: Payment status
│   │   └── webhook/
│   │       └── stripe/route.ts     # POST: Stripe webhook
│   ├── auth/
│   │   └── callback/route.ts       # OAuth callback
│   ├── login/page.tsx              # Google sign-in
│   ├── payment/
│   │   ├── success/page.tsx        # Post-payment verification
│   │   └── cancel/page.tsx         # Payment cancelled
│   ├── layout.tsx                  # Root layout (fonts, providers)
│   └── globals.css                 # Tailwind + animations
├── components/
│   ├── CartoonCreator.tsx          # Upload, generate, gallery
│   ├── AppBar.tsx                  # Navigation bar with credit balance
│   ├── HeartLoader.tsx             # Loading animation
│   ├── ImageWithLoader.tsx         # Image with shimmer loading
│   ├── Toast.tsx                   # Notification component
│   └── ClientProviders.tsx         # Auth + CreditBalance + Toast providers
├── contexts/
│   ├── AuthContext.tsx             # Auth state
│   ├── CreditBalanceContext.tsx    # Global credit balance
│   └── ToastContext.tsx            # Toast notifications
├── hooks/
│   ├── useAuth.ts
│   ├── useCreditBalance.ts
│   └── useToast.ts
├── lib/
│   ├── cartoon.ts                  # Cartoon CRUD + credit deduct/refund
│   ├── credits.ts                  # Credit operations
│   ├── openai.ts                   # OpenAI GPT Image 1.5
│   ├── profile.ts                  # Profile CRUD + credit grant
│   ├── constants.ts                # CARTOON_CREDIT_COST = 10
│   ├── supabase.ts                 # Browser client
│   ├── supabase-server.ts          # Server client (service role)
│   ├── stripe.ts                   # Stripe instance
│   └── upload.ts                   # Image processing & upload
├── types/
│   ├── cartoon.ts
│   ├── credits.ts
│   ├── profile.ts
│   └── database.ts                 # Supabase generated types
└── public/
    └── template/
        └── example.png             # Cartoon style template
```

---

## Migration Checklist

### Database (shared Supabase — tables already exist)

- [ ] Verify `credit_packages` has seed data
- [ ] Verify `user_credits` table, trigger, and RLS policies
- [ ] Verify `credit_transactions` table, indexes, and RLS policies
- [ ] Verify `user_profiles` table, trigger, and RLS policies
- [ ] Verify `cartoon_generations` table, indexes, and RLS policies
- [ ] Verify `cartoon-images` storage bucket exists with correct policies

### Stripe

- [ ] Set up Stripe account (or reuse existing)
- [ ] Create webhook endpoint pointing to new app's `/api/webhook/stripe`
- [ ] Subscribe to events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`
- [ ] If using referral discounts, create coupon `REFERRAL_50_THB` (amount_off: 5000, currency: thb, duration: once)

### Supabase Auth

- [ ] Add new app's domain to Supabase Auth → URL Configuration → Redirect URLs
- [ ] Ensure Google OAuth provider is configured in Supabase Auth → Providers
- [ ] Update `NEXT_PUBLIC_APP_URL` to the new domain

### OpenAI

- [ ] Set up OpenAI API key with access to `gpt-image-1.5`
- [ ] Copy `public/template/example.png` to the new project

### Vercel Deployment

- [ ] Create new Vercel project
- [ ] Set all environment variables
- [ ] Configure custom domain
- [ ] Set function timeout to 60s for `/api/cartoon/generate`

### Code

- [ ] Copy all files from the project structure above
- [ ] Remove memory-specific code from webhook handler (keep only `type === 'credits'` handling)
- [ ] Remove `memory_id` references from credit transactions (or keep nullable)
- [ ] Update `NEXT_PUBLIC_APP_URL` in success/cancel URLs
- [ ] Generate fresh `database.ts` types from Supabase: `npx supabase gen types typescript`

### Cross-Product Considerations

- [ ] Credits purchased in either product are available in both (shared `user_credits` table)
- [ ] Profile completed in either product grants credits once (idempotent via `profile_credits_claimed` flag)
- [ ] Users see the same credit balance across both products
- [ ] Transaction history shows all transactions from both products

---

## Tech Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.x |
| Language | TypeScript (strict) | 5.x |
| Runtime | React | 19.x |
| Styling | Tailwind CSS | 4.x |
| Database | Supabase (PostgreSQL + RLS) | — |
| Auth | Supabase Auth (Google OAuth) | — |
| Payments | Stripe (Card + PromptPay) | API 2026-01-28 |
| AI | OpenAI GPT Image 1.5 | — |
| Storage | Supabase Storage (WebP) | — |
| Icons | Lucide React | 0.563.0 |
| Hosting | Vercel | — |
| Fonts | Kanit, Itim, Leckerli One | Google Fonts |
