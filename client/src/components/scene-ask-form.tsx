import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, MapPin, Clock, Heart } from "lucide-react";

interface SceneAskFormProps {
  onSuccess?: () => void;
}

const moodOptions = [
  { emoji: "😊", label: "Happy & Social", value: "happy" },
  { emoji: "😌", label: "Calm & Peaceful", value: "calm" },
  { emoji: "🎯", label: "Focused & Productive", value: "focused" },
  { emoji: "🌟", label: "Excited & Adventurous", value: "excited" },
  { emoji: "💭", label: "Thoughtful & Deep", value: "thoughtful" },
  { emoji: "🔥", label: "Energetic & Active", value: "energetic" }
];

const purposeOptions = [
  { label: "Connect with others", value: "connect" },
  { label: "Learn something new", value: "learn" },
  { label: "Stay active", value: "active" },
  { label: "Find peace", value: "peace" },
  { label: "Have fun", value: "fun" },
  { label: "Explore ideas", value: "explore" },
  { label: "Get help", value: "help" },
  { label: "Share skills", value: "share" }
];

const timeOptions = [
  { label: "Right now", value: "now" },
  { label: "In the next hour", value: "hour" },
  { label: "Today", value: "today" },
  { label: "This week", value: "week" },
  { label: "Flexible", value: "flexible" }
];

export default function SceneAskForm({ onSuccess }: SceneAskFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    mood: "",
    purpose: "",
    timePreference: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createSceneAskMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/scene-asks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create scene ask");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scene-asks"] });
      toast({
        title: "Scene Ask posted! 🎉",
        description: "Your request is now live for others to see",
      });
      setFormData({
        title: "",
        description: "",
        location: "",
        mood: "",
        purpose: "",
        timePreference: ""
      });
      setIsOpen(false);
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "Couldn't post your Scene Ask",
        description: "Please try again",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.location || !formData.mood || !formData.purpose || !formData.timePreference) {
      toast({
        title: "Please fill in all fields",
        description: "All fields are required to post a Scene Ask",
        variant: "destructive",
      });
      return;
    }
    createSceneAskMutation.mutate(formData);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="btn-primary w-full mb-6 flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        Post a Scene Ask
      </Button>
    );
  }

  return (
    <Card className="scene-card mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-primary" />
          Create a Scene Ask
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">What are you looking for?</Label>
            <Input
              id="title"
              placeholder="e.g., Coffee companion for morning walk"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description">Tell us more (optional)</Label>
            <Textarea
              id="description"
              placeholder="Share any details that might help others connect with you..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </Label>
              <Input
                placeholder="Where?"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                When?
              </Label>
              <Select value={formData.timePreference} onValueChange={(value) => setFormData({ ...formData, timePreference: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select timing" />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Your mood</Label>
              <Select value={formData.mood} onValueChange={(value) => setFormData({ ...formData, mood: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="How are you feeling?" />
                </SelectTrigger>
                <SelectContent>
                  {moodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <span className="flex items-center gap-2">
                        <span>{option.emoji}</span>
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Purpose</Label>
              <Select value={formData.purpose} onValueChange={(value) => setFormData({ ...formData, purpose: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="What's your goal?" />
                </SelectTrigger>
                <SelectContent>
                  {purposeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createSceneAskMutation.isPending}
              className="flex-1 btn-primary"
            >
              {createSceneAskMutation.isPending ? "Posting..." : "Post Scene Ask"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}