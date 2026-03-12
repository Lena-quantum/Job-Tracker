import { pgTable, serial, text, timestamp, integer, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const STATUSES = [
  "Bookmarked",
  "Applied",
  "Phone Screen",
  "Interviewing",
  "Offer",
  "Rejected",
  "Withdrawn",
] as const;

export const INTEREST_LEVELS = ["High", "Medium", "Low"] as const;

export const prospects = pgTable("prospects", {
  id: serial("id").primaryKey(),
  companyName: text("company_name").notNull(),
  roleTitle: text("role_title").notNull(),
  jobUrl: text("job_url"),
  status: text("status").notNull().default("Bookmarked"),
  interestLevel: text("interest_level").notNull().default("Medium"),
  notes: text("notes"),
  targetSalary: integer("target_salary"),
  applicationDeadline: date("application_deadline"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertProspectSchema = createInsertSchema(prospects).omit({
  id: true,
  createdAt: true,
}).extend({
  companyName: z.string().min(1, "Company name is required"),
  roleTitle: z.string().min(1, "Role title is required"),
  status: z.enum(STATUSES).default("Bookmarked"),
  interestLevel: z.enum(INTEREST_LEVELS).default("Medium"),
  jobUrl: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  targetSalary: z.preprocess(
    (val) => {
      if (val === "" || val === null || val === undefined) return null;
      const n = Number(val);
      if (isNaN(n) || n === 0) return null;
      return Math.round(n);
    },
    z
      .number()
      .int()
      .min(1, "Salary must be a positive number")
      .nullable()
      .optional(),
  ),
  applicationDeadline: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : String(val)),
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Deadline must be a valid date (YYYY-MM-DD)")
      .nullable()
      .optional(),
  ),
});

export type InsertProspect = z.infer<typeof insertProspectSchema>;
export type Prospect = typeof prospects.$inferSelect;
