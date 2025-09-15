import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import pdfParse from 'https://esm.sh/pdf-parse@1.1.1';
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
          console.log('Processing PDF file with pdf-parse...');
          const buffer = await fileData.arrayBuffer();

          // Use pdf-parse for proper text extraction
          const data = await pdfParse(Buffer.from(buffer));

          if (!data.text || data.text.trim().length === 0) {
            throw new Error("No text content found in PDF. It may be image-based or scanned.");
          }

          extractedText = data.text.trim();
          console.log(`PDF extraction successful: ${extractedText.length} characters, ${data.numpages} pages`);

        } catch (pdfError) {
          console.error('PDF extraction error:', pdfError);

          if (pdfError.message.includes('Invalid PDF')) {
            extractedText = "Invalid or corrupted PDF file. Please try uploading a different PDF.";
          } else if (pdfError.message.includes('encrypted')) {
            extractedText = "PDF is password-protected. Please remove the password and try again.";
          } else if (pdfError.message.includes('No text content')) {
            extractedText = "No readable text found in PDF. This appears to be a scanned document or image-based PDF. Please try pasting the text manually or using a different PDF.";
          } else {
            extractedText = `PDF processing failed: ${pdfError.message}. Please try uploading a different PDF or paste the text manually.`;
          }
        }
        break;

      case 'doc':
      case 'docx':
        try {
          console.log(`Processing ${fileExtension.toUpperCase()} document...`);
          const buffer = await fileData.arrayBuffer();

          // Extract text from Word document using mammoth
          const result = await extractRawText({
            arrayBuffer: buffer,
            // Add options for better extraction
            styleMap: [
              "p[style-name='Heading 1'] => h1",
              "p[style-name='Heading 2'] => h2"
            ]
          });

          extractedText = result.value.trim();

          // Log extraction warnings and errors
          if (result.messages && result.messages.length > 0) {
            const warnings = result.messages.filter(msg => msg.type === 'warning');
            const errors = result.messages.filter(msg => msg.type === 'error');

            if (warnings.length > 0) {
              console.warn('Mammoth extraction warnings:', warnings);
            }
            if (errors.length > 0) {
              console.error('Mammoth extraction errors:', errors);
            }
          }

          if (!extractedText) {
            throw new Error("No text content found in Word document.");
          }

          console.log(`${fileExtension.toUpperCase()} processing completed: ${extractedText.length} characters`);
        } catch (docError) {
          console.error('Word document extraction error:', docError);

          if (docError.message.includes('Invalid') || docError.message.includes('corrupt')) {
            extractedText = `Invalid or corrupted ${fileExtension.toUpperCase()} file. Please try uploading a different file.`;
          } else if (docError.message.includes('password') || docError.message.includes('protected')) {
            extractedText = `${fileExtension.toUpperCase()} file is password-protected. Please remove the password and try again.`;
          } else if (docError.message.includes('No text content')) {
            extractedText = `No readable text found in ${fileExtension.toUpperCase()} file. The file may contain only images or be empty.`;
          } else {
            extractedText = `Failed to extract text from ${fileExtension.toUpperCase()} document: ${docError.message}. Please save as a .docx file or paste the text manually.`;
          }
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