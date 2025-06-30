import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Clock, Heart, Users, MessageCircle } from "lucide-react";
import type { SceneAskWithDetails } from "@shared/schema";

interface SceneAskCardProps {
  sceneAsk: SceneAskWithDetails;
  currentUserId?: number;
}

const moodEmojis: Record<string, string> = {
  happy: "😊",
  calm: "😌",
  focused: "🎯",
  excited: "🌟",
  thoughtful: "💭",
  energetic: "🔥"
};

const timeLabels: Record<string, string> = {
  now: "Right now",
  hour: "Next hour",
  today: "Today",
  week: "This week",
  flexible: "Flexible"
};

export default function SceneAskCard({ sceneAsk, currentUserId }: SceneAskCardProps) {
  const [feedbackShown, setFeedbackShown] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const respondMutation = useMutation({
    mutationFn: async (data: { responseType: string; message?: string }) => {
      const response = await fetch(`/api/scene-asks/${sceneAsk.id}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to respond");
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/scene-asks"] });
      
      // Show emoji feedback
      const emoji = variables.responseType === "join" ? "🤝" : "💝";
      setFeedbackShown(emoji);
      setTimeout(() => setFeedbackShown(null), 2000);

      // Track helpfulness locally
      const helpfulnessData = JSON.parse(localStorage.getItem("helpfulness") || "{}");
      const today = new Date().toDateString();
      helpfulnessData[today] = (helpfulnessData[today] || 0) + 1;
      localStorage.setItem("helpfulness", JSON.stringify(helpfulnessData));

      toast({
        title: variables.responseType === "join" ? "You joined! 🤝" : "Help offered! 💝",
        description: "The person will be notified of your response",
      });
    },
    onError: () => {
      toast({
        title: "Couldn't respond",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleJoin = () => {
    respondMutation.mutate({ responseType: "join" });
  };

  const handleHelp = () => {
    respondMutation.mutate({ responseType: "help" });
  };

  const isOwnPost = currentUserId === sceneAsk.userId;
  const hasResponded = sceneAsk.responses?.some(r => r.userId === currentUserId) || false;

  return (
    <Card className="scene-card-compact mb-4 relative overflow-hidden">
      {feedbackShown && (
        <div className="absolute top-2 right-2 emoji-feedback z-10">
          {feedbackShown}
        </div>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={sceneAsk.user.profilePicture || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {sceneAsk.user.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-sm truncate">
                {sceneAsk.user.name}
              </span>
              <span className="text-xl">
                {moodEmojis[sceneAsk.mood]}
              </span>
            </div>
            
            <h3 className="font-medium text-base leading-tight mb-2">
              {sceneAsk.title}
            </h3>
            
            {sceneAsk.description && (
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {sceneAsk.description}
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary" className="text-xs flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {sceneAsk.location}
          </Badge>
          
          <Badge variant="outline" className="text-xs flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeLabels[sceneAsk.timePreference] || sceneAsk.timePreference}
          </Badge>
          
          <Badge variant="outline" className="text-xs capitalize">
            {sceneAsk.purpose}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {sceneAsk.joinCount || 0} joined
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" />
              {sceneAsk.helpCount || 0} helped
            </span>
            {sceneAsk.responseCount > 0 && (
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                {sceneAsk.responseCount} responses
              </span>
            )}
          </div>

          {!isOwnPost && !hasResponded && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleHelp}
                disabled={respondMutation.isPending}
                className="text-xs px-3 py-1 h-auto"
              >
                <Heart className="w-3 h-3 mr-1" />
                Help
              </Button>
              <Button
                size="sm"
                onClick={handleJoin}
                disabled={respondMutation.isPending}
                className="text-xs px-3 py-1 h-auto btn-primary"
              >
                <Users className="w-3 h-3 mr-1" />
                Join
              </Button>
            </div>
          )}

          {hasResponded && (
            <Badge variant="default" className="text-xs">
              Responded
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}