import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/header";
import AvailabilityForm from "@/components/availability-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UserWithDetails, Resource } from "@shared/schema";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  profilePicture: z.string().url().optional().or(z.literal("")),
});

const resourceSchema = z.object({
  hasVehicle: z.boolean(),
  budgetMin: z.number().min(0).optional(),
  budgetMax: z.number().min(0).optional(),
  canHost: z.boolean(),
  location: z.string().optional(),
});

export default function Profile() {
  const currentUserId = 1;
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");

  const { data: user, isLoading } = useQuery<UserWithDetails>({
    queryKey: [`/api/user/${currentUserId}`],
  });

  const { data: resources } = useQuery<Resource | null>({
    queryKey: [`/api/resources/${currentUserId}`],
  });

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      profilePicture: user?.profilePicture || "",
    },
  });

  const resourceForm = useForm<z.infer<typeof resourceSchema>>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      hasVehicle: resources?.hasVehicle || false,
      budgetMin: resources?.budgetMin || undefined,
      budgetMax: resources?.budgetMax || undefined,
      canHost: resources?.canHost || false,
      location: resources?.location || "",
    },
  });

  const profileMutation = useMutation({
    mutationFn: (data: z.infer<typeof profileSchema>) =>
      apiRequest("PATCH", `/api/user/${currentUserId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${currentUserId}`] });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const resourceMutation = useMutation({
    mutationFn: (data: z.infer<typeof resourceSchema>) =>
      apiRequest("POST", "/api/resources", { userId: currentUserId, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/resources/${currentUserId}`] });
      toast({
        title: "Resources updated",
        description: "Your resource information has been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save resources. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onProfileSubmit = (data: z.infer<typeof profileSchema>) => {
    profileMutation.mutate(data);
  };

  const onResourceSubmit = (data: z.infer<typeof resourceSchema>) => {
    resourceMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="bg-white rounded-xl p-6 space-y-4">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
              <div className="h-10 bg-gray-200 rounded"></div>
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600">User not found</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Update form defaults when data loads
  if (user && !profileForm.getValues().name) {
    profileForm.reset({
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture || "",
    });
  }

  if (resources && !resourceForm.getValues().hasVehicle) {
    resourceForm.reset({
      hasVehicle: resources.hasVehicle,
      budgetMin: resources.budgetMin || undefined,
      budgetMax: resources.budgetMax || undefined,
      canHost: resources.canHost,
      location: resources.location || "",
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-2">Manage your profile information and preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="availability">Availability</TabsTrigger>
            <TabsTrigger value="personality">Personality</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="Enter your email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="profilePicture"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profile Picture URL (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/your-photo.jpg" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="bg-primary text-white hover:bg-primary/90"
                      disabled={profileMutation.isPending}
                    >
                      {profileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources">
            <Card>
              <CardHeader>
                <CardTitle>Resources & Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...resourceForm}>
                  <form onSubmit={resourceForm.handleSubmit(onResourceSubmit)} className="space-y-6">
                    <FormField
                      control={resourceForm.control}
                      name="hasVehicle"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>I have access to a vehicle</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              This helps match you with activities that might require transportation
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={resourceForm.control}
                        name="budgetMin"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Budget ($)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="0" 
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={resourceForm.control}
                        name="budgetMax"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Maximum Budget ($)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="100" 
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={resourceForm.control}
                      name="canHost"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>I can host activities at my place</FormLabel>
                            <p className="text-sm text-muted-foreground">
                              Perfect for board games, cooking sessions, or small group activities
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={resourceForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>General Location</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Downtown, North Side" {...field} />
                          </FormControl>
                          <p className="text-sm text-muted-foreground">
                            This helps match you with people in your area
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="bg-primary text-white hover:bg-primary/90"
                      disabled={resourceMutation.isPending}
                    >
                      {resourceMutation.isPending ? "Saving..." : "Save Resources"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="availability">
            <AvailabilityForm userId={currentUserId} />
          </TabsContent>

          <TabsContent value="personality">
            <Card>
              <CardHeader>
                <CardTitle>Personality Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                {user.quizCompleted ? (
                  <div className="space-y-6">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gradient-to-br from-primary to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span className="text-white text-3xl">✨</span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900">{user.personalityType}</h3>
                      <p className="text-gray-600 mt-2">{user.personalityDescription}</p>
                    </div>
                    
                    {user.personalityTraits && (
                      <div className="space-y-3">
                        {Object.entries(user.personalityTraits).map(([trait, value]) => (
                          <div key={trait} className="flex items-center justify-between">
                            <span className="text-sm text-gray-600 capitalize font-medium">{trait}</span>
                            <div className="flex-1 mx-4">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                                  style={{ width: `${value}%` }}
                                ></div>
                              </div>
                            </div>
                            <span className="text-sm font-medium text-gray-900 w-12 text-right">{value}%</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="text-center pt-4">
                      <Button variant="outline">
                        Retake Personality Quiz
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-6">
                      Complete our personality assessment to get better matched with compatible activity partners.
                    </p>
                    <Button className="bg-primary text-white hover:bg-primary/90">
                      Start Personality Quiz
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
