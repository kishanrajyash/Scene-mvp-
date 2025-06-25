import { 
  users, activities, availability, resources, personalityQuestions, userAnswers, matches,
  type User, type InsertUser, type Activity, type InsertActivity,
  type Availability, type InsertAvailability, type Resource, type InsertResource,
  type PersonalityQuestion, type InsertPersonalityQuestion,
  type UserAnswer, type InsertUserAnswer, type Match, type InsertMatch,
  type UserWithDetails, type MatchWithDetails
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  getUserWithDetails(id: number): Promise<UserWithDetails | undefined>;

  // Activity operations
  getActivitiesByUser(userId: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  updateActivity(id: number, updates: Partial<InsertActivity>): Promise<Activity | undefined>;
  deleteActivity(id: number): Promise<boolean>;
  getAllActiveActivities(): Promise<Activity[]>;

  // Availability operations
  getAvailabilityByUser(userId: number): Promise<Availability[]>;
  setAvailability(availability: InsertAvailability[]): Promise<Availability[]>;

  // Resource operations
  getResourcesByUser(userId: number): Promise<Resource | undefined>;
  setResources(resources: InsertResource): Promise<Resource>;

  // Personality operations
  getAllQuestions(): Promise<PersonalityQuestion[]>;
  saveUserAnswer(answer: InsertUserAnswer): Promise<UserAnswer>;
  getUserAnswers(userId: number): Promise<UserAnswer[]>;
  updateUserPersonality(userId: number, personality: {
    personalityType: string;
    personalityDescription: string;
    personalityTraits: any;
  }): Promise<User | undefined>;

  // Matching operations
  createMatch(match: InsertMatch): Promise<Match>;
  getMatchesForUser(userId: number): Promise<MatchWithDetails[]>;
  updateMatchStatus(matchId: number, status: string): Promise<Match | undefined>;
  getAllUsers(): Promise<User[]>;

  // Unit operations
  createUnit(unit: InsertUnit): Promise<Unit>;
  getUserUnits(userId: number): Promise<UnitWithDetails[]>;
  getUnitById(unitId: number): Promise<UnitWithDetails | undefined>;
  addUnitMember(unitMember: InsertUnitMember): Promise<UnitMember>;
  removeUnitMember(unitId: number, userId: number): Promise<boolean>;

  // Scene operations
  createScene(scene: InsertScene): Promise<Scene>;
  getActiveScenes(): Promise<SceneWithDetails[]>;
  getSceneById(sceneId: number): Promise<SceneWithDetails | undefined>;
  joinScene(sceneParticipant: InsertSceneParticipant): Promise<SceneParticipant>;
  leaveScene(sceneId: number, userId: number): Promise<boolean>;
  getUserScenes(userId: number): Promise<SceneWithDetails[]>;

  // Analytics operations
  logEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent>;
  getAnalytics(userId?: number): Promise<AnalyticsEvent[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private activities: Map<number, Activity> = new Map();
  private availability: Map<number, Availability[]> = new Map();
  private resources: Map<number, Resource> = new Map();
  private questions: Map<number, PersonalityQuestion> = new Map();
  private userAnswers: Map<number, UserAnswer[]> = new Map();
  private matches: Map<number, Match> = new Map();
  
  private currentUserId = 1;
  private currentActivityId = 1;
  private currentAvailabilityId = 1;
  private currentResourceId = 1;
  private currentQuestionId = 1;
  private currentAnswerId = 1;
  private currentMatchId = 1;

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Create default user
    const defaultUser: User = {
      id: 1,
      username: "sarahchen",
      email: "sarah@example.com",
      name: "Sarah Chen",
      profilePicture: "https://images.unsplash.com/photo-1494790108755-2616b7e85234?w=150&h=150&fit=crop&crop=face",
      personalityType: "The Explorer",
      personalityDescription: "Adventurous, curious, and loves trying new experiences",
      personalityTraits: {
        extroversion: 85,
        adventure: 75,
        planning: 60,
        creativity: 70,
        empathy: 80
      },
      quizCompleted: true,
      createdAt: new Date()
    };
    this.users.set(1, defaultUser);
    this.currentUserId = 2;

    // Create sample users for matching
    const sampleUsers: User[] = [
      {
        id: 2,
        username: "alexrivera",
        email: "alex@example.com",
        name: "Alex Rivera",
        profilePicture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        personalityType: "The Adventurer",
        personalityDescription: "Spontaneous and energetic outdoor enthusiast",
        personalityTraits: {
          extroversion: 90,
          adventure: 95,
          planning: 40,
          creativity: 60,
          empathy: 75
        },
        quizCompleted: true,
        createdAt: new Date()
      },
      {
        id: 3,
        username: "jamieliu",
        email: "jamie@example.com",
        name: "Jamie Liu",
        profilePicture: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
        personalityType: "The Curator",
        personalityDescription: "Thoughtful and appreciates quality experiences",
        personalityTraits: {
          extroversion: 65,
          adventure: 55,
          planning: 85,
          creativity: 90,
          empathy: 85
        },
        quizCompleted: true,
        createdAt: new Date()
      },
      {
        id: 4,
        username: "marcusthompson",
        email: "marcus@example.com",
        name: "Marcus Thompson",
        profilePicture: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
        personalityType: "The Strategist",
        personalityDescription: "Analytical thinker who enjoys mental challenges",
        personalityTraits: {
          extroversion: 70,
          adventure: 45,
          planning: 95,
          creativity: 65,
          empathy: 70
        },
        quizCompleted: true,
        createdAt: new Date()
      }
    ];

    sampleUsers.forEach(user => this.users.set(user.id, user));
    this.currentUserId = 5;

    // Initialize personality questions
    const questions: PersonalityQuestion[] = [
      {
        id: 1,
        question: "You're at a party where you don't know many people. What's your move?",
        emoji: "🎭",
        category: "social",
        options: [
          {
            text: "Find the host and introduce myself to new people",
            subtext: "I love meeting new faces and making connections!",
            trait: "extroversion",
            value: 4
          },
          {
            text: "Stick close to the few people I do know",
            subtext: "I prefer deeper conversations with familiar faces",
            trait: "extroversion",
            value: 2
          },
          {
            text: "Find a quiet corner and people-watch",
            subtext: "I enjoy observing and joining conversations naturally",
            trait: "extroversion",
            value: 1
          },
          {
            text: "Help with party activities or organizing",
            subtext: "I feel most comfortable when I'm being helpful",
            trait: "planning",
            value: 4
          }
        ]
      },
      {
        id: 2,
        question: "Your ideal weekend adventure would be:",
        emoji: "🗺️",
        category: "adventure",
        options: [
          {
            text: "Exploring a new hiking trail I found online",
            subtext: "Love discovering new places and challenges",
            trait: "adventure",
            value: 5
          },
          {
            text: "Visiting a museum or cultural exhibition",
            subtext: "I appreciate learning and thoughtful experiences",
            trait: "creativity",
            value: 4
          },
          {
            text: "Having a planned picnic in a familiar park",
            subtext: "I enjoy comfortable, well-organized activities",
            trait: "planning",
            value: 4
          },
          {
            text: "Staying home with a good book or hobby",
            subtext: "Sometimes the best adventures are quiet ones",
            trait: "extroversion",
            value: 1
          }
        ]
      },
      {
        id: 3,
        question: "When planning a group activity, you typically:",
        emoji: "📋",
        category: "planning",
        options: [
          {
            text: "Create a detailed itinerary with backup plans",
            subtext: "I want everyone to have the best experience",
            trait: "planning",
            value: 5
          },
          {
            text: "Suggest a few options and let the group decide",
            subtext: "Collaboration makes everything better",
            trait: "empathy",
            value: 4
          },
          {
            text: "Pick something spontaneous based on the mood",
            subtext: "The best moments are unplanned",
            trait: "adventure",
            value: 4
          },
          {
            text: "Research unique or creative alternatives",
            subtext: "Why do the same thing everyone else does?",
            trait: "creativity",
            value: 4
          }
        ]
      },
      {
        id: 4,
        question: "Your friend is going through a tough time. You:",
        emoji: "🤝",
        category: "empathy",
        options: [
          {
            text: "Drop everything to be there and listen",
            subtext: "Being present is the most important thing",
            trait: "empathy",
            value: 5
          },
          {
            text: "Offer practical help and solutions",
            subtext: "I want to actually solve their problems",
            trait: "planning",
            value: 3
          },
          {
            text: "Plan a fun distraction activity together",
            subtext: "Sometimes a good time is the best medicine",
            trait: "adventure",
            value: 3
          },
          {
            text: "Give them space but check in regularly",
            subtext: "I respect their process while staying supportive",
            trait: "empathy",
            value: 4
          }
        ]
      },
      {
        id: 5,
        question: "You discover a new hobby. Your approach is to:",
        emoji: "🎨",
        category: "creativity",
        options: [
          {
            text: "Dive deep and experiment with my own style",
            subtext: "I love putting my unique spin on things",
            trait: "creativity",
            value: 5
          },
          {
            text: "Take a structured class or workshop",
            subtext: "I learn best with proper guidance and structure",
            trait: "planning",
            value: 4
          },
          {
            text: "Find others to learn and practice with",
            subtext: "Everything's more fun with company",
            trait: "extroversion",
            value: 4
          },
          {
            text: "Research extensively before starting",
            subtext: "I want to understand it fully first",
            trait: "planning",
            value: 3
          }
        ]
      }
    ];

    questions.forEach(q => this.questions.set(q.id, q));
    this.currentQuestionId = 6;

    // Add sample activities for the default user
    const defaultActivities: Activity[] = [
      {
        id: 1,
        userId: 1,
        name: "Weekend Hiking",
        description: "Looking for hiking buddies for weekend trails around the city. All skill levels welcome!",
        category: "Outdoor",
        skillLevel: "all",
        maxParticipants: 6,
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 2,
        userId: 1,
        name: "Cooking Classes",
        description: "Want to learn new cuisines and cooking techniques with others who share the passion for food.",
        category: "Culinary",
        skillLevel: "beginner",
        maxParticipants: 4,
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 3,
        userId: 1,
        name: "Art Galleries",
        description: "Enjoy visiting art galleries and museums. Would love company for thoughtful discussions about art.",
        category: "Culture",
        skillLevel: "all",
        maxParticipants: 3,
        isActive: false,
        createdAt: new Date()
      },
      {
        id: 4,
        userId: 1,
        name: "Board Games",
        description: "Love strategy games and social gaming. Looking for regular game night participants.",
        category: "Games",
        skillLevel: "all",
        maxParticipants: 8,
        isActive: true,
        createdAt: new Date()
      }
    ];

    defaultActivities.forEach(activity => this.activities.set(activity.id, activity));
    this.currentActivityId = 5;

    // Add sample availability for default user
    const defaultAvailability: Availability[] = [
      { id: 1, userId: 1, dayOfWeek: "friday", timeSlot: "evening", isAvailable: true },
      { id: 2, userId: 1, dayOfWeek: "saturday", timeSlot: "afternoon", isAvailable: true },
      { id: 3, userId: 1, dayOfWeek: "sunday", timeSlot: "morning", isAvailable: true },
    ];

    this.availability.set(1, defaultAvailability);
    this.currentAvailabilityId = 4;

    // Add sample resources for default user
    const defaultResources: Resource = {
      id: 1,
      userId: 1,
      hasVehicle: true,
      budgetMin: 20,
      budgetMax: 50,
      canHost: false,
      location: "Downtown"
    };

    this.resources.set(1, defaultResources);
    this.currentResourceId = 2;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      personalityType: null,
      personalityDescription: null,
      personalityTraits: null,
      quizCompleted: false,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
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
    return Array.from(this.activities.values()).filter(activity => activity.userId === userId);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentActivityId++;
    const activity: Activity = {
      ...insertActivity,
      id,
      createdAt: new Date()
    };
    this.activities.set(id, activity);
    return activity;
  }

  async updateActivity(id: number, updates: Partial<InsertActivity>): Promise<Activity | undefined> {
    const activity = this.activities.get(id);
    if (!activity) return undefined;
    
    const updatedActivity = { ...activity, ...updates };
    this.activities.set(id, updatedActivity);
    return updatedActivity;
  }

  async deleteActivity(id: number): Promise<boolean> {
    return this.activities.delete(id);
  }

  async getAllActiveActivities(): Promise<Activity[]> {
    return Array.from(this.activities.values()).filter(activity => activity.isActive);
  }

  async getAvailabilityByUser(userId: number): Promise<Availability[]> {
    return this.availability.get(userId) || [];
  }

  async setAvailability(availabilityList: InsertAvailability[]): Promise<Availability[]> {
    const userId = availabilityList[0]?.userId;
    if (!userId) return [];

    const newAvailability = availabilityList.map(item => ({
      ...item,
      id: this.currentAvailabilityId++
    }));

    this.availability.set(userId, newAvailability);
    return newAvailability;
  }

  async getResourcesByUser(userId: number): Promise<Resource | undefined> {
    return this.resources.get(userId);
  }

  async setResources(insertResource: InsertResource): Promise<Resource> {
    const id = this.currentResourceId++;
    const resource: Resource = {
      ...insertResource,
      id
    };
    this.resources.set(insertResource.userId, resource);
    return resource;
  }

  async getAllQuestions(): Promise<PersonalityQuestion[]> {
    return Array.from(this.questions.values());
  }

  async saveUserAnswer(insertAnswer: InsertUserAnswer): Promise<UserAnswer> {
    const id = this.currentAnswerId++;
    const answer: UserAnswer = {
      ...insertAnswer,
      id,
      answeredAt: new Date()
    };

    const userAnswers = this.userAnswers.get(insertAnswer.userId) || [];
    userAnswers.push(answer);
    this.userAnswers.set(insertAnswer.userId, userAnswers);
    
    return answer;
  }

  async getUserAnswers(userId: number): Promise<UserAnswer[]> {
    return this.userAnswers.get(userId) || [];
  }

  async updateUserPersonality(userId: number, personality: {
    personalityType: string;
    personalityDescription: string;
    personalityTraits: any;
  }): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;

    const updatedUser = {
      ...user,
      ...personality,
      quizCompleted: true
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async createMatch(insertMatch: InsertMatch): Promise<Match> {
    const id = this.currentMatchId++;
    const match: Match = {
      ...insertMatch,
      id,
      matchedAt: new Date()
    };
    this.matches.set(id, match);
    return match;
  }

  async getMatchesForUser(userId: number): Promise<MatchWithDetails[]> {
    const userMatches = Array.from(this.matches.values()).filter(match => match.userId === userId);
    
    const matchesWithDetails: MatchWithDetails[] = [];
    
    for (const match of userMatches) {
      const matchedUser = await this.getUser(match.matchedUserId);
      const activity = this.activities.get(match.activityId);
      
      if (matchedUser && activity) {
        matchesWithDetails.push({
          ...match,
          matchedUser,
          activity,
          distance: Math.random() * 5 + 1, // Random distance for demo
          mutualConnections: Math.floor(Math.random() * 10),
          matchReason: this.generateMatchReason(matchedUser, activity)
        });
      }
    }
    
    return matchesWithDetails;
  }

  private generateMatchReason(user: User, activity: Activity): string {
    const reasons = [
      "Similar personality traits, matching schedule, shared interests",
      "High compatibility score, overlapping availability",
      "Both interested in similar activities, complementary personalities",
      "Shared values and lifestyle preferences"
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
  }

  async updateMatchStatus(matchId: number, status: string): Promise<Match | undefined> {
    const match = this.matches.get(matchId);
    if (!match) return undefined;
    
    const updatedMatch = { ...match, status };
    this.matches.set(matchId, updatedMatch);
    return updatedMatch;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
}

// Import database storage
import { DatabaseStorage } from "./storage-db";

// Use database storage instead of memory storage
export const storage = new DatabaseStorage();
