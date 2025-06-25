import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  profilePicture: text("profile_picture"),
  personalityType: text("personality_type"),
  personalityDescription: text("personality_description"),
  personalityTraits: jsonb("personality_traits").$type<{
    extroversion: number;
    adventure: number;
    planning: number;
    creativity: number;
    empathy: number;
  }>(),
  quizCompleted: boolean("quiz_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  skillLevel: text("skill_level"), // beginner, intermediate, advanced, all
  maxParticipants: integer("max_participants"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const availability = pgTable("availability", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  dayOfWeek: text("day_of_week").notNull(), // monday, tuesday, etc.
  timeSlot: text("time_slot").notNull(), // morning, afternoon, evening
  isAvailable: boolean("is_available").default(true),
});

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  hasVehicle: boolean("has_vehicle").default(false),
  budgetMin: integer("budget_min"),
  budgetMax: integer("budget_max"),
  canHost: boolean("can_host").default(false),
  location: text("location"),
});

export const personalityQuestions = pgTable("personality_questions", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  options: jsonb("options").$type<Array<{
    text: string;
    subtext: string;
    trait: string;
    value: number;
  }>>(),
  emoji: text("emoji"),
  category: text("category").notNull(),
});

export const userAnswers = pgTable("user_answers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  questionId: integer("question_id").notNull().references(() => personalityQuestions.id),
  selectedOption: integer("selected_option").notNull(),
  answeredAt: timestamp("answered_at").defaultNow(),
});

export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  matchedUserId: integer("matched_user_id").notNull().references(() => users.id),
  activityId: integer("activity_id").notNull().references(() => activities.id),
  compatibilityScore: integer("compatibility_score").notNull(),
  status: text("status").default("pending"), // pending, connected, skipped
  matchedAt: timestamp("matched_at").defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertActivitySchema = createInsertSchema(activities).omit({
  id: true,
  createdAt: true,
});

export const insertAvailabilitySchema = createInsertSchema(availability).omit({
  id: true,
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
});

export const insertPersonalityQuestionSchema = createInsertSchema(personalityQuestions).omit({
  id: true,
});

export const insertUserAnswerSchema = createInsertSchema(userAnswers).omit({
  id: true,
  answeredAt: true,
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  matchedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Activity = typeof activities.$inferSelect;
export type InsertActivity = z.infer<typeof insertActivitySchema>;

export type Availability = typeof availability.$inferSelect;
export type InsertAvailability = z.infer<typeof insertAvailabilitySchema>;

export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;

export type PersonalityQuestion = typeof personalityQuestions.$inferSelect;
export type InsertPersonalityQuestion = z.infer<typeof insertPersonalityQuestionSchema>;

export type UserAnswer = typeof userAnswers.$inferSelect;
export type InsertUserAnswer = z.infer<typeof insertUserAnswerSchema>;

export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;

// Extended types for frontend
export type UserWithDetails = User & {
  activities: Activity[];
  availability: Availability[];
  resources: Resource | null;
};

export type MatchWithDetails = Match & {
  matchedUser: User;
  activity: Activity;
  distance?: number;
  mutualConnections?: number;
  matchReason?: string;
};
