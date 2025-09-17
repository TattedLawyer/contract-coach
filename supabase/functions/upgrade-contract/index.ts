import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

/**
 * Clean upgraded contract text to remove unwanted introduction and metadata
 */
function cleanUpgradedContract(text: string): string {
    let cleaned = text;

    // Remove common unwanted introduction text patterns (comprehensive list)
    const unwantedPatterns = [
        // Main problematic patterns from user feedback
        /Here is the upgraded contract incorporating the requested changes\./gi,
        /The additions are clearly marked\./gi,
        /Changes are clearly marked with comments indicating the additions\./gi,
        /Here is your upgraded contract:/gi,
        /Below is the revised contract:/gi,
        /I've created the following contract for you:/gi,
        /Here's the contract draft:/gi,
        /The upgraded contract is as follows:/gi,
        /Here is the complete upgraded contract:/gi,
        /Here's the upgraded version:/gi,

        // Additional AI response patterns
        /Here is the contract:/gi,
        /The contract is as follows:/gi,
        /Below is the contract:/gi,
        /Here's your contract:/gi,
        /I have created the following contract:/gi,
        /The revised contract is:/gi,
        /Here is the revised version:/gi,

        // Markdown and formatting artifacts
        /\*\*Changes are marked with \[.*?\]\*\*/gi,
        /---[\s\S]*?---/g, // Remove markdown separators
        /```[\s\S]*?```/g, // Remove code blocks
        /`[\s\S]*?`/g, // Remove inline code
        /\[.*?\]/g, // Remove bracketed comments
        /^\s*\[.*?\]\s*$/gm, // Remove lines that are just bracketed comments

        // Specific problematic patterns from PDF output
        /```text\s+UPGRADED\s+CONTRACT/gi,
        /```UPGRADED\s+CONTRACT/gi,
        /```text/gi, // Remove any ```text patterns
        /UPGRADED\s+CONTRACT[\s\S]*?```/gi, // Remove content after UPGRADED CONTRACT in code blocks
        /^```[\s\S]*?UPGRADED\s+CONTRACT[\s\S]*?$/gm, // Remove entire lines with this pattern
        /```[\s\S]*?UPGRADED[\s\S]*?```/gi, // Remove code blocks containing UPGRADED

        // Additional contract-related code block patterns
        /```[\s\S]*?CONTRACT[\s\S]*?```/gi, // Any code block containing CONTRACT
        /```[\s\S]*?AGREEMENT[\s\S]*?```/gi, // Any code block containing AGREEMENT
        /```[\s\S]*?REVISED[\s\S]*?```/gi, // Any code block containing REVISED
        /^```\w*\s*$/gm, // Remove lines that are just opening code blocks
        /^```\w+.*$/gm, // Remove lines that start with code blocks and have content

        // Headers that should be removed
        /^#+\s*(Contract|Agreement|Draft|Upgrade|Revised|Updated)/gim,

        // Common AI fluff
        /^Here is/gim,
        /^Below is/gim,
        /^The following/gim,
        /^I've prepared/gim,
        /^This is the/gim,
        /^As requested/gim,
        /^The upgraded contract:/gim,
        /^Upgraded Contract:/gim,
        /^Revised Contract:/gim,
        /^New Contract Version:/gim,
    ];

    // Apply all cleaning patterns
    unwantedPatterns.forEach(pattern => {
        cleaned = cleaned.replace(pattern, '');
    });

    // Remove excessive whitespace and empty lines at the beginning
    cleaned = cleaned.replace(/^\s*\n+/gm, '');
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n'); // Remove excessive consecutive empty lines
    cleaned = cleaned.trim();

    // More aggressive cleaning: if text starts with common unwanted phrases, find contract start
    const aggressiveStartPatterns = [
        // Contract start patterns
        /^This Agreement/im,
        /^This Contract/im,
        /^WHEREAS/im,
        /^BETWEEN/im,
        /^PARTIES:/im,
        /^AGREEMENT/im,
        /^CONTRACT/im,
        /^The Parties:/im,
        /^1\./im, // Numbered clauses
        /^I\./im, // Roman numerals
        /^A\./im, // Lettered clauses
        /^Section\s+\d+/im,
        /^Article\s+\d+/im,

        // Header patterns that indicate actual contract content
        /^#+\s*(Parties|Definitions|Term|Payment|Signatures?|Scope|Obligations)/im,
    ];

    for (const pattern of aggressiveStartPatterns) {
        const match = cleaned.match(pattern);
        if (match && match.index > 0) {
            // Only cut if we're removing a significant amount of unwanted text
            if (match.index > 10) {
                cleaned = cleaned.substring(match.index);
                break;
            }
        }
    }

    // Final cleanup
    cleaned = cleaned.replace(/^\s*\n+/gm, ''); // Remove leading empty lines
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n'); // Normalize multiple empty lines
    cleaned = cleaned.trim();

    return cleaned;
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { contractText, selectedSuggestions, upgradeType, revisionCount = 0 } = await req.json();

        if (!geminiApiKey) {
            throw new Error('Gemini API key not configured');
        }

        if (!contractText || !selectedSuggestions || selectedSuggestions.length === 0) {
            throw new Error('Contract text and selected suggestions are required');
        }

        // Create Supabase client
        const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

        // Get training contracts for context (limit to recent ones)
        const { data: trainingContracts, error: contractsError } = await supabase
            .from('training_contracts')
            .select('file_name, contract_type, description')
            .order('created_at', { ascending: false })
            .limit(10);

        if (contractsError) {
            console.error('Error fetching training contracts:', contractsError);
        }

        // Build context from training contracts
        const trainingContext = trainingContracts?.map(contract =>
            `Contract: ${contract.file_name}\nType: ${contract.contract_type || 'Unknown'}\nDescription: ${contract.description || 'No description'}`
        ).join('\n\n') || '';

        // Format selected suggestions for the AI
        const suggestionsText = selectedSuggestions.map((suggestion: any, index: number) =>
            `${index + 1}. ${suggestion}`
        ).join('\n');

        // Determine upgrade complexity based on type and selections
        const upgradeComplexity = upgradeType === 'comprehensive' || selectedSuggestions.length > 10
            ? 'comprehensive'
            : 'targeted';

        // Create the upgrade prompt
        let systemPrompt = '';
        let userPrompt = '';

        if (upgradeComplexity === 'comprehensive') {
            systemPrompt = `You are an expert contract attorney specializing in contract drafting and improvement. You have access to a database of professional contract templates and best practices.

Training Contracts Context:
${trainingContext}

Your task is to comprehensively upgrade the provided contract by implementing ALL the selected suggestions. This is revision ${revisionCount + 1} of the contract.

IMPORTANT REQUIREMENTS:
1. Implement EVERY selected suggestion completely and professionally
2. Maintain the original contract's intent and core terms
3. Use modern, clear legal language
4. Ensure all additions are properly integrated into the contract structure
5. Preserve all existing valid clauses that aren't being modified
6. Add appropriate section headings and numbering
7. Ensure the upgraded contract is complete and ready for use

Return the fully upgraded contract as a complete, professional document.`;
        } else {
            systemPrompt = `You are an expert contract attorney specializing in contract improvement. You have access to a database of professional contracts and best practices.

Training Contracts Context:
${trainingContext}

Your task is to upgrade the provided contract by implementing ONLY the selected suggestions. This is revision ${revisionCount + 1} of the contract.

TARGETED UPGRADE REQUIREMENTS:
1. Implement ONLY the specific suggestions listed below
2. Make minimal changes beyond what's requested
3. Maintain the original contract structure where possible
4. Use professional legal language for all additions/modifications
5. Preserve all existing valid provisions not being changed

Return the upgraded contract with clear indications of what was changed.`;
        }

        userPrompt = `ORIGINAL CONTRACT:
${contractText}

SELECTED SUGGESTIONS TO IMPLEMENT:
${suggestionsText}

Please upgrade the contract by implementing these suggestions. Return the complete upgraded contract.`;

        // Call Gemini API
        const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: systemPrompt },
                            { text: userPrompt }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.3,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 8192,
                }
            })
        });

        if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            console.error('Gemini API error:', errorText);
            throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
        }

        const geminiData = await geminiResponse.json();
        console.log('Gemini response received for contract upgrade');

        if (!geminiData.candidates || geminiData.candidates.length === 0) {
            throw new Error('No upgrade generated from Gemini');
        }

        let upgradedContract = geminiData.candidates[0].content.parts[0].text;

        // Clean the upgraded contract to remove unwanted introduction text
        upgradedContract = cleanUpgradedContract(upgradedContract);

        // Create a summary of changes made
        const changesSummary = selectedSuggestions.map((suggestion: any, index: number) =>
            `${index + 1}. ${suggestion}`
        ).join('\n');

        return new Response(JSON.stringify({
            upgradedContract,
            changesSummary,
            selectedSuggestionsCount: selectedSuggestions.length,
            upgradeType,
            revisionNumber: revisionCount + 1,
            upgradeComplexity,
            timestamp: new Date().toISOString()
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('Error in upgrade-contract function:', error);
        return new Response(JSON.stringify({
            error: error.message,
            details: error.stack
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
