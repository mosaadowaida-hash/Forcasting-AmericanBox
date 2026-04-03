import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase client
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_FRONTEND_FORGE_API_URL || "https://hremfdzcaysddoymvwgp.supabase.co";
const supabaseKey = process.env.VITE_FRONTEND_FORGE_API_KEY || "sb_publishable_fvRitwIcZcDkgPNsiNU4gw_ZeoV7ATE";

const supabase = createClient(supabaseUrl, supabaseKey);

// Constants for calculations
const CONFIRMATION_RATE = 0.769; // 76.90%
const DELIVERY_RATE = 0.6883; // 68.83%
const COGS_PERCENTAGE = 0.65; // 65%
const SHIPPING_COST = 30; // 30 ج.م

// Upsell Mix: 70% single, 20% double (-10%), 10% triple (-15%)
const UPSELL_MIX = {
  single: { percentage: 0.70, discount: 0 },
  double: { percentage: 0.20, discount: 0.10 },
  triple: { percentage: 0.10, discount: 0.15 },
};

// CPM, CTR, CVR, Basket Size levels
const CPM_LEVELS = [
  { value: 32.5, label: "Low (32.5)" },
  { value: 47.5, label: "Medium (47.5)" },
  { value: 70, label: "High (70)" },
];
const CTR_LEVELS = [
  { value: 0.01, label: "1%" },
  { value: 0.0125, label: "1.25%" },
  { value: 0.015, label: "1.5%" },
  { value: 0.0175, label: "1.75%" },
];
const CVR_LEVELS = [
  { value: 0.005, label: "0.5%" },
  { value: 0.01, label: "1%" },
  { value: 0.015, label: "1.5%" },
];
const BASKET_LEVELS = [
  { value: 1.0, label: "1.0x" },
  { value: 1.1, label: "1.1x" },
  { value: 1.2, label: "1.2x" },
  { value: 1.3, label: "1.3x" },
];

interface ScenarioInput {
  cpm: number;
  cpm_label: string;
  ctr: number;
  ctr_label: string;
  cvr: number;
  cvr_label: string;
  basket_size: number;
  basket_label: string;
  original_price: number;
  type: "product" | "bundle";
  discount_two_items?: number;
  discount_three_items?: number;
  bundle_discount?: number;
}

function calculateAOV(
  originalPrice: number,
  type: "product" | "bundle",
  discountTwoItems?: number,
  discountThreeItems?: number,
  bundleDiscount?: number
): number {
  let basePrice = originalPrice;

  // Apply bundle discount if it's a bundle
  if (type === "bundle" && bundleDiscount) {
    basePrice = originalPrice * (1 - bundleDiscount / 100);
  }

  // Calculate AOV with upsell mix
  const singlePrice = basePrice;
  const doublePrice = basePrice * 2 * (1 - (discountTwoItems || 0) / 100);
  const triplePrice = basePrice * 3 * (1 - (discountThreeItems || 0) / 100);

  const aov =
    singlePrice * UPSELL_MIX.single.percentage +
    doublePrice * UPSELL_MIX.double.percentage +
    triplePrice * UPSELL_MIX.triple.percentage;

  return aov;
}

function calculateScenario(input: ScenarioInput): any {
  const { cpm, cpm_label, ctr, ctr_label, cvr, cvr_label, basket_size, basket_label, original_price, type, discount_two_items, discount_three_items, bundle_discount } = input;

  // Calculate AOV (Average Order Value)
  const aov = calculateAOV(original_price, type, discount_two_items, discount_three_items, bundle_discount);

  // Revenue per delivered order = AOV * Delivery Rate
  const revenue_per_order = aov * DELIVERY_RATE;

  // Ad cost per order = (CPM * CTR * CVR) / 10000
  const ad_cost_per_order = (cpm * ctr * cvr) / 10000;

  // CPA Dashboard (cost per action on dashboard)
  const cpa_dashboard = cpm / (ctr * cvr * 1000);

  // CPA Delivered (cost per actual delivered order)
  const cpa_delivered = ad_cost_per_order / (ctr * cvr * DELIVERY_RATE);

  // COGS
  const cogs_per_order = original_price * COGS_PERCENTAGE;

  // Net Profit = Revenue - COGS - Shipping - Ad Cost
  const net_profit_per_order = revenue_per_order - cogs_per_order - SHIPPING_COST - ad_cost_per_order;

  // ROAS (Return on Ad Spend)
  const roas = ad_cost_per_order > 0 ? revenue_per_order / ad_cost_per_order : 0;

  return {
    cpm,
    cpm_label,
    ctr,
    ctr_label,
    cvr,
    cvr_label,
    basket_size,
    basket_label,
    aov: Math.round(aov * 100) / 100,
    revenue_per_order: Math.round(revenue_per_order * 100) / 100,
    cpa_dashboard: Math.round(cpa_dashboard * 100) / 100,
    cpa_delivered: Math.round(cpa_delivered * 100) / 100,
    cogs: Math.round(cogs_per_order * 100) / 100,
    net_profit_per_order: Math.round(net_profit_per_order * 100) / 100,
    roas: Math.round(roas * 100) / 100,
  };
}

function generateScenarios(
  originalPrice: number,
  type: "product" | "bundle",
  discountTwoItems?: number,
  discountThreeItems?: number,
  bundleDiscount?: number
): any[] {
  const scenarios: any[] = [];

  for (const cpmLevel of CPM_LEVELS) {
    for (const ctrLevel of CTR_LEVELS) {
      for (const cvrLevel of CVR_LEVELS) {
        for (const basketSize of BASKET_LEVELS) {
          const scenario = calculateScenario({
            cpm: cpmLevel.value,
            cpm_label: cpmLevel.label,
            ctr: ctrLevel.value,
            ctr_label: ctrLevel.label,
            cvr: cvrLevel.value,
            cvr_label: cvrLevel.label,
            basket_size: basketSize.value,
            basket_label: basketSize.label,
            original_price: originalPrice,
            type,
            discount_two_items: discountTwoItems,
            discount_three_items: discountThreeItems,
            bundle_discount: bundleDiscount,
          });
          scenarios.push(scenario);
        }
      }
    }
  }

  return scenarios;
}

async function startServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // API Routes
  app.post("/api/products", async (req, res) => {
    try {
      const { name, type, original_price, discount_two_items, discount_three_items, bundle_discount } = req.body;

      // Validate input
      if (!name || !type || !original_price) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Insert product into Supabase
      const { data: product, error: productError } = await supabase
        .from("products")
        .insert([
          {
            name,
            type,
            original_price,
            discount_two_items: type === "product" ? discount_two_items : null,
            discount_three_items: type === "product" ? discount_three_items : null,
            bundle_discount: type === "bundle" ? bundle_discount : null,
          },
        ])
        .select()
        .single();

      if (productError) {
        console.error("Product insert error:", productError);
        return res.status(500).json({ message: "Failed to insert product" });
      }

      // Generate 144 scenarios
      const scenarios = generateScenarios(original_price, type, discount_two_items, discount_three_items, bundle_discount);

      // Insert scenarios into Supabase
      const scenariosWithProductId = scenarios.map((s) => ({
        ...s,
        product_id: product.id,
      }));

      const { error: scenariosError } = await supabase.from("scenarios").insert(scenariosWithProductId);

      if (scenariosError) {
        console.error("Scenarios insert error:", scenariosError);
        return res.status(500).json({ message: "Failed to insert scenarios" });
      }

      res.json({ success: true, product, scenarios_count: scenarios.length });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update product
  app.put("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { name, original_price, discount_two_items, discount_three_items, bundle_discount, type } = req.body;

      // Update product
      const { data: product, error: updateError } = await supabase
        .from("products")
        .update({
          name,
          original_price,
          discount_two_items: type === "product" ? discount_two_items : null,
          discount_three_items: type === "product" ? discount_three_items : null,
          bundle_discount: type === "bundle" ? bundle_discount : null,
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        return res.status(500).json({ message: "Failed to update product" });
      }

      // Delete old scenarios
      await supabase.from("scenarios").delete().eq("product_id", id);

      // Generate new scenarios
      const scenarios = generateScenarios(original_price, type, discount_two_items, discount_three_items, bundle_discount);

      // Insert new scenarios
      const scenariosWithProductId = scenarios.map((s) => ({
        ...s,
        product_id: id,
      }));

      await supabase.from("scenarios").insert(scenariosWithProductId);

      res.json({ success: true, product });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete product
  app.delete("/api/products/:id", async (req, res) => {
    try {
      const { id } = req.params;

      // Delete scenarios first (due to foreign key)
      await supabase.from("scenarios").delete().eq("product_id", id);

      // Delete product
      const { error: deleteError } = await supabase.from("products").delete().eq("id", id);

      if (deleteError) {
        return res.status(500).json({ message: "Failed to delete product" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/products", async (req, res) => {
    try {
      const { data: products, error } = await supabase.from("products").select("*");

      if (error) {
        return res.status(500).json({ message: "Failed to fetch products" });
      }

      res.json(products);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/products/:id/scenarios", async (req, res) => {
    try {
      const { id } = req.params;

      const { data: scenarios, error } = await supabase.from("scenarios").select("*").eq("product_id", id);

      if (error) {
        return res.status(500).json({ message: "Failed to fetch scenarios" });
      }

      res.json(scenarios);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  const server = createServer(app);

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
