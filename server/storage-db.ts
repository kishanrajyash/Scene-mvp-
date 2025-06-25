import { 
  users, activities, availability, resources, personalityQuestions, userAnswers, matches,
  units, unitMembers, scenes, sceneParticipants, analyticsEvents,
  type User, type InsertUser, type Activity, type InsertActivity,
  type Availability, type InsertAvailability, type Resource, type InsertResource,
  type PersonalityQuestion, type InsertPersonalityQuestion,
  type UserAnswer, type InsertUserAnswer, type Match, type InsertMatch,
  type Unit, type InsertUnit, type UnitMember, type InsertUnitMember,
  type Scene, type InsertScene, type SceneParticipant, type InsertSceneParticipant,
  type AnalyticsEvent, type InsertAnalyticsEvent,
  type UserWithDetails, type MatchWithDetails, type UnitWithDetails, type SceneWithDetails
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, or, exists } from "drizzle-orm";
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

  // Unit operations
  async createUnit(insertUnit: InsertUnit): Promise<Unit> {
    const [unit] = await db
      .insert(units)
      .values(insertUnit)
      .returning();
    
    // Add creator as first member
    await db.insert(unitMembers).values({
      unitId: unit.id,
      userId: unit.createdBy,
      role: "creator"
    });

    return unit;
  }

  async getUserUnits(userId: number): Promise<UnitWithDetails[]> {
    try {
      console.log('Getting units for user:', userId);
      // Get units where user is creator
      const userUnits = await db
        .select()
        .from(units)
        .where(eq(units.createdBy, userId));

      console.log('Found units:', userUnits);

      if (userUnits.length === 0) {
        return [];
      }

      const result: UnitWithDetails[] = [];

      for (const unit of userUnits) {
        // Get creator info
        const creator = await this.getUser(unit.createdBy);
        if (!creator) continue;

        // Get all members for this unit
        const members = await db
          .select()
          .from(unitMembers)
          .where(eq(unitMembers.unitId, unit.id));

        const membersWithUsers = [];
        for (const member of members) {
          const memberUser = await this.getUser(member.userId);
          if (memberUser) {
            membersWithUsers.push({
              ...member,
              user: memberUser
            });
          }
        }

        result.push({
          ...unit,
          creator,
          members: membersWithUsers,
          memberCount: membersWithUsers.length
        });
      }

      return result;
    } catch (error) {
      console.error('Error fetching user units:', error);
      return [];
    }
  }

  async getUnitById(unitId: number): Promise<UnitWithDetails | undefined> {
    const unitData = await db
      .select({
        unit: units,
        creator: users,
        member: unitMembers,
        memberUser: users
      })
      .from(units)
      .innerJoin(users, eq(units.createdBy, users.id))
      .leftJoin(unitMembers, eq(unitMembers.unitId, units.id))
      .leftJoin(users, eq(unitMembers.userId, users.id))
      .where(eq(units.id, unitId));

    if (unitData.length === 0) return undefined;

    const unit = unitData[0].unit;
    const creator = unitData[0].creator;
    const members = unitData
      .filter(row => row.member && row.memberUser)
      .map(row => ({ ...row.member!, user: row.memberUser! }));

    return {
      ...unit,
      creator,
      members,
      memberCount: members.length
    };
  }

  async addUnitMember(insertUnitMember: InsertUnitMember): Promise<UnitMember> {
    const [member] = await db
      .insert(unitMembers)
      .values(insertUnitMember)
      .returning();
    return member;
  }

  async removeUnitMember(unitId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(unitMembers)
      .where(and(eq(unitMembers.unitId, unitId), eq(unitMembers.userId, userId)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Scene operations
  async createScene(insertScene: InsertScene): Promise<Scene> {
    const [scene] = await db
      .insert(scenes)
      .values(insertScene)
      .returning();
    
    // Auto-join creator to scene
    await db.insert(sceneParticipants).values({
      sceneId: scene.id,
      userId: scene.createdBy,
      status: "joined"
    });

    return scene;
  }

  async getActiveScenes(): Promise<SceneWithDetails[]> {
    const sceneData = await db
      .select({
        scene: scenes,
        creator: users,
        activity: activities,
        unit: units,
        participant: sceneParticipants,
        participantUser: users
      })
      .from(scenes)
      .innerJoin(users, eq(scenes.createdBy, users.id))
      .leftJoin(activities, eq(scenes.activityId, activities.id))
      .leftJoin(units, eq(scenes.unitId, units.id))
      .leftJoin(sceneParticipants, eq(sceneParticipants.sceneId, scenes.id))
      .leftJoin(users, eq(sceneParticipants.userId, users.id))
      .where(eq(scenes.status, "open"));

    // Group by scene
    const scenesMap = new Map<number, SceneWithDetails>();
    
    sceneData.forEach(({ scene, creator, activity, unit, participant, participantUser }) => {
      if (!scenesMap.has(scene.id)) {
        scenesMap.set(scene.id, {
          ...scene,
          creator,
          activity: activity || undefined,
          unit: unit || undefined,
          participants: [],
          participantCount: 0
        });
      }
      
      const sceneDetails = scenesMap.get(scene.id)!;
      if (participant && participantUser && participant.status === "joined") {
        sceneDetails.participants.push({ ...participant, user: participantUser });
        sceneDetails.participantCount = sceneDetails.participants.length;
      }
    });

    return Array.from(scenesMap.values());
  }

  async getSceneById(sceneId: number): Promise<SceneWithDetails | undefined> {
    const sceneData = await db
      .select({
        scene: scenes,
        creator: users,
        activity: activities,
        unit: units,
        participant: sceneParticipants,
        participantUser: users
      })
      .from(scenes)
      .innerJoin(users, eq(scenes.createdBy, users.id))
      .leftJoin(activities, eq(scenes.activityId, activities.id))
      .leftJoin(units, eq(scenes.unitId, units.id))
      .leftJoin(sceneParticipants, eq(sceneParticipants.sceneId, scenes.id))
      .leftJoin(users, eq(sceneParticipants.userId, users.id))
      .where(eq(scenes.id, sceneId));

    if (sceneData.length === 0) return undefined;

    const scene = sceneData[0].scene;
    const creator = sceneData[0].creator;
    const activity = sceneData[0].activity;
    const unit = sceneData[0].unit;
    const participants = sceneData
      .filter(row => row.participant && row.participantUser && row.participant.status === "joined")
      .map(row => ({ ...row.participant!, user: row.participantUser! }));

    return {
      ...scene,
      creator,
      activity: activity || undefined,
      unit: unit || undefined,
      participants,
      participantCount: participants.length
    };
  }

  async joinScene(insertSceneParticipant: InsertSceneParticipant): Promise<SceneParticipant> {
    const [participant] = await db
      .insert(sceneParticipants)
      .values(insertSceneParticipant)
      .returning();
    return participant;
  }

  async leaveScene(sceneId: number, userId: number): Promise<boolean> {
    const [updated] = await db
      .update(sceneParticipants)
      .set({ status: "left" })
      .where(and(eq(sceneParticipants.sceneId, sceneId), eq(sceneParticipants.userId, userId)))
      .returning();
    return !!updated;
  }

  async getUserScenes(userId: number): Promise<SceneWithDetails[]> {
    const userSceneData = await db
      .select({
        scene: scenes,
        creator: users,
        activity: activities,
        unit: units,
        participant: sceneParticipants,
        participantUser: users
      })
      .from(sceneParticipants)
      .innerJoin(scenes, eq(sceneParticipants.sceneId, scenes.id))
      .innerJoin(users, eq(scenes.createdBy, users.id))
      .leftJoin(activities, eq(scenes.activityId, activities.id))
      .leftJoin(units, eq(scenes.unitId, units.id))
      .leftJoin(sceneParticipants, eq(sceneParticipants.sceneId, scenes.id))
      .leftJoin(users, eq(sceneParticipants.userId, users.id))
      .where(and(eq(sceneParticipants.userId, userId), eq(sceneParticipants.status, "joined")));

    // Group by scene and return unique scenes
    const scenesMap = new Map<number, SceneWithDetails>();
    
    userSceneData.forEach(({ scene, creator, activity, unit, participant, participantUser }) => {
      if (!scenesMap.has(scene.id)) {
        scenesMap.set(scene.id, {
          ...scene,
          creator,
          activity: activity || undefined,
          unit: unit || undefined,
          participants: [],
          participantCount: 0
        });
      }
      
      const sceneDetails = scenesMap.get(scene.id)!;
      if (participant && participantUser && participant.status === "joined") {
        sceneDetails.participants.push({ ...participant, user: participantUser });
        sceneDetails.participantCount = sceneDetails.participants.length;
      }
    });

    return Array.from(scenesMap.values());
  }

  // Analytics operations
  async logEvent(insertAnalyticsEvent: InsertAnalyticsEvent): Promise<AnalyticsEvent> {
    const [event] = await db
      .insert(analyticsEvents)
      .values(insertAnalyticsEvent)
      .returning();
    return event;
  }

  async getAnalytics(userId?: number): Promise<AnalyticsEvent[]> {
    if (userId) {
      return await db.select().from(analyticsEvents).where(eq(analyticsEvents.userId, userId));
    }
    return await db.select().from(analyticsEvents);
  }
}