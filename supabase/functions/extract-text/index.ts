import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { filePath } = await req.json();
    console.log('Extracting text from file:', filePath);

    if (!filePath) {
      throw new Error('File path is required');
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('training-contracts')
      .download(filePath);

    if (downloadError) {
      console.error('Download error:', downloadError);
      throw new Error(`Failed to download file: ${downloadError.message}`);
    }

    // Get file extension
    const fileExtension = filePath.split('.').pop()?.toLowerCase();
    let extractedText = '';

    switch (fileExtension) {
      case 'txt':
        // For text files, directly read content
        extractedText = await fileData.text();
        break;
        
      case 'pdf':
        // For PDF files, we'll need to implement PDF text extraction
        // For now, return a placeholder message
        extractedText = "PDF text extraction is not yet implemented. Please copy and paste the contract text manually, or upload a text file version of your contract.";
        break;
        
      case 'doc':
      case 'docx':
        // For Word files, we'll need to implement Word text extraction
        // For now, return a placeholder message
        extractedText = "Word document text extraction is not yet implemented. Please copy and paste the contract text manually, or save your document as a text file and upload that instead.";
        break;
        
      default:
        throw new Error(`Unsupported file type: ${fileExtension}`);
    }

    console.log('Text extraction completed, length:', extractedText.length);

    return new Response(JSON.stringify({ 
      extractedText,
      fileType: fileExtension,
      filePath
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in extract-text function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});