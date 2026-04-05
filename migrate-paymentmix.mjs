import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // Add paymentMix column (TiDB doesn't support expression defaults for TEXT)
  await conn.execute(`ALTER TABLE \`products\` ADD \`paymentMix\` text`);
  // Set default value for existing rows
  await conn.execute(`UPDATE \`products\` SET \`paymentMix\` = '["cod"]' WHERE \`paymentMix\` IS NULL`);
  console.log("✓ Added paymentMix column to products");
} catch (err) {
  if (err.code === "ER_DUP_FIELDNAME") {
    console.log("✓ paymentMix column already exists");
  } else {
    throw err;
  }
}

await conn.end();
console.log("Migration complete.");
