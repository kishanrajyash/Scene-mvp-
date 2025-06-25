import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock } from "lucide-react";
import type { Availability } from "@shared/schema";

interface AvailabilityFormProps {
  userId: number;
}

const DAYS_OF_WEEK = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

const TIME_SLOTS = [
  { value: "morning", label: "Morning", description: "6 AM - 12 PM" },
  { value: "afternoon", label: "Afternoon", description: "12 PM - 6 PM" },
  { value: "evening", label: "Evening", description: "6 PM - 12 AM" },
];

export default function AvailabilityForm({ userId }: AvailabilityFormProps) {
  const { toast } = useToast();
  const [selectedSlots, setSelectedSlots] = useState<Record<string, boolean>>({});

  const { data: availability, isLoading } = useQuery<Availability[]>({
    queryKey: [`/api/availability/${userId}`],
  });

  const saveAvailabilityMutation = useMutation({
    mutationFn: (availabilityData: any[]) =>
      apiRequest("POST", "/api/availability", availabilityData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/availability/${userId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/user/${userId}`] });
      toast({
        title: "Availability updated",
        description: "Your availability preferences have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save availability. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Initialize selected slots when availability data loads
  React.useEffect(() => {
    if (availability && availability.length > 0) {
      const slots: Record<string, boolean> = {};
      availability.forEach(slot => {
        const key = `${slot.dayOfWeek}-${slot.timeSlot}`;
        slots[key] = slot.isAvailable;
      });
      setSelectedSlots(slots);
    }
  }, [availability]);

  const handleSlotChange = (dayOfWeek: string, timeSlot: string, checked: boolean) => {
    const key = `${dayOfWeek}-${timeSlot}`;
    setSelectedSlots(prev => ({
      ...prev,
      [key]: checked
    }));
  };

  const handleSave = () => {
    const availabilityData = [];
    
    DAYS_OF_WEEK.forEach(day => {
      TIME_SLOTS.forEach(slot => {
        const key = `${day.value}-${slot.value}`;
        const isAvailable = selectedSlots[key] || false;
        
        availabilityData.push({
          userId,
          dayOfWeek: day.value,
          timeSlot: slot.value,
          isAvailable
        });
      });
    });

    saveAvailabilityMutation.mutate(availabilityData);
  };

  const getSelectedCount = () => {
    return Object.values(selectedSlots).filter(Boolean).length;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading availability...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>Weekly Availability</span>
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Select when you're available for activities
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {getSelectedCount()} time slots selected
            </div>
            <div className="text-xs text-gray-500">
              More availability = better matches
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {DAYS_OF_WEEK.map(day => (
            <div key={day.value} className="space-y-3">
              <h3 className="font-medium text-gray-900 text-sm">{day.label}</h3>
              <div className="space-y-2">
                {TIME_SLOTS.map(slot => {
                  const key = `${day.value}-${slot.value}`;
                  const isChecked = selectedSlots[key] || false;
                  
                  return (
                    <div 
                      key={slot.value} 
                      className="flex items-start space-x-3 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    >
                      <Checkbox
                        id={key}
                        checked={isChecked}
                        onCheckedChange={(checked) => 
                          handleSlotChange(day.value, slot.value, checked as boolean)
                        }
                      />
                      <Label htmlFor={key} className="cursor-pointer flex-1">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {slot.label}
                            </div>
                            <div className="text-xs text-gray-500">
                              {slot.description}
                            </div>
                          </div>
                        </div>
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <Clock className="h-3 w-3 text-blue-600" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-blue-900">Availability Tips</h4>
              <ul className="text-xs text-blue-700 mt-1 space-y-1">
                <li>• More available time slots lead to better matches</li>
                <li>• Weekend availability is popular for most activities</li>
                <li>• Evening slots work well for social activities</li>
                <li>• You can update your availability anytime</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => {
              // Clear all selections
              setSelectedSlots({});
            }}
          >
            Clear All
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveAvailabilityMutation.isPending}
            className="bg-primary text-white hover:bg-primary/90"
          >
            {saveAvailabilityMutation.isPending ? "Saving..." : "Save Availability"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
