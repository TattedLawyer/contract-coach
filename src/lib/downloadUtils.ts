export const downloadAsPDF = async (content: string, filename: string = 'contract.pdf') => {
    try {
        // Dynamic import to avoid build issues
        const { default: jsPDF } = await import('jspdf');
        const pdf = new jsPDF();

        // Split content into lines
        const lines = content.split('\n');

        let yPosition = 20;
        const pageHeight = pdf.internal.pageSize.height;
        const lineHeight = 7;

        // Set font
        pdf.setFont('helvetica', 'normal');

        lines.forEach((line, index) => {
            // Handle headings (lines starting with #)
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
            } else if (line.startsWith('- ')) {
                // Bullet points
                pdf.text('•', 25, yPosition);
                const cleanLine = line.substring(2);
                const wrappedLines = pdf.splitTextToSize(cleanLine, 160);
                pdf.text(wrappedLines, 35, yPosition);
                yPosition += lineHeight * wrappedLines.length;
            } else {
                // Regular text
                const wrappedLines = pdf.splitTextToSize(line, 170);
                pdf.text(wrappedLines, 20, yPosition);
                yPosition += lineHeight * wrappedLines.length;
            }

            // Check if we need a new page
            if (yPosition > pageHeight - 20) {
                pdf.addPage();
                yPosition = 20;
            }
        });

        pdf.save(filename);
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw new Error('Failed to generate PDF');
    }
};

export const downloadAsDocx = async (content: string, filename: string = 'contract.docx') => {
    try {
        // Dynamic import to avoid build issues
        const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import('docx');

        // Split content into sections
        const sections = content.split('\n\n');
        const docChildren = [];

        sections.forEach(section => {
            const lines = section.split('\n');

            lines.forEach(line => {
                if (line.startsWith('# ')) {
                    // Main heading
                    const cleanText = line.replace(/^#+\s*/, '');
                    docChildren.push(
                        new Paragraph({
                            text: cleanText,
                            heading: HeadingLevel.TITLE,
                            alignment: AlignmentType.LEFT,
                        })
                    );
                } else if (line.startsWith('## ')) {
                    // Sub heading
                    const cleanText = line.replace(/^#+\s*/, '');
                    docChildren.push(
                        new Paragraph({
                            text: cleanText,
                            heading: HeadingLevel.HEADING_1,
                            alignment: AlignmentType.LEFT,
                        })
                    );
                } else if (line.startsWith('### ')) {
                    // Sub-sub heading
                    const cleanText = line.replace(/^#+\s*/, '');
                    docChildren.push(
                        new Paragraph({
                            text: cleanText,
                            heading: HeadingLevel.HEADING_2,
                            alignment: AlignmentType.LEFT,
                        })
                    );
                } else if (line.startsWith('- ')) {
                    // Bullet points
                    const cleanText = line.substring(2);
                    docChildren.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: '• ',
                                    bold: true,
                                }),
                                new TextRun({
                                    text: cleanText,
                                }),
                            ],
                            indent: { left: 720 }, // 0.5 inch indent
                        })
                    );
                } else if (line.trim() === '') {
                    // Empty line - add paragraph break
                    docChildren.push(new Paragraph({}));
                } else {
                    // Regular text
                    docChildren.push(
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: line,
                                }),
                            ],
                        })
                    );
                }
            });
        });

        const doc = new Document({
            sections: [
                {
                    properties: {},
                    children: docChildren,
                },
            ],
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
