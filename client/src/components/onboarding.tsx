import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

interface OnboardingProps {
  user: User;
  onComplete: () => void;
}

const moodOptions = [
  { emoji: "😊", label: "Happy", value: "happy" },
  { emoji: "😌", label: "Calm", value: "calm" },
  { emoji: "🎯", label: "Focused", value: "focused" },
  { emoji: "🌟", label: "Excited", value: "excited" },
  { emoji: "💭", label: "Thoughtful", value: "thoughtful" },
  { emoji: "🔥", label: "Energetic", value: "energetic" }
];

const purposeOptions = [
  { emoji: "🤝", label: "Connect with others", value: "connect" },
  { emoji: "🎨", label: "Learn something new", value: "learn" },
  { emoji: "💪", label: "Stay active", value: "active" },
  { emoji: "🧘", label: "Find peace", value: "peace" },
  { emoji: "🎉", label: "Have fun", value: "fun" },
  { emoji: "💡", label: "Explore ideas", value: "explore" }
];

const offerNeedOptions = [
  { emoji: "🎁", label: "I can offer help", value: "offer" },
  { emoji: "🙏", label: "I need support", value: "need" },
  { emoji: "⚖️", label: "Both equally", value: "both" }
];

export default function Onboarding({ user, onComplete }: OnboardingProps) {
  const [step, setStep] = useState(1);
  const [selectedMood, setSelectedMood] = useState("");
  const [selectedPurpose, setSelectedPurpose] = useState("");
  const [selectedOfferNeed, setSelectedOfferNeed] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateUserMutation = useMutation({
    mutationFn: async (data: { currentMood: string; purpose: string; offerNeed: string }) => {
      const response = await fetch(`/api/users/${user.id}/onboarding`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update user");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      toast({
        title: "Welcome to Scene! 🎉",
        description: "Your profile is ready. Let's find your community!",
      });
      onComplete();
    },
    onError: () => {
      toast({
        title: "Something went wrong",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      updateUserMutation.mutate({
        currentMood: selectedMood,
        purpose: selectedPurpose,
        offerNeed: selectedOfferNeed,
      });
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1: return selectedMood;
      case 2: return selectedPurpose;
      case 3: return selectedOfferNeed;
      default: return false;
    }
  };

  const OptionCard = ({ option, selected, onSelect }: any) => (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:scale-105 ${
        selected ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'
      }`}
      onClick={() => onSelect(option.value)}
    >
      <CardContent className="flex flex-col items-center p-4 text-center">
        <div className="text-3xl mb-2">{option.emoji}</div>
        <div className="font-medium text-sm">{option.label}</div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background p-4 flex items-center justify-center">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Welcome to Scene</h1>
          <p className="text-muted-foreground">Let's set up your profile in 3 quick steps</p>
          <div className="flex justify-center mt-4 gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-colors ${
                  i <= step ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
        </div>

        <Card className="scene-card mb-6">
          <CardHeader>
            <CardTitle className="text-center">
              {step === 1 && "How are you feeling today?"}
              {step === 2 && "What brings you to Scene?"}
              {step === 3 && "How do you like to connect?"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <div className="grid grid-cols-2 gap-3">
                {moodOptions.map((option) => (
                  <OptionCard
                    key={option.value}
                    option={option}
                    selected={selectedMood === option.value}
                    onSelect={setSelectedMood}
                  />
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-2 gap-3">
                {purposeOptions.map((option) => (
                  <OptionCard
                    key={option.value}
                    option={option}
                    selected={selectedPurpose === option.value}
                    onSelect={setSelectedPurpose}
                  />
                ))}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                {offerNeedOptions.map((option) => (
                  <OptionCard
                    key={option.value}
                    option={option}
                    selected={selectedOfferNeed === option.value}
                    onSelect={setSelectedOfferNeed}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
              className="flex-1"
            >
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!canProceed() || updateUserMutation.isPending}
            className="flex-1 btn-primary"
          >
            {step === 3 
              ? updateUserMutation.isPending ? "Setting up..." : "Complete"
              : "Next"
            }
          </Button>
        </div>
      </div>
    </div>
  );
}