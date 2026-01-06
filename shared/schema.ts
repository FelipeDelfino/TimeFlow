import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";



// Tabela de usuários para autenticação
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // hash da senha
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("user"), // "admin" ou "user"
  isActive: boolean("is_active").notNull().default(true),
  mustResetPassword: boolean("must_reset_password").notNull().default(false),
  resetToken: text("reset_token"), // token para reset de senha
  resetTokenExpiry: timestamp("reset_token_expiry"),
  lastLogin: timestamp("last_login"),
  apiKey: text("api_key").unique(), // chave para acesso via API
  recoveryKey: text("recovery_key"), // Hash da chave de recuperação
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ===== NOVAS TABELAS PARA TIMES E PROJETOS =====

export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id),
  userId: integer("user_id").notNull().references(() => users.id),
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

export const teamManagers = pgTable("team_managers", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id),
  userId: integer("user_id").notNull().references(() => users.id),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
});

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isPersonal: boolean("is_personal").notNull().default(false),
  estimatedHours: integer("estimated_hours"), // horas estimadas para o projeto
  deadline: timestamp("deadline"), // data limite do projeto
  ownerId: integer("owner_id").references(() => users.id), // Para projetos pessoais
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const projectTeams = pgTable("project_teams", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull().references(() => projects.id),
  teamId: integer("team_id").notNull().references(() => teams.id),
  assignedAt: timestamp("assigned_at").notNull().defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").notNull().default("#3B82F6"),
  estimatedHours: integer("estimated_hours"), // horas previstas
  deadline: timestamp("deadline"), // prazo
  isActive: boolean("is_active").notNull().default(true),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // Campo obrigatório para identificar origem da tarefa
  source: text("source").notNull(), // "sistema" ou nome do sistema externo
  userId: integer("user_id").notNull().references(() => users.id), // usuário que criou
  projectId: integer("project_id").references(() => projects.id), // FK para projetos (nullable por enquanto para migração)
});

export const taskItems = pgTable("task_items", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => tasks.id),
  title: text("title").notNull(),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  userId: integer("user_id").notNull().references(() => users.id),
});

export const timeEntries = pgTable("time_entries", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull().references(() => tasks.id),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in seconds
  isRunning: boolean("is_running").notNull().default(false),
  notes: text("notes"), // observações
  createdAt: timestamp("created_at").notNull().defaultNow(),
  userId: integer("user_id").notNull().references(() => users.id),
});

// Configurações de integração WhatsApp (sistema single-user)
export const whatsappIntegrations = pgTable("whatsapp_integrations", {
  id: serial("id").primaryKey(),
  instanceName: text("instance_name").notNull(), // nome da instância Evolution API
  apiUrl: text("api_url").notNull(), // URL da Evolution API
  apiKey: text("api_key").notNull(), // chave de acesso
  phoneNumber: text("phone_number").notNull(), // número conectado
  isActive: boolean("is_active").notNull().default(true),
  webhookUrl: text("webhook_url"), // URL para receber webhooks
  // Configuração por números individuais
  authorizedNumbers: text("authorized_numbers"), // números autorizados (JSON array: ["5531999999999@c.us"])
  restrictToNumbers: boolean("restrict_to_numbers").notNull().default(true), // filtrar apenas mensagens dos números autorizados
  // Configuração por grupo
  allowedGroupJid: text("allowed_group_jid"), // JID do grupo autorizado (ex: 120363419788242278@g.us)
  responseMode: text("response_mode").notNull().default("individual"), // "individual" ou "group"
  lastConnection: timestamp("last_connection"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Log de comandos e mensagens WhatsApp - Apenas números individuais
export const whatsappLogs = pgTable("whatsapp_logs", {
  id: serial("id").primaryKey(),
  integrationId: integer("integration_id").notNull().references(() => whatsappIntegrations.id),
  logType: text("log_type").notNull(),
  message: text("message").notNull(),
  metadata: text("metadata"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Configurações de notificações automáticas
export const notificationSettings = pgTable("notification_settings", {
  id: serial("id").primaryKey(),
  enableDailyReport: boolean("enable_daily_report").notNull().default(false),
  dailyReportTime: text("daily_report_time").default("18:00"), // formato HH:MM
  enableWeeklyReport: boolean("enable_weekly_report").notNull().default(false),
  weeklyReportDay: integer("weekly_report_day").default(5), // 0=domingo, 5=sexta
  enableDeadlineReminders: boolean("enable_deadline_reminders").notNull().default(true),
  reminderHoursBefore: integer("reminder_hours_before").default(24), // horas antes do deadline
  enableTimerReminders: boolean("enable_timer_reminders").notNull().default(false),
  timerReminderInterval: integer("timer_reminder_interval").default(120), // minutos
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Schema para criação de usuário
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  resetToken: true,
  resetTokenExpiry: true,
  lastLogin: true,
}).extend({
  username: z.string().min(3, "Username deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  email: z.string().email("Email deve ser válido"),
  fullName: z.string().min(2, "Nome completo deve ter pelo menos 2 caracteres"),
  role: z.enum(["admin", "user"]).default("user"),
});

// Schema para login
export const loginSchema = z.object({
  username: z.string().min(1, "Username é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

// Schema para reset de senha
export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
  newPassword: z.string().min(6, "Nova senha deve ter pelo menos 6 caracteres"),
});

// Schema para criação de usuário pelo admin
export const createUserByAdminSchema = z.object({
  username: z.string().min(3, "Username deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email deve ser válido"),
  fullName: z.string().min(2, "Nome completo deve ter pelo menos 2 caracteres"),
  role: z.enum(["admin", "user"]).default("user"),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
}).extend({
  estimatedHours: z.number().nullable().optional(),
  deadline: z.string().nullable().optional().transform((val) => val ? new Date(val) : null),
  isActive: z.boolean().optional().default(true),
  source: z.string().min(1, "Origem da tarefa é obrigatória"), // obrigatório
  userId: z.number().min(1, "ID do usuário é obrigatório"),
  projectId: z.number().min(1, "Projeto é obrigatório"), // FK obrigatória
});

export const insertTaskItemSchema = createInsertSchema(taskItems).omit({
  id: true,
  createdAt: true,
}).extend({
  userId: z.number().min(1, "ID do usuário é obrigatório"),
});

export const insertTimeEntrySchema = createInsertSchema(timeEntries).omit({
  id: true,
  createdAt: true,
}).extend({
  startTime: z.union([z.date(), z.string()]).transform(val => typeof val === 'string' ? new Date(val) : val),
  endTime: z.union([z.date(), z.string(), z.null()]).nullable().optional().transform(val => {
    if (!val) return null;
    return typeof val === 'string' ? new Date(val) : val;
  }),
  userId: z.number().min(1, "ID do usuário é obrigatório"),
});

export const updateTimeEntrySchema = createInsertSchema(timeEntries).omit({
  id: true,
  createdAt: true,
}).extend({
  startTime: z.union([z.date(), z.string()]).transform(val => typeof val === 'string' ? new Date(val) : val).optional(),
  endTime: z.union([z.date(), z.string(), z.null()]).nullable().optional().transform(val => {
    if (!val) return null;
    return typeof val === 'string' ? new Date(val) : val;
  }),
}).partial();

// ===== SCHEMAS ZOD PARA TIMES E PROJETOS =====

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Nome do time é obrigatório"),
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertTeamManagerSchema = createInsertSchema(teamManagers).omit({
  id: true,
  assignedAt: true,
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(1, "Nome do projeto é obrigatório"),
});

export const insertProjectTeamSchema = createInsertSchema(projectTeams).omit({
  id: true,
  assignedAt: true,
});

// Schemas para WhatsApp Integration
export const insertWhatsappIntegrationSchema = createInsertSchema(whatsappIntegrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  apiUrl: z.string().url("URL da Evolution API deve ser válida"),
  phoneNumber: z.string().min(10, "Número de telefone deve ter pelo menos 10 dígitos"),
  authorizedNumbers: z.string().optional().refine((val) => {
    if (!val) return true;
    try {
      const numbers = JSON.parse(val);
      return Array.isArray(numbers) && numbers.every(n => typeof n === 'string' && n.includes('@c.us'));
    } catch {
      return false;
    }
  }, "Deve ser um JSON array de números válidos (ex: [\"5599999999999@c.us\"])"),

});

export const insertWhatsappLogSchema = createInsertSchema(whatsappLogs).omit({
  id: true,
  timestamp: true,
});

export const insertNotificationSettingsSchema = createInsertSchema(notificationSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dailyReportTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Formato deve ser HH:MM"),
  weeklyReportDay: z.number().min(0).max(6),
  reminderHoursBefore: z.number().min(1).max(168), // máximo 1 semana
  timerReminderInterval: z.number().min(5).max(480), // 5 min a 8 horas
});

// Tipos para exportação
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertTaskItem = z.infer<typeof insertTaskItemSchema>;
export type TaskItem = typeof taskItems.$inferSelect;

export type InsertTimeEntry = z.infer<typeof insertTimeEntrySchema>;
export type TimeEntry = typeof timeEntries.$inferSelect;
export type UpdateTimeEntry = z.infer<typeof updateTimeEntrySchema>;

export interface TimeEntryWithTask extends TimeEntry {
  task: Task;
}

export interface TaskWithStats extends Task {
  totalTime: number;
  activeEntries: number;
  items?: TaskItem[];
}

export type InsertTeam = z.infer<typeof insertTeamSchema>;
export type Team = typeof teams.$inferSelect;

export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;
export type TeamMember = typeof teamMembers.$inferSelect;

export type InsertTeamManager = z.infer<typeof insertTeamManagerSchema>;
export type TeamManager = typeof teamManagers.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertProjectTeam = z.infer<typeof insertProjectTeamSchema>;
export type ProjectTeam = typeof projectTeams.$inferSelect;

export type InsertWhatsappIntegration = z.infer<typeof insertWhatsappIntegrationSchema>;
export type WhatsappIntegration = typeof whatsappIntegrations.$inferSelect;

export type InsertWhatsappLog = z.infer<typeof insertWhatsappLogSchema>;
export type WhatsappLog = typeof whatsappLogs.$inferSelect;

export type InsertNotificationSettings = z.infer<typeof insertNotificationSettingsSchema>;
export type NotificationSettings = typeof notificationSettings.$inferSelect;
