import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Brain, CheckCircle, Loader2, Upload, X, Wand2, Download } from "lucide-react";
import { useDropzone } from "react-dropzone";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { ContractUpgradeSuggestions } from "./ContractUpgradeSuggestions";
import { ContractUpgradeResult } from "./ContractUpgradeResult";
import { downloadAsPDF, downloadAsDocx, getDownloadFilename } from "@/lib/downloadUtils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ContractDraftingWizard } from "./ContractDraftingWizard";
import { FullAnalysisReport } from "./FullAnalysisReport";
import { AnalysisPaywall } from "./AnalysisPaywall";
import { UpgradePaywall } from "./UpgradePaywall";

// Configure PDF.js worker - using local worker for reliability
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export const ContractAnalysis = () => {
  const { user } = useAuth();
  const [contractText, setContractText] = useState("");
  const [draftPrompt, setDraftPrompt] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisType, setAnalysisType] = useState<'draft' | 'analyze'>('analyze');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const { toast } = useToast();

  // Upgrade flow state - reset when analysis type changes
  const [showUpgradeOptions, setShowUpgradeOptions] = useState(false);
  const [showUpgradeResult, setShowUpgradeResult] = useState(false);
  const [originalContractForUpgrade, setOriginalContractForUpgrade] = useState("");
  const [upgradedContract, setUpgradedContract] = useState("");
  const [appliedChanges, setAppliedChanges] = useState<string[]>([]);
  const [revisionCount, setRevisionCount] = useState(0);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Integrated suggestions from analysis
  const [upgradeSuggestions, setUpgradeSuggestions] = useState<any>(null);
  // Unified grade information
  const [contractGrade, setContractGrade] = useState<string>('');
  const [gradeScore, setGradeScore] = useState<number>(0);

  // Check subscription status on component mount and when user changes
  useEffect(() => {
    checkSubscriptionStatus();
  }, [user]);

  // Reset upgrade state when analysis type changes
  useEffect(() => {
    // Reset all upgrade-related state when switching analysis types
    setShowUpgradeOptions(false);
    setShowUpgradeResult(false);
    setOriginalContractForUpgrade("");
    setUpgradedContract("");
    setAppliedChanges([]);
    setRevisionCount(0);
    setIsUpgrading(false);
    setUpgradeSuggestions(null); // Reset integrated suggestions
    setContractGrade(''); // Reset grade info
    setGradeScore(0); // Reset grade score
    // DON'T reset contractText or analysis - these should persist across tab switches
  }, [analysisType]);

  // Check if user has subscription or is admin developer
  const checkSubscriptionStatus = async () => {
    if (!user) {
      setHasSubscription(false);
      return;
    }

    // Admin/Developer accounts - bypass paywall for testing
    const adminEmails = ['tatted@outkast.world', 'tatted@mnnt.io'];

    if (adminEmails.includes(user.email || '')) {
      setHasSubscription(true);
      return;
    }

    // TODO: Replace with actual subscription check from your backend
    // For now, regular users get paywall
    setHasSubscription(false);
  };

  // Enhanced file validation
  const validateFile = (file: File): string | null => {
    // Size validation - 25MB limit for better performance
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSize) {
      return `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Please upload files smaller than 25MB.`;
    }

    // Minimum size check
    if (file.size === 0) {
      return "File appears to be empty. Please select a valid file.";
    }

    // Type validation with comprehensive MIME type support
    const validTypes = {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.ms-word.document.macroEnabled.12': ['.docm'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-word.template.macroEnabled.12': ['.dotm'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.template': ['.dotx'],
      'text/plain': ['.txt']
    };

    const fileExtension = file.name.toLowerCase().split('.').pop();
    const isValidType = Object.entries(validTypes).some(([mimeType, extensions]) =>
      extensions.includes(`.${fileExtension}`) || file.type === mimeType
    );

    if (!isValidType) {
      return `Unsupported file type "${fileExtension}". Please upload PDF, Word (.doc, .docx), or text files.`;
    }

    return null; // Valid file
  };

  // Helper function to clear all analysis state for a fresh restart
  const clearAnalysisState = useCallback(() => {
    setAnalysis("");
    setUpgradeSuggestions(null);
    setContractGrade("");
    setGradeScore(0);
    setShowUpgradeOptions(false);
    setShowUpgradeResult(false);
    setOriginalContractForUpgrade("");
    setUpgradedContract("");
    setAppliedChanges([]);
    setRevisionCount(0);
    setIsUpgrading(false);
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Enhanced file validation
    const validationError = validateFile(file);
    if (validationError) {
      toast({
        title: "File Validation Failed",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    setIsProcessingFile(true);

    // Clear all previous analysis state for a fresh restart
    clearAnalysisState();

    try {
      let extractedText = "";

      // Progressive enhancement: try client-side first, then server-side fallback
      if (file.type === 'text/plain') {
        // Text files - read directly (fastest)
        console.log('Processing text file...');
        extractedText = await file.text();
      } else {
        // Try client-side extraction first (faster, no network)
        try {
          console.log('Attempting client-side extraction...');

          if (file.type === 'application/pdf') {
            extractedText = await extractTextFromPDF(file);
          } else if (file.type.includes('word') || file.type.includes('document')) {
            extractedText = await extractTextFromDOCX(file);
          } else {
            throw new Error(`Unsupported file type: ${file.type}`);
          }

          console.log('Client-side extraction successful');
        } catch (clientError) {
          console.warn('Client-side extraction failed, trying server-side...', clientError);

          // Fallback to server-side extraction
          try {
            extractedText = await extractTextFromServer(file);
            console.log('Server-side extraction successful');
          } catch (serverError) {
            console.error('Both extraction methods failed:', serverError);

            // Provide helpful user guidance
            if (file.type === 'application/pdf') {
              throw new Error(
                "Unable to extract text from PDF. This may be a scanned document or have complex formatting. " +
                "Please try uploading a different PDF or paste the contract text manually."
              );
            } else {
              throw new Error(
                "Unable to extract text from document. The file may be corrupted, password-protected, " +
                "or use unsupported formatting. Please try saving as .docx or paste the text manually."
              );
            }
          }
        }
      }

      if (!extractedText.trim()) {
        throw new Error("No readable text found in the file. The document may be empty or contain only images.");
      }

      setContractText(extractedText);
      toast({
        title: "File Processed Successfully",
        description: `Extracted ${extractedText.length} characters from ${file.name}`,
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
    try {
      console.log('Starting PDF text extraction for:', file.name);

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const textParts: string[] = [];

      console.log(`Processing ${pdf.numPages} pages...`);

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          const textContent = await page.getTextContent();

          // Enhanced text extraction with better filtering and formatting
          const pageText = textContent.items
            .filter((item: any) => 'str' in item && item.str && item.str.trim())
            .map((item: any) => item.str.trim())
            .join(' ')
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();

          if (pageText) {
            textParts.push(pageText);
            console.log(`Page ${pageNum}: extracted ${pageText.length} characters`);
          } else {
            console.warn(`Page ${pageNum}: no text content found`);
          }
        } catch (pageError) {
          console.warn(`Failed to extract text from page ${pageNum}:`, pageError);
          // Continue processing other pages
        }
      }

      const extractedText = textParts.join('\n\n');

      if (!extractedText.trim()) {
        throw new Error(
          "No readable text found in PDF. This may be a scanned document, " +
          "image-based PDF, or corrupted file. Please try uploading a different PDF " +
          "or paste the contract text manually."
        );
      }

      console.log(`PDF extraction complete: ${extractedText.length} characters from ${textParts.length} pages`);
      return extractedText;

    } catch (error) {
      console.error('PDF extraction error:', error);

      if (error.message.includes('InvalidPDFException')) {
        throw new Error("Invalid or corrupted PDF file. Please try uploading a different PDF.");
      } else if (error.message.includes('MissingPDFException')) {
        throw new Error("PDF file appears to be corrupted or incomplete.");
      } else if (error.message.includes('UnexpectedResponseException')) {
        throw new Error("Unable to read PDF file. It may be password-protected or corrupted.");
      } else {
        throw new Error(`PDF processing failed: ${error.message}`);
      }
    }
  };

  const extractTextFromDOCX = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value.trim();
  };

  // Server-side extraction fallback for when client-side fails
  const extractTextFromServer = async (file: File): Promise<string> => {
    console.log('Attempting server-side extraction for:', file.name);

    // For now, we'll use the existing server function
    // In a production app, you might want to upload the file first
    // and then call the extraction function

    // This is a placeholder - you would need to:
    // 1. Upload file to Supabase storage
    // 2. Call the extract-text function with the file path
    // 3. Return the extracted text

    throw new Error("Server-side extraction not implemented yet. Please paste the text manually.");

    // Example implementation:
    /*
    try {
      // Upload file to storage
      const fileName = `${Date.now()}-${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('temp-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Call extraction function
      const { data, error } = await supabase.functions.invoke('extract-text', {
        body: { filePath: uploadData.path }
      });

      if (error) throw error;

      // Clean up temp file
      await supabase.storage.from('temp-files').remove([fileName]);

      return data.extractedText;
    } catch (error) {
      // Clean up temp file on error
      try {
        await supabase.storage.from('temp-files').remove([fileName]);
      } catch (cleanupError) {
        console.warn('Failed to cleanup temp file:', cleanupError);
      }
      throw error;
    }
    */
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.ms-word.document.macroEnabled.12': ['.docm'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-word.template.macroEnabled.12': ['.dotm'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.template': ['.dotx'],
      'text/plain': ['.txt']
    },
    multiple: false,
    maxSize: 25 * 1024 * 1024 // 25MB limit
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

      // Handle formatted text response for analyze
      if (analysisType === 'analyze') {
        // Extract grade from the formatted text response
        const analysisText = data.analysis;
        let grade = '';
        let gradeScore = 0;

        // Extract grade from markdown format like "## 🎯 Overall Grade: A- (92%)"
        const gradeMatch = analysisText.match(/## 🎯 Overall Grade:\s*([A-F][+-]?\s*\(\s*(\d+)%?\s*\))/i);
        if (gradeMatch) {
          const fullGrade = gradeMatch[1];
          const scoreMatch = fullGrade.match(/([A-F][+-]?)\s*\(\s*(\d+)/i);
          if (scoreMatch) {
            grade = scoreMatch[1].trim();
            gradeScore = parseInt(scoreMatch[2]);
          }
        }

        // Extract upgrade suggestions from the formatted text
        const suggestionsText = analysisText.split('---')[1]; // Get everything after the first separator
        const upgradeSuggestions = parseUpgradeSuggestionsFromText(suggestionsText);

        setAnalysis(analysisText);
        setContractGrade(grade);
        setGradeScore(gradeScore);
        setUpgradeSuggestions(upgradeSuggestions);

        toast({
          title: "Analysis Complete",
          description: grade ? `Contract analysis completed with grade ${grade} (${gradeScore}%)` : "Contract analysis completed successfully",
        });
      } else {
        // Draft contracts don't have integrated suggestions
        setAnalysis(data.analysis);
        setContractGrade('');
        setGradeScore(0);
        setUpgradeSuggestions(null);
        toast({
          title: "Analysis Complete",
          description: `Contract ${analysisType} completed successfully.`,
        });
      }
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
      case 'analyze': return <Brain className="h-5 w-5" />;
    }
  };

  const getAnalysisDescription = () => {
    switch (analysisType) {
      case 'draft': return "AI will draft a complete contract based on your requirements";
      case 'analyze': return "AI will provide comprehensive analysis including grade, strengths, weaknesses, risks, and upgrade suggestions";
    }
  };

  // Parse upgrade suggestions from formatted text
  const parseUpgradeSuggestionsFromText = (suggestionsText: string) => {
    if (!suggestionsText) return null;

    const categories = [];

    // Split by priority levels
    const highPriorityMatch = suggestionsText.match(/## 🏆 High Priority Improvements([\s\S]*?)(?=## 📈|$)/);
    const mediumPriorityMatch = suggestionsText.match(/## 📈 Medium Priority Improvements([\s\S]*?)(?=## 📝|$)/);
    const lowPriorityMatch = suggestionsText.match(/## 📝 Low Priority Improvements([\s\S]*?)$/);

    // Parse high priority suggestions
    if (highPriorityMatch) {
      const highPriorityText = highPriorityMatch[1];

      // Missing Clauses
      const missingClausesMatch = highPriorityText.match(/### Missing Clauses([\s\S]*?)(?=###|$)/);
      if (missingClausesMatch) {
        categories.push({
          id: 'missing-clauses',
          category: 'Missing Clauses',
          title: 'Add Essential Contract Clauses',
          description: 'Your contract is missing several standard clauses that are commonly included in professional contracts.',
          priority: 'high',
          suggestions: extractSuggestionsFromMarkdown(missingClausesMatch[1]),
          estimatedImpact: 'High - Prevents legal disputes and misunderstandings'
        });
      }

      // Legal Language
      const legalLanguageMatch = highPriorityText.match(/### Legal Language Enhancements([\s\S]*?)(?=###|$)/);
      if (legalLanguageMatch) {
        categories.push({
          id: 'legal-language',
          category: 'Legal Language',
          title: 'Strengthen Contract Language',
          description: 'Some provisions use vague language that could lead to interpretation issues.',
          priority: 'high',
          suggestions: extractSuggestionsFromMarkdown(legalLanguageMatch[1]),
          estimatedImpact: 'High - Reduces legal risks and ambiguity'
        });
      }
    }

    // Parse medium priority suggestions
    if (mediumPriorityMatch) {
      const mediumPriorityText = mediumPriorityMatch[1];

      // Risk Mitigation
      const riskMatch = mediumPriorityText.match(/### Risk Mitigation([\s\S]*?)(?=###|$)/);
      if (riskMatch) {
        categories.push({
          id: 'risk-mitigation',
          category: 'Risk Mitigation',
          title: 'Enhance Liability Protections',
          description: 'Current liability provisions could be strengthened to better protect your interests.',
          priority: 'medium',
          suggestions: extractSuggestionsFromMarkdown(riskMatch[1]),
          estimatedImpact: 'Medium - Better protection against potential losses'
        });
      }

      // Compliance
      const complianceMatch = mediumPriorityText.match(/### Compliance Updates([\s\S]*?)(?=###|$)/);
      if (complianceMatch) {
        categories.push({
          id: 'compliance',
          category: 'Compliance',
          title: 'Update for Current Standards',
          description: 'Contract language should reflect current legal and industry standards.',
          priority: 'medium',
          suggestions: extractSuggestionsFromMarkdown(complianceMatch[1]),
          estimatedImpact: 'Medium - Ensures compliance with current standards'
        });
      }
    }

    // Parse low priority suggestions
    if (lowPriorityMatch) {
      const lowPriorityText = lowPriorityMatch[1];

      // Clarity
      const clarityMatch = lowPriorityText.match(/### Clarity Improvements([\s\S]*?)$/);
      if (clarityMatch) {
        categories.push({
          id: 'clarity',
          category: 'Clarity',
          title: 'Improve Readability',
          description: 'Some sections could be clearer and more user-friendly.',
          priority: 'low',
          suggestions: extractSuggestionsFromMarkdown(clarityMatch[1]),
          estimatedImpact: 'Low - Improves usability and understanding'
        });
      }
    }

    return categories.length > 0 ? { categories } : null;
  };

  // Extract suggestions from markdown text
  const extractSuggestionsFromMarkdown = (section: string): string[] => {
    const suggestions = [];
    const lines = section.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      // Match lines that start with "- " or "- **" (bold text)
      if ((trimmed.startsWith('- ') || trimmed.startsWith('- **')) && !trimmed.includes('###') && !trimmed.includes('##')) {
        // Remove the "- " prefix and clean up any markdown formatting
        let suggestion = trimmed.replace(/^-\s*/, '').replace(/\*\*/g, '');
        suggestions.push(suggestion);
      }
    }

    return suggestions;
  };

  // Download functions
  const handleDownloadAnalysis = async (format: 'pdf' | 'docx') => {
    if (!analysis || analysis.trim().length === 0) {
      toast({
        title: "No Analysis Available",
        description: "Please complete the contract analysis first.",
        variant: "destructive",
      });
      return;
    }

    try {
      const filename = getDownloadFilename('contract_analysis', format);

      if (format === 'pdf') {
        await downloadAsPDF(analysis, filename);
        toast({
          title: "PDF Downloaded",
          description: `Analysis saved as ${filename}`,
        });
      } else {
        await downloadAsDocx(analysis, filename);
        toast({
          title: "DOCX Downloaded",
          description: `Analysis saved as ${filename}`,
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to generate document. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Upgrade functions
  const handleStartUpgrade = () => {
    console.log('🔍 DEBUG: handleStartUpgrade called');
    console.log('🔍 DEBUG: contractText length:', contractText?.length || 0);
    console.log('🔍 DEBUG: analysis length:', analysis?.length || 0);
    console.log('🔍 DEBUG: upgradeSuggestions:', upgradeSuggestions);

    if (!contractText || contractText.trim().length === 0) {
      toast({
        title: "No Contract Content",
        description: "Please upload and analyze a contract first.",
        variant: "destructive",
      });
      return;
    }

    if (!analysis || analysis.trim().length === 0) {
      toast({
        title: "No Analysis Available",
        description: "Please complete the contract analysis first.",
        variant: "destructive",
      });
      return;
    }

    if (!upgradeSuggestions || !upgradeSuggestions.categories) {
      toast({
        title: "No Upgrade Suggestions",
        description: "Upgrade suggestions are not available for this analysis.",
        variant: "destructive",
      });
      return;
    }

    setOriginalContractForUpgrade(contractText);
    setShowUpgradeOptions(true);
  };

  const handleUpgradeComplete = (upgradedText: string, changes: string[]) => {
    console.log('🎯 CONTRACT ANALYSIS - RECEIVING UPGRADE COMPLETE:');
    console.log('Upgraded text length:', upgradedText.length);
    console.log('Upgraded text preview (first 300 chars):', upgradedText.substring(0, 300));
    console.log('Contains "Here is":', upgradedText.includes('Here is'));
    console.log('Contains "```":', upgradedText.includes('```'));
    console.log('Changes count:', changes.length);

    setUpgradedContract(upgradedText);
    setAppliedChanges(changes);
    setRevisionCount(prev => prev + 1);
    setShowUpgradeOptions(false);
    setShowUpgradeResult(true);
  };

  const handleNewUpgrade = () => {
    // Start a new upgrade cycle
    setContractText(upgradedContract); // Use the upgraded contract as the new base
    setOriginalContractForUpgrade(upgradedContract);
    setShowUpgradeResult(false);
    setShowUpgradeOptions(true);
    setAnalysis(""); // Clear previous analysis
  };

  const handleBackToAnalysis = () => {
    // Reset to analysis view
    setShowUpgradeOptions(false);
    setShowUpgradeResult(false);
    setOriginalContractForUpgrade("");
    setUpgradedContract("");
    setAppliedChanges([]);
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
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="draft">Draft Contract</TabsTrigger>
              <TabsTrigger value="analyze">Analyze Contract</TabsTrigger>
            </TabsList>

            <TabsContent value="draft" className="space-y-4">
              <ContractDraftingWizard
                onComplete={(contractText) => {
                  setContractText(contractText);
                  setAnalysisType('analyze'); // Switch to analyze tab to show the drafted contract
                  toast({
                    title: "Contract Drafted Successfully",
                    description: "Your contract has been generated and is ready for review.",
                  });
                }}
                onBack={() => setAnalysisType('analyze')}
                isEnterpriseUser={false} // TODO: Check subscription status
              />
            </TabsContent>

            <TabsContent value="analyze" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Upload Contract File
                  </label>
                  <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
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
                            // Clear analysis state when clearing the file
                            clearAnalysisState();
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
                    onChange={(e) => {
                      const newValue = e.target.value;
                      // Clear analysis state when starting fresh input (empty to non-empty transition)
                      if (contractText === "" && newValue !== "") {
                        clearAnalysisState();
                      }
                      setContractText(newValue);
                    }}
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

      {analysis && !showUpgradeOptions && !showUpgradeResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Contract Analysis Result</CardTitle>
                <CardDescription>
                  Comprehensive AI analysis using training data from {" "}
                  <Badge variant="outline">100 contracts</Badge>
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {hasSubscription ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDownloadAnalysis('pdf')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Download as PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownloadAnalysis('docx')}>
                        <FileText className="h-4 w-4 mr-2" />
                        Download as DOCX
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('https://ezbizcontract.com/pricing', '_blank')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Upgrade to Download
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Grade Display */}
            {(contractGrade || gradeScore > 0) && (
              <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-xl border-2 border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-center space-x-4">
                  <div className="text-center">
                    <div className={`text-6xl font-bold ${contractGrade === 'A' || contractGrade === 'A-' ? 'text-green-600' :
                      contractGrade === 'B' || contractGrade === 'B+' || contractGrade === 'B-' ? 'text-blue-600' :
                        contractGrade === 'C' || contractGrade === 'C+' || contractGrade === 'C-' ? 'text-yellow-600' :
                          'text-red-600'
                      }`}>
                      {contractGrade}
                    </div>
                    <div className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mt-1">
                      {gradeScore}%
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-medium text-gray-700 dark:text-gray-300">
                      Contract Grade
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Based on legal accuracy, clarity, risk management, and compliance
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Conditional Rendering: Full Analysis or Paywall */}
            {hasSubscription ? (
              <FullAnalysisReport
                analysis={analysis}
                contractGrade={contractGrade}
                gradeScore={gradeScore}
                analysisType={analysisType}
                upgradeSuggestions={upgradeSuggestions}
                handleStartUpgrade={handleStartUpgrade}
              />
            ) : (
              <AnalysisPaywall
                onUpgradeClick={() => window.open('https://ezbizcontract.com/pricing', '_blank')}
              />
            )}

            {/* Upgrade suggestions are now handled by FullAnalysisReport component */}
          </CardContent>
        </Card>
      )}

      {/* Upgrade Suggestions */}
      {showUpgradeOptions && (
        <ContractUpgradeSuggestions
          contractText={originalContractForUpgrade}
          analysisType={analysisType as 'analyze'}
          upgradeSuggestions={upgradeSuggestions}
          onUpgradeComplete={handleUpgradeComplete}
        />
      )}

      {/* Upgrade Results */}
      {showUpgradeResult && (
        <ContractUpgradeResult
          originalContract={originalContractForUpgrade}
          upgradedContract={upgradedContract}
          changesSummary=""
          appliedChanges={appliedChanges}
          revisionNumber={revisionCount}
          onNewUpgrade={handleNewUpgrade}
          onBackToAnalysis={handleBackToAnalysis}
        />
      )}
    </div>
  );
};