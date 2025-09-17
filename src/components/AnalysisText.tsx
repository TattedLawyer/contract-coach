import React from 'react';

interface AnalysisTextProps {
    content: string;
    className?: string;
}

export const AnalysisText: React.FC<AnalysisTextProps> = ({ content, className = '' }) => {
    // Function to parse and format the analysis content
    const formatAnalysisContent = (text: string) => {
        // Split content into lines for processing
        const lines = text.split('\n');
        const formattedElements: JSX.Element[] = [];
        let key = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Handle headings (## Heading)
            if (line.startsWith('## ')) {
                const headingText = line.substring(3).trim();
                formattedElements.push(
                    <h2 key={key++} className="analysis-heading-2">
                        {formatInlineElements(headingText)}
                    </h2>
                );
            }
            // Handle subheadings (### Subheading)
            else if (line.startsWith('### ')) {
                const headingText = line.substring(4).trim();
                formattedElements.push(
                    <h3 key={key++} className="analysis-heading-3">
                        {formatInlineElements(headingText)}
                    </h3>
                );
            }
            // Handle main headings (# Heading)
            else if (line.startsWith('# ')) {
                const headingText = line.substring(2).trim();
                formattedElements.push(
                    <h1 key={key++} className="analysis-heading-1">
                        {formatInlineElements(headingText)}
                    </h1>
                );
            }
            // Handle list items (- item or * item)
            else if (line.startsWith('- ') || line.startsWith('* ')) {
                const listItemText = line.substring(2).trim();
                formattedElements.push(
                    <li key={key++} className="analysis-list-item">
                        {formatInlineElements(listItemText)}
                    </li>
                );
            }
            // Handle numbered lists (1. item, 2. item, etc.)
            else if (/^\d+\.\s/.test(line)) {
                const listItemText = line.replace(/^\d+\.\s/, '');
                formattedElements.push(
                    <li key={key++} className="analysis-list-item">
                        {formatInlineElements(listItemText)}
                    </li>
                );
            }
            // Handle blockquotes (> quote)
            else if (line.startsWith('> ')) {
                const quoteText = line.substring(2).trim();
                formattedElements.push(
                    <blockquote key={key++} className="analysis-quote">
                        {formatInlineElements(quoteText)}
                    </blockquote>
                );
            }
            // Handle horizontal rules (--- or ***)
            else if (line.match(/^[-*_]{3,}$/)) {
                formattedElements.push(
                    <hr key={key++} className="my-6 border-border" />
                );
            }
            // Handle empty lines (create paragraph breaks)
            else if (line === '') {
                // Skip empty lines, they'll be handled by paragraph grouping
                continue;
            }
            // Handle regular paragraphs
            else {
                // Group consecutive non-empty lines into paragraphs
                let paragraphLines = [line];

                // Look ahead to collect all consecutive non-empty lines
                while (i + 1 < lines.length && lines[i + 1].trim() !== '' &&
                    !lines[i + 1].trim().startsWith('#') &&
                    !lines[i + 1].trim().match(/^[-*_]{3,}$/) &&
                    !lines[i + 1].trim().startsWith('> ') &&
                    !(/^\d+\.\s/.test(lines[i + 1].trim())) &&
                    !lines[i + 1].trim().startsWith('- ') &&
                    !lines[i + 1].trim().startsWith('* ')) {
                    i++;
                    paragraphLines.push(lines[i].trim());
                }

                const paragraphText = paragraphLines.join(' ').trim();
                if (paragraphText) {
                    formattedElements.push(
                        <p key={key++} className="analysis-paragraph">
                            {formatInlineElements(paragraphText)}
                        </p>
                    );
                }
            }
        }

        return formattedElements;
    };

    // Function to handle inline formatting (**bold**, *italic*, `code`, etc.)
    const formatInlineElements = (text: string): (string | JSX.Element)[] => {
        const elements: (string | JSX.Element)[] = [];
        let lastIndex = 0;
        let key = 0;

        // Handle bold text (**text**)
        const boldRegex = /\*\*(.*?)\*\*/g;
        let match;
        while ((match = boldRegex.exec(text)) !== null) {
            // Add text before the match
            if (match.index > lastIndex) {
                elements.push(text.slice(lastIndex, match.index));
            }

            // Add the formatted bold text
            elements.push(
                <strong key={key++} className="analysis-strong">
                    {match[1]}
                </strong>
            );

            lastIndex = match.index + match[0].length;
        }

        // Handle italic text (*text*)
        const italicRegex = /\*(.*?)\*/g;
        while ((match = italicRegex.exec(text)) !== null) {
            if (match.index >= lastIndex) {
                // Add text before the match
                if (match.index > lastIndex) {
                    elements.push(text.slice(lastIndex, match.index));
                }

                // Add the formatted italic text
                elements.push(
                    <em key={key++} className="analysis-emphasis">
                        {match[1]}
                    </em>
                );

                lastIndex = match.index + match[0].length;
            }
        }

        // Handle inline code (`code`)
        const codeRegex = /`(.*?)`/g;
        while ((match = codeRegex.exec(text)) !== null) {
            if (match.index >= lastIndex) {
                // Add text before the match
                if (match.index > lastIndex) {
                    elements.push(text.slice(lastIndex, match.index));
                }

                // Add the formatted code
                elements.push(
                    <code key={key++} className="analysis-code">
                        {match[1]}
                    </code>
                );

                lastIndex = match.index + match[0].length;
            }
        }

        // Add any remaining text
        if (lastIndex < text.length) {
            elements.push(text.slice(lastIndex));
        }

        // If no formatting was found, return the original text
        return elements.length > 0 ? elements : [text];
    };

    return (
        <div className={`analysis-text ${className}`}>
            {formatAnalysisContent(content)}
        </div>
    );
};
