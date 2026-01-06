import { Express } from "express";
import { storage } from "./storage";
import { insertProjectSchema, insertProjectTeamSchema } from "@shared/schema";
import { authenticateAny, authenticateAdmin } from "./auth-middleware";
import { z } from "zod";

export function registerProjectRoutes(app: Express) {
    // Admin route to fix missing personal projects and orphan tasks
    app.post("/api/admin/fix-projects", authenticateAdmin, async (req: any, res) => {
        try {
            const users = await storage.getAllUsers();
            const results = {
                usersProcessed: 0,
                projectsCreated: 0,
                tasksMigrated: 0
            };

            for (const user of users) {
                // Check if user has personal project
                let personalProject = await storage.getUserPersonalProject(user.id);

                if (!personalProject) {
                    console.log(`Creating personal project for user ${user.username}`);
                    // Create one if missing
                    personalProject = await storage.createProject({
                        name: `Projeto Pessoal - ${user.fullName.split(' ')[0]}`,
                        description: "Seu espaço para tarefas pessoais e privadas",
                        isPersonal: true,
                        ownerId: user.id,
                        isActive: true
                    });
                    results.projectsCreated++;
                }

                // Migrate orphan tasks
                const migratedCount = await storage.migrateOrphanTasks(user.id, personalProject.id);
                if (migratedCount > 0) {
                    console.log(`Migrated ${migratedCount} tasks for user ${user.username}`);
                }

                results.tasksMigrated += migratedCount;
                results.usersProcessed++;
            }

            res.json({
                message: "Migration completed successfully",
                stats: results
            });
        } catch (error) {
            console.error("Migration error:", error);
            res.status(500).json({ message: "Error executing migration" });
        }
    });

    app.get("/api/projects", authenticateAny, async (req: any, res) => {
        try {
            console.log(`[GET /api/projects] Fetching for user ${req.user.id} (${req.user.username}), role: ${req.user.role}`);
            if (req.user.role === 'admin') {
                const projects = await storage.getAllProjects();
                console.log(`[GET /api/projects] Admin found ${projects.length} projects`);
                res.json(projects);
            } else {
                const projects = await storage.getProjectsForUser(req.user.id);
                console.log(`[GET /api/projects] User found ${projects.length} projects`);
                res.json(projects);
            }
        } catch (error) {
            console.error("[GET /api/projects] Error:", error);
            res.status(500).json({ message: "Error fetching projects" });
        }
    });

    // Create project
    app.post("/api/projects", authenticateAny, async (req: any, res) => {
        try {
            // Validate with schema but allow overrides
            const projectData = insertProjectSchema.parse(req.body);

            // Force ownerId to be current user if not provided in body (admins can set it, but default to self)
            if (!projectData.ownerId) {
                projectData.ownerId = req.user.id;
            }
            // For non-admins, strict enforcement (which is already covered if we overwrite, but let's be safe)
            if (req.user.role !== 'admin') {
                projectData.ownerId = req.user.id;
            }

            const project = await storage.createProject(projectData);

            // If teamId provided in body (custom logic, not in schema strictly but common), bind it?
            // Or client should call bind separately.
            // Let's assume standard creation first.

            res.status(201).json(project);
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ message: "Invalid data", errors: error.errors });
            } else {
                res.status(500).json({ message: "Error creating project" });
            }
        }
    });

    // Get project details
    app.get("/api/projects/:id", authenticateAny, async (req: any, res) => {
        try {
            const projectId = parseInt(req.params.id);
            const project = await storage.getProject(projectId);

            if (!project) return res.status(404).json({ message: "Project not found" });

            // Check access
            const userProjects = await storage.getProjectsForUser(req.user.id);
            const hasAccess = userProjects.some(p => p.id === projectId) || req.user.role === 'admin';

            if (!hasAccess) return res.status(403).json({ message: "Access denied" });

            res.json(project);
        } catch (error) {
            res.status(500).json({ message: "Error fetching project" });
        }
    });

    // Update project
    app.put("/api/projects/:id", authenticateAny, async (req: any, res) => {
        try {
            const projectId = parseInt(req.params.id);
            const project = await storage.getProject(projectId);

            if (!project) return res.status(404).json({ message: "Project not found" });

            // Check ownership or admin
            if (project.ownerId !== req.user.id && req.user.role !== 'admin') {
                // Also allow if user is manager of a team assigned to this project
                // TODO: Implement deep check for team managers.
                // For now restricted to owner/admin.
                return res.status(403).json({ message: "Access denied" });
            }

            const updates = insertProjectSchema.partial().parse(req.body);
            const updated = await storage.updateProject(projectId, updates);
            res.json(updated);
        } catch (error) {
            res.status(500).json({ message: "Error updating project" });
        }
    });

    // Bind project to team
    app.post("/api/projects/:id/teams", authenticateAny, async (req: any, res) => {
        try {
            const projectId = parseInt(req.params.id);
            const { teamId } = req.body;

            // Check if user is owner of project or admin
            const project = await storage.getProject(projectId);
            if (!project) return res.status(404).json({ message: "Project not found" });

            if (project.ownerId !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({ message: "Access denied" });
            }

            const link = await storage.bindProjectToTeam({
                projectId,
                teamId
            });

            res.status(201).json(link);
        } catch (error) {
            res.status(500).json({ message: "Error binding project to team" });
        }
    });

    // Delete project (Admin or Owner)
    app.delete("/api/projects/:id", authenticateAny, async (req: any, res) => {
        try {
            const projectId = parseInt(req.params.id);
            const project = await storage.getProject(projectId);

            if (!project) return res.status(404).json({ message: "Project not found" });

            // Check ownership or admin
            if (project.ownerId !== req.user.id && req.user.role !== 'admin') {
                return res.status(403).json({ message: "Access denied" });
            }

            // Soft delete - mark as inactive
            const updated = await storage.updateProject(projectId, { isActive: false });
            res.json({ message: "Project deleted successfully" });
        } catch (error) {
            res.status(500).json({ message: "Error deleting project" });
        }
    });
}

