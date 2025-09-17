import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, Wand2 } from "lucide-react";
import { downloadAsPDF, downloadAsDocx, getDownloadFilename } from "@/lib/downloadUtils";
import { AnalysisText } from "./AnalysisText";

interface FullAnalysisReportProps {
  analysis: string;
  contractGrade: string;
  gradeScore: number;
  analysisType: 'draft' | 'analyze';
  upgradeSuggestions: any;
  handleStartUpgrade: () => void;
}

export const FullAnalysisReport: React.FC<FullAnalysisReportProps> = ({
  analysis,
  contractGrade,
  gradeScore,
  analysisType,
  upgradeSuggestions,
  handleStartUpgrade
}) => {
  const handleDownloadAnalysis = async (format: 'pdf' | 'docx') => {
    const filename = getDownloadFilename(analysisType);
    if (format === 'pdf') {
      await downloadAsPDF(analysis, filename);
    } else {
      await downloadAsDocx(analysis, filename);
    }
  };

  return (
    <div className="space-y-6">
      {/* Full Analysis Text */}
      <div className="bg-muted p-6 rounded-lg overflow-auto">
        <AnalysisText content={analysis} />
      </div>

      {/* Upgrade Suggestions Summary */}
      {analysisType === 'analyze' && upgradeSuggestions && upgradeSuggestions.categories && upgradeSuggestions.categories.length > 0 && (
        <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                <Wand2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-100">
                  {upgradeSuggestions.categories.length} Upgrade Categories Available
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {upgradeSuggestions.categories.reduce((total: number, cat: any) => total + cat.suggestions.length, 0)} specific suggestions to improve your contract
                </p>
              </div>
            </div>
            <Button onClick={handleStartUpgrade} className="bg-green-600 hover:bg-green-700">
              <Wand2 className="h-4 w-4 mr-2" />
              Apply Suggestions
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {upgradeSuggestions.categories.slice(0, 3).map((category: any, index: number) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <Badge variant={
                  category.priority === 'high' ? 'destructive' :
                    category.priority === 'medium' ? 'default' : 'secondary'
                } className="text-xs">
                  {category.priority}
                </Badge>
                <span className="text-green-800 dark:text-green-200 truncate">{category.title}</span>
                <span className="text-green-600 dark:text-green-400 text-xs">
                  ({category.suggestions.length})
                </span>
              </div>
            ))}
            {upgradeSuggestions.categories.length > 3 && (
              <div className="text-sm text-green-600 dark:text-green-400">
                +{upgradeSuggestions.categories.length - 3} more categories
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

