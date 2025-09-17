import { createClient } from '@supabase/supabase-js';

interface ContractFormat {
    structure: {
        hasHeader: boolean;
        hasFooter: boolean;
        hasPageNumbers: boolean;
        hasTableOfContents: boolean;
    };
    typography: {
        fontFamily: string;
        fontSize: string;
        lineHeight: string;
        headingHierarchy: string[];
    };
    layout: {
        margins: string;
        paragraphSpacing: string;
        sectionSpacing: string;
        alignment: string;
    };
    elements: {
        clauseNumbering: boolean;
        signatureBlocks: boolean;
        definitions: boolean;
        schedules: boolean;
    };
}

interface TrainingContractAnalysis {
    totalContracts: number;
    contractTypes: string[];
    formatPatterns: ContractFormat[];
    commonStructures: string[];
    recommendedFormat: ContractFormat;
}

export class TrainingDataAnalyzer {
    private supabase;

    constructor(supabaseUrl?: string, supabaseKey?: string) {
        this.supabase = createClient(
            supabaseUrl || process.env.SUPABASE_URL!,
            supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
    }

    /**
     * Analyze all training contracts to understand formatting patterns
     */
    async analyzeTrainingData(): Promise<TrainingContractAnalysis> {
        console.log('🔍 Starting training data analysis...');

        // Get all training contract metadata
        const { data: contracts, error } = await this.supabase
            .from('training_contracts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error(`Failed to fetch training contracts: ${error.message}`);
        }

        if (!contracts || contracts.length === 0) {
            return this.getDefaultAnalysis();
        }

        console.log(`📊 Found ${contracts.length} training contracts`);

        const formatPatterns: ContractFormat[] = [];
        const contractTypes = new Set<string>();
        const structures = new Set<string>();

        // Analyze each contract
        for (const contract of contracts) {
            console.log(`🔎 Analyzing: ${contract.file_name}`);

            try {
                // Extract text content from the file
                const content = await this.extractContractContent(contract.file_path);
                const format = this.analyzeContractFormat(content);

                formatPatterns.push(format);
                contractTypes.add(contract.contract_type || 'Unknown');

                // Identify common structural patterns
                const structure = this.identifyStructure(content);
                structures.add(structure);

            } catch (error) {
                console.warn(`⚠️ Failed to analyze ${contract.file_name}:`, error);
            }
        }

        // Generate recommended format based on analysis
        const recommendedFormat = this.generateRecommendedFormat(formatPatterns);

        return {
            totalContracts: contracts.length,
            contractTypes: Array.from(contractTypes),
            formatPatterns,
            commonStructures: Array.from(structures),
            recommendedFormat
        };
    }

    /**
     * Extract text content from training contract files
     */
    private async extractContractContent(filePath: string): Promise<string> {
        try {
            const { data, error } = await this.supabase.storage
                .from('training-contracts')
                .download(filePath);

            if (error) {
                throw new Error(`Failed to download file: ${error.message}`);
            }

            const fileExtension = filePath.split('.').pop()?.toLowerCase();

            switch (fileExtension) {
                case 'txt':
                    return await data.text();

                case 'pdf':
                    // Use pdf-parse to extract text (this would need to be implemented)
                    return await this.extractFromPDF(data);

                case 'doc':
                case 'docx':
                    // Use mammoth to extract text (this would need to be implemented)
                    return await this.extractFromWord(data);

                default:
                    throw new Error(`Unsupported file type: ${fileExtension}`);
            }
        } catch (error) {
            console.error(`Error extracting content from ${filePath}:`, error);
            throw error;
        }
    }

    /**
     * Analyze the formatting patterns in contract text
     */
    private analyzeContractFormat(content: string): ContractFormat {
        const lines = content.split('\n');

        return {
            structure: {
                hasHeader: this.detectHeader(lines),
                hasFooter: this.detectFooter(lines),
                hasPageNumbers: this.detectPageNumbers(lines),
                hasTableOfContents: this.detectTableOfContents(lines)
            },
            typography: {
                fontFamily: this.detectFontFamily(lines),
                fontSize: this.detectFontSize(lines),
                lineHeight: this.detectLineHeight(lines),
                headingHierarchy: this.detectHeadingHierarchy(lines)
            },
            layout: {
                margins: this.detectMargins(lines),
                paragraphSpacing: this.detectParagraphSpacing(lines),
                sectionSpacing: this.detectSectionSpacing(lines),
                alignment: this.detectAlignment(lines)
            },
            elements: {
                clauseNumbering: this.detectClauseNumbering(lines),
                signatureBlocks: this.detectSignatureBlocks(lines),
                definitions: this.detectDefinitions(lines),
                schedules: this.detectSchedules(lines)
            }
        };
    }

    /**
     * Identify the overall structure of a contract
     */
    private identifyStructure(content: string): string {
        const lines = content.split('\n');
        const structure = [];

        // Look for common contract sections
        if (this.detectPreamble(lines)) structure.push('preamble');
        if (this.detectDefinitions(lines)) structure.push('definitions');
        if (this.detectObligations(lines)) structure.push('obligations');
        if (this.detectTermination(lines)) structure.push('termination');
        if (this.detectSignatures(lines)) structure.push('signatures');

        return structure.join(' → ');
    }

    /**
     * Generate recommended format based on training data analysis
     */
    private generateRecommendedFormat(patterns: ContractFormat[]): ContractFormat {
        if (patterns.length === 0) {
            return this.getDefaultFormat();
        }

        // Analyze patterns and create optimal format
        const recommended: ContractFormat = {
            structure: {
                hasHeader: patterns.filter(p => p.structure.hasHeader).length > patterns.length * 0.5,
                hasFooter: patterns.filter(p => p.structure.hasFooter).length > patterns.length * 0.5,
                hasPageNumbers: patterns.filter(p => p.structure.hasPageNumbers).length > patterns.length * 0.5,
                hasTableOfContents: patterns.filter(p => p.structure.hasTableOfContents).length > patterns.length * 0.5
            },
            typography: {
                fontFamily: this.getMostCommonValue(patterns.map(p => p.typography.fontFamily)),
                fontSize: this.getMostCommonValue(patterns.map(p => p.typography.fontSize)),
                lineHeight: this.getMostCommonValue(patterns.map(p => p.typography.lineHeight)),
                headingHierarchy: this.getMostCommonHeadingHierarchy(patterns)
            },
            layout: {
                margins: this.getMostCommonValue(patterns.map(p => p.layout.margins)),
                paragraphSpacing: this.getMostCommonValue(patterns.map(p => p.layout.paragraphSpacing)),
                sectionSpacing: this.getMostCommonValue(patterns.map(p => p.layout.sectionSpacing)),
                alignment: this.getMostCommonValue(patterns.map(p => p.layout.alignment))
            },
            elements: {
                clauseNumbering: patterns.filter(p => p.elements.clauseNumbering).length > patterns.length * 0.5,
                signatureBlocks: patterns.filter(p => p.elements.signatureBlocks).length > patterns.length * 0.5,
                definitions: patterns.filter(p => p.elements.definitions).length > patterns.length * 0.5,
                schedules: patterns.filter(p => p.elements.schedules).length > patterns.length * 0.5
            }
        };

        return recommended;
    }

    // Detection methods (simplified implementations)
    private detectHeader(lines: string[]): boolean {
        return lines.slice(0, 5).some(line =>
            /\b(agreement|contract|parties|date)\b/i.test(line)
        );
    }

    private detectFooter(lines: string[]): boolean {
        return lines.slice(-5).some(line =>
            /\b(page|signature|executed)\b/i.test(line)
        );
    }

    private detectPageNumbers(lines: string[]): boolean {
        return lines.some(line => /\bpage\s+\d+\b/i.test(line));
    }

    private detectTableOfContents(lines: string[]): boolean {
        return lines.some(line => /\b(table of contents|contents)\b/i.test(line));
    }

    private detectClauseNumbering(lines: string[]): boolean {
        return lines.some(line => /^\d+\.\d+|\(\w+\)/.test(line.trim()));
    }

    private detectSignatureBlocks(lines: string[]): boolean {
        return lines.some(line => /\b(signature|signed|executed)\b/i.test(line));
    }

    private detectDefinitions(lines: string[]): boolean {
        return lines.some(line => /\bdefinitions?\b/i.test(line));
    }

    private detectSchedules(lines: string[]): boolean {
        return lines.some(line => /\bschedules?\b/i.test(line));
    }

    private detectPreamble(lines: string[]): boolean {
        return lines.some(line => /\b(witnesseth|whereas|recitals)\b/i.test(line));
    }

    private detectObligations(lines: string[]): boolean {
        return lines.some(line => /\b(shall|will|agree|obligations)\b/i.test(line));
    }

    private detectTermination(lines: string[]): boolean {
        return lines.some(line => /\b(termination|end|expire)\b/i.test(line));
    }

    private detectSignatures(lines: string[]): boolean {
        return lines.some(line => /\b(signatures?|executed)\b/i.test(line));
    }

    // Placeholder detection methods
    private detectFontFamily(lines: string[]): string { return 'Calibri'; }
    private detectFontSize(lines: string[]): string { return '12pt'; }
    private detectLineHeight(lines: string[]): string { return '1.5'; }
    private detectHeadingHierarchy(lines: string[]): string[] { return ['h1', 'h2', 'h3']; }
    private detectMargins(lines: string[]): string { return '1in'; }
    private detectParagraphSpacing(lines: string[]): string { return '12pt'; }
    private detectSectionSpacing(lines: string[]): string { return '18pt'; }
    private detectAlignment(lines: string[]): string { return 'justify'; }

    // Utility methods
    private getMostCommonValue(values: string[]): string {
        const counts = values.reduce((acc, val) => {
            acc[val] = (acc[val] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'default';
    }

    private getMostCommonHeadingHierarchy(patterns: ContractFormat[]): string[] {
        // Simplified implementation
        return ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
    }

    // Placeholder methods for file extraction
    private async extractFromPDF(data: any): Promise<string> {
        // This would use pdf-parse in a real implementation
        return 'PDF extraction not implemented in this demo';
    }

    private async extractFromWord(data: any): Promise<string> {
        // This would use mammoth in a real implementation
        return 'Word extraction not implemented in this demo';
    }

    private getDefaultAnalysis(): TrainingContractAnalysis {
        return {
            totalContracts: 0,
            contractTypes: [],
            formatPatterns: [],
            commonStructures: [],
            recommendedFormat: this.getDefaultFormat()
        };
    }

    private getDefaultFormat(): ContractFormat {
        return {
            structure: {
                hasHeader: true,
                hasFooter: true,
                hasPageNumbers: true,
                hasTableOfContents: false
            },
            typography: {
                fontFamily: 'Calibri',
                fontSize: '12pt',
                lineHeight: '1.5',
                headingHierarchy: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']
            },
            layout: {
                margins: '1in',
                paragraphSpacing: '12pt',
                sectionSpacing: '18pt',
                alignment: 'justify'
            },
            elements: {
                clauseNumbering: true,
                signatureBlocks: true,
                definitions: true,
                schedules: false
            }
        };
    }
}

export default TrainingDataAnalyzer;
