import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductScenarios,
  createScenarios,
  deleteProductScenarios,
  getAllScenarios,
} from "../supabase";
import { v4 as uuidv4 } from "uuid";

// Scenario calculation engine
function calculateScenarios(product: any): any[] {
  const scenarios = [];
  const cpmValues = [50, 60, 70, 80, 90];
  const ctrValues = [0.015, 0.0175, 0.02, 0.0225, 0.025];
  const cvrValues = [0.01, 0.015, 0.02, 0.025, 0.03];
  const basketSizes = [1, 1.2, 1.4, 1.6, 1.8];

  const cpmLabels = ["Low CPM (50 EGP)", "Medium CPM (60 EGP)", "High CPM (70 EGP)", "Very High CPM (80 EGP)", "Premium CPM (90 EGP)"];
  const ctrLabels = ["Poor CTR (1.5%)", "Fair CTR (1.75%)", "Good CTR (2%)", "Excellent CTR (2.25%)", "Outstanding CTR (2.5%)"];
  const cvrLabels = ["Poor CVR (1%)", "Fair CVR (1.5%)", "Good CVR (2%)", "Excellent CVR (2.5%)", "Outstanding CVR (3%)"];
  const basketLabels = ["Poor Basket (1.0)", "Fair Basket (1.2)", "Good Basket (1.4)", "Excellent Basket (1.6)", "Outstanding Basket (1.8)"];

  for (let i = 0; i < cpmValues.length; i++) {
    for (let j = 0; j < ctrValues.length; j++) {
      for (let k = 0; k < cvrValues.length; k++) {
        for (let l = 0; l < basketSizes.length; l++) {
          const cpm = cpmValues[i];
          const ctr = ctrValues[j];
          const cvr = cvrValues[k];
          const basketSize = basketSizes[l];

          const aov = product.original_price * basketSize;
          const revenuePerOrder = aov;
          const cpaDashboard = cpm / (ctr * cvr * 1000);
          const cpaDelivered = cpaDashboard * 1.15;
          const cogs = product.original_price * 0.3;
          const netProfitPerOrder = revenuePerOrder - cpaDelivered - cogs;
          const roas = revenuePerOrder / cpaDashboard;

          scenarios.push({
            id: uuidv4(),
            product_id: product.id,
            cpm,
            cpm_label: cpmLabels[i],
            ctr: ctr * 100,
            ctr_label: ctrLabels[j],
            cvr: cvr * 100,
            cvr_label: cvrLabels[k],
            basket_size: basketSize,
            basket_label: basketLabels[l],
            aov: Math.round(aov * 100) / 100,
            revenue_per_order: Math.round(revenuePerOrder * 100) / 100,
            cpa_dashboard: Math.round(cpaDashboard * 100) / 100,
            cpa_delivered: Math.round(cpaDelivered * 100) / 100,
            cogs: Math.round(cogs * 100) / 100,
            net_profit_per_order: Math.round(netProfitPerOrder * 100) / 100,
            roas: Math.round(roas * 100) / 100,
          });
        }
      }
    }
  }

  return scenarios;
}

export const productsRouter = router({
  // Get all products
  list: publicProcedure.query(async () => {
    return await getAllProducts();
  }),

  // Get product by ID
  getById: publicProcedure.input(z.string()).query(async ({ input }) => {
    return await getProductById(input);
  }),

  // Get all scenarios for a product
  getScenarios: publicProcedure.input(z.string()).query(async ({ input }) => {
    return await getProductScenarios(input);
  }),

  // Get all scenarios across all products
  getAllScenarios: publicProcedure.query(async () => {
    return await getAllScenarios();
  }),

  // Create a new product and calculate scenarios
  create: publicProcedure
    .input(
      z.object({
        name: z.string(),
        type: z.enum(["product", "bundle"]),
        original_price: z.number(),
        discount_two_items: z.number().optional(),
        discount_three_items: z.number().optional(),
        bundle_discount: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const productId = uuidv4();
      const product = {
        id: productId,
        ...input,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Create product
      const createdProduct = await createProduct(product);

      // Calculate and create scenarios
      const scenarios = calculateScenarios(createdProduct);
      const scenariosWithIds = scenarios.map(s => ({ ...s, id: uuidv4() }));
      await createScenarios(scenariosWithIds);

      return createdProduct;
    }),

  // Update product and recalculate scenarios
  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        type: z.enum(["product", "bundle"]).optional(),
        original_price: z.number().optional(),
        discount_two_items: z.number().optional(),
        discount_three_items: z.number().optional(),
        bundle_discount: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;

      // Update product
      const updatedProduct = await updateProduct(id, {
        ...updates,
        updated_at: new Date().toISOString(),
      });

      // Delete old scenarios
      await deleteProductScenarios(id);

      // Calculate and create new scenarios
      const scenarios = calculateScenarios(updatedProduct);
      const scenariosWithIds = scenarios.map(s => ({ ...s, id: uuidv4() }));
      await createScenarios(scenariosWithIds);

      return updatedProduct;
    }),

  // Delete product and its scenarios
  delete: publicProcedure.input(z.string()).mutation(async ({ input }) => {
    await deleteProductScenarios(input);
    await deleteProduct(input);
    return { success: true };
  }),
});
