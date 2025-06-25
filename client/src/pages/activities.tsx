import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/header";
import ActivityCard from "@/components/activity-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";
import type { UserWithDetails, Activity } from "@shared/schema";

const activitySchema = z.object({
  name: z.string().min(1, "Activity name is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  skillLevel: z.string().min(1, "Skill level is required"),
  maxParticipants: z.number().min(2, "Must allow at least 2 participants").max(20, "Maximum 20 participants"),
});

const categories = [
  "Outdoor",
  "Sports",
  "Fitness",
  "Arts & Crafts",
  "Music",
  "Food & Cooking",
  "Games",
  "Learning",
  "Volunteering",
  "Social",
  "Travel",
  "Photography",
  "Technology",
  "Reading",
  "Other"
];

const skillLevels = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "all", label: "All Levels" }
];

export default function Activities() {
  const currentUserId = 1;
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: user, isLoading } = useQuery<UserWithDetails>({
    queryKey: [`/api/user/${currentUserId}`],
  });

  const form = useForm<z.infer<typeof activitySchema>>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      skillLevel: "",
      maxParticipants: 4,
    },
  });

  const createActivityMutation = useMutation({
    mutationFn: (data: z.infer<typeof activitySchema>) =>
      apiRequest("POST", "/api/activities", { userId: currentUserId, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${currentUserId}`] });
      toast({
        title: "Activity created",
        description: "Your new activity has been added successfully.",
      });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create activity. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof activitySchema>) => {
    createActivityMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="flex justify-between items-center">
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
              <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Activities</h1>
            <p className="text-gray-600 mt-2">Manage the activities you're interested in</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-white hover:bg-primary/90 flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Add Activity</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Activity</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Activity Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Weekend Hiking" {...field} />
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
                            placeholder="Describe what this activity involves and what you're looking for..."
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="skillLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Skill Level</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select skill level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {skillLevels.map((level) => (
                              <SelectItem key={level.value} value={level.value}>
                                {level.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="maxParticipants"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Participants</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={2} 
                            max={20} 
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-primary text-white hover:bg-primary/90"
                      disabled={createActivityMutation.isPending}
                    >
                      {createActivityMutation.isPending ? "Creating..." : "Create Activity"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {user.activities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {user.activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} showActions />
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent className="pt-6">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No activities yet</h3>
                <p className="text-gray-600 mb-6">
                  Start by adding activities you're interested in doing with others. This helps us find you the perfect matches!
                </p>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-primary text-white hover:bg-primary/90">
                      Add Your First Activity
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add New Activity</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Activity Name</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., Weekend Hiking" {...field} />
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
                                  placeholder="Describe what this activity involves and what you're looking for..."
                                  className="min-h-[100px]"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {categories.map((category) => (
                                    <SelectItem key={category} value={category}>
                                      {category}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="skillLevel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Skill Level</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select skill level" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {skillLevels.map((level) => (
                                    <SelectItem key={level.value} value={level.value}>
                                      {level.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="maxParticipants"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Maximum Participants</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  min={2} 
                                  max={20} 
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="flex justify-end space-x-2 pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="submit" 
                            className="bg-primary text-white hover:bg-primary/90"
                            disabled={createActivityMutation.isPending}
                          >
                            {createActivityMutation.isPending ? "Creating..." : "Create Activity"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
