import { Express } from "express";
import { storage } from "./storage";
import { insertTeamSchema, insertTeamMemberSchema, insertTeamManagerSchema } from "@shared/schema";
import { authenticateAny } from "./auth-middleware";
import { z } from "zod";

export function registerTeamRoutes(app: Express) {
    // Get user's teams
    app.get("/api/teams", authenticateAny, async (req: any, res) => {
        try {
            if (req.user.role === 'admin') {
                const allTeams = await storage.getAllTeams();
                return res.json(allTeams);
            }

            // Get teams where user is a member
            const memberTeams = await storage.getTeamsForUser(req.user.id);
            res.json(memberTeams);
        } catch (error) {
            res.status(500).json({ message: "Error fetching teams" });
        }
    });

    // Get managed teams for a user (admin only)
    app.get("/api/users/:id/managed-teams", authenticateAny, async (req: any, res) => {
        try {
            const targetUserId = parseInt(req.params.id);

            // Only admin can see other users' managed teams
            if (req.user.role !== 'admin' && req.user.id !== targetUserId) {
                return res.status(403).json({ message: "Access denied" });
            }

            const managedTeams = await storage.getManagedTeams(targetUserId);
            res.json(managedTeams.map(t => t.id)); // Return IDs only for checkbox state
        } catch (error) {
            res.status(500).json({ message: "Error fetching managed teams" });
        }
    });

    // Update managed teams for a user (admin only)
    app.put("/api/users/:id/managed-teams", authenticateAny, async (req: any, res) => {
        try {
            if (req.user.role !== 'admin') {
                return res.status(403).json({ message: "Only admins can assign managers" });
            }

            const targetUserId = parseInt(req.params.id);
            const { teamIds } = req.body; // Expecting array of numbers

            if (!Array.isArray(teamIds)) {
                return res.status(400).json({ message: "teamIds must be an array" });
            }

            await storage.updateUserManagedTeams(targetUserId, teamIds);
            res.json({ message: "Managed teams updated" });
        } catch (error) {
            console.error("Error updating managed teams:", error);
            res.status(500).json({ message: "Error updating managed teams" });
        }
    });

    // Get managed teams (for manager view)
    app.get("/api/teams/managed", authenticateAny, async (req: any, res) => {
        try {
            const managedTeams = await storage.getManagedTeams(req.user.id);
            res.json(managedTeams);
        } catch (error) {
            res.status(500).json({ message: "Error fetching managed teams" });
        }
    });

    // Create team
    app.post("/api/teams", authenticateAny, async (req: any, res) => {
        try {
            const teamData = insertTeamSchema.parse(req.body);
            const team = await storage.createTeam(teamData);

            // Auto-assign creator as manager and member
            await storage.addTeamMember({ teamId: team.id, userId: req.user.id });
            await storage.addTeamManager({ teamId: team.id, userId: req.user.id });

            res.status(201).json(team);
        } catch (error) {
            if (error instanceof z.ZodError) {
                res.status(400).json({ message: "Invalid data", errors: error.errors });
            } else {
                res.status(500).json({ message: "Error creating team" });
            }
        }
    });

    // Get specific team
    app.get("/api/teams/:id", authenticateAny, async (req: any, res) => {
        try {
            const teamId = parseInt(req.params.id);
            const team = await storage.getTeam(teamId);

            if (!team) return res.status(404).json({ message: "Team not found" });

            // Check access: Must be member or manager or admin
            const members = await storage.getTeamMembers(teamId);
            const isMember = members.some(m => m.id === req.user.id);
            const isAdmin = req.user.role === 'admin';

            if (!isMember && !isAdmin) {
                return res.status(403).json({ message: "Access denied" });
            }

            res.json(team);
        } catch (error) {
            res.status(500).json({ message: "Error fetching team" });
        }
    });

    // Update team
    app.put("/api/teams/:id", authenticateAny, async (req: any, res) => {
        try {
            const teamId = parseInt(req.params.id);
            // Check manager access
            const managers = await storage.getTeamManagers(teamId);
            const isManager = managers.some(m => m.id === req.user.id);
            const isAdmin = req.user.role === 'admin';

            if (!isManager && !isAdmin) {
                return res.status(403).json({ message: "Only managers can update team" });
            }

            const updates = insertTeamSchema.partial().parse(req.body);
            const updated = await storage.updateTeam(teamId, updates);
            res.json(updated);
        } catch (error) {
            res.status(500).json({ message: "Error updating team" });
        }
    });

    // Delete team
    app.delete("/api/teams/:id", authenticateAny, async (req: any, res) => {
        try {
            const teamId = parseInt(req.params.id);

            // Only admin can delete teams
            if (req.user.role !== 'admin') {
                return res.status(403).json({ message: "Only admins can delete teams" });
            }

            const success = await storage.deleteTeam(teamId);
            if (!success) {
                return res.status(404).json({ message: "Team not found" });
            }
            res.json({ message: "Team deleted" });
        } catch (error) {
            console.error("Error deleting team:", error);
            res.status(500).json({ message: "Error deleting team" });
        }
    });

    // Add member
    app.post("/api/teams/:id/members", authenticateAny, async (req: any, res) => {
        try {
            const teamId = parseInt(req.params.id);
            const { userId } = req.body;

            // Check manager access
            const managers = await storage.getTeamManagers(teamId);
            const isManager = managers.some(m => m.id === req.user.id);
            const isAdmin = req.user.role === 'admin';

            if (!isManager && !isAdmin) {
                return res.status(403).json({ message: "Only managers can add members" });
            }

            await storage.addTeamMember({ teamId, userId });
            res.status(201).json({ message: "Member added" });
        } catch (error) {
            res.status(500).json({ message: "Error adding member" });
        }
    });

    // Remove member
    app.delete("/api/teams/:id/members/:userId", authenticateAny, async (req: any, res) => {
        try {
            const teamId = parseInt(req.params.id);
            const userIdToRemove = parseInt(req.params.userId);

            // Check access
            const managers = await storage.getTeamManagers(teamId);
            const isManager = managers.some(m => m.id === req.user.id);
            const isAdmin = req.user.role === 'admin';

            if (!isManager && !isAdmin) {
                return res.status(403).json({ message: "Only managers can remove members" });
            }

            await storage.removeTeamMember(teamId, userIdToRemove);
            res.json({ message: "Member removed" });
        } catch (error) {
            res.status(500).json({ message: "Error removing member" });
        }
    });

    // Get members
    app.get("/api/teams/:id/members", authenticateAny, async (req: any, res) => {
        try {
            const teamId = parseInt(req.params.id);
            // Access check? Any member can see other members? Yes.
            const members = await storage.getTeamMembers(teamId);
            res.json(members);
        } catch (error) {
            res.status(500).json({ message: "Error fetching members" });
        }
    });
}
