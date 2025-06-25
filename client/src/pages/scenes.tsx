import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Users, Calendar, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertSceneSchema } from "@shared/schema";
import type { SceneWithDetails, Activity } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Scenes() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedScene, setSelectedScene] = useState<SceneWithDetails | null>(null);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [joinNote, setJoinNote] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user ID (assuming user 1 for now)
  const currentUserId = 1;

  const { data: scenesResponse, isLoading } = useQuery<{ scenes: SceneWithDetails[], message?: string }>({
    queryKey: ["/api/scenes"],
  });

  const { data: activities = [] } = useQuery<Activity[]>({
    queryKey: ["/api/activities/user", currentUserId],
  });

  const form = useForm({
    resolver: zodResolver(insertSceneSchema),
    defaultValues: {
      name: "",
      description: "",
      createdBy: currentUserId,
      activityId: undefined,
      maxParticipants: 10,
      scheduledDate: undefined,
      location: "",
      status: "open",
    },
  });

  const createSceneMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/scenes", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scenes"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Success!",
        description: "Scene created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create scene",
        variant: "destructive",
      });
    },
  });

  const joinSceneMutation = useMutation({
    mutationFn: ({ sceneId, noteToOthers }: { sceneId: number, noteToOthers?: string }) => 
      apiRequest(`/api/scenes/${sceneId}/join`, "POST", { 
        userId: currentUserId, 
        noteToOthers 
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scenes"] });
      setJoinDialogOpen(false);
      setSelectedScene(null);
      setJoinNote("");
      toast({
        title: "Success!",
        description: "Successfully joined scene",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to join scene",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    // Convert date string to Date object if provided
    if (data.scheduledDate) {
      data.scheduledDate = new Date(data.scheduledDate);
    }
    createSceneMutation.mutate(data);
  };

  const handleJoinScene = (scene: SceneWithDetails) => {
    setSelectedScene(scene);
    setJoinDialogOpen(true);
  };

  const confirmJoinScene = () => {
    if (selectedScene) {
      joinSceneMutation.mutate({ 
        sceneId: selectedScene.id, 
        noteToOthers: joinNote.trim() || undefined 
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">Loading scenes...</div>
        </div>
      </div>
    );
  }

  const scenes = scenesResponse?.scenes || [];
  const emptyMessage = scenesResponse?.message;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Active Scenes</h1>
          <p className="text-muted-foreground mt-2">
            Join or create activity scenes happening now
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Scene
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Scene</DialogTitle>
              <DialogDescription>
                Create an activity scene for others to join
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Scene Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Saturday Morning Hike" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe the activity..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="activityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related Activity (Optional)</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an activity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {activities.map((activity) => (
                            <SelectItem key={activity.id} value={activity.id.toString()}>
                              {activity.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="maxParticipants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Participants</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min="2" 
                            max="50"
                            {...field} 
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scheduledDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scheduled Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="datetime-local" 
                            {...field}
                            value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Location</FormLabel>
                      <FormControl>
                        <Input placeholder="Where will this happen?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createSceneMutation.isPending}>
                    {createSceneMutation.isPending ? "Creating..." : "Create Scene"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {scenes.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <CardTitle className="text-xl">No Active Scenes</CardTitle>
            <CardDescription>
              {emptyMessage || "No scenes available right now. Create your own!"}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {scenes.map((scene) => (
            <Card key={scene.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{scene.name}</span>
                  <Badge variant="secondary">
                    {scene.participantCount}/{scene.maxParticipants}
                  </Badge>
                </CardTitle>
                <CardDescription>{scene.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4" />
                    <span>Created by {scene.creator.name}</span>
                  </div>
                  
                  {scene.location && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span>{scene.location}</span>
                    </div>
                  )}
                  
                  {scene.scheduledDate && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(scene.scheduledDate).toLocaleDateString()}</span>
                    </div>
                  )}

                  {scene.participants.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Who's Coming:</p>
                      <div className="flex flex-wrap gap-2">
                        {scene.participants.slice(0, 3).map((participant) => (
                          <div key={participant.id} className="flex items-center gap-1">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={participant.user.profilePicture || ""} />
                              <AvatarFallback className="text-xs">
                                {participant.user.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs">{participant.user.name}</span>
                          </div>
                        ))}
                        {scene.participants.length > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{scene.participants.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-2">
                    <Button 
                      className="w-full" 
                      size="sm"
                      onClick={() => handleJoinScene(scene)}
                      disabled={scene.participantCount >= scene.maxParticipants}
                    >
                      {scene.participantCount >= scene.maxParticipants ? "Full" : "Join Scene"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Join Scene Dialog */}
      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Join Scene</DialogTitle>
            <DialogDescription>
              You're about to join "{selectedScene?.name}". Add an optional note to let others know about you.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="joinNote">Note to Others (Optional)</Label>
              <Textarea
                id="joinNote"
                placeholder="e.g., First time hiking, looking forward to meeting everyone!"
                value={joinNote}
                onChange={(e) => setJoinNote(e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setJoinDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmJoinScene}
                disabled={joinSceneMutation.isPending}
              >
                {joinSceneMutation.isPending ? "Joining..." : "Join Scene"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}