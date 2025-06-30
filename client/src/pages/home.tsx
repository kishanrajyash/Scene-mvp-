import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import Header from "@/components/header";
import Onboarding from "@/components/onboarding";
import SceneAskForm from "@/components/scene-ask-form";
import SceneFeed from "@/components/scene-feed";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Users, Sparkles, MessageCircle } from "lucide-react";
import type { User } from "@shared/schema";

export default function Home() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const [showOnboarding, setShowOnboarding] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="animate-pulse p-4 space-y-4">
          <div className="h-16 bg-muted rounded-2xl"></div>
          <div className="h-32 bg-muted rounded-2xl"></div>
          <div className="h-48 bg-muted rounded-2xl"></div>
        </div>
      </div>
    );
  }

  // Show onboarding if user hasn't completed it
  if (user && !user.onboardingCompleted && !showOnboarding) {
    return <Onboarding user={user} onComplete={() => setShowOnboarding(false)} />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Header user={user} />
      
      <main className="container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome Section */}
        {user && (
          <Card className="scene-card bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/10">
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <Sparkles className="w-12 h-12 mx-auto text-primary mb-2" />
                <h1 className="text-2xl font-bold mb-1">
                  Welcome back, {user.name}!
                </h1>
                <p className="text-muted-foreground">
                  Ready to connect with your community?
                </p>
              </div>
              
              {user.currentMood && (
                <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    <span>Feeling {user.currentMood}</span>
                  </div>
                  {user.purpose && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>Looking to {user.purpose}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="scene-card-compact hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto text-primary mb-2" />
              <h3 className="font-medium text-sm">Find People</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Connect with others
              </p>
            </CardContent>
          </Card>
          
          <Card className="scene-card-compact hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 text-center">
              <MessageCircle className="w-8 h-8 mx-auto text-secondary mb-2" />
              <h3 className="font-medium text-sm">Share Story</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Tell your journey
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Scene Ask Form */}
        <SceneAskForm onSuccess={() => {
          // Refresh feed after posting
        }} />

        {/* Scene Feed */}
        <SceneFeed user={user} />

        {/* Onboarding Button for completed users */}
        {user && user.onboardingCompleted && (
          <Card className="scene-card-compact">
            <CardContent className="p-4 text-center">
              <Button
                variant="outline"
                onClick={() => setShowOnboarding(true)}
                className="w-full"
              >
                Update Your Vibe
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Change your mood, purpose, or how you like to connect
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}