
import "dotenv/config";
import { db } from "./db";
import { sql } from "drizzle-orm";

async function main() {
    try {
        // Check if project_id exists in tasks
        const check = await db.execute(sql`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'tasks' AND column_name = 'project_id'
        `);

        if (check.rowCount === 0) {
            console.log("Adding project_id to tasks...");
            await db.execute(sql`
                ALTER TABLE tasks 
                ADD COLUMN project_id integer REFERENCES projects(id)
            `);
            console.log("Column added.");
        } else {
            console.log("project_id already exists.");
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
main();
