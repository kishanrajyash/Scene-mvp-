import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Users, Car, DollarSign, Clock } from "lucide-react";
import type { MatchWithDetails } from "@shared/schema";

interface MatchCardProps {
  match: MatchWithDetails;
}

export default function MatchCard({ match }: MatchCardProps) {
  const { toast } = useToast();

  const updateMatchMutation = useMutation({
    mutationFn: (status: string) =>
      apiRequest("PATCH", `/api/matches/${match.id}/status`, { status }),
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${match.userId}`] });
      toast({
        title: status === "connected" ? "Match connected!" : "Match skipped",
        description: status === "connected" 
          ? `You've connected with ${match.matchedUser.name}` 
          : "This match has been skipped",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update match status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleConnect = () => {
    updateMatchMutation.mutate("connected");
  };

  const handleSkip = () => {
    updateMatchMutation.mutate("skipped");
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 90) return "bg-secondary text-white";
    if (score >= 80) return "bg-accent text-accent-foreground";
    return "bg-primary text-white";
  };

  const getCompatibilityDot = (score: number) => {
    if (score >= 90) return "bg-secondary";
    if (score >= 80) return "bg-accent";
    return "bg-primary";
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer animate-fade-in">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={match.matchedUser.profilePicture || undefined} alt={match.matchedUser.name} />
            <AvatarFallback>
              {match.matchedUser.name.split(" ").map(n => n[0]).join("").toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{match.matchedUser.name}</h3>
              <div className="flex items-center space-x-1">
                <div className={`w-3 h-3 rounded-full ${getCompatibilityDot(match.compatibilityScore)}`}></div>
                <span className={`text-sm font-medium px-2 py-1 rounded-full ${getCompatibilityColor(match.compatibilityScore)}`}>
                  {match.compatibilityScore}% Match
                </span>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 mt-1">
              Wants to do: <span className="font-medium">{match.activity.name}</span>
            </p>
            
            <div className="flex items-center space-x-4 mt-2">
              {match.distance && (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" />
                  <span>{match.distance.toFixed(1)} miles away</span>
                </div>
              )}
              {match.mutualConnections && match.mutualConnections > 0 && (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Users className="h-3 w-3" />
                  <span>{match.mutualConnections} mutual connections</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2 mt-3">
              {match.matchedUser.personalityType && (
                <Badge variant="secondary" className="text-xs">
                  {match.matchedUser.personalityType}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-200">
                <Clock className="h-3 w-3 mr-1" />
                Available Now
              </Badge>
              <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                <Car className="h-3 w-3 mr-1" />
                Has Transport
              </Badge>
            </div>
          </div>
        </div>
        
        {match.status === "pending" && (
          <>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                {match.matchReason || "Compatible personality traits and shared interests"}
              </p>
            </div>
            
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <div className="flex-1"></div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleSkip}
                  disabled={updateMatchMutation.isPending}
                  className="text-gray-700 hover:bg-gray-50"
                >
                  Skip
                </Button>
                <Button 
                  size="sm"
                  onClick={handleConnect}
                  disabled={updateMatchMutation.isPending}
                  className="bg-primary text-white hover:bg-primary/90"
                >
                  {updateMatchMutation.isPending ? "Connecting..." : "Connect"}
                </Button>
              </div>
            </div>
          </>
        )}
        
        {match.status === "connected" && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <Badge className="bg-secondary text-white">Connected</Badge>
              <Button variant="outline" size="sm">
                Message
              </Button>
            </div>
          </div>
        )}
        
        {match.status === "skipped" && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <Badge variant="outline" className="text-gray-500">Skipped</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
