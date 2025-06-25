import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Users, 
  Mountain,
  Utensils,
  Palette,
  Gamepad2,
  Music,
  Camera,
  Book,
  Dumbbell,
  Code,
  Heart,
  MapPin
} from "lucide-react";
import type { Activity } from "@shared/schema";

interface ActivityCardProps {
  activity: Activity;
  showActions?: boolean;
}

const getCategoryIcon = (category: string) => {
  const iconClass = "h-5 w-5";
  switch (category.toLowerCase()) {
    case "outdoor": return <Mountain className={iconClass} />;
    case "food & cooking": case "culinary": return <Utensils className={iconClass} />;
    case "arts & crafts": case "culture": return <Palette className={iconClass} />;
    case "games": return <Gamepad2 className={iconClass} />;
    case "music": return <Music className={iconClass} />;
    case "photography": return <Camera className={iconClass} />;
    case "reading": return <Book className={iconClass} />;
    case "fitness": case "sports": return <Dumbbell className={iconClass} />;
    case "technology": return <Code className={iconClass} />;
    case "volunteering": return <Heart className={iconClass} />;
    default: return <Users className={iconClass} />;
  }
};

const getCategoryColor = (category: string) => {
  const colors = {
    "outdoor": "bg-green-100 text-green-600",
    "food & cooking": "bg-orange-100 text-orange-600", 
    "culinary": "bg-orange-100 text-orange-600",
    "arts & crafts": "bg-purple-100 text-purple-600",
    "culture": "bg-purple-100 text-purple-600",
    "games": "bg-blue-100 text-blue-600",
    "music": "bg-pink-100 text-pink-600",
    "photography": "bg-indigo-100 text-indigo-600",
    "reading": "bg-yellow-100 text-yellow-600",
    "fitness": "bg-red-100 text-red-600",
    "sports": "bg-red-100 text-red-600",
    "technology": "bg-gray-100 text-gray-600",
    "volunteering": "bg-rose-100 text-rose-600",
    "default": "bg-slate-100 text-slate-600"
  };
  return colors[category.toLowerCase() as keyof typeof colors] || colors.default;
};

export default function ActivityCard({ activity, showActions = false }: ActivityCardProps) {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteActivityMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", `/api/activities/${activity.id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${activity.userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/activities/user/${activity.userId}`] });
      toast({
        title: "Activity deleted",
        description: "Your activity has been removed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete activity. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleActivityMutation = useMutation({
    mutationFn: () => 
      apiRequest("PATCH", `/api/activities/${activity.id}`, { isActive: !activity.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${activity.userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/activities/user/${activity.userId}`] });
      toast({
        title: activity.isActive ? "Activity paused" : "Activity activated",
        description: `Your activity is now ${activity.isActive ? "paused" : "active"}.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update activity status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDelete = () => {
    setIsDeleting(true);
    deleteActivityMutation.mutate();
  };

  const handleToggleStatus = () => {
    toggleActivityMutation.mutate();
  };

  // Mock potential matches count for demo
  const potentialMatches = Math.floor(Math.random() * 20) + 1;

  return (
    <Card className="hover:shadow-md transition-shadow animate-fade-in">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getCategoryColor(activity.category)}`}>
              {getCategoryIcon(activity.category)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{activity.name}</h3>
              <p className="text-sm text-gray-600">
                {activity.category} • {activity.skillLevel === "all" ? "All Levels" : activity.skillLevel}
              </p>
            </div>
          </div>
          
          {showActions && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => console.log("Edit activity")}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Activity
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleToggleStatus}>
                  <Users className="h-4 w-4 mr-2" />
                  {activity.isActive ? "Pause" : "Activate"}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDelete}
                  className="text-red-600 focus:text-red-600"
                  disabled={isDeleting || deleteActivityMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {isDeleting || deleteActivityMutation.isPending ? "Deleting..." : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {activity.description}
        </p>
        
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1">
              <Users className="h-3 w-3" />
              <span>{potentialMatches} potential matches</span>
            </span>
            {activity.maxParticipants && (
              <span className="flex items-center space-x-1">
                <MapPin className="h-3 w-3" />
                <span>Max {activity.maxParticipants} people</span>
              </span>
            )}
          </div>
          
          <Badge 
            variant={activity.isActive ? "default" : "secondary"}
            className={`text-xs ${
              activity.isActive 
                ? "bg-green-100 text-green-800 border-green-200" 
                : "bg-yellow-100 text-yellow-800 border-yellow-200"
            }`}
          >
            {activity.isActive ? "Active" : "Paused"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
