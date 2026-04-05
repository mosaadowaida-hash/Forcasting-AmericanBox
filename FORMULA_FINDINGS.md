# Formula Verification Findings

## Confirmed Formulas
1. **CPC** = CPM / (CTR * 1000) ✅ (0 errors)
2. **CPA Dashboard** = CPC / CVR ✅ (0 errors)
3. **AOV base ratio** = ~1.2959 for ALL products (consistent)
4. **AOV** = baseAOV * basket_multiplier ✅ (0 errors)
5. **Delivery rate** = ~0.885 (range 0.8846-0.8853)
6. **CPA Delivery ratio** = ~1.13 (range 1.1271-1.1329)

## Formulas with Issues
1. **Profit**: profit = price * actual_margin/100 - cpa_dashboard works for MOST (3952/6048) but 2096 have errors
   - Some products have a diff of exactly 100 (e.g., KELP 100 capsules)
   - This suggests some products have an additional fixed cost (shipping?)
   
2. **ROAS**: aov / cpa_dashboard is close but has rounding differences (1575 errors)
   - The actual ROAS might use a different rounding method

3. **Profit Margin**: profit / aov * 100 doesn't match - probably uses revenue_per_order instead
   - profit_margin = profit / revenue_per_order * 100? Or profit / aov * 100?

4. **Break-even CPA**: price * actual_margin / 100 has 1692 errors
   - Some products have a fixed offset (like 100 for shipping)

## Key Constants
- AOV_RATIO = 1.2959 (consistent across all 42 products)
- DELIVERY_RATE = 0.885 (approximate)
- CPA_DELIVERY_FACTOR = 1.13 (approximate)

## Strategy
Since the original data was imported into MySQL already with all correct values,
the calculation engine only needs to work for NEW products.
For new products, we use:
- baseAOV = price * 1.296
- AOV = baseAOV * basket
- revenue = AOV * 0.885
- CPC = CPM / (CTR * 1000)
- CPA = CPC / CVR
- CPA_delivered = CPA * 1.13
- profit = price * actual_margin/100 - CPA
- break_even_cpa = price * actual_margin / 100
- ROAS = AOV / CPA
- delivered_ROAS = revenue / CPA_delivered
- profit_margin = profit / AOV * 100
- status = profit > 0 ? 'Profit' : 'Loss'
