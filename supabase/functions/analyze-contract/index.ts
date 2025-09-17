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

// Analysis cleaning is now handled by the parsingUtils.ts shared library

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contractText, analysisType, prompt } = await req.json();
    console.log('Contract analysis request:', { analysisType, promptLength: prompt?.length });

    if (!geminiApiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Get training contracts for context (limit to recent ones for performance)
    const { data: trainingContracts, error: contractsError } = await supabase
      .from('training_contracts')
      .select('file_name, contract_type, description')
      .order('created_at', { ascending: false })
      .limit(20);

    if (contractsError) {
      console.error('Error fetching training contracts:', contractsError);
    }

    // Build context from training contracts
    const trainingContext = trainingContracts?.map(contract =>
      `Contract: ${contract.file_name}\nType: ${contract.contract_type || 'Unknown'}\nDescription: ${contract.description || 'No description'}`
    ).join('\n\n') || '';

    // Define analysis prompts based on type
    let systemPrompt = '';
    let userPrompt = '';

    switch (analysisType) {
      case 'draft':
        systemPrompt = `You are an expert contract attorney with extensive experience in drafting various types of contracts. You have access to a database of training contracts that inform your understanding of best practices and common clauses.

Training Contracts Context:
${trainingContext}

Your task is to draft a comprehensive, legally sound contract based on the user's requirements. Include:
- Clear terms and conditions
- Appropriate legal language
- Standard clauses for the contract type
- Risk mitigation provisions
- Compliance considerations

Format your response as a complete contract document with proper structure and legal formatting.`;
        userPrompt = prompt || contractText;
        break;

      case 'analyze':
        // UNIFIED ANALYSIS: Both review and grade in one comprehensive response
        systemPrompt = `You are an expert contract attorney and legal educator. You have access to a database of training contracts that inform your understanding of industry standards and best practices.

Training Contracts Context:
${trainingContext}

**GRADE THE CONTRACT** on a scale of A-F based on:
- Legal accuracy and completeness (40%)
- Clarity and precision of language (25%)
- Risk management and protection (20%)
- Industry best practices compliance (15%)

**PROVIDE COMPREHENSIVE ANALYSIS** in a well-formatted, professional report including:
1. **Overall Grade**: Letter grade (A-F) with percentage score and brief justification
2. **Detailed Breakdown**: Score and comments for each category above
3. **Summary**: Brief overview of the contract's purpose and key terms
4. **Strengths**: Well-drafted clauses and provisions
5. **Weaknesses**: Areas of concern, ambiguous language, or missing provisions
6. **Risks**: Potential legal and business risks
7. **Recommendations**: Specific suggestions for improvement
8. **Compliance**: Any regulatory or industry standard considerations
9. **Comparison**: How this contract compares to industry standards

**THEN PROVIDE UPGRADE SUGGESTIONS** in a structured format. Structure your ENTIRE response as clean, formatted text (NOT JSON). Use markdown formatting for readability:

# 📊 Contract Analysis Report

## 🎯 Overall Grade: [GRADE] ([SCORE]%)

## 📋 Detailed Breakdown
- **Legal Accuracy and Completeness (40%)**: [Score/40] - [Comments]
- **Clarity and Precision of Language (25%)**: [Score/25] - [Comments]
- **Risk Management and Protection (20%)**: [Score/20] - [Comments]
- **Industry Best Practices Compliance (15%)**: [Score/15] - [Comments]

## 📝 Summary
[Brief overview of contract purpose and key terms]

## ✅ Strengths
- [Strength 1]
- [Strength 2]
- [etc.]

## ⚠️ Weaknesses
- [Weakness 1]
- [Weakness 2]
- [etc.]

## 🚨 Risks
- [Risk 1]
- [Risk 2]
- [etc.]

## 💡 Recommendations
- [Recommendation 1]
- [Recommendation 2]
- [etc.]

## ⚖️ Compliance
[Compliance analysis]

## 🔍 Industry Comparison
[Comparison to industry standards]

---

# 🚀 Contract Upgrade Suggestions

## 🏆 High Priority Improvements
### Missing Clauses
- [Suggestion 1]
- [Suggestion 2]
- [etc.]

### Legal Language Enhancements
- [Suggestion 1]
- [Suggestion 2]
- [etc.]

## 📈 Medium Priority Improvements
### Risk Mitigation
- [Suggestion 1]
- [Suggestion 2]
- [etc.]

### Compliance Updates
- [Suggestion 1]
- [Suggestion 2]
- [etc.]

## 📝 Low Priority Improvements
### Clarity Improvements
- [Suggestion 1]
- [Suggestion 2]
- [etc.]

---

**IMPORTANT:** Format your response as clean, readable text with markdown formatting. Do NOT return JSON. Make it professional and easy to read.`;
        userPrompt = `Please analyze the following contract comprehensively and provide a detailed report with upgrade suggestions:\n\n${contractText}`;
        break;

      default:
        throw new Error('Invalid analysis type. Must be: draft or analyze');
    }

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
    console.log('Gemini response received');

    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      throw new Error('No response generated from Gemini');
    }

    let rawAiResponse = geminiData.candidates[0].content.parts[0].text;
    console.log('🔍 RAW ANALYSIS RESPONSE LENGTH:', rawAiResponse.length);
    console.log('🔍 RAW ANALYSIS RESPONSE PREVIEW:', rawAiResponse.substring(0, 200) + '...');

    // 🧹 CRITICAL: FILTER THE DATA - Remove conversational artifacts
    const analysis = cleanContractText(rawAiResponse);
    console.log('✅ CLEANED ANALYSIS LENGTH:', analysis.length);
    console.log('✅ CLEANED ANALYSIS PREVIEW:', analysis.substring(0, 200) + '...');

    // Validate the cleaning quality
    if (analysis.includes('Here is') || analysis.includes('```')) {
        console.warn('⚠️ Warning: Some unwanted text may still be present in the cleaned analysis');
    }

    return new Response(JSON.stringify({
      analysis,
      analysisType,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-contract function:', error);
    return new Response(JSON.stringify({
      error: error.message,
      details: error.stack
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});