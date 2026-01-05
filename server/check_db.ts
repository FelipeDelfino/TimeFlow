import "dotenv/config";
import { db } from "./db";
import { sql } from "drizzle-orm";

async function main() {
    try {
        const res = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
        console.log("Tables:", res.rows.map(r => r.table_name));
        console.log("Tables:", res.rows.map((r: any) => r.table_name).sort());

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

main();
