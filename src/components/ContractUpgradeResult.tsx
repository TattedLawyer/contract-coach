import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Download, Copy, CheckCircle, ArrowLeft, RotateCcw } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { downloadAsPDF, downloadAsDocx, getDownloadFilename } from "@/lib/downloadUtils";
import { diffWords } from "diff";

interface ContractUpgradeResultProps {
    originalContract: string;
    upgradedContract: string;
    changesSummary: string;
    appliedChanges: string[];
    revisionNumber: number;
    onNewUpgrade: () => void;
    onBackToAnalysis: () => void;
}

export const ContractUpgradeResult = ({
    originalContract,
    upgradedContract,
    changesSummary,
    appliedChanges,
    revisionNumber,
    onNewUpgrade,
    onBackToAnalysis
}: ContractUpgradeResultProps) => {
    const [activeTab, setActiveTab] = useState('upgraded');
    const { toast } = useToast();

    // Download functions
    const handleDownloadUpgraded = async (format: 'pdf' | 'docx') => {
        if (!upgradedContract || upgradedContract.trim().length === 0) {
            toast({
                title: "No Contract Available",
                description: "No upgraded contract to download.",
                variant: "destructive",
            });
            return;
        }

        try {
            const filename = getDownloadFilename('upgraded_contract', format);

            if (format === 'pdf') {
                await downloadAsPDF(upgradedContract, filename);
                toast({
                    title: "PDF Downloaded",
                    description: `Upgraded contract saved as ${filename}`,
                });
            } else {
                await downloadAsDocx(upgradedContract, filename);
                toast({
                    title: "DOCX Downloaded",
                    description: `Upgraded contract saved as ${filename}`,
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

    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text);
            toast({
                title: "Copied to clipboard",
                description: `${label} has been copied successfully.`,
            });
        } catch (error) {
            toast({
                title: "Copy failed",
                description: "Unable to copy to clipboard. Please select and copy manually.",
                variant: "destructive",
            });
        }
    };

    const downloadContract = (content: string, filename: string) => {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
            title: "Download started",
            description: `${filename} has been downloaded.`,
        });
    };

    const formatChangesList = (changes: string[]) => {
        return changes.map((change, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{change}</span>
            </li>
        ));
    };

    const renderHighlightedDiff = (original: string, upgraded: string) => {
        const differences = diffWords(original, upgraded);

        return differences.map((part, index) => {
            if (part.added) {
                return (
                    <span key={index} className="bg-green-200 text-green-900 px-1 rounded">
                        {part.value}
                    </span>
                );
            } else if (part.removed) {
                return (
                    <span key={index} className="bg-red-200 text-red-900 px-1 rounded line-through">
                        {part.value}
                    </span>
                );
            } else {
                return <span key={index}>{part.value}</span>;
            }
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                Contract Successfully Upgraded
                            </CardTitle>
                            <CardDescription>
                                Revision {revisionNumber} - {appliedChanges.length} improvements implemented
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-sm">
                                Revision {revisionNumber}
                            </Badge>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm">
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleDownloadUpgraded('pdf')}>
                                        <FileText className="h-4 w-4 mr-2" />
                                        Download as PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleDownloadUpgraded('docx')}>
                                        <FileText className="h-4 w-4 mr-2" />
                                        Download as DOCX
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        <Button onClick={onNewUpgrade} variant="outline">
                            <RotateCcw className="h-4 w-4 mr-2" />
                            New Upgrade
                        </Button>
                        <Button onClick={onBackToAnalysis} variant="outline">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Analysis
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Changes Summary */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Changes Implemented</CardTitle>
                    <CardDescription>
                        Summary of improvements made to your contract
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert className="mb-4">
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>{appliedChanges.length} improvements</strong> have been successfully applied to your contract.
                            Each change enhances the legal protection, clarity, and completeness of your agreement.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                        <h4 className="font-semibold">Applied Changes:</h4>
                        <ul className="space-y-2">
                            {formatChangesList(appliedChanges)}
                        </ul>
                    </div>
                </CardContent>
            </Card>

            {/* Contract Comparison */}
            <Card>
                <CardHeader>
                    <CardTitle>Contract Comparison</CardTitle>
                    <CardDescription>
                        Compare your original contract with the upgraded version
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="upgraded">Upgraded Contract</TabsTrigger>
                            <TabsTrigger value="original">Original Contract</TabsTrigger>
                            <TabsTrigger value="comparison">Side-by-Side</TabsTrigger>
                        </TabsList>

                        <TabsContent value="upgraded" className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold">Your Upgraded Contract</h3>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => copyToClipboard(upgradedContract, 'Upgraded contract')}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <Copy className="h-4 w-4 mr-2" />
                                        Copy
                                    </Button>
                                    <Button
                                        onClick={() => downloadContract(upgradedContract, `upgraded-contract-revision-${revisionNumber}.txt`)}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                    </Button>
                                </div>
                            </div>
                            <Textarea
                                value={upgradedContract}
                                readOnly
                                className="min-h-[500px] font-mono text-sm"
                                placeholder="Your upgraded contract will appear here..."
                            />
                        </TabsContent>

                        <TabsContent value="original" className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-semibold">Original Contract</h3>
                                <Button
                                    onClick={() => copyToClipboard(originalContract, 'Original contract')}
                                    variant="outline"
                                    size="sm"
                                >
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy
                                </Button>
                            </div>
                            <Textarea
                                value={originalContract}
                                readOnly
                                className="min-h-[500px] font-mono text-sm opacity-75"
                                placeholder="Your original contract..."
                            />
                        </TabsContent>

                        <TabsContent value="comparison" className="space-y-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-gray-600">Original Contract</h3>
                                    <div className="border rounded-md p-4 min-h-[400px] font-mono text-sm bg-gray-50 overflow-auto">
                                        <pre className="whitespace-pre-wrap">{originalContract}</pre>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold text-green-600">Upgraded Contract (with highlights)</h3>
                                    <div className="border rounded-md p-4 min-h-[400px] font-mono text-sm bg-white overflow-auto">
                                        <div className="whitespace-pre-wrap">
                                            {renderHighlightedDiff(originalContract, upgradedContract)}
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-block w-4 h-4 bg-green-200 rounded"></span>
                                            <span>New additions/improvements</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="inline-block w-4 h-4 bg-red-200 rounded line-through"></span>
                                            <span>Removed content (if any)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
                <CardHeader>
                    <CardTitle>What's Next?</CardTitle>
                    <CardDescription>
                        Options for continuing to improve your contract
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button onClick={onNewUpgrade} className="h-auto p-4 flex flex-col items-start">
                            <div className="flex items-center gap-2 mb-2">
                                <RotateCcw className="h-5 w-5" />
                                <span className="font-semibold">Create Another Revision</span>
                            </div>
                            <p className="text-sm text-left opacity-75">
                                Generate additional improvements or modify existing changes.
                                {revisionNumber >= 5 && " (Premium feature for revisions 6+)"}
                            </p>
                        </Button>

                        <Button onClick={onBackToAnalysis} variant="outline" className="h-auto p-4 flex flex-col items-start">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-5 w-5" />
                                <span className="font-semibold">New Contract Analysis</span>
                            </div>
                            <p className="text-sm text-left opacity-75">
                                Upload and analyze a different contract or start fresh.
                            </p>
                        </Button>
                    </div>

                    <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Tip:</strong> Your upgraded contract is ready to use immediately. You can download it,
                            copy it to your preferred editor, or continue refining it with additional revisions.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        </div>
    );
};
