# Gap Analysis: Original vs Current Implementation

## Original (Correct) Implementation
- **42 products**, **6,048 scenarios** (144 per product)
- **144 = 3 CPM × 4 CTR × 3 CVR × 4 Basket**
  - CPM: [32.5, 47.5, 70]
  - CTR: [0.01, 0.0125, 0.015, 0.0175]
  - CVR: [0.005, 0.01, 0.015]
  - Basket: [1.0, 1.1, 1.2, 1.3]

## Original Calculation Formulas (from scenarioCalculations.ts)
- COGS_PERCENTAGE = 0.65 (65% of original price)
- SHIPPING_COST = 30 EGP
- EFFECTIVE_DELIVERY_RATE = 0.6883 (68.83%)
- EFFECTIVE_CONFIRMATION_RATE = 0.7690 (76.90%)
- AOV = weighted upsell mix (70% single + 20% double@-10% + 10% triple@-15%)
- revenue_per_order = AOV * EFFECTIVE_DELIVERY_RATE
- CPA_Dashboard = CPM / (CTR * 1000) / CVR  (i.e. CPC / CVR)
- CPA_Delivered = CPA_Dashboard / EFFECTIVE_DELIVERY_RATE
- Net Profit = revenue_per_order - COGS - SHIPPING - ad_cost_per_order
- ROAS = revenue_per_order / ad_cost_per_order

## Original Scenario Fields
item_name, item_type, selling_price, base_margin, actual_margin,
cpm, ctr, cvr, basket_multiplier, cpc,
cpa_dashboard, cpa_delivered, aov, revenue_per_order,
roas, delivered_roas, profit_per_order, profit_margin,
max_cpa_allowed, break_even_cpa, status,
cpm_scenario, ctr_scenario, cvr_scenario, basket_scenario

## Current (Broken) Implementation
- **42 products**, **26,250 scenarios** (625 per product)
- **625 = 5 CPM × 5 CTR × 5 CVR × 5 Basket** (WRONG!)
  - CPM: [50, 60, 70, 80, 90] (WRONG)
  - CTR: [0.015, 0.0175, 0.02, 0.0225, 0.025] (WRONG)
  - CVR: [0.01, 0.015, 0.02, 0.025, 0.03] (WRONG)
  - Basket: [1, 1.2, 1.4, 1.6, 1.8] (WRONG)

## Current (Broken) Calculation Formulas
- AOV = original_price * basket (WRONG - should use upsell mix)
- revenue_per_order = AOV (WRONG - should multiply by delivery rate)
- CPA_Delivered = CPA_Dashboard * 1.15 (WRONG - should use delivery rate)
- COGS = original_price * 0.3 (WRONG - should be 0.65)
- No shipping cost (WRONG)
- No status field (WRONG)

## Missing Pages
All old pages (Overview, Ranking, Analysis, AdvancedFilter) still exist but use
`useAllProducts` hook which reads from static JSON + localStorage.
They need to be converted to use tRPC/Supabase.

## Missing Features
1. Edit product button doesn't work (no edit form/mutation wired)
2. Add product button doesn't work (tRPC mutation exists but UI may be broken)
3. No sidebar navigation
4. No product management (edit/delete) in the dashboard

## Action Plan
1. Fix the calculation engine to match original 144 scenarios (3×4×3×4)
2. Re-migrate 42 products with correct scenarios to Supabase
3. Add missing fields to scenarios table (status, cpc, delivered_roas, etc.)
4. Rewrite all pages to use tRPC instead of useAllProducts/localStorage
5. Wire up add/edit/delete with proper tRPC mutations
6. Add sidebar navigation with all pages
