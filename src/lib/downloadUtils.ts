// Professional PDF generation using pdf-lib service
export const downloadAsPDF = async (content: string, filename: string = 'contract.pdf') => {
    try {
        // Import the PDF generation service
        const { PDFGenerationService } = await import('../services/PDFGenerationService');
        const pdfService = new PDFGenerationService();

        // Prepare contract data for the service
        const contractData = {
            contract_title: 'Contract Analysis Report',
            contract_subtitle: 'EZ Biz Contract Analysis',
            contract_body: content,
            revision_number: 1,
            generation_date: new Date().toLocaleDateString(),
            logo_url: '/Andrometa Brand Kit.svg'
        };

        // Generate PDF using the professional service
        const pdfBuffer = await pdfService.generateContractPDF(contractData);

        // Create blob and download
        const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

    } catch (error) {
        console.error('Error generating PDF with pdf-lib:', error);
        // Fallback to basic PDF generation if pdf-lib fails
        await downloadAsPDFFallback(content, filename);
    }
};

// Fallback PDF generation using jsPDF
const downloadAsPDFFallback = async (content: string, filename: string) => {
    const { default: jsPDF } = await import('jspdf');
    const pdf = new jsPDF();

    // Set Calibri-like font
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(12);

    const lines = content.split('\n');
    let yPosition = 20;
    const pageHeight = pdf.internal.pageSize.height;
    const lineHeight = 7;

    lines.forEach((line) => {
        if (line.startsWith('# ')) {
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(16);
            const cleanLine = line.replace(/^#+\s*/, '');
            pdf.text(cleanLine, 20, yPosition);
            yPosition += lineHeight * 1.5;
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(12);
        } else if (line.startsWith('## ')) {
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(14);
            const cleanLine = line.replace(/^#+\s*/, '');
            pdf.text(cleanLine, 20, yPosition);
            yPosition += lineHeight * 1.3;
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(12);
        } else if (line.trim() === '') {
            yPosition += lineHeight * 0.5;
        } else {
            const wrappedLines = pdf.splitTextToSize(line, 170);
            pdf.text(wrappedLines, 20, yPosition);
            yPosition += lineHeight * wrappedLines.length;
        }

        if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
        }
    });

    pdf.save(filename);
};

// Note: Content formatting is now handled by the PDFGenerationService
// This function is kept for backward compatibility with fallback

export const downloadAsDocx = async (content: string, filename: string = 'contract.docx') => {
    try {
        // Dynamic import to avoid build issues
        const {
            Document,
            Packer,
            Paragraph,
            TextRun,
            HeadingLevel,
            AlignmentType,
            Table,
            TableRow,
            TableCell,
            WidthType,
            BorderStyle,
            PageOrientation,
            PageSize
        } = await import('docx');

        // Create document with Calibri font and professional formatting
        const docChildren = [];

        // Add document title
        docChildren.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'Contract Analysis Report',
                        size: 32, // 16pt
                        bold: true,
                        font: 'Calibri'
                    })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
            })
        );

        // Add subtitle
        docChildren.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'EZ Biz Contract Analysis',
                        size: 24, // 12pt
                        font: 'Calibri'
                    })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 600 }
            })
        );

        // Add generation date
        docChildren.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: `Generated: ${new Date().toLocaleDateString()}`,
                        size: 20, // 10pt
                        font: 'Calibri'
                    })
                ],
                alignment: AlignmentType.RIGHT,
                spacing: { after: 400 }
            })
        );

        // Split content and process each line
        const lines = content.split('\n');

        lines.forEach((line, index) => {
            if (line.startsWith('# ')) {
                // Main heading
                const cleanText = line.replace(/^#+\s*/, '');
                docChildren.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: cleanText,
                                size: 28, // 14pt
                                bold: true,
                                font: 'Calibri'
                            })
                        ],
                        spacing: { before: 400, after: 200 }
                    })
                );
            } else if (line.startsWith('## ')) {
                // Sub heading
                const cleanText = line.replace(/^#+\s*/, '');
                docChildren.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: cleanText,
                                size: 24, // 12pt
                                bold: true,
                                font: 'Calibri'
                            })
                        ],
                        spacing: { before: 300, after: 150 }
                    })
                );
            } else if (line.startsWith('### ')) {
                // Sub-sub heading
                const cleanText = line.replace(/^#+\s*/, '');
                docChildren.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: cleanText,
                                size: 22, // 11pt
                                bold: true,
                                font: 'Calibri'
                            })
                        ],
                        spacing: { before: 250, after: 100 }
                    })
                );
            } else if (line.startsWith('- ') || line.startsWith('* ')) {
                // Bullet points
                const cleanText = line.substring(2);
                docChildren.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: '• ',
                                bold: true,
                                font: 'Calibri'
                            }),
                            new TextRun({
                                text: cleanText,
                                font: 'Calibri'
                            })
                        ],
                        indent: { left: 720 }, // 0.5 inch indent
                        spacing: { after: 100 }
                    })
                );
            } else if (line.trim() === '') {
                // Empty line - add paragraph break with minimal spacing
                docChildren.push(
                    new Paragraph({
                        spacing: { after: 50 }
                    })
                );
            } else {
                // Regular text paragraph
                docChildren.push(
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: line,
                                font: 'Calibri'
                            })
                        ],
                        spacing: { after: 120 },
                        alignment: AlignmentType.LEFT
                    })
                );
            }
        });

        // Add footer information
        docChildren.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'This analysis was generated by EZ Biz Contract\'s AI-powered platform.',
                        size: 18, // 9pt
                        font: 'Calibri'
                    })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 600, after: 100 }
            })
        );

        docChildren.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: 'For questions or support, visit www.ezbizcontract.com',
                        size: 18, // 9pt
                        font: 'Calibri'
                    })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 }
            })
        );

        // Create the document with professional settings
        const doc = new Document({
            sections: [
                {
                    properties: {
                        page: {
                            size: {
                                width: PageSize.A4.width,
                                height: PageSize.A4.height,
                                orientation: PageOrientation.PORTRAIT
                            },
                            margin: {
                                top: 1440, // 1 inch
                                right: 1440,
                                bottom: 1440,
                                left: 1440
                            }
                        }
                    },
                    children: docChildren,
                },
            ],
            styles: {
                default: {
                    document: {
                        run: {
                            font: 'Calibri',
                            size: 24 // 12pt default
                        },
                        paragraph: {
                            spacing: {
                                line: 276, // 1.15 line spacing
                                after: 120
                            }
                        }
                    }
                }
            }
        });

        const buffer = await Packer.toBuffer(doc);
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error generating DOCX:', error);
        throw new Error('Failed to generate DOCX');
    }
};

// Utility function to get filename with timestamp
export const getDownloadFilename = (prefix: string, extension: string) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    return `${prefix}_${timestamp}.${extension}`;
};
