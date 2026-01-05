
import "dotenv/config";
import { storage } from "./storage";

async function main() {
    try {
        console.log("Starting migration...");
        const users = await storage.getAllUsers();
        let migratedCount = 0;
        let tasksMigratedCount = 0;

        console.log(`Found ${users.length} users.`);

        for (const user of users) {
            console.log(`Processing user: ${user.username} (${user.id})`);
            // Create a default "Personal" project for each user
            let personalProject = await storage.getUserPersonalProject(user.id);

            if (!personalProject) {
                console.log(`Creating personal project for ${user.username}...`);
                personalProject = await storage.createProject({
                    name: `Projeto Pessoal - ${user.fullName.split(' ')[0]}`,
                    description: "Seu espaço para tarefas pessoais e privadas",
                    isPersonal: true,
                    ownerId: user.id,
                    isActive: true
                });
                migratedCount++;
            } else {
                console.log(`User ${user.username} already has a personal project: ${personalProject.name}`);
            }

            if (personalProject) {
                // Migrar tarefas órfãs
                const migrated = await storage.migrateOrphanTasks(user.id, personalProject.id);
                console.log(`Migrated ${migrated} orphan tasks for ${user.username}.`);
                tasksMigratedCount += migrated;
            }
        }

        console.log("Migration complete.");
        console.log(`Projects created: ${migratedCount}`);
        console.log(`Tasks migrated: ${tasksMigratedCount}`);

        process.exit(0);
    } catch (error) {
        console.error("Migration error:", error);
        process.exit(1);
    }
}

main();
