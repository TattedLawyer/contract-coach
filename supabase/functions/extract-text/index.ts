import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { PDFDocument } from 'https://esm.sh/pdf-lib@1.17.1';
import * as pdfParse from 'https://esm.sh/pdf-parse@1.1.1';

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
        try {
          console.log('Processing PDF file...');
          const buffer = await fileData.arrayBuffer();
          const uint8Array = new Uint8Array(buffer);
          
          // Use pdf-parse to extract text
          const pdfData = await pdfParse.default(uint8Array);
          extractedText = pdfData.text;
          
          if (!extractedText || extractedText.trim().length === 0) {
            extractedText = "No readable text found in the PDF. This might be a scanned document or image-based PDF. Please copy and paste the contract text manually.";
          }
          
          console.log('PDF text extracted, length:', extractedText.length);
        } catch (pdfError) {
          console.error('PDF extraction error:', pdfError);
          extractedText = "Failed to extract text from PDF. Please copy and paste the contract text manually, or upload a text file version.";
        }
        break;
        
      case 'doc':
      case 'docx':
        try {
          console.log('Processing Word document...');
          const buffer = await fileData.arrayBuffer();
          
          if (fileExtension === 'docx') {
            // For .docx files, we'll use a simple text extraction approach
            // This is a basic implementation - for production, consider using mammoth.js
            const uint8Array = new Uint8Array(buffer);
            const decoder = new TextDecoder('utf-8', { fatal: false });
            const rawText = decoder.decode(uint8Array);
            
            // Extract readable text (this is a simplified approach)
            // Remove XML tags and extract text content
            const textMatch = rawText.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
            if (textMatch) {
              extractedText = textMatch
                .map(match => match.replace(/<w:t[^>]*>([^<]*)<\/w:t>/, '$1'))
                .join(' ')
                .replace(/\s+/g, ' ')
                .trim();
            }
            
            if (!extractedText || extractedText.trim().length === 0) {
              extractedText = "Could not extract readable text from the Word document. Please save as a text file or copy and paste the content manually.";
            }
          } else {
            // .doc files are more complex, suggest alternative
            extractedText = "Legacy .doc format is not supported. Please save your document as .docx format or as a text file, then upload again.";
          }
          
          console.log('Word document text extracted, length:', extractedText.length);
        } catch (docError) {
          console.error('Word document extraction error:', docError);
          extractedText = "Failed to extract text from Word document. Please save as a text file or copy and paste the content manually.";
        }
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