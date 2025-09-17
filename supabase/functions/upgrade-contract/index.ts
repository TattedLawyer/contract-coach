import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { cleanContractText } from '../_shared/parsingUtils.ts';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

// Contract cleaning is now handled by the parsingUtils.ts shared library

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

        let rawAiResponse = geminiData.candidates[0].content.parts[0].text;
        console.log('🔍 RAW AI RESPONSE LENGTH:', rawAiResponse.length);
        console.log('🔍 RAW AI RESPONSE PREVIEW:', rawAiResponse.substring(0, 200) + '...');

        // 🧹 CRITICAL: FILTER THE DATA - Remove conversational artifacts
        const upgradedContract = cleanContractText(rawAiResponse);
        console.log('✅ CLEANED CONTRACT LENGTH:', upgradedContract.length);
        console.log('✅ CLEANED CONTRACT PREVIEW:', upgradedContract.substring(0, 200) + '...');

        // Validate the cleaning quality
        if (upgradedContract.includes('Here is') || upgradedContract.includes('```')) {
            console.warn('⚠️ Warning: Some unwanted text may still be present in the cleaned contract');
        }

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
