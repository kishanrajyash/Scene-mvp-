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
  const [selectedUnit, setSelectedUnit] = useState<UnitWithDetails | null>(null);
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
      creatorId: currentUserId,
      category: "",
      preferredDays: [] as string[],
      preferredTimeSlots: [] as string[],
      maxMembers: 6,
    },
  });

  const createUnitMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/units", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/units/user", currentUserId] });
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
    // Convert arrays to comma-separated strings for database storage
    const processedData = {
      ...data,
      preferredDays: Array.isArray(data.preferredDays) ? data.preferredDays.join(",") : data.preferredDays || "",
      preferredTimeSlots: Array.isArray(data.preferredTimeSlots) ? data.preferredTimeSlots.join(",") : data.preferredTimeSlots || "",
    };
    createUnitMutation.mutate(processedData);
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
                  name="category"
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
                            <SelectItem key={category} value={category.toLowerCase()}>
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
                  name="maxMembers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Members</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="2" 
                          max="20"
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
                              const currentValue = Array.isArray(field.value) ? field.value : [];
                              return (
                                <FormItem
                                  key={day}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={currentValue.includes(day)}
                                      onCheckedChange={(checked) => {
                                        const newValue = checked
                                          ? [...currentValue, day]
                                          : currentValue.filter((value: string) => value !== day);
                                        field.onChange(newValue);
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
                  name="preferredTimeSlots"
                  render={() => (
                    <FormItem>
                      <FormLabel>Preferred Times</FormLabel>
                      <div className="flex gap-4">
                        {TIME_SLOTS.map((time) => (
                          <FormField
                            key={time}
                            control={form.control}
                            name="preferredTimeSlots"
                            render={({ field }) => {
                              const currentValue = Array.isArray(field.value) ? field.value : [];
                              return (
                                <FormItem
                                  key={time}
                                  className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                  <FormControl>
                                    <Checkbox
                                      checked={currentValue.includes(time)}
                                      onCheckedChange={(checked) => {
                                        const newValue = checked
                                          ? [...currentValue, time]
                                          : currentValue.filter((value: string) => value !== time);
                                        field.onChange(newValue);
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
            <Card key={unit.id} className="hover:shadow-md transition-shadow h-fit">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg leading-tight">
                  <Users className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{unit.name}</span>
                </CardTitle>
                <CardDescription className="text-sm line-clamp-2 min-h-[2.5rem]">
                  {unit.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <Calendar className="h-4 w-4 flex-shrink-0" />
                    <span className="capitalize truncate">{(unit as any).category || (unit as any).activityCategory}</span>
                  </div>
                  
                  {(unit as any).preferredDays && (
                    <div className="flex items-start gap-2 text-sm text-gray-600 mb-3">
                      <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <span className="capitalize text-xs leading-relaxed line-clamp-2">
                        {typeof (unit as any).preferredDays === 'string' 
                          ? (unit as any).preferredDays.split(',').map((d: string) => d.trim()).join(', ')
                          : Array.isArray((unit as any).preferredDays) 
                            ? (unit as any).preferredDays.join(', ')
                            : (unit as any).preferredDays
                        }
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-xs text-muted-foreground">
                      {unit.memberCount || 0} / {(unit as any).maxMembers || 6} members
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedUnit(unit)}
                      className="text-xs px-3 py-1 h-7"
                    >
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Unit Details Dialog */}
      <Dialog open={!!selectedUnit} onOpenChange={() => setSelectedUnit(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {selectedUnit?.name}
            </DialogTitle>
            <DialogDescription>
              Unit details and member information
            </DialogDescription>
          </DialogHeader>
          
          {selectedUnit && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-600">{selectedUnit.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Category</h3>
                  <p className="text-gray-600 capitalize">{(selectedUnit as any).category || (selectedUnit as any).activityCategory}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Members</h3>
                  <p className="text-gray-600">{selectedUnit.memberCount || 0} / {(selectedUnit as any).maxMembers || 6}</p>
                </div>
                {(selectedUnit as any).preferredDays && (
                  <div>
                    <h3 className="font-semibold mb-2">Preferred Days</h3>
                    <p className="text-gray-600 capitalize">
                      {typeof (selectedUnit as any).preferredDays === 'string' 
                        ? (selectedUnit as any).preferredDays.split(',').map((d: string) => d.trim()).join(', ')
                        : Array.isArray((selectedUnit as any).preferredDays) 
                          ? (selectedUnit as any).preferredDays.join(', ')
                          : (selectedUnit as any).preferredDays
                      }
                    </p>
                  </div>
                )}
                {(selectedUnit as any).preferredTimeSlots && (
                  <div>
                    <h3 className="font-semibold mb-2">Preferred Times</h3>
                    <p className="text-gray-600 capitalize">
                      {typeof (selectedUnit as any).preferredTimeSlots === 'string' 
                        ? (selectedUnit as any).preferredTimeSlots.split(',').map((t: string) => t.trim()).join(', ')
                        : Array.isArray((selectedUnit as any).preferredTimeSlots) 
                          ? (selectedUnit as any).preferredTimeSlots.join(', ')
                          : (selectedUnit as any).preferredTimeSlots
                      }
                    </p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-3">Members</h3>
                <div className="space-y-2">
                  {selectedUnit.members && selectedUnit.members.length > 0 ? (
                    selectedUnit.members.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {member.user.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium">{member.user.username}</p>
                            <p className="text-sm text-gray-500">
                              Joined {member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : 'Recently'}
                            </p>
                          </div>
                        </div>
                        {(selectedUnit as any).creatorId === member.userId && (
                          <span className="text-xs bg-primary text-white px-2 py-1 rounded">Creator</span>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">No members yet. Be the first to join!</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setSelectedUnit(null)} className="flex-1">
                  Close
                </Button>
                {(selectedUnit as any).creatorId !== currentUserId && (
                  <Button className="flex-1">
                    Join Unit
                  </Button>
                )}
                {(selectedUnit as any).creatorId === currentUserId && (
                  <Button variant="outline" className="flex-1">
                    Manage Unit
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}