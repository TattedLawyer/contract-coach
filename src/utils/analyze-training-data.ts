#!/usr/bin/env tsx

/**
 * Training Data Analysis Script
 *
 * This script analyzes all training contracts to understand formatting patterns
 * and generate recommendations for optimal contract PDF generation.
 *
 * Usage: npx tsx src/utils/analyze-training-data.ts
 */

import { TrainingDataAnalyzer } from '../services/TrainingDataAnalyzer';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
    console.log('🚀 Starting Training Data Analysis...\n');

    try {
        // Initialize analyzer
        const analyzer = new TrainingDataAnalyzer(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        // Analyze training data
        console.log('📊 Analyzing training contracts...\n');
        const analysis = await analyzer.analyzeTrainingData();

        // Display results
        console.log('📈 ANALYSIS RESULTS');
        console.log('==================\n');

        console.log(`📊 Total Contracts Analyzed: ${analysis.totalContracts}`);
        console.log(`🏷️  Contract Types: ${analysis.contractTypes.join(', ') || 'None found'}`);
        console.log(`🏗️  Common Structures: ${analysis.commonStructures.join(', ') || 'None identified'}\n`);

        console.log('🎯 RECOMMENDED FORMAT');
        console.log('====================\n');

        const rec = analysis.recommendedFormat;

        console.log('📋 Structure:');
        console.log(`  • Header: ${rec.structure.hasHeader ? '✅' : '❌'}`);
        console.log(`  • Footer: ${rec.structure.hasFooter ? '✅' : '❌'}`);
        console.log(`  • Page Numbers: ${rec.structure.hasPageNumbers ? '✅' : '❌'}`);
        console.log(`  • Table of Contents: ${rec.structure.hasTableOfContents ? '✅' : '❌'}\n`);

        console.log('✍️ Typography:');
        console.log(`  • Font Family: ${rec.typography.fontFamily}`);
        console.log(`  • Font Size: ${rec.typography.fontSize}`);
        console.log(`  • Line Height: ${rec.typography.lineHeight}`);
        console.log(`  • Heading Hierarchy: ${rec.typography.headingHierarchy.join(' → ')}\n`);

        console.log('📐 Layout:');
        console.log(`  • Margins: ${rec.layout.margins}`);
        console.log(`  • Paragraph Spacing: ${rec.layout.paragraphSpacing}`);
        console.log(`  • Section Spacing: ${rec.layout.sectionSpacing}`);
        console.log(`  • Text Alignment: ${rec.layout.alignment}\n`);

        console.log('🔧 Elements:');
        console.log(`  • Clause Numbering: ${rec.elements.clauseNumbering ? '✅' : '❌'}`);
        console.log(`  • Signature Blocks: ${rec.elements.signatureBlocks ? '✅' : '❌'}`);
        console.log(`  • Definitions Section: ${rec.elements.definitions ? '✅' : '❌'}`);
        console.log(`  • Schedules/Exhibits: ${rec.elements.schedules ? '✅' : '❌'}\n`);

        // Provide PDF generation recommendations
        console.log('🎨 PDF GENERATION RECOMMENDATIONS');
        console.log('=================================\n');

        if (analysis.totalContracts === 0) {
            console.log('⚠️  No training contracts found!');
            console.log('   Recommendations:');
            console.log('   • Upload sample contracts to analyze formatting patterns');
            console.log('   • Include various contract types (NDA, Service Agreements, etc.)');
            console.log('   • Use professional legal document formatting');
            console.log('   • Ensure contracts have proper headers, footers, and signatures\n');
        } else {
            console.log('✅ Training data analysis complete!');
            console.log('   The PDF generation service will use these patterns to create');
            console.log('   professional contracts that match your training data format.\n');

            // Contract structure recommendations
            if (rec.structure.hasHeader && rec.structure.hasFooter) {
                console.log('🏛️  Structure: Full professional layout with headers and footers');
            }

            if (rec.typography.fontFamily === 'Calibri') {
                console.log('📝 Typography: Calibri font family for professional appearance');
            }

            if (rec.layout.alignment === 'justify') {
                console.log('📐 Layout: Justified text alignment for formal document appearance');
            }

            if (rec.elements.clauseNumbering && rec.elements.definitions) {
                console.log('📋 Elements: Comprehensive contract structure with numbered clauses');
            }
        }

        console.log('🎯 NEXT STEPS');
        console.log('=============');
        console.log('1. Review the recommended format above');
        console.log('2. Update PDF templates to match these patterns');
        console.log('3. Test PDF generation with sample contracts');
        console.log('4. Upload more training contracts to improve analysis\n');

    } catch (error) {
        console.error('❌ Error during analysis:', error);
        console.log('\n🔧 Troubleshooting:');
        console.log('• Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
        console.log('• Check that training contracts exist in the database');
        console.log('• Verify Supabase connection and permissions');
        process.exit(1);
    }
}

// Run the analysis
main().catch(console.error);
