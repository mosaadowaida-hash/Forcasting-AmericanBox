import { systemRouter } from "./_core/systemRouter";
import { router } from "./_core/trpc";
import { productsRouter } from "./routers/products";
import { authRouter } from "./routers/auth";
import { adminRouter } from "./routers/admin";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  products: productsRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
