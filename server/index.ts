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

// CPM, CTR, CVR, Basket Size levels
const CPM_LEVELS = [0.5, 1.0, 1.5];
const CPM_LABELS = ["Low", "Medium", "High"];
const CTR_LEVELS = [0.01, 0.0125, 0.015, 0.0175];
const CTR_LABELS = ["1%", "1.25%", "1.5%", "1.75%"];
const CVR_LEVELS = [0.005, 0.01, 0.015];
const CVR_LABELS = ["0.5%", "1%", "1.5%"];
const BASKET_LEVELS = [1.0, 1.1, 1.2, 1.3];
const BASKET_LABELS = ["1.0x", "1.1x", "1.2x", "1.3x"];

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
}

function calculateScenario(input: ScenarioInput): any {
  const { cpm, cpm_label, ctr, ctr_label, cvr, cvr_label, basket_size, basket_label, original_price } = input;

  // Calculate AOV (Average Order Value)
  const aov = original_price * basket_size;

  // Calculate Revenue per order (after confirmation and delivery)
  const revenue_per_order = aov * CONFIRMATION_RATE * DELIVERY_RATE;

  // Calculate CPA
  const cpa_dashboard = cpm / (ctr * cvr * 1000);
  const cpa_delivered = cpa_dashboard / (CONFIRMATION_RATE * DELIVERY_RATE);

  // Calculate COGS
  const cogs_per_order = original_price * COGS_PERCENTAGE;

  // Calculate Net Profit
  const net_profit_per_order = revenue_per_order - cpa_delivered - cogs_per_order - SHIPPING_COST;

  // Calculate ROAS
  const roas = revenue_per_order / cpa_delivered;

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

function generateScenarios(originalPrice: number): any[] {
  const scenarios: any[] = [];

  for (let i = 0; i < CPM_LEVELS.length; i++) {
    for (let j = 0; j < CTR_LEVELS.length; j++) {
      for (let k = 0; k < CVR_LEVELS.length; k++) {
        for (let l = 0; l < BASKET_LEVELS.length; l++) {
          const scenario = calculateScenario({
            cpm: CPM_LEVELS[i],
            cpm_label: CPM_LABELS[i],
            ctr: CTR_LEVELS[j],
            ctr_label: CTR_LABELS[j],
            cvr: CVR_LEVELS[k],
            cvr_label: CVR_LABELS[k],
            basket_size: BASKET_LEVELS[l],
            basket_label: BASKET_LABELS[l],
            original_price: originalPrice,
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
      const scenarios = generateScenarios(original_price);

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

      const { data: scenarios, error } = await supabase
        .from("scenarios")
        .select("*")
        .eq("product_id", id);

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
