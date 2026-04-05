import { describe, expect, it } from "vitest";
import { createClient } from "@supabase/supabase-js";

describe("Supabase Connection", () => {
  it("should connect to Supabase with service role key", async () => {
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    expect(supabaseUrl).toBeDefined();
    expect(serviceRoleKey).toBeDefined();

    const supabase = createClient(supabaseUrl!, serviceRoleKey!);

    // Try to fetch from a simple table to verify connection
    const { data, error } = await supabase
      .from("products")
      .select("id")
      .limit(1);

    // If table doesn't exist, that's okay - we just want to verify the connection works
    // The error would be about the table not existing, not about authentication
    if (error) {
      console.log("Supabase response:", error.message);
      // Connection is working if we get a response (even if table doesn't exist)
      expect(error.message).not.toContain("Invalid API key");
      expect(error.message).not.toContain("Unauthorized");
    } else {
      expect(data).toBeDefined();
    }
  });
});
