# Calculation Formulas (Reverse-Engineered from Original Data)

## Key Constants
- Delivery Rate: 0.9801875792 (NOT 0.6883 as previously assumed!)
  - Calculated: revenue_per_order / aov = 4833.55 / 4931.25 = 0.98019
  - Wait - let me recalculate. Actually this is the delivered revenue rate
  
## Actually: Let me re-examine
- Nordic DHA: original_price=3750, selling_price=3750
- AOV (basket=1) = 4931.25
- AOV formula: 0.7*3750 + 0.2*(2*3750*0.9) + 0.1*(3*3750*0.85) = 2625 + 1350 + 956.25 = 4931.25 ✅
- revenue_per_order = 4833.55
- delivery_rate = 4833.55 / 4931.25 = 0.98019 ← This is NOT the 68.83% delivery rate
- COGS = 3412.5 = 3750 * 0.91 (NOT 65% of original price!)
- COGS for basket=1.3: 4436.25 = 3750 * 0.91 * 1.3 = 4436.25 ✅

## Wait - COGS is 91% of selling_price? That seems high.
- Actually COGS = original_price * 0.91 for products
- For bundles: COGS = original_price * 0.65

## Shipping
- Some products: 0 (free shipping)
- Some products: 85 EGP
- All bundles: 0 (free shipping)

## Bundle AOV
- Bundles: AOV = selling_price (no upsell mix, just the bundle price)
- Bundle discount: 20% off original_price
- Bundle COGS: original_price * 0.65

## Product AOV (with upsell mix)
- Single (70%): selling_price
- Double (20%): 2 * selling_price * 0.9
- Triple (10%): 3 * selling_price * 0.85
- AOV = weighted sum * basket_size

## Revenue per order
- revenue_per_order = aov * delivery_rate
- delivery_rate ≈ 0.98019 (need to verify)

## Net Profit
- net_profit = revenue_per_order - cogs - shipping - cpa_delivered

## Break Even CPA (max_cpa_allowed = gross_profit)
- gross_profit = revenue_per_order - cogs - shipping
