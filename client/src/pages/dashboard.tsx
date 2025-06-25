import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import PersonalityQuiz from "@/components/personality-quiz";
import { queryClient } from "@/lib/queryClient";
import MatchCard from "@/components/match-card";
import ActivityCard from "@/components/activity-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Plus, Search, Calendar, Star, Car, DollarSign, Shield, EyeOff } from "lucide-react";
import { Link } from "wouter";
import type { UserWithDetails, MatchWithDetails } from "@shared/schema";

export default function Dashboard() {
  const currentUserId = 1; // In a real app, this would come from auth context

  const { data: user, isLoading: userLoading } = useQuery<UserWithDetails>({
    queryKey: [`/api/user/${currentUserId}`],
  });

  const { data: matches, isLoading: matchesLoading } = useQuery<MatchWithDetails[]>({
    queryKey: [`/api/matches/${currentUserId}`],
  });

  const { data: units = [], isLoading: unitsLoading } = useQuery({
    queryKey: [`/api/units/user/${currentUserId}`],
  });

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="space-y-6">
                <div className="h-64 bg-gray-200 rounded-xl"></div>
                <div className="h-64 bg-gray-200 rounded-xl"></div>
              </div>
              <div className="lg:col-span-2">
                <div className="h-96 bg-gray-200 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600">User not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const formatAvailability = (availability: any[]) => {
    return availability
      .filter(a => a.isAvailable)
      .map(a => `${a.dayOfWeek.charAt(0).toUpperCase() + a.dayOfWeek.slice(1)} ${a.timeSlot}`)
      .join(", ");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Quick Actions & Personality */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/activities">
                  <Button className="w-full bg-primary text-white hover:bg-primary/90 flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Add New Activity</span>
                  </Button>
                </Link>
                <Link href="/matches">
                  <Button className="w-full bg-secondary text-white hover:bg-secondary/90 flex items-center space-x-2">
                    <Search className="h-4 w-4" />
                    <span>Find Matches</span>
                  </Button>
                </Link>
                <Link href="/profile">
                  <Button variant="outline" className="w-full flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>Update Availability</span>
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Personality Preview */}
            <Card className="animate-fade-in">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg">Your Personality</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-primary hover:text-primary/80"
                  onClick={() => {
                    // Reset quiz completion status to allow retaking
                    queryClient.setQueryData([`/api/user/${currentUserId}`], (oldData: UserWithDetails | undefined) => {
                      if (oldData) {
                        return { ...oldData, quizCompleted: false };
                      }
                      return oldData;
                    });
                  }}
                >
                  Retake Quiz
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {user.quizCompleted && user.personalityType ? (
                  <>
                    <div className="text-center">
                      <div className="w-20 h-20 bg-gradient-to-br from-primary to-purple-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                        <Star className="text-white text-2xl" />
                      </div>
                      <h3 className="font-semibold text-gray-900">{user.personalityType}</h3>
                      <p className="text-sm text-gray-600 mt-1">{user.personalityDescription}</p>
                    </div>
                    
                    <div className="space-y-2">
                      {user.personalityTraits && Object.entries(user.personalityTraits).map(([trait, value]) => (
                        <div key={trait} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 capitalize">{trait}</span>
                          <div className="flex-1 mx-3">
                            <Progress value={value as number} className="h-2" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">{value}%</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-600 mb-4">Complete your personality assessment to get better matches!</p>
                    <Link href="/profile">
                      <Button className="bg-primary text-white hover:bg-primary/90">
                        Take Personality Quiz
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Availability Status */}
            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle className="text-lg">Current Availability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="text-primary h-5 w-5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">This Week</p>
                    <p className="text-xs text-gray-600">
                      {user.availability.length > 0 ? formatAvailability(user.availability) : "No availability set"}
                    </p>
                  </div>
                </div>
                
                {user.resources && (
                  <>
                    <div className="flex items-center space-x-3">
                      <Car className="text-secondary h-5 w-5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Transportation</p>
                        <p className="text-xs text-gray-600">
                          {user.resources.hasVehicle ? "Car available" : "No vehicle"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <DollarSign className="text-accent h-5 w-5" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Budget Range</p>
                        <p className="text-xs text-gray-600">
                          {user.resources.budgetMin && user.resources.budgetMax 
                            ? `$${user.resources.budgetMin}-${user.resources.budgetMax} per activity`
                            : "Budget not set"}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Middle Column: Matches & Personality Quiz */}
          <div className="lg:col-span-2 space-y-6">
            {/* Matches Section */}
            <Card className="animate-fade-in">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
                <CardTitle className="text-xl">Your Matches</CardTitle>
                <Link href="/matches">
                  <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                    View All →
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {matchesLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : matches && matches.length > 0 ? (
                  <div className="space-y-4">
                    {matches.slice(0, 3).map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">No matches found yet. Complete your profile to get started!</p>
                    <Link href="/profile">
                      <Button className="bg-primary text-white hover:bg-primary/90">
                        Complete Profile
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Personality Quiz Component - Only show if not completed */}
            {!user.quizCompleted && <PersonalityQuiz userId={user.id} />}

            {/* My Activities */}
            <Card className="animate-fade-in">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
                <CardTitle className="text-xl">My Activities</CardTitle>
                <Link href="/activities">
                  <Button className="bg-primary text-white hover:bg-primary/90 flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Add Activity</span>
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {user.activities.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.activities.map((activity) => (
                      <ActivityCard key={activity.id} activity={activity} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">You haven't added any activities yet.</p>
                    <Link href="/activities">
                      <Button className="bg-primary text-white hover:bg-primary/90">
                        Add Your First Activity
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Privacy Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Shield className="h-4 w-4 text-secondary" />
                <span>Your data is secure and private</span>
              </div>
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                <EyeOff className="h-4 w-4 text-primary" />
                <span>Only matched users see your profile</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 text-sm">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                Privacy Settings
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                Help & Support
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
