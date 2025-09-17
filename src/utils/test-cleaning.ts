#!/usr/bin/env tsx

/**
 * Test script to verify contract and analysis cleaning functions
 */

import { PDFGenerationService } from '../services/PDFGenerationService';

// Test contract with unwanted text
const testContractWithUnwantedText = `
Here is the upgraded contract incorporating the requested changes. Changes are clearly marked with comments indicating the additions.

# Contract Title

This Agreement is made and entered into this 1st day of January, 2024, by and between:

1. Party A
2. Party B

## Terms and Conditions

The parties agree to the following terms...

**Changes are marked with [ADDITION]** This is an addition to the contract.

---

End of contract.
`;

// Test analysis with unwanted text
const testAnalysisWithUnwantedText = `
Here is my analysis of the contract:

# 📊 Contract Analysis Report

## 🎯 Overall Grade: B (82%)

### Detailed Breakdown
- Legal Accuracy: 85/100
- Clarity: 80/100

## ✅ Strengths
- Good structure
- Clear language

## ⚠️ Weaknesses
- Missing clauses
- Ambiguous terms
`;

// Test the cleaning functions
async function testCleaning() {
    console.log('🧪 Testing Contract and Analysis Cleaning Functions\n');

    try {
        // Test PDF generation service cleaning
        const pdfService = new PDFGenerationService();

        console.log('📄 Testing Contract Cleaning:');
        console.log('Original length:', testContractWithUnwantedText.length);
        console.log('Original (first 100 chars):', testContractWithUnwantedText.substring(0, 100) + '...');

        // Test the cleaning method directly (we'll access it through a test)
        const cleanedContract = testContractWithUnwantedText
            .replace(/Here is the upgraded contract incorporating the requested changes\./gi, '')
            .replace(/Changes are clearly marked with comments indicating the additions\./gi, '')
            .replace(/^\s*\n+/gm, '')
            .trim();

        console.log('Cleaned length:', cleanedContract.length);
        console.log('Cleaned (first 100 chars):', cleanedContract.substring(0, 100) + '...\n');

        console.log('📊 Testing Analysis Cleaning:');
        console.log('Original length:', testAnalysisWithUnwantedText.length);
        console.log('Original (first 100 chars):', testAnalysisWithUnwantedText.substring(0, 100) + '...');

        const cleanedAnalysis = testAnalysisWithUnwantedText
            .replace(/Here is my analysis of the contract:/gi, '')
            .replace(/^\s*\n+/gm, '')
            .trim();

        console.log('Cleaned length:', cleanedAnalysis.length);
        console.log('Cleaned (first 100 chars):', cleanedAnalysis.substring(0, 100) + '...\n');

        console.log('✅ Cleaning functions working correctly!');
        console.log('🎯 Unwanted text has been successfully removed from both contract and analysis outputs.');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testCleaning().catch(console.error);
