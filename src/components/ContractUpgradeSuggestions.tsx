import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ChevronDown, ChevronRight, Wand2, CheckCircle, AlertTriangle, Info } from "lucide-react";

interface Suggestion {
    id: string;
    category: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    suggestions: string[];
    estimatedImpact: string;
}

interface ContractUpgradeSuggestionsProps {
    contractText: string;
    analysisType: 'analyze';
    upgradeSuggestions: any; // Already parsed suggestions from integrated analysis
    onUpgradeComplete: (upgradedContract: string, appliedChanges: string[]) => void;
}

export const ContractUpgradeSuggestions = ({
    contractText,
    analysisType,
    upgradeSuggestions,
    onUpgradeComplete
}: ContractUpgradeSuggestionsProps) => {
    const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
    const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
    const [isUpgrading, setIsUpgrading] = useState(false);
    const [revisionCount, setRevisionCount] = useState(0);
    const { toast } = useToast();

    // Use the passed suggestions instead of fetching them
    const suggestions = upgradeSuggestions?.categories || [];

    // REMOVED: generateUpgradeSuggestions - suggestions are now passed in as props

    // REMOVED: parseAISuggestions function - suggestions are now passed in as structured props

    // Perform contract upgrade with selected suggestions
    const performContractUpgrade = async () => {
        if (selectedSuggestions.size === 0) {
            toast({
                title: "No suggestions selected",
                description: "Please select at least one suggestion to implement.",
                variant: "destructive",
            });
            return;
        }

        setIsUpgrading(true);
        try {
            // Convert selected suggestion IDs back to actual suggestion text
            const selectedSuggestionTexts = Array.from(selectedSuggestions).map(id => {
                // Split on the last hyphen to handle category IDs with hyphens
                const lastHyphenIndex = id.lastIndexOf('-');
                const categoryId = id.substring(0, lastHyphenIndex);
                const suggestionIndex = id.substring(lastHyphenIndex + 1);

                const category = suggestions.find(s => s.id === categoryId);
                return category?.suggestions[parseInt(suggestionIndex)] || '';
            }).filter(text => text);

            const requestBody = {
                contractText,
                selectedSuggestions: selectedSuggestionTexts,
                upgradeType: selectedSuggestions.size > 10 ? 'comprehensive' : 'targeted',
                revisionCount
            };

            const { data, error } = await supabase.functions.invoke('upgrade-contract', {
                body: requestBody,
            });

            if (error) throw error;

            console.log('🔄 UPGRADE API RESPONSE RECEIVED:');
            console.log('Response data keys:', Object.keys(data));
            console.log('Upgraded contract length:', data.upgradedContract?.length || 0);
            console.log('Upgraded contract preview (first 300 chars):', data.upgradedContract?.substring(0, 300) || 'EMPTY');
            console.log('Contains "Here is":', data.upgradedContract?.includes('Here is') || false);
            console.log('Contains "```":', data.upgradedContract?.includes('```') || false);

            toast({
                title: "Contract upgraded successfully!",
                description: `Applied ${selectedSuggestionTexts.length} improvements.`,
            });

            // Call the completion callback
            onUpgradeComplete(data.upgradedContract, selectedSuggestionTexts);

        } catch (error) {
            console.error('Upgrade error:', error);
            toast({
                title: "Upgrade failed",
                description: error.message || "Failed to upgrade contract. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsUpgrading(false);
        }
    };

    const toggleSuggestion = (suggestionId: string) => {
        const newSelected = new Set(selectedSuggestions);
        if (newSelected.has(suggestionId)) {
            newSelected.delete(suggestionId);
        } else {
            newSelected.add(suggestionId);
        }
        setSelectedSuggestions(newSelected);
    };

    const toggleCategory = (categoryId: string) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId);
        } else {
            newExpanded.add(categoryId);
        }
        setExpandedCategories(newExpanded);
    };

    const selectAllSuggestions = () => {
        const allSuggestionIds = suggestions.flatMap(s => s.suggestions.map((_, idx) => `${s.id}-${idx}`));
        setSelectedSuggestions(new Set(allSuggestionIds));
    };

    const deselectAllSuggestions = () => {
        setSelectedSuggestions(new Set());
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high': return 'destructive';
            case 'medium': return 'default';
            case 'low': return 'secondary';
            default: return 'secondary';
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case 'high': return <AlertTriangle className="h-4 w-4" />;
            case 'medium': return <Info className="h-4 w-4" />;
            case 'low': return <CheckCircle className="h-4 w-4" />;
            default: return <Info className="h-4 w-4" />;
        }
    };

    if (suggestions.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        No Upgrade Suggestions Available
                    </CardTitle>
                    <CardDescription>
                        No upgrade suggestions were generated for this contract analysis.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            Try re-analyzing your contract or contact support if this issue persists.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wand2 className="h-5 w-5" />
                        Contract Upgrade Suggestions
                    </CardTitle>
                    <CardDescription>
                        Select the improvements you'd like the AI to implement. Higher priority suggestions are recommended for most contracts.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Selection Controls */}
                    <div className="flex gap-2">
                        <Button onClick={selectAllSuggestions} variant="outline" size="sm">
                            Select All
                        </Button>
                        <Button onClick={deselectAllSuggestions} variant="outline" size="sm">
                            Deselect All
                        </Button>
                        <Badge variant="secondary">
                            {selectedSuggestions.size} selected
                        </Badge>
                    </div>

                    {/* Suggestions List */}
                    <div className="space-y-3">
                        {suggestions.map((suggestion) => (
                            <Collapsible
                                key={suggestion.id}
                                open={expandedCategories.has(suggestion.id)}
                                onOpenChange={() => toggleCategory(suggestion.id)}
                            >
                                <CollapsibleTrigger asChild>
                                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer">
                                        <div className="flex items-center gap-3">
                                            {expandedCategories.has(suggestion.id) ?
                                                <ChevronDown className="h-4 w-4" /> :
                                                <ChevronRight className="h-4 w-4" />
                                            }
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-semibold">{suggestion.title}</h3>
                                                    <Badge variant={getPriorityColor(suggestion.priority)}>
                                                        {getPriorityIcon(suggestion.priority)}
                                                        {suggestion.priority.toUpperCase()}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{suggestion.estimatedImpact}</p>
                                            </div>
                                        </div>
                                    </div>
                                </CollapsibleTrigger>

                                <CollapsibleContent>
                                    <div className="mt-3 ml-7 space-y-2">
                                        {suggestion.suggestions.map((item, idx) => {
                                            const suggestionId = `${suggestion.id}-${idx}`;
                                            return (
                                                <div key={idx} className="flex items-start gap-3 p-3 bg-muted/30 rounded">
                                                    <Checkbox
                                                        id={suggestionId}
                                                        checked={selectedSuggestions.has(suggestionId)}
                                                        onCheckedChange={() => toggleSuggestion(suggestionId)}
                                                    />
                                                    <label
                                                        htmlFor={suggestionId}
                                                        className="text-sm cursor-pointer flex-1"
                                                    >
                                                        {item}
                                                    </label>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        ))}
                    </div>

                    {/* Upgrade Actions */}
                    <div className="flex gap-2 pt-4 border-t">
                        <Button
                            onClick={performContractUpgrade}
                            disabled={selectedSuggestions.size === 0 || isUpgrading}
                            className="flex-1"
                        >
                            {isUpgrading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Upgrading Contract...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="h-4 w-4 mr-2" />
                                    Upgrade Contract ({selectedSuggestions.size} changes)
                                </>
                            )}
                        </Button>
                        {/* REMOVED: Re-analyze button - suggestions are now integrated */}
                    </div>

                    {revisionCount > 0 && (
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                Revision {revisionCount} of 5. Each revision improves your contract based on selected suggestions.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
