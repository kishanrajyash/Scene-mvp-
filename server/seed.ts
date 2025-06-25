import { db } from "./db";
import { 
  users, activities, availability, resources, personalityQuestions, userAnswers 
} from "@shared/schema";

export async function seedDatabase() {
  console.log("🌱 Seeding database...");

  // Seed personality questions first
  const questions = [
    {
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

  await db.insert(personalityQuestions).values(questions);

  // Seed users with diverse profiles
  const sampleUsers = [
    {
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
      quizCompleted: true
    },
    {
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
      quizCompleted: true
    },
    {
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
      quizCompleted: true
    },
    {
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
      quizCompleted: true
    }
  ];

  const insertedUsers = await db.insert(users).values(sampleUsers).returning();

  // Seed activities for users
  const sampleActivities = [
    {
      userId: insertedUsers[0].id,
      name: "Weekend Hiking",
      description: "Looking for hiking buddies for weekend trails around the city. All skill levels welcome!",
      category: "Outdoor",
      skillLevel: "all",
      maxParticipants: 6,
      isActive: true
    },
    {
      userId: insertedUsers[0].id,
      name: "Cooking Classes",
      description: "Want to learn new cuisines and cooking techniques with others who share the passion for food.",
      category: "Food & Cooking",
      skillLevel: "beginner",
      maxParticipants: 4,
      isActive: true
    },
    {
      userId: insertedUsers[1].id,
      name: "Rock Climbing Adventures",
      description: "Indoor and outdoor climbing sessions. Great for building strength and meeting adventure seekers!",
      category: "Outdoor",
      skillLevel: "intermediate",
      maxParticipants: 8,
      isActive: true
    },
    {
      userId: insertedUsers[1].id,
      name: "Spontaneous Food Tours",
      description: "Exploring the city's food scene one neighborhood at a time. No plans, just good eats!",
      category: "Food & Cooking",
      skillLevel: "all",
      maxParticipants: 6,
      isActive: true
    },
    {
      userId: insertedUsers[2].id,
      name: "Art Gallery Walks",
      description: "Monthly visits to local galleries and museums. Perfect for thoughtful discussions about art.",
      category: "Arts & Crafts",
      skillLevel: "all",
      maxParticipants: 4,
      isActive: true
    },
    {
      userId: insertedUsers[2].id,
      name: "Photography Workshops",
      description: "Learn photography techniques while exploring beautiful locations around the city.",
      category: "Photography",
      skillLevel: "beginner",
      maxParticipants: 5,
      isActive: true
    },
    {
      userId: insertedUsers[3].id,
      name: "Strategy Game Nights",
      description: "Weekly board game sessions featuring complex strategy games. Perfect for analytical minds!",
      category: "Games",
      skillLevel: "intermediate",
      maxParticipants: 6,
      isActive: true
    },
    {
      userId: insertedUsers[3].id,
      name: "Tech Meetups",
      description: "Discussing latest technology trends and working on collaborative coding projects.",
      category: "Technology",
      skillLevel: "intermediate",
      maxParticipants: 10,
      isActive: true
    }
  ];

  await db.insert(activities).values(sampleActivities);

  // Seed availability with overlapping time slots for potential matches
  const availabilityData = [
    // Sarah Chen - Weekend focused
    { userId: insertedUsers[0].id, dayOfWeek: "friday", timeSlot: "evening", isAvailable: true },
    { userId: insertedUsers[0].id, dayOfWeek: "saturday", timeSlot: "morning", isAvailable: true },
    { userId: insertedUsers[0].id, dayOfWeek: "saturday", timeSlot: "afternoon", isAvailable: true },
    { userId: insertedUsers[0].id, dayOfWeek: "sunday", timeSlot: "morning", isAvailable: true },
    
    // Alex Rivera - Similar weekend availability (good match potential)
    { userId: insertedUsers[1].id, dayOfWeek: "friday", timeSlot: "evening", isAvailable: true },
    { userId: insertedUsers[1].id, dayOfWeek: "saturday", timeSlot: "morning", isAvailable: true },
    { userId: insertedUsers[1].id, dayOfWeek: "saturday", timeSlot: "afternoon", isAvailable: true },
    { userId: insertedUsers[1].id, dayOfWeek: "sunday", timeSlot: "afternoon", isAvailable: true },
    
    // Jamie Liu - Weekday evenings + Saturday
    { userId: insertedUsers[2].id, dayOfWeek: "tuesday", timeSlot: "evening", isAvailable: true },
    { userId: insertedUsers[2].id, dayOfWeek: "wednesday", timeSlot: "evening", isAvailable: true },
    { userId: insertedUsers[2].id, dayOfWeek: "thursday", timeSlot: "evening", isAvailable: true },
    { userId: insertedUsers[2].id, dayOfWeek: "saturday", timeSlot: "afternoon", isAvailable: true },
    
    // Marcus Thompson - Weekday evenings (matches Jamie)
    { userId: insertedUsers[3].id, dayOfWeek: "tuesday", timeSlot: "evening", isAvailable: true },
    { userId: insertedUsers[3].id, dayOfWeek: "wednesday", timeSlot: "evening", isAvailable: true },
    { userId: insertedUsers[3].id, dayOfWeek: "thursday", timeSlot: "evening", isAvailable: true },
    { userId: insertedUsers[3].id, dayOfWeek: "saturday", timeSlot: "evening", isAvailable: true }
  ];

  await db.insert(availability).values(availabilityData);

  // Seed resources
  const resourcesData = [
    {
      userId: insertedUsers[0].id,
      hasVehicle: true,
      budgetMin: 20,
      budgetMax: 50,
      canHost: false,
      location: "Downtown"
    },
    {
      userId: insertedUsers[1].id,
      hasVehicle: true,
      budgetMin: 15,
      budgetMax: 75,
      canHost: false,
      location: "North Side"
    },
    {
      userId: insertedUsers[2].id,
      hasVehicle: false,
      budgetMin: 25,
      budgetMax: 60,
      canHost: true,
      location: "Downtown"
    },
    {
      userId: insertedUsers[3].id,
      hasVehicle: true,
      budgetMin: 30,
      budgetMax: 100,
      canHost: true,
      location: "East Side"
    }
  ];

  await db.insert(resources).values(resourcesData);

  console.log("✅ Database seeded successfully!");
  return insertedUsers;
}