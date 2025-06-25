import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Header from "@/components/header";
import MatchCard from "@/components/match-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, RefreshCw, Users } from "lucide-react";
import type { UserWithDetails, MatchWithDetails } from "@shared/schema";

export default function Matches() {
  const currentUserId = 1;
  const { toast } = useToast();
  
  const { data: user, isLoading: userLoading } = useQuery<UserWithDetails>({
    queryKey: [`/api/user/${currentUserId}`],
  });

  const { data: matches, isLoading: matchesLoading, refetch } = useQuery<MatchWithDetails[]>({
    queryKey: [`/api/matches/${currentUserId}`],
  });

  const generateMatchesMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/matches/generate", { userId: currentUserId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${currentUserId}`] });
      toast({
        title: "Matches updated",
        description: "New matches have been generated based on your profile.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate matches. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateMatches = () => {
    generateMatchesMutation.mutate();
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="flex justify-between items-center">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
              ))}
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600">User not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const pendingMatches = matches?.filter(m => m.status === "pending") || [];
  const connectedMatches = matches?.filter(m => m.status === "connected") || [];
  const skippedMatches = matches?.filter(m => m.status === "skipped") || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Your Matches</h1>
            <p className="text-gray-600 mt-2">Find people who share your interests and personality</p>
          </div>
          
          <Button 
            onClick={handleGenerateMatches}
            disabled={generateMatchesMutation.isPending}
            className="bg-secondary text-white hover:bg-secondary/90 flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${generateMatchesMutation.isPending ? 'animate-spin' : ''}`} />
            <span>
              {generateMatchesMutation.isPending ? "Generating..." : "Find New Matches"}
            </span>
          </Button>
        </div>

        {!user.quizCompleted ? (
          <Card className="mb-8">
            <CardContent className="pt-6 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Complete Your Profile</h3>
                <p className="text-gray-600 mb-6">
                  To get the best matches, please complete your personality assessment and add some activities.
                </p>
                <Button className="bg-primary text-white hover:bg-primary/90">
                  Complete Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="pending" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending" className="flex items-center space-x-2">
                <span>New Matches</span>
                {pendingMatches.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {pendingMatches.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="connected" className="flex items-center space-x-2">
                <span>Connected</span>
                {connectedMatches.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {connectedMatches.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="skipped" className="flex items-center space-x-2">
                <span>Skipped</span>
                {skippedMatches.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {skippedMatches.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Search className="h-5 w-5" />
                    <span>New Matches</span>
                  </CardTitle>
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
                  ) : pendingMatches.length > 0 ? (
                    <div className="space-y-4">
                      {pendingMatches.map((match) => (
                        <MatchCard key={match.id} match={match} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No new matches</h3>
                      <p className="text-gray-600 mb-6">
                        We'll keep looking for compatible activity partners for you. Try adding more activities or updating your preferences.
                      </p>
                      <Button 
                        onClick={handleGenerateMatches}
                        disabled={generateMatchesMutation.isPending}
                        className="bg-secondary text-white hover:bg-secondary/90"
                      >
                        Search Again
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="connected">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Connected Matches</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {connectedMatches.length > 0 ? (
                    <div className="space-y-4">
                      {connectedMatches.map((match) => (
                        <MatchCard key={match.id} match={match} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No connections yet</h3>
                      <p className="text-gray-600">
                        When you connect with someone, they'll appear here.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="skipped">
              <Card>
                <CardHeader>
                  <CardTitle>Skipped Matches</CardTitle>
                </CardHeader>
                <CardContent>
                  {skippedMatches.length > 0 ? (
                    <div className="space-y-4">
                      {skippedMatches.map((match) => (
                        <MatchCard key={match.id} match={match} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No skipped matches</h3>
                      <p className="text-gray-600">
                        Matches you skip will appear here.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
