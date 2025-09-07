import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Brain, CheckCircle, Loader2, Upload, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const ContractAnalysis = () => {
  const [contractText, setContractText] = useState("");
  const [draftPrompt, setDraftPrompt] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisType, setAnalysisType] = useState<'draft' | 'review' | 'grade'>('review');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Check file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Unsupported File Type",
        description: "Please upload a PDF, Word document, or text file.",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    setIsProcessingFile(true);

    try {
      let extractedText = "";

      if (file.type === 'text/plain') {
        // Text files - read directly
        extractedText = await file.text();
      } else if (file.type === 'application/pdf') {
        // PDF files - extract using PDF.js
        extractedText = await extractTextFromPDF(file);
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        // DOCX files - extract using mammoth
        extractedText = await extractTextFromDOCX(file);
      } else if (file.type === 'application/msword') {
        // Legacy DOC files not supported
        throw new Error("Legacy .doc files are not supported. Please save as .docx or copy/paste the text.");
      }

      if (!extractedText.trim()) {
        throw new Error("No readable text found in the file. Please try copying and pasting the text manually.");
      }

      setContractText(extractedText);
      toast({
        title: "File Processed",
        description: "Contract text extracted successfully.",
      });
    } catch (error) {
      console.error('File processing error:', error);
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to extract text from file. Please try pasting the text directly.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingFile(false);
    }
  }, [toast]);

  const extractTextFromPDF = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const textParts: string[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .filter((item: any) => 'str' in item)
        .map((item: any) => item.str)
        .join(' ');
      textParts.push(pageText);
    }

    return textParts.join('\n\n').trim();
  };

  const extractTextFromDOCX = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    multiple: false
  });

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
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Upload Contract File
                  </label>
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                    }`}
                  >
                    <input {...getInputProps()} />
                    {isProcessingFile ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Processing file...</span>
                      </div>
                    ) : uploadedFile ? (
                      <div className="flex items-center justify-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>{uploadedFile.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadedFile(null);
                            setContractText("");
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {isDragActive ? "Drop the file here" : "Drag & drop a contract file here, or click to select"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Supports PDF, Word, and text files
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-center text-sm text-muted-foreground">
                  — or —
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Paste Contract Text
                  </label>
                  <Textarea
                    placeholder="Paste the contract text you want to review..."
                    value={contractText}
                    onChange={(e) => setContractText(e.target.value)}
                    rows={8}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="grade" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Upload Contract File
                  </label>
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                      isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                    }`}
                  >
                    <input {...getInputProps()} />
                    {isProcessingFile ? (
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Processing file...</span>
                      </div>
                    ) : uploadedFile ? (
                      <div className="flex items-center justify-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>{uploadedFile.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setUploadedFile(null);
                            setContractText("");
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          {isDragActive ? "Drop the file here" : "Drag & drop a contract file here, or click to select"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Supports PDF, Word, and text files
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-center text-sm text-muted-foreground">
                  — or —
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Paste Contract Text
                  </label>
                  <Textarea
                    placeholder="Paste the contract text you want to grade..."
                    value={contractText}
                    onChange={(e) => setContractText(e.target.value)}
                    rows={8}
                  />
                </div>
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