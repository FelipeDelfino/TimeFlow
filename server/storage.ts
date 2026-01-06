import {
  tasks, taskItems, timeEntries, whatsappIntegrations, whatsappLogs, notificationSettings, users,
  type Task, type InsertTask, type TaskItem, type InsertTaskItem,
  type TimeEntry, type InsertTimeEntry, type UpdateTimeEntry, type TimeEntryWithTask, type TaskWithStats,
  type WhatsappIntegration, type InsertWhatsappIntegration, type WhatsappLog, type InsertWhatsappLog,
  type NotificationSettings, type InsertNotificationSettings,
  type User, type InsertUser,
  type Team, type InsertTeam, type TeamMember, type InsertTeamMember, type TeamManager, type InsertTeamManager,
  type Project, type InsertProject, type ProjectTeam, type InsertProjectTeam
} from "@shared/schema";

export interface IStorage {
  // User authentication methods
  getUserByUsernameOrEmail(identifier: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByApiKey(apiKey: string): Promise<User | undefined>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUser(id: number): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  generateApiKey(userId: number): Promise<string>;
  validateUserAccess(userId: number): Promise<boolean>;

  // Team methods
  createTeam(team: InsertTeam): Promise<Team>;
  getTeam(id: number): Promise<Team | undefined>;
  updateTeam(id: number, updates: Partial<Team>): Promise<Team | undefined>;
  deleteTeam(id: number): Promise<boolean>;
  addTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  removeTeamMember(teamId: number, userId: number): Promise<boolean>;
  getTeamMembers(teamId: number): Promise<User[]>;
  addTeamManager(manager: InsertTeamManager): Promise<TeamManager>;
  removeTeamManager(teamId: number, userId: number): Promise<boolean>;
  getTeamManagers(teamId: number): Promise<User[]>;
  getTeamsForUser(userId: number): Promise<Team[]>;
  getManagedTeams(userId: number): Promise<Team[]>;
  getAllTeams(): Promise<Team[]>;

  // Project methods
  createProject(project: InsertProject): Promise<Project>;
  getAllTeams(): Promise<Team[]>;
  updateUserManagedTeams(userId: number, teamIds: number[]): Promise<void>;
  getProject(id: number): Promise<Project | undefined>;
  updateProject(id: number, updates: Partial<Project>): Promise<Project | undefined>;
  getUserPersonalProject(userId: number): Promise<Project | undefined>;
  getProjectsForUser(userId: number): Promise<Project[]>; // Personal + Team projects
  getAllProjects(): Promise<Project[]>; // Admin only
  bindProjectToTeam(projectTeam: InsertProjectTeam): Promise<ProjectTeam>;
  getProjectsForTeam(teamId: number): Promise<Project[]>;
  unbindProjectFromTeam(teamId: number, projectId: number): Promise<boolean>;
  // Task methods
  getAllTasks(): Promise<TaskWithStats[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  completeTask(id: number): Promise<Task | undefined>;
  reopenTask(id: number): Promise<Task | undefined>;

  // Task item methods
  getTaskItems(taskId: number): Promise<TaskItem[]>;
  createTaskItem(item: InsertTaskItem): Promise<TaskItem>;
  updateTaskItem(id: number, updates: Partial<TaskItem>): Promise<TaskItem | undefined>;
  deleteTaskItem(id: number): Promise<boolean>;
  completeAllTaskItems(taskId: number): Promise<void>;

  // Time entry methods
  getAllTimeEntries(): Promise<TimeEntryWithTask[]>;
  getTimeEntry(id: number): Promise<TimeEntry | undefined>;
  getTimeEntriesByTask(taskId: number): Promise<TimeEntry[]>;
  getTimeEntriesByUser(userId: number, startDate?: string, endDate?: string): Promise<TimeEntry[]>;
  getRunningTimeEntries(): Promise<TimeEntryWithTask[]>;
  createTimeEntry(entry: InsertTimeEntry): Promise<TimeEntry>;
  updateTimeEntry(id: number, updates: UpdateTimeEntry): Promise<TimeEntry | undefined>;
  deleteTimeEntry(id: number): Promise<boolean>;
  deleteAllTimeEntries(): Promise<boolean>;

  // Analytics methods
  getDashboardStats(userId: number): Promise<{
    todayTime: number;
    activeTasks: number;
    weekTime: number;
    monthTime: number;
    completedTasks: number;
    overdueTasks: number;
    overTimeTasks: number;
    dueTodayTasks: number;
    dueTomorrowTasks: number;
    nearingLimitTasks: number;
    efficiency: number; // Porcentagem (0-100+)
  }>;
  getTimeByTask(userId: number, startDate?: Date, endDate?: Date): Promise<Array<{ task: Task; totalTime: number }>>;
  getDailyStats(userId: number, startDate: Date, endDate: Date): Promise<Array<{ date: string; totalTime: number }>>;

  // WhatsApp Integration methods (single instance)
  getWhatsappIntegration(): Promise<WhatsappIntegration | undefined>;
  createWhatsappIntegration(integration: InsertWhatsappIntegration): Promise<WhatsappIntegration>;
  updateWhatsappIntegration(id: number, updates: Partial<WhatsappIntegration>): Promise<WhatsappIntegration | undefined>;
  deleteWhatsappIntegration(id: number): Promise<boolean>;

  // WhatsApp Logs methods
  createWhatsappLog(log: InsertWhatsappLog): Promise<WhatsappLog>;
  getWhatsappLogs(integrationId: number, limit?: number): Promise<WhatsappLog[]>;

  // Migration methods
  migrateOrphanTasks(userId: number, projectId: number): Promise<number>;

  // Notification Settings methods (single instance)
  getNotificationSettings(): Promise<NotificationSettings | undefined>;
  createNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings>;
  updateNotificationSettings(updates: Partial<NotificationSettings>): Promise<NotificationSettings | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tasks: Map<number, Task>;
  private taskItems: Map<number, TaskItem>;
  private timeEntries: Map<number, TimeEntry>;
  private whatsappIntegration: WhatsappIntegration | undefined;
  private whatsappLogs: Map<number, WhatsappLog>;
  private notificationSettings: NotificationSettings | undefined;
  private currentUserId: number;
  private currentTaskId: number;
  private currentTaskItemId: number;
  private currentTimeEntryId: number;
  private currentWhatsappLogId: number;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.taskItems = new Map();
    this.timeEntries = new Map();
    this.whatsappIntegration = undefined;
    this.whatsappLogs = new Map();
    this.notificationSettings = undefined;
    this.currentUserId = 1;
    this.currentTaskId = 1;
    this.currentTaskItemId = 1;
    this.currentTimeEntryId = 1;
    this.currentWhatsappLogId = 1;

    // Sistema inicia vazio - primeiro usuário será criado via endpoint de inicialização
  }

  private createDefaultUser() {
    const defaultUser: User = {
      id: 1,
      username: 'admin',
      password: '$2b$10$o94EUqCxV0Ih4BQ5ar.H2u08kL/.1Cy4kPzR5QH8ALzM9k9qU0R2G', // admin123
      email: 'admin@pontual.local',
      fullName: 'Administrador do Sistema',
      role: 'admin',
      isActive: true,
      mustResetPassword: false,
      resetToken: null,
      resetTokenExpiry: null,
      lastLogin: null,
      apiKey: 'pont_' + Math.random().toString(36).substring(2) + Date.now().toString(36),
      recoveryKey: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(1, defaultUser);
    this.currentUserId = 2;
  }

  // User authentication methods
  async getUserByUsernameOrEmail(identifier: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user =>
      user.username.toLowerCase() === identifier.toLowerCase() ||
      user.email.toLowerCase() === identifier.toLowerCase()
    );
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByApiKey(apiKey: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.apiKey === apiKey && user.isActive);
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.resetToken === token);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(userData: InsertUser): Promise<User> {
    const user: User = {
      id: this.currentUserId++,
      username: userData.username,
      password: userData.password,
      email: userData.email,
      fullName: userData.fullName,
      role: userData.role || 'user',
      isActive: userData.isActive ?? true,
      mustResetPassword: userData.mustResetPassword ?? false,
      resetToken: null,
      resetTokenExpiry: null,
      lastLogin: null,
      apiKey: userData.apiKey || null,
      recoveryKey: userData.recoveryKey || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates, updatedAt: new Date() };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }

  async generateApiKey(userId: number): Promise<string> {
    const apiKey = 'pont_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    await this.updateUser(userId, { apiKey });
    return apiKey;
  }

  async validateUserAccess(userId: number): Promise<boolean> {
    const user = this.users.get(userId);
    return !!user && user.isActive;
  }

  // Team methods
  async getAllTeams(): Promise<Team[]> {
    return Array.from(this.teams.values());
  }

  async updateUserManagedTeams(userId: number, teamIds: number[]): Promise<void> {
    // Remove existing managers entries for this user
    for (const [id, manager] of this.teamManagers) {
      if (manager.userId === userId) {
        this.teamManagers.delete(id);
      }
    }

    // Add new entries
    for (const teamId of teamIds) {
      const id = this.currentId++;
      this.teamManagers.set(id, {
        id,
        teamId,
        userId,
        assignedAt: new Date()
      });
    }
  }

  async createTeam(team: InsertTeam): Promise<Team> { throw new Error("Not implemented in MemStorage"); }
  async getTeam(id: number): Promise<Team | undefined> { throw new Error("Not implemented in MemStorage"); }
  async updateTeam(id: number, updates: Partial<Team>): Promise<Team | undefined> { throw new Error("Not implemented in MemStorage"); }
  async deleteTeam(id: number): Promise<boolean> { throw new Error("Not implemented in MemStorage"); }
  async addTeamMember(member: InsertTeamMember): Promise<TeamMember> { throw new Error("Not implemented in MemStorage"); }
  async removeTeamMember(teamId: number, userId: number): Promise<boolean> { throw new Error("Not implemented in MemStorage"); }
  async getTeamMembers(teamId: number): Promise<User[]> { throw new Error("Not implemented in MemStorage"); }
  async addTeamManager(manager: InsertTeamManager): Promise<TeamManager> { throw new Error("Not implemented in MemStorage"); }
  async removeTeamManager(teamId: number, userId: number): Promise<boolean> { throw new Error("Not implemented in MemStorage"); }
  async getTeamManagers(teamId: number): Promise<User[]> { throw new Error("Not implemented in MemStorage"); }
  async getTeamsForUser(userId: number): Promise<Team[]> { throw new Error("Not implemented in MemStorage"); }
  async getManagedTeams(userId: number): Promise<Team[]> { throw new Error("Not implemented in MemStorage"); }
  async getAllTeams(): Promise<Team[]> { throw new Error("Not implemented in MemStorage"); }

  // Project methods (Not implemented in MemStorage)
  async createProject(project: InsertProject): Promise<Project> { throw new Error("Not implemented in MemStorage"); }
  async getProject(id: number): Promise<Project | undefined> { throw new Error("Not implemented in MemStorage"); }
  async updateProject(id: number, updates: Partial<Project>): Promise<Project | undefined> { throw new Error("Not implemented in MemStorage"); }
  async getUserPersonalProject(userId: number): Promise<Project | undefined> { throw new Error("Not implemented in MemStorage"); }
  async getProjectsForUser(userId: number): Promise<Project[]> { throw new Error("Not implemented in MemStorage"); }
  async getAllProjects(): Promise<Project[]> { throw new Error("Not implemented in MemStorage"); }
  async bindProjectToTeam(projectTeam: InsertProjectTeam): Promise<ProjectTeam> { throw new Error("Not implemented in MemStorage"); }
  async getProjectsForTeam(teamId: number): Promise<Project[]> { throw new Error("Not implemented in MemStorage"); }
  async unbindProjectFromTeam(teamId: number, projectId: number): Promise<boolean> { throw new Error("Not implemented in MemStorage"); }

  // Task methods
  async getAllTasks(): Promise<TaskWithStats[]> {
    const tasksArray = Array.from(this.tasks.values()).filter(task => task.isActive);
    const tasksWithStats: TaskWithStats[] = [];

    for (const task of tasksArray) {
      const entries = Array.from(this.timeEntries.values()).filter(entry => entry.taskId === task.id);
      const totalTime = entries.reduce((sum, entry) => {
        if (entry.duration) return sum + entry.duration;
        if (entry.isRunning && entry.startTime) {
          return sum + Math.floor((Date.now() - new Date(entry.startTime).getTime()) / 1000);
        }
        return sum;
      }, 0);
      const activeEntries = entries.filter(entry => entry.isRunning).length;
      const items = Array.from(this.taskItems.values()).filter(item => item.taskId === task.id);

      tasksWithStats.push({
        ...task,
        totalTime,
        activeEntries,
        items,
      });
    }

    return tasksWithStats;
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentTaskId++;
    const task: Task = {
      ...insertTask,
      description: insertTask.description || null,
      color: insertTask.color || "#3B82F6",
      estimatedHours: insertTask.estimatedHours ?? null,
      deadline: insertTask.deadline || null,
      isActive: insertTask.isActive !== undefined ? insertTask.isActive : true,
      isCompleted: false,
      completedAt: null,
      projectId: insertTask.projectId || null, // Added projectId support
      id,
      createdAt: new Date(),
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, updates: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updatedTask = { ...task, ...updates };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    const task = this.tasks.get(id);
    if (!task) return false;

    // Soft delete - mark as inactive
    task.isActive = false;
    this.tasks.set(id, task);
    return true;
  }

  async completeTask(id: number): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (task) {
      const updatedTask = {
        ...task,
        isCompleted: true,
        completedAt: new Date()
      };
      this.tasks.set(id, updatedTask);
      return updatedTask;
    }
    return undefined;
  }

  async reopenTask(id: number): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (task) {
      const updatedTask = {
        ...task,
        isCompleted: false,
        completedAt: null
      };
      this.tasks.set(id, updatedTask);
      return updatedTask;
    }
    return undefined;
  }

  // Task item methods
  async getTaskItems(taskId: number): Promise<TaskItem[]> {
    return Array.from(this.taskItems.values()).filter(item => item.taskId === taskId);
  }

  async createTaskItem(insertItem: InsertTaskItem): Promise<TaskItem> {
    const id = this.currentTaskItemId++;
    const item: TaskItem = {
      ...insertItem,
      completed: insertItem.completed !== undefined ? insertItem.completed : false,
      id,
      createdAt: new Date(),
    };
    this.taskItems.set(id, item);
    return item;
  }

  async updateTaskItem(id: number, updates: Partial<TaskItem>): Promise<TaskItem | undefined> {
    const item = this.taskItems.get(id);
    if (!item) return undefined;

    const updatedItem = { ...item, ...updates };
    this.taskItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteTaskItem(id: number): Promise<boolean> {
    return this.taskItems.delete(id);
  }

  async completeAllTaskItems(taskId: number): Promise<void> {
    const items = Array.from(this.taskItems.values()).filter(item => item.taskId === taskId);
    for (const item of items) {
      item.completed = true;
      this.taskItems.set(item.id, item);
    }
  }

  // Time entry methods
  async getAllTimeEntries(): Promise<TimeEntryWithTask[]> {
    const entries = Array.from(this.timeEntries.values());
    const entriesWithTask: TimeEntryWithTask[] = [];

    for (const entry of entries) {
      const task = this.tasks.get(entry.taskId);
      if (task) {
        entriesWithTask.push({ ...entry, task });
      }
    }

    return entriesWithTask.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getTimeEntry(id: number): Promise<TimeEntry | undefined> {
    return this.timeEntries.get(id);
  }

  async getTimeEntriesByTask(taskId: number): Promise<TimeEntry[]> {
    return Array.from(this.timeEntries.values()).filter(entry => entry.taskId === taskId);
  }

  async getTimeEntriesByUser(userId: number, startDate?: string, endDate?: string): Promise<TimeEntry[]> {
    let entries = Array.from(this.timeEntries.values()).filter(entry => entry.userId === userId);

    if (startDate || endDate) {
      entries = entries.filter(entry => {
        const entryDate = entry.startTime ? new Date(entry.startTime) : new Date();

        if (startDate && entryDate < new Date(startDate)) {
          return false;
        }

        if (endDate && entryDate > new Date(endDate)) {
          return false;
        }

        return true;
      });
    }

    return entries.sort((a, b) => {
      const dateA = a.endTime ? new Date(a.endTime) : new Date();
      const dateB = b.endTime ? new Date(b.endTime) : new Date();
      return dateB.getTime() - dateA.getTime();
    });
  }

  async getRunningTimeEntries(): Promise<TimeEntryWithTask[]> {
    const runningEntries = Array.from(this.timeEntries.values()).filter(entry => entry.isRunning);
    const entriesWithTask: TimeEntryWithTask[] = [];

    for (const entry of runningEntries) {
      const task = this.tasks.get(entry.taskId);
      if (task) {
        entriesWithTask.push({ ...entry, task });
      }
    }

    return entriesWithTask;
  }

  async createTimeEntry(insertEntry: InsertTimeEntry): Promise<TimeEntry> {
    const id = this.currentTimeEntryId++;
    const entry: TimeEntry = {
      ...insertEntry,
      endTime: insertEntry.endTime || null,
      duration: insertEntry.duration || null,
      isRunning: insertEntry.isRunning !== undefined ? insertEntry.isRunning : false,
      notes: insertEntry.notes || null,
      id,
      createdAt: new Date(),
    };
    this.timeEntries.set(id, entry);
    return entry;
  }

  async updateTimeEntry(id: number, updates: UpdateTimeEntry): Promise<TimeEntry | undefined> {
    const entry = this.timeEntries.get(id);
    if (!entry) return undefined;

    const updatedEntry = { ...entry, ...updates };
    this.timeEntries.set(id, updatedEntry);
    return updatedEntry;
  }

  async deleteTimeEntry(id: number): Promise<boolean> {
    return this.timeEntries.delete(id);
  }

  async deleteAllTimeEntries(): Promise<boolean> {
    this.timeEntries.clear();
    return true;
  }

  // Analytics methods
  async getDashboardStats(userId: number): Promise<{
    todayTime: number;
    activeTasks: number;
    weekTime: number;
    monthTime: number;
    completedTasks: number;
    overdueTasks: number;
    overTimeTasks: number;
    dueTodayTasks: number;
    dueTomorrowTasks: number;
    dueTomorrowTasks: number;
    nearingLimitTasks: number;
    efficiency: number;
  }> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const userEntries = Array.from(this.timeEntries.values()).filter(e => e.userId === userId);
    const userTasks = Array.from(this.tasks.values()).filter(t => t.userId === userId);

    const todayTime = userEntries
      .filter(e => e.startTime >= startOfDay)
      .reduce((sum, e) => sum + (e.duration || 0), 0);

    const weekTime = userEntries
      .filter(e => e.startTime >= startOfWeek)
      .reduce((sum, e) => sum + (e.duration || 0), 0);

    const monthTime = userEntries
      .filter(e => e.startTime >= startOfMonth)
      .reduce((sum, e) => sum + (e.duration || 0), 0);

    const activeTasks = userTasks.filter(t => t.isActive).length;
    const completedTasks = userTasks.filter(t => t.isCompleted).length;

    return {
      todayTime,
      activeTasks,
      weekTime,
      monthTime,
      completedTasks,
      overdueTasks: 0,
      overTimeTasks: 0,
      dueTodayTasks: 0,
      dueTomorrowTasks: 0,
      nearingLimitTasks: 0,
      efficiency: 0
    };
  }

  async getTimeByTask(userId: number, startDate?: Date, endDate?: Date): Promise<Array<{ task: Task; totalTime: number }>> {
    return [];
  }

  async getDailyStats(userId: number, startDate: Date, endDate: Date): Promise<Array<{ date: string; totalTime: number }>> {
    return [];
  }

  // Migration methods
  async migrateOrphanTasks(userId: number, projectId: number): Promise<number> {
    let count = 0;
    for (const task of Array.from(this.tasks.values())) {
      if (task.userId === userId && !task.projectId) {
        task.projectId = projectId;
        this.tasks.set(task.id, task);
        count++;
      }
    }
    return count;
  }

  // WhatsApp Integration methods - Adjusted to new Schema
  async getWhatsappIntegration(): Promise<WhatsappIntegration | undefined> {
    return this.whatsappIntegration;
  }

  async createWhatsappIntegration(integration: InsertWhatsappIntegration): Promise<WhatsappIntegration> {
    const whatsappIntegration: WhatsappIntegration = {
      id: 1,
      instanceName: integration.instanceName || '',
      apiKey: integration.apiKey || '',
      apiUrl: integration.apiUrl || '',
      phoneNumber: integration.phoneNumber || '',
      webhookUrl: integration.webhookUrl || null,
      authorizedNumbers: integration.authorizedNumbers || null,
      restrictToNumbers: integration.restrictToNumbers ?? true,
      allowedGroupJid: integration.allowedGroupJid || null,
      responseMode: integration.responseMode || 'individual',
      isActive: integration.isActive ?? true,
      lastConnection: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.whatsappIntegration = whatsappIntegration;
    return whatsappIntegration;
  }

  async updateWhatsappIntegration(id: number, updates: Partial<WhatsappIntegration>): Promise<WhatsappIntegration | undefined> {
    if (this.whatsappIntegration && this.whatsappIntegration.id === id) {
      this.whatsappIntegration = {
        ...this.whatsappIntegration,
        ...updates,
        updatedAt: new Date()
      };
      return this.whatsappIntegration;
    }
    return undefined;
  }

  async deleteWhatsappIntegration(id: number): Promise<boolean> {
    if (this.whatsappIntegration && this.whatsappIntegration.id === id) {
      this.whatsappIntegration = undefined;
      return true;
    }
    return false;
  }

  async createWhatsappLog(log: InsertWhatsappLog): Promise<WhatsappLog> {
    const whatsappLog: WhatsappLog = {
      id: this.currentWhatsappLogId++,
      integrationId: log.integrationId,
      logType: log.logType,
      message: log.message,
      metadata: log.metadata || null,
      timestamp: new Date()
    };
    this.whatsappLogs.set(whatsappLog.id, whatsappLog);
    return whatsappLog;
  }

  async getWhatsappLogs(integrationId: number, limit?: number): Promise<WhatsappLog[]> {
    const logs = Array.from(this.whatsappLogs.values())
      .filter(log => log.integrationId === integrationId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return limit ? logs.slice(0, limit) : logs;
  }

  // Notification Settings methods - Adjusted to new Schema
  async getNotificationSettings(): Promise<NotificationSettings | undefined> {
    return this.notificationSettings;
  }

  async createNotificationSettings(settings: InsertNotificationSettings): Promise<NotificationSettings> {
    const notificationSettings: NotificationSettings = {
      id: 1,
      enableDailyReport: settings.enableDailyReport ?? false,
      dailyReportTime: settings.dailyReportTime || '18:00',
      enableWeeklyReport: settings.enableWeeklyReport ?? false,
      weeklyReportDay: settings.weeklyReportDay ?? 5,
      enableDeadlineReminders: settings.enableDeadlineReminders ?? true,
      reminderHoursBefore: settings.reminderHoursBefore ?? 24,
      enableTimerReminders: settings.enableTimerReminders ?? false,
      timerReminderInterval: settings.timerReminderInterval ?? 120,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.notificationSettings = notificationSettings;
    return notificationSettings;
  }

  async updateNotificationSettings(updates: Partial<NotificationSettings>): Promise<NotificationSettings | undefined> {
    if (this.notificationSettings) {
      this.notificationSettings = {
        ...this.notificationSettings,
        ...updates,
        updatedAt: new Date()
      };
      return this.notificationSettings;
    }
    return undefined;
  }
}

import { DatabaseStorage } from "./database-storage.js";

// Detectar ambiente
const hasDatabaseUrl = !!process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER || process.env.DOCKER;
const isNeonDatabase = process.env.DATABASE_URL?.includes('neon.tech');
const isReplit = !!process.env.REPL_ID;

console.log("🔍 Detectando ambiente:");
console.log("- Produção:", isProduction ? "✅ Sim" : "❌ Não (desenvolvimento)");
console.log("- Replit:", isReplit ? "✅ Sim" : "❌ Não");
console.log("- DATABASE_URL:", hasDatabaseUrl ? "✅ Configurado" : "❌ Não configurado");
console.log("- Tipo de banco:", isNeonDatabase ? "Neon" : "PostgreSQL padrão");

// Verificar se o banco Neon está hibernando APENAS em desenvolvimento no Replit
const isNeonHibernating = isNeonDatabase && !isProduction && isReplit;

if (!hasDatabaseUrl) {
  console.log("❌ DATABASE_URL não configurado. Configure PostgreSQL.");
  throw new Error("DATABASE_URL é obrigatória. Configure uma conexão PostgreSQL.");
}

let storage: IStorage;

if (isProduction) {
  // Produção (Render/Docker) sempre usa PostgreSQL
  console.log("🐘 Produção (Render/Docker): Usando PostgreSQL obrigatoriamente");
  console.log("📊 Dados serão persistidos no banco PostgreSQL");
  storage = new DatabaseStorage();
} else if (isNeonHibernating) {
  // Neon hibernando APENAS em desenvolvimento no Replit
  console.log("⚠️  Banco Neon detectado hibernando no Replit desenvolvimento");
  console.log("💾 Usando MemStorage temporariamente (apenas desenvolvimento)");
  console.log("💡 No Render/Docker: dados serão persistidos no PostgreSQL");
  storage = new MemStorage();
} else {
  // PostgreSQL padrão ou desenvolvimento local
  console.log("🐘 Desenvolvimento: Usando PostgreSQL");
  console.log("📊 Dados serão persistidos no banco PostgreSQL");
  storage = new DatabaseStorage();
}

export { storage };
