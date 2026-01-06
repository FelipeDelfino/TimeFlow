
import { db } from "../server/db";
import { projects } from "../shared/schema";
import { eq } from "drizzle-orm";

async function verify() {
    console.log("Verifying database connection and schema...");
    try {
        const allProjects = await db.select().from(projects);
        console.log(`Found ${allProjects.length} projects.`);
        console.log("Projects:", JSON.stringify(allProjects, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("Database verification failed:", error);
        process.exit(1);
    }
}

verify();
