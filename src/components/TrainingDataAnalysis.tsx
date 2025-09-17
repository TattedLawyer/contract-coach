import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { TrainingDataAnalyzer } from '@/services/TrainingDataAnalyzer';
import { RefreshCw, FileText, BarChart3, Settings, CheckCircle, AlertCircle } from 'lucide-react';

interface TrainingAnalysisResult {
    totalContracts: number;
    contractTypes: string[];
    formatPatterns: any[];
    commonStructures: string[];
    recommendedFormat: {
        structure: {
            hasHeader: boolean;
            hasFooter: boolean;
            hasPageNumbers: boolean;
            hasTableOfContents: boolean;
        };
        typography: {
            fontFamily: string;
            fontSize: string;
            lineHeight: string;
            headingHierarchy: string[];
        };
        layout: {
            margins: string;
            paragraphSpacing: string;
            sectionSpacing: string;
            alignment: string;
        };
        elements: {
            clauseNumbering: boolean;
            signatureBlocks: boolean;
            definitions: boolean;
            schedules: boolean;
        };
    };
}

export const TrainingDataAnalysis = () => {
    const [analysis, setAnalysis] = useState<TrainingAnalysisResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    const runAnalysis = async () => {
        setLoading(true);
        setError(null);

        try {
            const analyzer = new TrainingDataAnalyzer();
            const result = await analyzer.analyzeTrainingData();
            setAnalysis(result);

            toast({
                title: "Analysis Complete",
                description: `Analyzed ${result.totalContracts} training contracts successfully.`,
            });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
            setError(errorMessage);

            toast({
                title: "Analysis Failed",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Auto-run analysis on component mount
        runAnalysis();
    }, []);

    const formatBoolean = (value: boolean) => (
        <Badge variant={value ? "default" : "secondary"}>
            {value ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
            {value ? 'Yes' : 'No'}
        </Badge>
    );

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Training Data Analysis
                    </CardTitle>
                    <CardDescription>
                        Analyzing your training contracts to understand formatting patterns...
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                        <span className="ml-2 text-muted-foreground">Analyzing contracts...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Training Data Analysis
                    </CardTitle>
                    <CardDescription>
                        Error analyzing training contracts
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                    <Button onClick={runAnalysis} className="mt-4">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Try Again
                    </Button>
                </CardContent>
            </Card>
        );
    }

    if (!analysis) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Training Data Analysis
                    </CardTitle>
                    <CardDescription>
                        Click to analyze your training contracts
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={runAnalysis}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Run Analysis
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Training Data Analysis Results
                    </CardTitle>
                    <CardDescription>
                        Analysis of {analysis.totalContracts} training contracts completed
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">{analysis.totalContracts}</div>
                            <div className="text-sm text-muted-foreground">Total Contracts</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">{analysis.contractTypes.length}</div>
                            <div className="text-sm text-muted-foreground">Contract Types</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-primary">{analysis.commonStructures.length}</div>
                            <div className="text-sm text-muted-foreground">Common Structures</div>
                        </div>
                    </div>

                    {analysis.contractTypes.length > 0 && (
                        <div className="mt-4">
                            <h4 className="font-semibold mb-2">Contract Types Found:</h4>
                            <div className="flex flex-wrap gap-2">
                                {analysis.contractTypes.map((type, index) => (
                                    <Badge key={index} variant="outline">{type}</Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    <Button onClick={runAnalysis} variant="outline" className="mt-4">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Analysis
                    </Button>
                </CardContent>
            </Card>

            {/* Recommended Format */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Recommended Contract Format
                    </CardTitle>
                    <CardDescription>
                        Optimal formatting based on your training data analysis
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Structure */}
                    <div>
                        <h4 className="font-semibold mb-3">📋 Document Structure</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-sm font-medium mb-2">Header</div>
                                {formatBoolean(analysis.recommendedFormat.structure.hasHeader)}
                            </div>
                            <div className="text-center">
                                <div className="text-sm font-medium mb-2">Footer</div>
                                {formatBoolean(analysis.recommendedFormat.structure.hasFooter)}
                            </div>
                            <div className="text-center">
                                <div className="text-sm font-medium mb-2">Page Numbers</div>
                                {formatBoolean(analysis.recommendedFormat.structure.hasPageNumbers)}
                            </div>
                            <div className="text-center">
                                <div className="text-sm font-medium mb-2">Table of Contents</div>
                                {formatBoolean(analysis.recommendedFormat.structure.hasTableOfContents)}
                            </div>
                        </div>
                    </div>

                    {/* Typography */}
                    <div>
                        <h4 className="font-semibold mb-3">✍️ Typography</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm font-medium mb-2">Font Family</div>
                                <Badge variant="outline">{analysis.recommendedFormat.typography.fontFamily}</Badge>
                            </div>
                            <div>
                                <div className="text-sm font-medium mb-2">Base Font Size</div>
                                <Badge variant="outline">{analysis.recommendedFormat.typography.fontSize}</Badge>
                            </div>
                            <div>
                                <div className="text-sm font-medium mb-2">Line Height</div>
                                <Badge variant="outline">{analysis.recommendedFormat.typography.lineHeight}</Badge>
                            </div>
                            <div>
                                <div className="text-sm font-medium mb-2">Heading Levels</div>
                                <Badge variant="outline">{analysis.recommendedFormat.typography.headingHierarchy.length} levels</Badge>
                            </div>
                        </div>
                    </div>

                    {/* Layout */}
                    <div>
                        <h4 className="font-semibold mb-3">📐 Layout</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="text-sm font-medium mb-2">Margins</div>
                                <Badge variant="outline">{analysis.recommendedFormat.layout.margins}</Badge>
                            </div>
                            <div>
                                <div className="text-sm font-medium mb-2">Text Alignment</div>
                                <Badge variant="outline">{analysis.recommendedFormat.layout.alignment}</Badge>
                            </div>
                            <div>
                                <div className="text-sm font-medium mb-2">Paragraph Spacing</div>
                                <Badge variant="outline">{analysis.recommendedFormat.layout.paragraphSpacing}</Badge>
                            </div>
                            <div>
                                <div className="text-sm font-medium mb-2">Section Spacing</div>
                                <Badge variant="outline">{analysis.recommendedFormat.layout.sectionSpacing}</Badge>
                            </div>
                        </div>
                    </div>

                    {/* Elements */}
                    <div>
                        <h4 className="font-semibold mb-3">🔧 Contract Elements</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-sm font-medium mb-2">Clause Numbering</div>
                                {formatBoolean(analysis.recommendedFormat.elements.clauseNumbering)}
                            </div>
                            <div className="text-center">
                                <div className="text-sm font-medium mb-2">Signature Blocks</div>
                                {formatBoolean(analysis.recommendedFormat.elements.signatureBlocks)}
                            </div>
                            <div className="text-center">
                                <div className="text-sm font-medium mb-2">Definitions</div>
                                {formatBoolean(analysis.recommendedFormat.elements.definitions)}
                            </div>
                            <div className="text-center">
                                <div className="text-sm font-medium mb-2">Schedules</div>
                                {formatBoolean(analysis.recommendedFormat.elements.schedules)}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Impact Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        PDF Generation Impact
                    </CardTitle>
                    <CardDescription>
                        How this analysis improves your contract PDFs
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Your PDF generation service now uses these insights!</strong> All generated contracts will automatically match the formatting patterns found in your training data, creating professional documents that look like they came from your existing contract templates.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        </div>
    );
};
