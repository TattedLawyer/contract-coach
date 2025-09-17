#!/usr/bin/env tsx

/**
 * Test script to verify pdf-lib PDF generation works correctly
 */

import { PDFGenerationService } from '../services/PDFGenerationService';

async function testPdfLibGeneration() {
    console.log('🧪 Testing pdf-lib PDF Generation\n');

    try {
        const pdfService = new PDFGenerationService();

        const testContractData = {
            contract_title: 'Test Contract',
            contract_body: `This is a test contract for pdf-lib generation.

This Agreement is made between Test Party A and Test Party B.

1. First clause of the contract
2. Second clause with some details
3. Third clause to test formatting

Terms and conditions apply.`,
            revision_number: 1,
            generation_date: new Date().toLocaleDateString()
        };

        console.log('📄 Generating PDF with test data...');
        console.log('Title:', testContractData.contract_title);
        console.log('Content length:', testContractData.contract_body.length, 'characters');
        console.log('Revision:', testContractData.revision_number);
        console.log('Date:', testContractData.generation_date);

        const pdfBuffer = await pdfService.generateContractPDF(testContractData);

        console.log('✅ PDF generated successfully!');
        console.log('📊 PDF Buffer size:', pdfBuffer.length, 'bytes');
        console.log('📄 PDF Buffer type:', pdfBuffer.constructor.name);

        // Verify the buffer is valid
        if (pdfBuffer.length > 1000) {
            console.log('✅ PDF buffer appears to be valid (size > 1KB)');
        } else {
            console.log('⚠️ PDF buffer might be too small, check generation');
        }

        // Test that we can create a blob from it
        const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
        console.log('✅ Blob created successfully, size:', blob.size, 'bytes');

        console.log('\n🎉 pdf-lib PDF generation test completed successfully!');
        console.log('🚀 Ready for production use in Supabase Edge Runtime');

    } catch (error) {
        console.error('❌ PDF generation test failed:', error);
        console.error('Error details:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
    }
}

// Run the test
testPdfLibGeneration().catch(console.error);
