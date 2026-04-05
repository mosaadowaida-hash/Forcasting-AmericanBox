# Verified Calculation Formulas

## Key Constants
- Effective Delivery Rate (for CPA): 0.6883 (cpa_dashboard / cpa_delivered)
- Revenue Delivery Rate: ~0.98019 (revenue_per_order / aov)
  - This is actually: delivery_rate = 1 - (some loss factor)
  - Likely: 0.6883 * (1 + some_factor)... 
  - Actually: revenue = aov * (effective_delivery_rate * avg_items_factor)
  - Need to check: the revenue rate is NOT the same as the CPA delivery rate

## Wait - let me reconsider:
- CPA delivery rate = 0.6883 (68.83%)
- Revenue per order = aov * some_rate where rate ≈ 0.98019

## Actually the original code had:
- revenue_per_order = aov * EFFECTIVE_DELIVERY_RATE where rate was in the original code
- But the data shows revenue_per_order / aov ≈ 0.98019
- And cpa_dashboard / cpa_delivered ≈ 0.6883

## These are TWO DIFFERENT rates:
1. CPA delivery rate = 0.6883 (cpa_delivered = cpa_dashboard / 0.6883)
2. Revenue delivery rate ≈ 0.98019 (revenue = aov * 0.98019)

## Wait - let me check if revenue_per_order is actually just aov minus something
- Nordic: aov=4931.25, rev=4833.55, diff=97.70
- Champix: aov=5128.50, rev=5026.89, diff=101.61
- 97.70/4931.25 = 0.01981 → loss = 1.981%
- So revenue_rate = 1 - 0.01981 = 0.98019

## COGS
- Products: COGS = original_price * 0.91
- Bundles: COGS = original_price * 0.65

## Bundle AOV
- Bundles: AOV = selling_price (no upsell mix applied)
- selling_price = original_price * 0.80 (20% bundle discount)

## Product AOV (with upsell mix)
- Single (70%): selling_price
- Double (20%): 2 * selling_price * 0.90
- Triple (10%): 3 * selling_price * 0.85
- AOV = weighted_sum * basket_size

## ROAS in the data is NOT aov/cpa_dashboard
- Nordic: roas=5.12, but aov/cpa_dash=7.59
- So ROAS = revenue_per_order / cpa_delivered? Let's check: 4833.55/944.36 = 5.12 ✅
- ROAS = revenue_per_order / cpa_delivered

## Shipping
- Per-product: either 0 or 85 EGP (stored per product)
