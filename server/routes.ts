import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertActivitySchema, insertAvailabilitySchema, 
  insertResourceSchema, insertUserAnswerSchema, insertMatchSchema,
  insertUnitSchema, insertSceneSchema, insertSceneParticipantSchema, insertAnalyticsEventSchema,
  type User, type Activity, type Match
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // User routes
  app.get("/api/user/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUserWithDetails(id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/user", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/user/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const user = await storage.updateUser(id, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Activity routes
  app.get("/api/activities/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const activities = await storage.getActivitiesByUser(userId);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/activities", async (req, res) => {
    try {
      const activityData = insertActivitySchema.parse(req.body);
      const activity = await storage.createActivity(activityData);
      res.status(201).json(activity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid activity data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/activities/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const activity = await storage.updateActivity(id, updates);
      if (!activity) {
        return res.status(404).json({ message: "Activity not found" });
      }
      res.json(activity);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/activities/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteActivity(id);
      if (!deleted) {
        return res.status(404).json({ message: "Activity not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Availability routes
  app.get("/api/availability/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const availability = await storage.getAvailabilityByUser(userId);
      res.json(availability);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/availability", async (req, res) => {
    try {
      const availabilityData = z.array(insertAvailabilitySchema).parse(req.body);
      const availability = await storage.setAvailability(availabilityData);
      res.json(availability);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid availability data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Resources routes
  app.get("/api/resources/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const resources = await storage.getResourcesByUser(userId);
      res.json(resources || null);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/resources", async (req, res) => {
    try {
      const resourceData = insertResourceSchema.parse(req.body);
      const resource = await storage.setResources(resourceData);
      res.json(resource);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid resource data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Personality quiz routes
  app.get("/api/personality/questions", async (req, res) => {
    try {
      const questions = await storage.getAllQuestions();
      res.json(questions);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/personality/answer", async (req, res) => {
    try {
      const answerData = insertUserAnswerSchema.parse(req.body);
      const answer = await storage.saveUserAnswer(answerData);
      res.status(201).json(answer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid answer data", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/personality/answers/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const answers = await storage.getUserAnswers(userId);
      res.json(answers);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/personality/complete", async (req, res) => {
    try {
      const { userId, personalityType, personalityDescription, personalityTraits } = req.body;
      const user = await storage.updateUserPersonality(userId, {
        personalityType,
        personalityDescription,
        personalityTraits
      });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Matching routes
  app.get("/api/matches/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const matches = await storage.getMatchesForUser(userId);
      res.json(matches);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/matches/generate", async (req, res) => {
    try {
      const { userId } = req.body;
      
      // Use strict matching with non-negotiable activity and availability compatibility
      const strictMatches = await (storage as any).findStrictMatches?.(userId);
      
      if (strictMatches) {
        // Save the matches to database
        const savedMatches: Match[] = [];
        for (const match of strictMatches) {
          const savedMatch = await storage.createMatch({
            userId: match.userId,
            matchedUserId: match.matchedUserId,
            activityId: match.activityId,
            compatibilityScore: match.compatibilityScore,
            status: "pending"
          });
          savedMatches.push(savedMatch);
        }
        res.json(savedMatches);
      } else {
        // Fallback to original matching if strict matching not available
        const currentUser = await storage.getUserWithDetails(userId);
        if (!currentUser) {
          return res.status(404).json({ message: "User not found" });
        }

        const allUsers = await storage.getAllUsers();
        const otherUsers = allUsers.filter(u => u.id !== userId && u.quizCompleted);

        const matches: Match[] = [];
        
        for (const otherUser of otherUsers) {
          if (!otherUser.personalityTraits || !currentUser.personalityTraits) continue;
          
          const compatibility = calculateCompatibility(
            currentUser.personalityTraits,
            otherUser.personalityTraits
          );

          const otherUserActivities = await storage.getActivitiesByUser(otherUser.id);
          
          for (const activity of otherUserActivities) {
            if (activity.isActive) {
              const match = await storage.createMatch({
                userId,
                matchedUserId: otherUser.id,
                activityId: activity.id,
                compatibilityScore: compatibility,
                status: "pending"
              });
              matches.push(match);
            }
          }
        }

        res.json(matches);
      }
    } catch (error) {
      console.error("Error generating matches:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/matches/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const match = await storage.updateMatchStatus(id, status);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      res.json(match);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Unit routes
  app.post("/api/units", async (req, res) => {
    try {
      const unitData = insertUnitSchema.parse(req.body);
      const unit = await storage.createUnit(unitData);
      
      // Log analytics event
      await storage.logEvent({
        userId: unit.createdBy,
        eventType: "unit_created",
        eventData: { unitId: unit.id, unitName: unit.name }
      });
      
      res.status(201).json({ 
        message: "Unit created successfully!",
        unit 
      });
    } catch (error) {
      console.error("Error creating unit:", error);
      res.status(500).json({ message: "Failed to create unit" });
    }
  });

  app.get("/api/units/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const units = await storage.getUserUnits(parseInt(userId));
      res.json(units);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/units/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const unit = await storage.getUnitById(parseInt(id));
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }
      res.json(unit);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/units/:id/members", async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      
      const member = await storage.addUnitMember({
        unitId: parseInt(id),
        userId: parseInt(userId),
        role: "member"
      });
      
      res.json(member);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Unit routes
  app.get("/api/units/user/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      console.log('Fetching units for user:', userId);
      const units = await storage.getUserUnits(userId);
      console.log('Found units:', units.length);
      res.json(units);
    } catch (error: any) {
      console.error('Error in /api/units/user/:userId:', error);
      res.status(500).json({ error: "Failed to fetch units", details: error?.message || 'Unknown error' });
    }
  });

  app.post("/api/units", async (req, res) => {
    try {
      const result = insertUnitSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid unit data", details: result.error.issues });
      }
      
      const unit = await storage.createUnit(result.data);
      
      // Log analytics event
      await storage.logEvent({
        userId: result.data.createdBy,
        eventType: "unit_created",
        eventData: { unitId: unit.id, unitName: unit.name }
      });
      
      res.status(201).json(unit);
    } catch (error) {
      res.status(500).json({ error: "Failed to create unit" });
    }
  });

  app.get("/api/units/:unitId", async (req, res) => {
    try {
      const unitId = parseInt(req.params.unitId);
      const unit = await storage.getUnitById(unitId);
      if (!unit) {
        return res.status(404).json({ error: "Unit not found" });
      }
      res.json(unit);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch unit" });
    }
  });

  app.post("/api/units/:unitId/join", async (req, res) => {
    try {
      const unitId = parseInt(req.params.unitId);
      const { userId } = req.body;
      
      const member = await storage.addUnitMember({
        unitId,
        userId
      });
      
      // Log analytics event
      await storage.logEvent({
        userId,
        eventType: "unit_joined",
        eventData: { unitId }
      });
      
      res.status(201).json(member);
    } catch (error) {
      res.status(400).json({ error: "Failed to join unit" });
    }
  });

  // Scene routes
  app.post("/api/scenes", async (req, res) => {
    try {
      const sceneData = insertSceneSchema.parse(req.body);
      const scene = await storage.createScene(sceneData);
      
      // Log analytics event
      await storage.logEvent({
        userId: scene.createdBy,
        eventType: "scene_created",
        eventData: { sceneId: scene.id, sceneName: scene.name }
      });
      
      res.status(201).json({ 
        message: "Scene created successfully!",
        scene 
      });
    } catch (error) {
      console.error("Error creating scene:", error);
      res.status(500).json({ message: "Failed to create scene" });
    }
  });

  app.get("/api/scenes", async (req, res) => {
    try {
      const scenes = await storage.getActiveScenes();
      if (scenes.length === 0) {
        return res.json({ 
          scenes: [], 
          message: "No scenes found. Try creating your own!" 
        });
      }
      res.json({ scenes });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/scenes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const scene = await storage.getSceneById(parseInt(id));
      if (!scene) {
        return res.status(404).json({ message: "Scene not found" });
      }
      res.json(scene);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/scenes/:id/join", async (req, res) => {
    try {
      const { id } = req.params;
      const participantData = insertSceneParticipantSchema.parse({
        ...req.body,
        sceneId: parseInt(id)
      });
      
      const participant = await storage.joinScene(participantData);
      
      // Log analytics event
      await storage.logEvent({
        userId: participant.userId,
        eventType: "scene_joined",
        eventData: { sceneId: participant.sceneId }
      });
      
      res.json({ 
        message: "Successfully joined scene!",
        participant 
      });
    } catch (error) {
      console.error("Error joining scene:", error);
      res.status(500).json({ message: "Failed to join scene" });
    }
  });

  app.delete("/api/scenes/:id/leave", async (req, res) => {
    try {
      const { id } = req.params;
      const { userId } = req.body;
      
      const success = await storage.leaveScene(parseInt(id), userId);
      if (!success) {
        return res.status(404).json({ message: "Participation not found" });
      }
      
      res.json({ message: "Successfully left scene" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/scenes/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const scenes = await storage.getUserScenes(parseInt(userId));
      res.json(scenes);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Analytics routes
  app.get("/api/analytics", async (req, res) => {
    try {
      const { userId } = req.query;
      const events = await storage.getAnalytics(userId ? parseInt(userId as string) : undefined);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function calculateCompatibility(traits1: any, traits2: any): number {
  const traitKeys = ['extroversion', 'adventure', 'planning', 'creativity', 'empathy'];
  let totalDifference = 0;
  
  for (const key of traitKeys) {
    const diff = Math.abs((traits1[key] || 0) - (traits2[key] || 0));
    totalDifference += diff;
  }
  
  // Convert to compatibility percentage (100 - average difference)
  const averageDifference = totalDifference / traitKeys.length;
  return Math.max(0, Math.round(100 - averageDifference));
}
