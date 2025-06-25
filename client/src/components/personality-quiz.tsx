import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PersonalityQuestion } from "@shared/schema";

interface PersonalityQuizProps {
  userId: number;
}

export default function PersonalityQuiz({ userId }: PersonalityQuizProps) {
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);

  const { data: questions, isLoading } = useQuery<PersonalityQuestion[]>({
    queryKey: ["/api/personality/questions"],
  });

  const saveAnswerMutation = useMutation({
    mutationFn: (data: { questionId: number; selectedOption: number }) =>
      apiRequest("POST", "/api/personality/answer", {
        userId,
        questionId: data.questionId,
        selectedOption: data.selectedOption,
      }),
  });

  const completeQuizMutation = useMutation({
    mutationFn: (personalityData: any) =>
      apiRequest("POST", "/api/personality/complete", personalityData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/user/${userId}`] });
      toast({
        title: "Personality assessment complete!",
        description: "Your profile has been updated with your personality insights.",
      });
    },
  });

  if (isLoading || !questions) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Loading Personality Quiz...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleNext = async () => {
    if (selectedOption === null) return;

    // Save the answer
    const answerData = {
      questionId: currentQuestion.id,
      selectedOption: selectedOption,
    };
    
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: selectedOption }));
    await saveAnswerMutation.mutateAsync(answerData);

    if (isLastQuestion) {
      // Calculate personality traits and complete quiz
      await completePersonalityAssessment();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedOption(null);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      const previousQuestion = questions[currentQuestionIndex - 1];
      setSelectedOption(answers[previousQuestion.id] || null);
    }
  };

  const completePersonalityAssessment = async () => {
    // Calculate traits based on answers
    const traits = { extroversion: 0, adventure: 0, planning: 0, creativity: 0, empathy: 0 };
    const traitCounts = { extroversion: 0, adventure: 0, planning: 0, creativity: 0, empathy: 0 };

    questions.forEach(question => {
      const answerIndex = answers[question.id];
      if (answerIndex !== undefined && question.options && question.options[answerIndex]) {
        const option = question.options[answerIndex];
        const traitKey = option.trait as keyof typeof traits;
        if (traits.hasOwnProperty(traitKey)) {
          traits[traitKey] += option.value * 20; // Scale to 0-100
          traitCounts[traitKey]++;
        }
      }
    });

    // Average the traits
    Object.keys(traits).forEach(key => {
      const traitKey = key as keyof typeof traits;
      if (traitCounts[traitKey] > 0) {
        traits[traitKey] = Math.round(traits[traitKey] / traitCounts[traitKey]);
      }
    });

    // Determine personality type based on dominant traits
    const { personalityType, personalityDescription } = determinePersonalityType(traits);

    await completeQuizMutation.mutateAsync({
      userId,
      personalityType,
      personalityDescription,
      personalityTraits: traits,
    });
  };

  const determinePersonalityType = (traits: any) => {
    const { extroversion, adventure, planning, creativity, empathy } = traits;
    
    if (adventure >= 80 && extroversion >= 70) {
      return {
        personalityType: "The Explorer",
        personalityDescription: "Adventurous, curious, and loves trying new experiences with others"
      };
    } else if (creativity >= 80 && empathy >= 70) {
      return {
        personalityType: "The Creator",
        personalityDescription: "Creative and empathetic, enjoys meaningful artistic experiences"
      };
    } else if (planning >= 80 && extroversion >= 70) {
      return {
        personalityType: "The Organizer",
        personalityDescription: "Structured and social, loves planning perfect group activities"
      };
    } else if (empathy >= 80 && extroversion >= 70) {
      return {
        personalityType: "The Connector",
        personalityDescription: "Warm and social, brings people together through shared interests"
      };
    } else if (planning >= 80 && creativity >= 70) {
      return {
        personalityType: "The Strategist",
        personalityDescription: "Analytical and creative, enjoys well-planned intellectual pursuits"
      };
    } else {
      return {
        personalityType: "The Balanced",
        personalityDescription: "Well-rounded personality with diverse interests and social flexibility"
      };
    }
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
        <div>
          <CardTitle className="text-xl">Complete Your Personality Profile</CardTitle>
          <p className="text-sm text-gray-600 mt-1">Answer a few fun questions to improve your matches</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-gray-900">Progress</div>
          <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {currentQuestionIndex + 1} of {questions.length}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
            <span className="text-2xl">{currentQuestion.emoji}</span>
            <span>{currentQuestion.question}</span>
          </h3>
          
          <RadioGroup
            value={selectedOption?.toString()}
            onValueChange={(value) => setSelectedOption(parseInt(value))}
            className="space-y-3"
          >
            {currentQuestion.options?.map((option, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-white hover:shadow-sm transition-all cursor-pointer">
                <RadioGroupItem value={index.toString()} id={`option-${index}`} className="mt-1" />
                <Label htmlFor={`option-${index}`} className="cursor-pointer flex-1">
                  <div className="font-medium text-gray-900">{option.text}</div>
                  <div className="text-sm text-gray-600 mt-1">{option.subtext}</div>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setCurrentQuestionIndex(prev => prev + 1);
                setSelectedOption(null);
              }}
              disabled={isLastQuestion}
            >
              Skip
            </Button>
            <Button
              onClick={handleNext}
              disabled={selectedOption === null || saveAnswerMutation.isPending || completeQuizMutation.isPending}
              className="bg-primary text-white hover:bg-primary/90 flex items-center space-x-2"
            >
              <span>
                {saveAnswerMutation.isPending || completeQuizMutation.isPending
                  ? "Saving..."
                  : isLastQuestion
                  ? "Complete"
                  : "Next"
                }
              </span>
              {!isLastQuestion && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
