import { 
  users, activities, availability, resources, personalityQuestions, userAnswers, matches,
  type User, type InsertUser, type Activity, type InsertActivity,
  type Availability, type InsertAvailability, type Resource, type InsertResource,
  type PersonalityQuestion, type InsertPersonalityQuestion,
  type UserAnswer, type InsertUserAnswer, type Match, type InsertMatch,
  type UserWithDetails, type MatchWithDetails
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray } from "drizzle-orm";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getUserWithDetails(id: number): Promise<UserWithDetails | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const userActivities = await this.getActivitiesByUser(id);
    const userAvailability = await this.getAvailabilityByUser(id);
    const userResources = await this.getResourcesByUser(id);

    return {
      ...user,
      activities: userActivities,
      availability: userAvailability,
      resources: userResources
    };
  }

  async getActivitiesByUser(userId: number): Promise<Activity[]> {
    return await db.select().from(activities).where(eq(activities.userId, userId));
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values(insertActivity)
      .returning();
    return activity;
  }

  async updateActivity(id: number, updates: Partial<InsertActivity>): Promise<Activity | undefined> {
    const [activity] = await db
      .update(activities)
      .set(updates)
      .where(eq(activities.id, id))
      .returning();
    return activity || undefined;
  }

  async deleteActivity(id: number): Promise<boolean> {
    const result = await db.delete(activities).where(eq(activities.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getAllActiveActivities(): Promise<Activity[]> {
    return await db.select().from(activities).where(eq(activities.isActive, true));
  }

  async getAvailabilityByUser(userId: number): Promise<Availability[]> {
    return await db.select().from(availability).where(eq(availability.userId, userId));
  }

  async setAvailability(availabilityList: InsertAvailability[]): Promise<Availability[]> {
    if (availabilityList.length === 0) return [];
    
    const userId = availabilityList[0].userId;
    
    // Delete existing availability for the user
    await db.delete(availability).where(eq(availability.userId, userId));
    
    // Insert new availability data
    const newAvailability = await db
      .insert(availability)
      .values(availabilityList)
      .returning();
    
    return newAvailability;
  }

  async getResourcesByUser(userId: number): Promise<Resource | undefined> {
    const [resource] = await db.select().from(resources).where(eq(resources.userId, userId));
    return resource || undefined;
  }

  async setResources(insertResource: InsertResource): Promise<Resource> {
    // Try to update existing resource first
    const [existingResource] = await db
      .update(resources)
      .set(insertResource)
      .where(eq(resources.userId, insertResource.userId))
      .returning();

    if (existingResource) {
      return existingResource;
    }

    // If no existing resource, insert new one
    const [newResource] = await db
      .insert(resources)
      .values(insertResource)
      .returning();
    
    return newResource;
  }

  async getAllQuestions(): Promise<PersonalityQuestion[]> {
    return await db.select().from(personalityQuestions);
  }

  async saveUserAnswer(insertAnswer: InsertUserAnswer): Promise<UserAnswer> {
    const [answer] = await db
      .insert(userAnswers)
      .values(insertAnswer)
      .returning();
    return answer;
  }

  async getUserAnswers(userId: number): Promise<UserAnswer[]> {
    return await db.select().from(userAnswers).where(eq(userAnswers.userId, userId));
  }

  async updateUserPersonality(userId: number, personality: {
    personalityType: string;
    personalityDescription: string;
    personalityTraits: any;
  }): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({
        personalityType: personality.personalityType,
        personalityDescription: personality.personalityDescription,
        personalityTraits: personality.personalityTraits,
        quizCompleted: true
      })
      .where(eq(users.id, userId))
      .returning();
    
    return user || undefined;
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const [match] = await db
      .insert(matches)
      .values(insertMatch)
      .returning();
    return match;
  }

  async getMatchesForUser(userId: number): Promise<MatchWithDetails[]> {
    const userMatches = await db
      .select({
        match: matches,
        matchedUser: users,
        activity: activities
      })
      .from(matches)
      .innerJoin(users, eq(matches.matchedUserId, users.id))
      .innerJoin(activities, eq(matches.activityId, activities.id))
      .where(eq(matches.userId, userId));

    return userMatches.map(({ match, matchedUser, activity }) => ({
      ...match,
      matchedUser,
      activity,
      matchReason: this.generateMatchReason(matchedUser, activity)
    }));
  }

  private generateMatchReason(user: User, activity: Activity): string {
    const reasons = [];
    
    if (user.personalityType) {
      reasons.push(`compatible ${user.personalityType.toLowerCase()} personality`);
    }
    
    reasons.push(`shared interest in ${activity.category.toLowerCase()}`);
    
    if (activity.skillLevel !== 'all') {
      reasons.push(`matching ${activity.skillLevel} skill level`);
    }

    return reasons.length > 1 
      ? `${reasons.slice(0, -1).join(", ")} and ${reasons[reasons.length - 1]}`
      : reasons[0] || `both interested in ${activity.name}`;
  }

  async updateMatchStatus(matchId: number, status: string): Promise<Match | undefined> {
    const [match] = await db
      .update(matches)
      .set({ status })
      .where(eq(matches.id, matchId))
      .returning();
    
    return match || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Enhanced matching with strict activity and availability compatibility
  async findStrictMatches(userId: number): Promise<MatchWithDetails[]> {
    // Get user's complete profile
    const userProfile = await this.getUserWithDetails(userId);
    if (!userProfile) return [];

    // Get user's available time slots
    const userAvailableSlots = userProfile.availability
      .filter(a => a.isAvailable)
      .map(a => `${a.dayOfWeek}-${a.timeSlot}`);

    if (userAvailableSlots.length === 0) return [];

    // Get all other users with their profiles
    const allUsers = await this.getAllUsers();
    const otherUsers = allUsers.filter(u => u.id !== userId && u.quizCompleted);
    
    const strictMatches: MatchWithDetails[] = [];

    for (const otherUser of otherUsers) {
      // Get other user's availability - NON-NEGOTIABLE
      const otherAvailability = await this.getAvailabilityByUser(otherUser.id);
      const otherAvailableSlots = otherAvailability
        .filter(a => a.isAvailable)
        .map(a => `${a.dayOfWeek}-${a.timeSlot}`);

      // Check for availability overlap - REQUIRED
      const hasAvailabilityOverlap = userAvailableSlots.some(slot => 
        otherAvailableSlots.includes(slot)
      );

      if (!hasAvailabilityOverlap) continue; // Skip if no time compatibility

      // Get other user's activities - NON-NEGOTIABLE
      const otherActivities = await this.getActivitiesByUser(otherUser.id);
      const activeOtherActivities = otherActivities.filter(a => a.isActive);

      // Check for activity compatibility - REQUIRED
      for (const otherActivity of activeOtherActivities) {
        const hasActivityCompatibility = userProfile.activities.some(userActivity => 
          userActivity.category === otherActivity.category ||
          (otherActivity.skillLevel === 'all' || userActivity.skillLevel === 'all' || 
           userActivity.skillLevel === otherActivity.skillLevel)
        );

        if (!hasActivityCompatibility) continue; // Skip if no activity compatibility

        // Calculate personality compatibility (nice to have, but not blocking)
        let personalityScore = 50; // default
        if (userProfile.personalityTraits && otherUser.personalityTraits) {
          personalityScore = this.calculatePersonalityCompatibility(
            userProfile.personalityTraits, 
            otherUser.personalityTraits
          );
        }

        // Create match with high base score since requirements are met
        const compatibilityScore = Math.min(95, 70 + Math.round(personalityScore * 0.25));

        const match: MatchWithDetails = {
          id: 0, // Will be set when saved
          userId,
          matchedUserId: otherUser.id,
          activityId: otherActivity.id,
          compatibilityScore,
          status: "pending",
          matchedAt: new Date(),
          matchedUser: otherUser,
          activity: otherActivity,
          matchReason: `Guaranteed availability overlap and ${otherActivity.category} activity compatibility`
        };

        strictMatches.push(match);
      }
    }

    // Sort by compatibility score and return top matches
    return strictMatches
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, 10);
  }

  private calculatePersonalityCompatibility(traits1: any, traits2: any): number {
    const traitKeys = ['extroversion', 'adventure', 'planning', 'creativity', 'empathy'];
    let totalDifference = 0;
    let validTraits = 0;

    traitKeys.forEach(trait => {
      const value1 = traits1[trait] || 50;
      const value2 = traits2[trait] || 50;
      totalDifference += Math.abs(value1 - value2);
      validTraits++;
    });

    if (validTraits === 0) return 50;
    const averageDifference = totalDifference / validTraits;
    return Math.max(0, Math.round(100 - averageDifference));
  }
}