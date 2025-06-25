import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertActivitySchema, insertAvailabilitySchema, 
  insertResourceSchema, insertUserAnswerSchema, insertMatchSchema,
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
      
      // Get current user and all other users
      const currentUser = await storage.getUserWithDetails(userId);
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const allUsers = await storage.getAllUsers();
      const otherUsers = allUsers.filter(u => u.id !== userId && u.quizCompleted);
      const allActivities = await storage.getAllActiveActivities();

      // Generate matches based on personality compatibility
      const matches: Match[] = [];
      
      for (const otherUser of otherUsers) {
        if (!otherUser.personalityTraits || !currentUser.personalityTraits) continue;
        
        // Calculate compatibility score
        const compatibility = calculateCompatibility(
          currentUser.personalityTraits,
          otherUser.personalityTraits
        );

        // Find matching activities
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
    } catch (error) {
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
