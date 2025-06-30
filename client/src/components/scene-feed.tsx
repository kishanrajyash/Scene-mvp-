import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Heart } from "lucide-react";
import SceneAskCard from "./scene-ask-card";
import type { SceneAskWithDetails, User } from "@shared/schema";

interface SceneFeedProps {
  user?: User;
}

export default function SceneFeed({ user }: SceneFeedProps) {
  const { data: sceneAsks, isLoading, refetch } = useQuery<SceneAskWithDetails[]>({
    queryKey: ["/api/scene-asks"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="scene-card-compact animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-full"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!sceneAsks || sceneAsks.length === 0) {
    return (
      <Card className="scene-card text-center py-12">
        <CardContent>
          <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Scene Asks yet</h3>
          <p className="text-muted-foreground mb-6">
            Be the first to share what you're looking for or what you can offer!
          </p>
          <Button onClick={() => refetch()} variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Check again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show helpfulness stats from localStorage
  const helpfulnessData = JSON.parse(localStorage.getItem("helpfulness") || "{}");
  const today = new Date().toDateString();
  const todayHelpfulness = helpfulnessData[today] || 0;
  const totalHelpfulness = Object.values(helpfulnessData).reduce((sum: number, count) => sum + (count as number), 0);

  return (
    <div className="space-y-4">
      {todayHelpfulness > 0 && (
        <Card className="scene-card-compact bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm">
              <Heart className="w-4 h-4 text-primary" />
              <span>
                You've been helpful {todayHelpfulness} time{todayHelpfulness !== 1 ? 's' : ''} today!
                {totalHelpfulness > todayHelpfulness && ` (${totalHelpfulness} total)`}
              </span>
              <span className="text-lg">✨</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium">Recent Scene Asks</h2>
        <Button
          onClick={() => refetch()}
          variant="ghost"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        {sceneAsks.map((sceneAsk) => (
          <SceneAskCard
            key={sceneAsk.id}
            sceneAsk={sceneAsk}
            currentUserId={user?.id}
          />
        ))}
      </div>
    </div>
  );
}