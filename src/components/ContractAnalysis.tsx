import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Brain, CheckCircle, Loader2 } from "lucide-react";

export const ContractAnalysis = () => {
  const [contractText, setContractText] = useState("");
  const [draftPrompt, setDraftPrompt] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisType, setAnalysisType] = useState<'draft' | 'review' | 'grade'>('review');
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (analysisType !== 'draft' && !contractText.trim()) {
      toast({
        title: "Missing Contract",
        description: "Please paste a contract to analyze.",
        variant: "destructive",
      });
      return;
    }

    if (analysisType === 'draft' && !draftPrompt.trim()) {
      toast({
        title: "Missing Requirements",
        description: "Please describe what type of contract you want to draft.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-contract', {
        body: {
          contractText: contractText,
          analysisType: analysisType,
          prompt: analysisType === 'draft' ? draftPrompt : undefined,
        },
      });

      if (error) throw error;

      setAnalysis(data.analysis);
      toast({
        title: "Analysis Complete",
        description: `Contract ${analysisType} completed successfully.`,
      });
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze contract. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getAnalysisIcon = () => {
    switch (analysisType) {
      case 'draft': return <FileText className="h-5 w-5" />;
      case 'review': return <Brain className="h-5 w-5" />;
      case 'grade': return <CheckCircle className="h-5 w-5" />;
    }
  };

  const getAnalysisDescription = () => {
    switch (analysisType) {
      case 'draft': return "AI will draft a complete contract based on your requirements";
      case 'review': return "AI will analyze strengths, weaknesses, and risks in your contract";
      case 'grade': return "AI will grade your contract and provide detailed feedback";
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getAnalysisIcon()}
            Contract Analysis with Gemini AI
          </CardTitle>
          <CardDescription>
            Advanced contract analysis powered by Google's Gemini 2.5 Flash model
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={analysisType} onValueChange={(value) => setAnalysisType(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="draft">Draft Contract</TabsTrigger>
              <TabsTrigger value="review">Review Contract</TabsTrigger>
              <TabsTrigger value="grade">Grade Contract</TabsTrigger>
            </TabsList>

            <TabsContent value="draft" className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Contract Requirements
                </label>
                <Textarea
                  placeholder="Describe the type of contract you need (e.g., 'Employment agreement for a software developer with remote work provisions and intellectual property clauses')"
                  value={draftPrompt}
                  onChange={(e) => setDraftPrompt(e.target.value)}
                  rows={4}
                />
              </div>
            </TabsContent>

            <TabsContent value="review" className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Contract Text
                </label>
                <Textarea
                  placeholder="Paste the contract text you want to review..."
                  value={contractText}
                  onChange={(e) => setContractText(e.target.value)}
                  rows={8}
                />
              </div>
            </TabsContent>

            <TabsContent value="grade" className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Contract Text
                </label>
                <Textarea
                  placeholder="Paste the contract text you want to grade..."
                  value={contractText}
                  onChange={(e) => setContractText(e.target.value)}
                  rows={8}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {analysisType.charAt(0).toUpperCase() + analysisType.slice(1)}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {getAnalysisDescription()}
              </span>
            </div>
            <Button 
              onClick={handleAnalyze} 
              disabled={isAnalyzing}
              className="min-w-[120px]"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                `${analysisType.charAt(0).toUpperCase() + analysisType.slice(1)} Contract`
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Result</CardTitle>
            <CardDescription>
              AI-powered {analysisType} using training data from {" "}
              <Badge variant="outline">100 contracts</Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-lg overflow-auto">
                {analysis}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};