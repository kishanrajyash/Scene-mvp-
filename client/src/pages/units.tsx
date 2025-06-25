import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Users, Calendar, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertUnitSchema } from "@shared/schema";
import type { UnitWithDetails } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const ACTIVITY_CATEGORIES = [
  "Outdoor", "Sports", "Arts & Crafts", "Music", "Food & Cooking", 
  "Games", "Technology", "Photography", "Fitness", "Social"
];

const DAYS_OF_WEEK = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"
];

const TIME_SLOTS = [
  "morning", "afternoon", "evening"
];

export default function Units() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current user ID (assuming user 1 for now)
  const currentUserId = 1;

  const { data: units = [], isLoading } = useQuery<UnitWithDetails[]>({
    queryKey: ["/api/units/user", currentUserId],
  });

  const form = useForm({
    resolver: zodResolver(insertUnitSchema),
    defaultValues: {
      name: "",
      description: "",
      createdBy: currentUserId,
      activityCategory: "",
      preferredDays: [],
      preferredTimes: [],
      isActive: true,
    },
  });

  const createUnitMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/units", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/units/user"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Success!",
        description: "Unit created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create unit",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createUnitMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">Loading your units...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Units</h1>
          <p className="text-muted-foreground mt-2">
            Recurring groups for your favorite activities
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Unit
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Unit</DialogTitle>
              <DialogDescription>
                Create a recurring group for activities you want to do regularly
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unit Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Weekend Hikers" {...field} />
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
                          placeholder="Describe what this unit is about..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="activityCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Activity Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {ACTIVITY_CATEGORIES.map((category) => (
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
                  name="preferredDays"
                  render={() => (
                    <FormItem>
                      <FormLabel>Preferred Days</FormLabel>
                      <div className="grid grid-cols-2 gap-2">
                        {DAYS_OF_WEEK.map((day) => (
                          <FormField
                            key={day}
                            control={form.control}
                            name="preferredDays"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={day}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(day)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, day])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== day
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal capitalize">
                                    {day}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferredTimes"
                  render={() => (
                    <FormItem>
                      <FormLabel>Preferred Times</FormLabel>
                      <div className="flex gap-4">
                        {TIME_SLOTS.map((time) => (
                          <FormField
                            key={time}
                            control={form.control}
                            name="preferredTimes"
                            render={({ field }) => {
                              return (
                                <FormItem
                                  key={time}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(time)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, time])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== time
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal capitalize">
                                    {time}
                                  </FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                      </div>
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
                  <Button type="submit" disabled={createUnitMutation.isPending}>
                    {createUnitMutation.isPending ? "Creating..." : "Create Unit"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {units.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <CardTitle className="text-xl">No Units Yet</CardTitle>
            <CardDescription>
              Create your first unit to start building recurring activity groups
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {units.map((unit) => (
            <Card key={unit.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {unit.name}
                </CardTitle>
                <CardDescription>{unit.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4" />
                    <span>{unit.activityCategory}</span>
                  </div>
                  
                  {unit.preferredDays && unit.preferredDays.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span className="capitalize">
                        {unit.preferredDays.join(", ")}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-sm text-muted-foreground">
                      {unit.memberCount} member{unit.memberCount !== 1 ? "s" : ""}
                    </span>
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}