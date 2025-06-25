import type { User, Activity, Availability, Resource } from "@shared/schema";

export interface MatchingCriteria {
  personalityWeight: number;
  activityWeight: number;
  availabilityWeight: number;
  locationWeight: number;
  budgetWeight: number;
}

export interface UserProfile {
  user: User;
  activities: Activity[];
  availability: Availability[];
  resources: Resource | null;
}

export interface MatchResult {
  userId: number;
  matchedUserId: number;
  activityId: number;
  compatibilityScore: number;
  breakdown: {
    personalityScore: number;
    activityScore: number;
    availabilityScore: number;
    locationScore: number;
    budgetScore: number;
  };
  matchReason: string;
}

const DEFAULT_CRITERIA: MatchingCriteria = {
  personalityWeight: 0.4,
  activityWeight: 0.3,
  availabilityWeight: 0.2,
  locationWeight: 0.05,
  budgetWeight: 0.05,
};

export class MatchingAlgorithm {
  private criteria: MatchingCriteria;

  constructor(criteria: MatchingCriteria = DEFAULT_CRITERIA) {
    this.criteria = criteria;
  }

  /**
   * Calculate compatibility between two users for a specific activity
   */
  calculateCompatibility(
    user1Profile: UserProfile,
    user2Profile: UserProfile,
    activityId: number
  ): MatchResult | null {
    const activity = user2Profile.activities.find(a => a.id === activityId);
    if (!activity) return null;

    const breakdown = {
      personalityScore: this.calculatePersonalityCompatibility(user1Profile.user, user2Profile.user),
      activityScore: this.calculateActivityCompatibility(user1Profile, user2Profile, activity),
      availabilityScore: this.calculateAvailabilityOverlap(user1Profile.availability, user2Profile.availability),
      locationScore: this.calculateLocationCompatibility(user1Profile.resources, user2Profile.resources),
      budgetScore: this.calculateBudgetCompatibility(user1Profile.resources, user2Profile.resources),
    };

    const compatibilityScore = Math.round(
      breakdown.personalityScore * this.criteria.personalityWeight +
      breakdown.activityScore * this.criteria.activityWeight +
      breakdown.availabilityScore * this.criteria.availabilityWeight +
      breakdown.locationScore * this.criteria.locationWeight +
      breakdown.budgetScore * this.criteria.budgetWeight
    );

    const matchReason = this.generateMatchReason(breakdown, activity);

    return {
      userId: user1Profile.user.id,
      matchedUserId: user2Profile.user.id,
      activityId,
      compatibilityScore,
      breakdown,
      matchReason,
    };
  }

  /**
   * Calculate personality compatibility based on trait similarity
   */
  private calculatePersonalityCompatibility(user1: User, user2: User): number {
    if (!user1.personalityTraits || !user2.personalityTraits) {
      return 50; // Default score if personality data is missing
    }

    const traits = ['extroversion', 'adventure', 'planning', 'creativity', 'empathy'] as const;
    let totalDifference = 0;
    let validTraits = 0;

    traits.forEach(trait => {
      const value1 = user1.personalityTraits?.[trait] || 0;
      const value2 = user2.personalityTraits?.[trait] || 0;
      
      if (value1 > 0 && value2 > 0) {
        totalDifference += Math.abs(value1 - value2);
        validTraits++;
      }
    });

    if (validTraits === 0) return 50;

    const averageDifference = totalDifference / validTraits;
    return Math.max(0, Math.round(100 - averageDifference));
  }

  /**
   * Calculate activity compatibility based on shared interests and skill levels
   */
  private calculateActivityCompatibility(
    user1Profile: UserProfile,
    user2Profile: UserProfile,
    targetActivity: Activity
  ): number {
    let score = 60; // Base score

    // Check if user1 has similar activities
    const similarActivities = user1Profile.activities.filter(activity => 
      activity.category === targetActivity.category || 
      activity.name.toLowerCase().includes(targetActivity.name.toLowerCase()) ||
      targetActivity.name.toLowerCase().includes(activity.name.toLowerCase())
    );

    if (similarActivities.length > 0) {
      score += 20;
    }

    // Skill level compatibility
    const user1SkillActivities = user1Profile.activities.filter(a => a.category === targetActivity.category);
    if (user1SkillActivities.length > 0) {
      const user1Skill = user1SkillActivities[0].skillLevel;
      if (targetActivity.skillLevel === 'all' || user1Skill === 'all' || user1Skill === targetActivity.skillLevel) {
        score += 15;
      } else {
        // Penalize major skill mismatches
        if ((user1Skill === 'beginner' && targetActivity.skillLevel === 'advanced') ||
            (user1Skill === 'advanced' && targetActivity.skillLevel === 'beginner')) {
          score -= 10;
        }
      }
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Calculate availability overlap between two users
   */
  private calculateAvailabilityOverlap(
    availability1: Availability[],
    availability2: Availability[]
  ): number {
    if (availability1.length === 0 || availability2.length === 0) {
      return 50; // Default score if availability data is missing
    }

    const available1 = new Set(
      availability1
        .filter(a => a.isAvailable)
        .map(a => `${a.dayOfWeek}-${a.timeSlot}`)
    );

    const available2 = new Set(
      availability2
        .filter(a => a.isAvailable)
        .map(a => `${a.dayOfWeek}-${a.timeSlot}`)
    );

    const overlap = [...available1].filter(slot => available2.has(slot));
    const union = new Set([...available1, ...available2]);

    if (union.size === 0) return 50;

    return Math.round((overlap.length / union.size) * 100);
  }

  /**
   * Calculate location compatibility (simplified)
   */
  private calculateLocationCompatibility(
    resources1: Resource | null,
    resources2: Resource | null
  ): number {
    if (!resources1 || !resources2) return 70; // Default score

    // In a real implementation, this would use actual geographic data
    // For now, we'll use a simplified approach based on location strings
    if (resources1.location && resources2.location) {
      const location1 = resources1.location.toLowerCase();
      const location2 = resources2.location.toLowerCase();
      
      if (location1 === location2) return 100;
      if (location1.includes(location2) || location2.includes(location1)) return 85;
      return 60;
    }

    return 70;
  }

  /**
   * Calculate budget compatibility
   */
  private calculateBudgetCompatibility(
    resources1: Resource | null,
    resources2: Resource | null
  ): number {
    if (!resources1 || !resources2) return 70; // Default score

    const budget1Min = resources1.budgetMin || 0;
    const budget1Max = resources1.budgetMax || 1000;
    const budget2Min = resources2.budgetMin || 0;
    const budget2Max = resources2.budgetMax || 1000;

    // Check for budget range overlap
    const overlapMin = Math.max(budget1Min, budget2Min);
    const overlapMax = Math.min(budget1Max, budget2Max);

    if (overlapMax < overlapMin) {
      // No overlap
      return 20;
    }

    const overlapSize = overlapMax - overlapMin;
    const union1 = budget1Max - budget1Min;
    const union2 = budget2Max - budget2Min;
    const avgUnion = (union1 + union2) / 2;

    if (avgUnion === 0) return 100;

    return Math.min(100, Math.round((overlapSize / avgUnion) * 100) + 30);
  }

  /**
   * Generate a human-readable reason for the match
   */
  private generateMatchReason(breakdown: MatchResult['breakdown'], activity: Activity): string {
    const reasons = [];

    if (breakdown.personalityScore >= 80) {
      reasons.push("highly compatible personalities");
    } else if (breakdown.personalityScore >= 60) {
      reasons.push("complementary personality traits");
    }

    if (breakdown.activityScore >= 80) {
      reasons.push("shared activity interests");
    } else if (breakdown.activityScore >= 60) {
      reasons.push("similar activity preferences");
    }

    if (breakdown.availabilityScore >= 80) {
      reasons.push("excellent schedule compatibility");
    } else if (breakdown.availabilityScore >= 60) {
      reasons.push("good availability overlap");
    }

    if (breakdown.budgetScore >= 80) {
      reasons.push("matching budget preferences");
    }

    if (breakdown.locationScore >= 80) {
      reasons.push("nearby location");
    }

    if (reasons.length === 0) {
      return `Both interested in ${activity.category.toLowerCase()} activities`;
    }

    if (reasons.length === 1) {
      return `Match based on ${reasons[0]}`;
    }

    if (reasons.length === 2) {
      return `${reasons[0]} and ${reasons[1]}`;
    }

    return `${reasons.slice(0, -1).join(", ")}, and ${reasons[reasons.length - 1]}`;
  }

  /**
   * Find all potential matches for a user
   */
  findMatches(
    userProfile: UserProfile,
    otherProfiles: UserProfile[],
    minCompatibilityScore: number = 60
  ): MatchResult[] {
    const matches: MatchResult[] = [];

    otherProfiles.forEach(otherProfile => {
      if (otherProfile.user.id === userProfile.user.id) return;

      otherProfile.activities
        .filter(activity => activity.isActive)
        .forEach(activity => {
          const match = this.calculateCompatibility(userProfile, otherProfile, activity.id);
          if (match && match.compatibilityScore >= minCompatibilityScore) {
            matches.push(match);
          }
        });
    });

    // Sort by compatibility score (highest first)
    return matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);
  }
}

export const matchingAlgorithm = new MatchingAlgorithm();
