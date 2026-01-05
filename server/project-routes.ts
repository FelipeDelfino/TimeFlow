import { Express } from "express";
import { storage } from "./storage";
import { insertProjectSchema, insertProjectTeamSchema } from "@shared/schema";
import { authenticateAny } from "./auth-middleware";
import { z } from "zod";

export function registerProjectRoutes(app: Express) {
    // Get user's projects (Personal + Team projects)
    app.get("/api/projects", authenticateAny, async (req: any, res) => {
        try {
            const projects = await storage.getProjectsForUser(req.user.id);
            res.json(projects);
        } catch (error) {
            res.status(500).json({ message: "Error fetching projects" });
        }
    });

    // Create project
    app.post("/api/projects", authenticateAny, async (req: any, res) => {
        try {
            // Validate with schema but allow overrides
            const projectData = insertProjectSchema.parse(req.body);

            // Force ownerId to be current user if not admin
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
}
