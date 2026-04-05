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
