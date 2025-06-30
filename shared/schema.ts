import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
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
  onboardingCompleted: boolean("onboarding_completed").default(false),
  currentMood: text("current_mood"),
  purpose: text("purpose"),
  offerNeed: text("offer_need"),
  helpfulnessScore: integer("helpfulness_score").default(0),
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

export const sceneAsks = pgTable("scene_asks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  mood: text("mood").notNull(),
  purpose: text("purpose").notNull(),
  timePreference: text("time_preference").notNull(),
  isActive: boolean("is_active").default(true),
  helpCount: integer("help_count").default(0),
  joinCount: integer("join_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const sceneResponses = pgTable("scene_responses", {
  id: serial("id").primaryKey(),
  sceneAskId: integer("scene_ask_id").notNull().references(() => sceneAsks.id),
  userId: integer("user_id").notNull().references(() => users.id),
  responseType: text("response_type").notNull(), // 'join' or 'help'
  message: text("message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userFeedback = pgTable("user_feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  targetUserId: integer("target_user_id").references(() => users.id),
  feedbackType: text("feedback_type").notNull(), // 'helpful', 'positive', 'negative'
  emoji: text("emoji").notNull(),
  context: text("context"), // 'scene_response', 'general_interaction'
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

export const units = pgTable("units", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  activityCategory: text("activity_category").notNull(),
  preferredDays: text("preferred_days"),
  preferredTimeSlots: text("preferred_time_slots"),
  maxMembers: integer("max_members").default(6),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const unitMembers = pgTable("unit_members", {
  id: serial("id").primaryKey(),
  unitId: integer("unit_id").notNull().references(() => units.id),
  userId: integer("user_id").notNull().references(() => users.id),
  joinedAt: timestamp("joined_at").defaultNow(),
  role: text("role").default("member"), // creator, member
});

export const scenes = pgTable("scenes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  activityId: integer("activity_id").references(() => activities.id),
  unitId: integer("unit_id").references(() => units.id),
  createdBy: integer("created_by").notNull().references(() => users.id),
  maxParticipants: integer("max_participants").default(10),
  scheduledDate: timestamp("scheduled_date"),
  location: text("location"),
  status: text("status").default("open"), // open, full, cancelled, completed
  createdAt: timestamp("created_at").defaultNow(),
});

export const sceneParticipants = pgTable("scene_participants", {
  id: serial("id").primaryKey(),
  sceneId: integer("scene_id").notNull().references(() => scenes.id),
  userId: integer("user_id").notNull().references(() => users.id),
  noteToOthers: text("note_to_others"),
  joinedAt: timestamp("joined_at").defaultNow(),
  status: text("status").default("joined"), // joined, left
});

export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  eventType: text("event_type").notNull(), // scene_created, scene_joined, unit_created, repeat_usage
  eventData: jsonb("event_data"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define relations
export const sceneAsksRelations = relations(sceneAsks, ({ one, many }) => ({
  user: one(users, {
    fields: [sceneAsks.userId],
    references: [users.id]
  }),
  responses: many(sceneResponses)
}));

export const sceneResponsesRelations = relations(sceneResponses, ({ one }) => ({
  sceneAsk: one(sceneAsks, {
    fields: [sceneResponses.sceneAskId],
    references: [sceneAsks.id]
  }),
  user: one(users, {
    fields: [sceneResponses.userId],
    references: [users.id]
  })
}));

export const userFeedbackRelations = relations(userFeedback, ({ one }) => ({
  user: one(users, {
    fields: [userFeedback.userId],
    references: [users.id],
    relationName: "givenFeedback"
  }),
  targetUser: one(users, {
    fields: [userFeedback.targetUserId],
    references: [users.id],
    relationName: "receivedFeedback"
  })
}));

export const usersRelations = relations(users, ({ many, one }) => ({
  activities: many(activities),
  availability: many(availability),
  resources: one(resources),
  userAnswers: many(userAnswers),
  matches: many(matches, { relationName: "userMatches" }),
  matchedWith: many(matches, { relationName: "matchedUserMatches" }),
  createdUnits: many(units),
  unitMemberships: many(unitMembers),
  createdScenes: many(scenes),
  sceneParticipations: many(sceneParticipants),
  analyticsEvents: many(analyticsEvents),
  sceneAsks: many(sceneAsks),
  sceneResponses: many(sceneResponses),
  givenFeedback: many(userFeedback, { relationName: "givenFeedback" }),
  receivedFeedback: many(userFeedback, { relationName: "receivedFeedback" })
}));

export const activitiesRelations = relations(activities, ({ one, many }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id]
  }),
  matches: many(matches)
}));

export const availabilityRelations = relations(availability, ({ one }) => ({
  user: one(users, {
    fields: [availability.userId],
    references: [users.id]
  })
}));

export const resourcesRelations = relations(resources, ({ one }) => ({
  user: one(users, {
    fields: [resources.userId],
    references: [users.id]
  })
}));

export const personalityQuestionsRelations = relations(personalityQuestions, ({ many }) => ({
  userAnswers: many(userAnswers)
}));

export const userAnswersRelations = relations(userAnswers, ({ one }) => ({
  user: one(users, {
    fields: [userAnswers.userId],
    references: [users.id]
  }),
  question: one(personalityQuestions, {
    fields: [userAnswers.questionId],
    references: [personalityQuestions.id]
  })
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  user: one(users, {
    fields: [matches.userId],
    references: [users.id],
    relationName: "userMatches"
  }),
  matchedUser: one(users, {
    fields: [matches.matchedUserId],
    references: [users.id],
    relationName: "matchedUserMatches"
  }),
  activity: one(activities, {
    fields: [matches.activityId],
    references: [activities.id]
  })
}));

export const unitsRelations = relations(units, ({ one, many }) => ({
  creator: one(users, {
    fields: [units.createdBy],
    references: [users.id]
  }),
  members: many(unitMembers),
  scenes: many(scenes)
}));

export const unitMembersRelations = relations(unitMembers, ({ one }) => ({
  unit: one(units, {
    fields: [unitMembers.unitId],
    references: [units.id]
  }),
  user: one(users, {
    fields: [unitMembers.userId],
    references: [users.id]
  })
}));

export const scenesRelations = relations(scenes, ({ one, many }) => ({
  creator: one(users, {
    fields: [scenes.createdBy],
    references: [users.id]
  }),
  activity: one(activities, {
    fields: [scenes.activityId],
    references: [activities.id]
  }),
  unit: one(units, {
    fields: [scenes.unitId],
    references: [units.id]
  }),
  participants: many(sceneParticipants)
}));

export const sceneParticipantsRelations = relations(sceneParticipants, ({ one }) => ({
  scene: one(scenes, {
    fields: [sceneParticipants.sceneId],
    references: [scenes.id]
  }),
  user: one(users, {
    fields: [sceneParticipants.userId],
    references: [users.id]
  })
}));

export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  user: one(users, {
    fields: [analyticsEvents.userId],
    references: [users.id]
  })
}));

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

export const insertUnitSchema = createInsertSchema(units).omit({
  id: true,
  createdAt: true,
});

export const insertUnitMemberSchema = createInsertSchema(unitMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertSceneSchema = createInsertSchema(scenes).omit({
  id: true,
  createdAt: true,
});

export const insertSceneParticipantSchema = createInsertSchema(sceneParticipants).omit({
  id: true,
  joinedAt: true,
});

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({
  id: true,
  createdAt: true,
});

export const insertSceneAskSchema = createInsertSchema(sceneAsks).omit({
  id: true,
  createdAt: true,
  helpCount: true,
  joinCount: true,
});

export const insertSceneResponseSchema = createInsertSchema(sceneResponses).omit({
  id: true,
  createdAt: true,
});

export const insertUserFeedbackSchema = createInsertSchema(userFeedback).omit({
  id: true,
  createdAt: true,
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

// New schema types
export type Unit = typeof units.$inferSelect;
export type InsertUnit = z.infer<typeof insertUnitSchema>;

export type UnitMember = typeof unitMembers.$inferSelect;
export type InsertUnitMember = z.infer<typeof insertUnitMemberSchema>;

export type Scene = typeof scenes.$inferSelect;
export type InsertScene = z.infer<typeof insertSceneSchema>;

export type SceneParticipant = typeof sceneParticipants.$inferSelect;
export type InsertSceneParticipant = z.infer<typeof insertSceneParticipantSchema>;

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;

// Complex types
export type UnitWithDetails = Unit & {
  creator: User;
  members: (UnitMember & { user: User })[];
  memberCount: number;
  category?: string;
  creatorId?: number;
};

export type SceneWithDetails = Scene & {
  creator: User;
  activity?: Activity;
  unit?: Unit;
  participants: (SceneParticipant & { user: User })[];
  participantCount: number;
};

// New types for social utility features
export type SceneAsk = typeof sceneAsks.$inferSelect;
export type InsertSceneAsk = z.infer<typeof insertSceneAskSchema>;

export type SceneResponse = typeof sceneResponses.$inferSelect;
export type InsertSceneResponse = z.infer<typeof insertSceneResponseSchema>;

export type UserFeedback = typeof userFeedback.$inferSelect;
export type InsertUserFeedback = z.infer<typeof insertUserFeedbackSchema>;

export type SceneAskWithDetails = SceneAsk & {
  user: User;
  responses: (SceneResponse & { user: User })[];
  responseCount: number;
};
