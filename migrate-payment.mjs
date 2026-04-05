import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

const sqls = [
  "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `paymentMethod` ENUM('instapay','paypal')",
  "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `paymentProofImage` TEXT",
  "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `paymentStatus` ENUM('pending','verified','rejected')",
  "ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `paymentSubmittedAt` TIMESTAMP NULL",
];

for (const sql of sqls) {
  try {
    await conn.execute(sql);
    console.log("✓", sql.substring(0, 60));
  } catch (e) {
    if (e.code === "ER_DUP_FIELDNAME") {
      console.log("⚠ Already exists:", sql.substring(0, 60));
    } else {
      console.error("✗", e.message);
    }
  }
}

// Verify
const [rows] = await conn.execute("DESCRIBE users");
const paymentCols = rows.filter(r => r.Field.startsWith("payment"));
console.log("\nPayment columns in DB:");
paymentCols.forEach(r => console.log(" -", r.Field, r.Type));

await conn.end();
console.log("\nMigration complete.");
