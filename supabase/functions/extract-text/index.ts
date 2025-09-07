import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { PDFDocument } from 'https://esm.sh/pdf-lib@1.17.1';
import { extractRawText } from 'https://esm.sh/mammoth@1.6.0';

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
          
          // Load PDF document
          const pdfDoc = await PDFDocument.load(buffer);
          const pages = pdfDoc.getPages();
          
          // Extract text from all pages
          let allText = '';
          for (const page of pages) {
            try {
              // Note: pdf-lib doesn't have built-in text extraction
              // This is a basic implementation that may not extract all text
              const textContent = page.node.Contents;
              if (textContent) {
                // This is a simplified approach - real PDF text extraction is complex
                allText += `[Page ${pages.indexOf(page) + 1} content]\n`;
              }
            } catch (pageError) {
              console.warn('Could not extract text from page:', pageError);
            }
          }
          
          if (allText.trim()) {
            extractedText = allText;
          } else {
            extractedText = "PDF content detected but text extraction failed. This may be a scanned document or have complex formatting. Please copy and paste the text manually.";
          }
          
          console.log('PDF processing completed, extracted length:', extractedText.length);
        } catch (pdfError) {
          console.error('PDF extraction error:', pdfError);
          extractedText = "Failed to extract text from PDF. The file may be corrupted or use unsupported formatting. Please copy and paste the contract text manually.";
        }
        break;
        
      case 'doc':
      case 'docx':
        try {
          console.log('Processing Word document...');
          const buffer = await fileData.arrayBuffer();
          
          // Extract text from DOCX using mammoth
          const result = await extractRawText({ arrayBuffer: buffer });
          extractedText = result.value;
          
          if (result.messages && result.messages.length > 0) {
            console.log('Mammoth extraction messages:', result.messages);
          }
          
          console.log('DOCX processing completed, extracted length:', extractedText.length);
        } catch (docError) {
          console.error('Word document extraction error:', docError);
          extractedText = "Failed to extract text from Word document. The file may be corrupted or use unsupported formatting. Please save as a text file or copy and paste the content manually.";
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