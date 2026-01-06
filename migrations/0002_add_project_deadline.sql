CREATE TABLE IF NOT EXISTS "project_teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"project_id" integer NOT NULL,
	"team_id" integer NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "projects" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_personal" boolean DEFAULT false NOT NULL,
	"estimated_hours" integer,
	"deadline" timestamp,
	"owner_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "estimated_hours" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "deadline" timestamp;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "team_managers" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "team_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "estimated_hours" integer;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "deadline" timestamp;
--> statement-breakpoint
ALTER TABLE "notification_settings" DROP CONSTRAINT IF EXISTS "notification_settings_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "whatsapp_integrations" DROP CONSTRAINT IF EXISTS "whatsapp_integrations_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "task_items" ADD COLUMN IF NOT EXISTS "user_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "source" text NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "user_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "project_id" integer;--> statement-breakpoint
ALTER TABLE "time_entries" ADD COLUMN IF NOT EXISTS "user_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "full_name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "must_reset_password" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reset_token_expiry" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "api_key" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "whatsapp_integrations" ADD COLUMN IF NOT EXISTS "authorized_numbers" text;--> statement-breakpoint
ALTER TABLE "whatsapp_integrations" ADD COLUMN IF NOT EXISTS "restrict_to_numbers" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "whatsapp_integrations" ADD COLUMN IF NOT EXISTS "response_mode" text DEFAULT 'individual' NOT NULL;--> statement-breakpoint
ALTER TABLE "whatsapp_logs" ADD COLUMN IF NOT EXISTS "log_type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "whatsapp_logs" ADD COLUMN IF NOT EXISTS "message" text NOT NULL;--> statement-breakpoint
ALTER TABLE "whatsapp_logs" ADD COLUMN IF NOT EXISTS "metadata" text;--> statement-breakpoint
ALTER TABLE "whatsapp_logs" ADD COLUMN IF NOT EXISTS "timestamp" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "project_teams" ADD CONSTRAINT "project_teams_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_teams" ADD CONSTRAINT "project_teams_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_managers" ADD CONSTRAINT "team_managers_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_managers" ADD CONSTRAINT "team_managers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_items" ADD CONSTRAINT "task_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_entries" ADD CONSTRAINT "time_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_settings" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "whatsapp_integrations" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "whatsapp_integrations" DROP COLUMN "allowed_group_name";--> statement-breakpoint
ALTER TABLE "whatsapp_integrations" DROP COLUMN "restrict_to_group";--> statement-breakpoint
ALTER TABLE "whatsapp_logs" DROP COLUMN "message_id";--> statement-breakpoint
ALTER TABLE "whatsapp_logs" DROP COLUMN "message_type";--> statement-breakpoint
ALTER TABLE "whatsapp_logs" DROP COLUMN "message_content";--> statement-breakpoint
ALTER TABLE "whatsapp_logs" DROP COLUMN "command";--> statement-breakpoint
ALTER TABLE "whatsapp_logs" DROP COLUMN "response";--> statement-breakpoint
ALTER TABLE "whatsapp_logs" DROP COLUMN "success";--> statement-breakpoint
ALTER TABLE "whatsapp_logs" DROP COLUMN "error_message";--> statement-breakpoint
ALTER TABLE "whatsapp_logs" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_api_key_unique" UNIQUE("api_key");