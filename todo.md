# Project TODO

## Phase 1: Fix Calculation Engine (144 scenarios)
- [x] Reverse-engineer original formulas from 6,048 JSON scenarios
- [x] Verify AOV_RATIO = 1.296, DELIVERY_RATE = 0.885, CPA_DELIVERY_FACTOR = 1.13
- [x] Verify ACTUAL_MARGIN = 31.5%, SHIPPING_COST = 100 for products ≤ 2600
- [x] Fix calculation engine to match original data (profit = price × 0.315 - CPA - shipping)
- [x] Verify engine against all 42 products (99.5%+ accuracy, ±1 rounding only)

## Phase 2: Migrate Data to MySQL
- [x] Create Drizzle schema (products + scenarios tables with all 24 fields)
- [x] Run Drizzle migration to create MySQL tables
- [x] Import 42 products from original JSON directly into MySQL
- [x] Import 6,048 scenarios from original JSON directly into MySQL (no recalculation)
- [x] Verify MySQL data matches original JSON 100%

## Phase 3: Build tRPC API (Full-Stack)
- [x] Create products router with all CRUD operations
- [x] list: Get all products
- [x] getById: Get product by ID
- [x] getScenarios: Get 144 scenarios for a product
- [x] getAllScenarios: Get all 6,048 scenarios
- [x] getOverviewStats: Aggregate stats across all products
- [x] getRanking: Ranking data for all products
- [x] create: Add new product + auto-calculate 144 scenarios
- [x] update: Edit product + recalculate 144 scenarios
- [x] delete: Remove product + its scenarios

## Phase 4: Rebuild All Pages
- [x] Dashboard (المحاكي): Product selector, scenario table, charts, filters, CRUD buttons
- [x] Overview (نظرة عامة): Stats cards, product comparison table, charts
- [x] Ranking (ترتيب المنتجات): Sorted product list with profitability metrics
- [x] Analysis (تحليل المنتج): Detailed product analysis with all scenario breakdowns
- [x] AdvancedFilter (تصفية متقدمة): Multi-filter (CPM/CTR/CVR/Basket/Status/Profit/ROAS)
- [x] AppLayout: Top navigation bar with all page links
- [x] Home: Redirect to Dashboard

## Phase 5: CRUD Operations
- [x] Add Product: Form with name, type, price, discounts → saves to MySQL + calculates 144 scenarios
- [x] Edit Product: Pre-filled form → updates MySQL + recalculates 144 scenarios
- [x] Delete Product: Confirmation dialog → removes product + scenarios from MySQL
- [x] Tested: Add (42→43), Edit (price change recalculates), Delete (43→42)

## Phase 6: Testing
- [x] 8/8 vitest tests passing
- [x] Test: list 42 products from MySQL
- [x] Test: 6048 total scenarios
- [x] Test: 144 scenarios per product
- [x] Test: correct CPM/CTR/CVR/Basket combinations
- [x] Test: correct scenario fields with proper values
- [x] Test: add new product with 144 calculated scenarios
- [x] Test: update product and recalculate scenarios
- [x] Test: auth.logout

## Phase 7: Cleanup
- [x] Remove old Supabase references
- [x] Remove old unused pages (ComprehensiveDashboard, DynamicProducts, WorkingDashboard, SupabaseDashboard)
- [x] Remove old unused hooks and services
- [x] 0 TypeScript errors, 0 LSP errors

## Phase 8: Authentication System (Login/Signup + Admin Panel)

### DB Schema Updates
- [x] Add status field to users table (pending/active/suspended)
- [x] Add passwordHash field to users table
- [x] Add activatedAt and suspendedAt timestamp fields to users table
- [x] Add userId foreign key to products table (multi-tenant isolation)
- [x] Run migration SQL to update existing tables

### Backend Auth Procedures
- [x] auth.signup: Create account with email/password (status=pending)
- [x] auth.login: Email/password login with status check (pending/suspended rejection)
- [x] auth.me: Return current user info
- [x] auth.logout: Clear session cookie
- [x] auth.changePassword: Change own password (authenticated)
- [x] Add bcrypt password hashing utility

### Backend Admin Procedures
- [x] admin.listUsers: List all users with status/dates
- [x] admin.approveUser: Set status=active + activatedAt
- [x] admin.rejectUser: Delete pending user
- [x] admin.suspendUser: Set status=suspended + suspendedAt
- [x] admin.reactivateUser: Set status=active, clear suspendedAt
- [x] admin.updateUser: Update name/email/password for any user
- [x] admin.deleteUser: Delete user + their products/scenarios
- [x] admin.listAllProducts: List products for all users with owner info
- [x] admin.deleteProduct: Delete any product (admin only)
- [x] admin.getStats: Dashboard stats (total users/products/scenarios)

### Multi-tenant Product Isolation
- [x] Update products.list to filter by current user (userId)
- [x] Update products.create to attach userId to new products
- [x] Update products.getScenarios to verify product ownership
- [x] Update products.update to verify product ownership
- [x] Update products.delete to verify product ownership
- [x] Update products.getOverviewStats to filter by userId
- [x] Update products.getRanking to filter by userId
- [x] Update products.getAllScenarios to filter by userId

### Frontend Pages
- [x] Create /login page (email + password form)
- [x] Create /signup page (name + email + password form with pending notice)
- [x] Create /pending page (waiting for admin approval message)
- [x] Create /admin route (admin-only panel)
- [x] Admin: Users management tab (list, approve, reject, suspend, reactivate, edit, delete)
- [x] Admin: Products management tab (view all users' products, delete)
- [x] Admin: Stats cards (total users/pending/active/products)
- [x] Update AppLayout to show user info + logout button + admin link
- [x] Add route guards: redirect unauthenticated to /login
- [x] Add route guard: redirect pending/suspended users to /pending
- [x] Add admin route guard: redirect non-admins to /dashboard

### Default Accounts Setup
- [x] Create admin account (marketer.a.mosaad@gmail.com / Generate5598@Go)
- [x] Create American Box account (americanbox149@gmail.com / Amrcnbxquiz26)
- [x] Migrate existing 42 products to American Box account (userId assignment)

### Testing
- [x] 27/27 vitest tests passing
- [x] Test: auth system password hashing/verification
- [x] Test: user status logic (pending/active/suspended)
- [x] Test: role logic (admin/user)
- [x] Test: getUserByEmail mock
- [x] Test: admin user management logic
- [x] Test: multi-tenant data isolation
- [x] Test: products list with user context (42 products for American Box)
- [x] Test: unauthenticated access rejection
- [x] Test: admin sees only their own products (0 for admin user)

## Phase 9: Landing Page + Remove Manus Branding
- [x] Remove "Made by Manus" / Manus branding from all pages (Login, Signup, Pending, App)
- [x] Build external Conversion Landing Page at /
- [x] Landing Page: Hero section with strong headline + subheadline (Performance Marketing copy)
- [x] Landing Page: Features/benefits section (3-4 value propositions)
- [x] Landing Page: Social proof / stats section
- [x] Landing Page: CTA buttons (Login + Sign Up)
- [x] Landing Page: Professional design with dark/gradient theme
- [x] Update routing so / shows Landing Page, /dashboard redirects to login if unauthenticated

## Phase 10: Payment System + AOV Fix + Landing Page Updates
- [x] DB: Add payment_method, payment_proof_image, payment_status columns to users table
- [x] Backend: Add file upload endpoint for payment proof images (S3)
- [x] Backend: Add payment submission procedure (instapay/paypal)
- [x] Backend: Add admin procedures: verifyPayment, rejectPayment
- [x] Backend: Add admin impersonation procedure (get user session token)
- [x] Frontend: Update Signup to multi-step flow with payment step (InstaPay + PayPal)
- [x] Frontend: InstaPay step - show phone number + image upload for proof
- [x] Frontend: PayPal step - embed PayPal hosted button
- [x] Frontend: Pending page - show "قيد المراجعة" badge with payment status
- [x] Frontend: Admin Panel - show payment proof image, payment method, payment status per user
- [x] Frontend: Admin Panel - add Verify Payment / Reject Payment buttons
- [x] Frontend: Admin Panel - add Impersonation button (view as user)
- [x] Fix AOV formula: AOV = price × basket_size (no inflation)
- [x] Landing Page: Update all copy texts as specified
- [x] Landing Page: Replace static testimonial with animated slider
- [x] Landing Page: Add pricing section ($34/month)
- [x] Landing Page: Update domain URL to adsforcasting.pro/dashboard
- [x] Rename brand from CampaignSim to Ads Forecasting Pro everywhere

## Phase 11: Subscription System + Auth Fix + UI Fixes

### Bug Fix: Logout Redirect to Manus Auth
- [x] Remove Manus OAuth logout redirect from AppLayout/auth system
- [x] Ensure logout clears session cookie and redirects to /login (internal only)
- [x] Remove any external auth provider references from logout flow

### DB: Payments Table + Subscription Fields
- [x] Create separate `payments` table (id, userId, paymentMethod, proofImageUrl, paymentDate, paymentStatus, createdAt)
- [x] Add `subscriptionExpiresAt` field to users table
- [x] Add `subscriptionStatus` field to users table (active/expired/pending)
- [x] Run migration SQL

### Backend: Subscription System
- [x] auth.submitPayment: save to payments table (not users table directly)
- [x] admin.listPayments: list all payments for a user (payment history)
- [x] admin.verifyPayment: approve payment → set subscriptionExpiresAt = now + 30 days, status=active
- [x] admin.rejectPayment: reject payment → keep status=pending
- [x] Cron/check logic: auto-suspend users with subscriptionExpiresAt < now
- [x] auth.me: include subscriptionExpiresAt and daysRemaining in response
- [x] Login: check subscription expiry, block expired users with renewal prompt

### Frontend: Admin Panel Updates
- [x] Admin: show full payment history per user (all payments table)
- [x] Admin: payment proof image opens in full-size modal on click
- [x] Admin: show subscription expiry date per user
- [x] Admin: verify/reject each payment individually

### Frontend: Expired Subscription Page
- [x] Create /renew page for expired users (PayPal button + InstaPay upload)
- [x] Show "اشتراكك انتهى" message with renewal options
- [x] Route guard: redirect expired users to /renew instead of /dashboard

### Frontend: Warning Banner (28 days)
- [x] Show warning banner in dashboard when subscription expires in ≤ 2 days

### Landing Page Fixes
- [x] Change price from $34 to $29/month everywhere
- [x] Change "ابدأ مجاناً" button to "ابدأ الآن باشتراك 29$"
- [x] Update stats section text as requested
- [x] Fix Login page brand name to "Ads Forecasting Pro"
