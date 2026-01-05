import "dotenv/config";
import { db } from "./db";
import { sql } from "drizzle-orm";

async function main() {
    try {
        console.log("Dropping whatsapp_integrations table...");
        await db.execute(sql`DROP TABLE IF EXISTS whatsapp_integrations CASCADE`);
        console.log("Table dropped successfully.");
        process.exit(0);
    } catch (error) {
        console.error("Error dropping table:", error);
        process.exit(1);
    }
}

main();
