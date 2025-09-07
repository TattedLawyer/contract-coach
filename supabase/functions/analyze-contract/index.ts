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

      case 'review':
        systemPrompt = `You are an expert contract attorney specializing in contract review and analysis. You have access to a database of training contracts that inform your understanding of industry standards and best practices.

Training Contracts Context:
${trainingContext}

Analyze the provided contract thoroughly and provide:
1. **Summary**: Brief overview of the contract's purpose and key terms
2. **Strengths**: Well-drafted clauses and provisions
3. **Weaknesses**: Areas of concern, ambiguous language, or missing provisions
4. **Risks**: Potential legal and business risks
5. **Recommendations**: Specific suggestions for improvement
6. **Compliance**: Any regulatory or industry standard considerations

Be thorough but concise in your analysis.`;
        userPrompt = `Please review and analyze the following contract:\n\n${contractText}`;
        break;

      case 'grade':
        systemPrompt = `You are an expert contract attorney and legal educator. You have access to a database of training contracts that represent industry standards and best practices.

Training Contracts Context:
${trainingContext}

Grade the provided contract on a scale of A-F based on:
- Legal accuracy and completeness (40%)
- Clarity and precision of language (25%)
- Risk management and protection (20%)
- Industry best practices compliance (15%)

Provide:
1. **Overall Grade**: Letter grade with brief justification
2. **Detailed Breakdown**: Score and comments for each category
3. **Specific Issues**: Line-by-line feedback on problematic sections
4. **Improvement Suggestions**: Concrete recommendations to achieve a higher grade
5. **Comparison**: How this contract compares to industry standards based on your training data

Be constructive but honest in your assessment.`;
        userPrompt = `Please grade and provide detailed feedback on the following contract:\n\n${contractText}`;
        break;

      default:
        throw new Error('Invalid analysis type. Must be: draft, review, or grade');
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

    const analysis = geminiData.candidates[0].content.parts[0].text;

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