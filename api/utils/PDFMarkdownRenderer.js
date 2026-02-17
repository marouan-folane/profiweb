/**
 * PDFMarkdownRenderer - Professional Markdown to PDF Renderer
 * Handles all markdown syntax and applies proper PDF formatting
 */

class PDFMarkdownRenderer {
    constructor(doc, colors, pageMargin) {
        this.doc = doc;
        this.COLORS = colors;
        this.PAGE_MARGIN = pageMargin;
    }

    /**
     * Main method to render markdown text to PDF
     * Handles block-level elements (headings, lists, paragraphs, horizontal rules)
     */
    renderMarkdownText(text, startY, contentWidth, maxY) {
        if (!text) return;

        const lines = text.split('\n');
        this.doc.y = startY;

        let inList = false;
        let listType = null; // 'ul' or 'ol'
        let listCounter = 1;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();

            // Check for page break
            if (this.doc.y > maxY) {
                this.doc.addPage();
                this.doc.x = this.PAGE_MARGIN.left;
                this.doc.y = this.PAGE_MARGIN.top + 20;
            }

            // Skip empty lines but add spacing
            if (!trimmedLine) {
                if (inList) {
                    inList = false;
                    listType = null;
                    listCounter = 1;
                }
                this.doc.moveDown(0.4);
                continue;
            }

            // Detect block type and render accordingly
            if (this.isHorizontalRule(trimmedLine)) {
                this.renderHorizontalRule(contentWidth);
                inList = false;
            } else if (this.isHeading(trimmedLine)) {
                this.renderHeading(trimmedLine, contentWidth);
                inList = false;
            } else if (this.isUnorderedList(trimmedLine)) {
                this.renderUnorderedListItem(trimmedLine, contentWidth);
                if (!inList || listType !== 'ul') {
                    inList = true;
                    listType = 'ul';
                }
            } else if (this.isOrderedList(trimmedLine)) {
                this.renderOrderedListItem(trimmedLine, listCounter, contentWidth);
                if (!inList || listType !== 'ol') {
                    inList = true;
                    listType = 'ol';
                    listCounter = 1;
                } else {
                    listCounter++;
                }
            } else {
                // Regular paragraph with inline markdown
                this.renderParagraph(trimmedLine, contentWidth);
                inList = false;
            }
        }
    }

    /**
     * Check if line is a horizontal rule (---, ***, ___)
     */
    isHorizontalRule(line) {
        return /^(-{3,}|\*{3,}|_{3,})$/.test(line);
    }

    /**
     * Check if line is a heading (#, ##, ###)
     */
    isHeading(line) {
        return /^#{1,3}\s+/.test(line);
    }

    /**
     * Check if line is an unordered list (-, *, +)
     */
    isUnorderedList(line) {
        return /^[-*+]\s+/.test(line);
    }

    /**
     * Check if line is an ordered list (1., 2., etc.)
     */
    isOrderedList(line) {
        return /^\d+\.\s+/.test(line);
    }

    /**
     * Render horizontal rule
     */
    renderHorizontalRule(contentWidth) {
        this.doc.moveDown(0.8);
        const ruleY = this.doc.y;

        this.doc.moveTo(this.PAGE_MARGIN.left + 50, ruleY)
            .lineTo(this.PAGE_MARGIN.left + contentWidth - 50, ruleY)
            .lineWidth(1.5)
            .strokeColor(this.COLORS.border)
            .opacity(0.5)
            .stroke()
            .opacity(1);

        this.doc.moveDown(0.8);
    }

    /**
     * Render heading (H1, H2, H3)
     */
    renderHeading(line, contentWidth) {
        const level = line.match(/^#+/)[0].length;
        const text = line.replace(/^#+\s+/, '').trim();
        const cleanText = this.stripAllMarkdown(text);

        this.doc.moveDown(level === 1 ? 1 : 0.7);

        if (level === 1) {
            // H1 - Large header with blue background
            const headerY = this.doc.y;
            const headerHeight = 45;

            this.doc.roundedRect(this.PAGE_MARGIN.left, headerY, contentWidth, headerHeight, 6)
                .fillColor(this.COLORS.primary)
                .fill();

            this.doc.fontSize(18)
                .font('Helvetica-Bold')
                .fillColor('#ffffff')
                .text(cleanText,
                    this.PAGE_MARGIN.left + 20,
                    headerY + 15,
                    { width: contentWidth - 40 });

            this.doc.y = headerY + headerHeight;
            this.doc.moveDown(0.6);

        } else if (level === 2) {
            // H2 - Medium header with accent bar
            const headerY = this.doc.y;
            const headerHeight = 35;

            this.doc.roundedRect(this.PAGE_MARGIN.left, headerY, contentWidth, headerHeight, 5)
                .fillColor(this.COLORS.background)
                .fill();

            // Left accent bar
            this.doc.rect(this.PAGE_MARGIN.left, headerY, 5, headerHeight)
                .fillColor(this.COLORS.accent)
                .fill();

            this.doc.fontSize(14)
                .font('Helvetica-Bold')
                .fillColor(this.COLORS.secondary)
                .text(cleanText,
                    this.PAGE_MARGIN.left + 20,
                    headerY + 10,
                    { width: contentWidth - 25 });

            this.doc.y = headerY + headerHeight;
            this.doc.moveDown(0.6);

        } else {
            // H3 - Simple bold text
            this.doc.fontSize(12)
                .font('Helvetica-Bold')
                .fillColor(this.COLORS.text)
                .text(cleanText,
                    this.PAGE_MARGIN.left + 15,
                    this.doc.y,
                    { width: contentWidth - 15 });

            this.doc.moveDown(0.5);
        }
    }

    /**
     * Render unordered list item (bullet point)
     */
    renderUnorderedListItem(line, contentWidth) {
        const text = line.replace(/^[-*+]\s+/, '').trim();
        const bulletY = this.doc.y;

        // Blue bullet point
        this.doc.circle(this.PAGE_MARGIN.left + 20, bulletY + 6, 2.5)
            .fillColor(this.COLORS.accent)
            .fill();

        // Render text with inline markdown
        this.renderInlineMarkdown(
            text,
            this.PAGE_MARGIN.left + 30,
            bulletY,
            contentWidth - 35,
            10,
            'Helvetica'
        );

        this.doc.moveDown(0.4);
    }

    /**
     * Render ordered list item (numbered)
     */
    renderOrderedListItem(line, number, contentWidth) {
        const text = line.replace(/^\d+\.\s+/, '').trim();
        const itemY = this.doc.y;

        // Blue number
        this.doc.fontSize(10)
            .font('Helvetica-Bold')
            .fillColor(this.COLORS.accent)
            .text(`${number}.`,
                this.PAGE_MARGIN.left + 15,
                itemY,
                { width: 15 });

        // Render text with inline markdown
        this.renderInlineMarkdown(
            text,
            this.PAGE_MARGIN.left + 30,
            itemY,
            contentWidth - 35,
            10,
            'Helvetica'
        );

        this.doc.moveDown(0.4);
    }

    /**
     * Render paragraph with inline markdown
     */
    renderParagraph(text, contentWidth) {
        this.renderInlineMarkdown(
            text,
            this.PAGE_MARGIN.left + 15,
            this.doc.y,
            contentWidth - 15,
            10,
            'Helvetica'
        );

        this.doc.moveDown(0.3);
    }

    /**
     * Render text with inline markdown formatting (bold, italic, strikethrough)
     * This is the core method that handles mixed formatting on the same line
     */
    renderInlineMarkdown(text, x, y, width, fontSize, baseFont) {
        this.doc.x = x;
        this.doc.y = y;

        // Split text into segments with different formatting
        const segments = this.parseInlineMarkdown(text);

        segments.forEach((segment, index) => {
            const isLast = index === segments.length - 1;

            // Choose font based on formatting
            let font = baseFont;
            if (segment.bold && segment.italic) {
                font = 'Helvetica-BoldOblique';
            } else if (segment.bold) {
                font = 'Helvetica-Bold';
            } else if (segment.italic) {
                font = 'Helvetica-Oblique';
            }

            // Apply strikethrough if needed
            if (segment.strikethrough) {
                const textWidth = this.doc.widthOfString(segment.text, { font, fontSize });
                const strikeY = this.doc.y + (fontSize / 2);
                
                this.doc.fontSize(fontSize)
                    .font(font)
                    .fillColor(this.COLORS.text)
                    .text(segment.text, this.doc.x, this.doc.y, {
                        width: width - (this.doc.x - x),
                        continued: !isLast,
                        lineBreak: false
                    });

                // Draw strikethrough line
                this.doc.moveTo(this.doc.x - textWidth, strikeY)
                    .lineTo(this.doc.x, strikeY)
                    .lineWidth(0.5)
                    .strokeColor(this.COLORS.text)
                    .stroke();
            } else {
                // Normal text
                this.doc.fontSize(fontSize)
                    .font(font)
                    .fillColor(this.COLORS.text)
                    .text(segment.text, this.doc.x, this.doc.y, {
                        width: width - (this.doc.x - x),
                        continued: !isLast,
                        lineBreak: false
                    });
            }
        });

        // End the text chain
        this.doc.text('');

        // Reset to original x position
        this.doc.x = x;
    }

    /**
     * Parse text into segments with formatting flags
     * Handles: **bold**, *italic*, ~~strikethrough~~, ++underline++, and mixed combinations
     */
    parseInlineMarkdown(text) {
        const segments = [];
        let currentText = '';
        let i = 0;

        while (i < text.length) {
            // Check for bold (**text**)
            if (text.substr(i, 2) === '**') {
                if (currentText) {
                    segments.push({ text: currentText, bold: false, italic: false, strikethrough: false });
                    currentText = '';
                }

                i += 2;
                let boldText = '';
                while (i < text.length && text.substr(i, 2) !== '**') {
                    boldText += text[i];
                    i++;
                }
                i += 2; // Skip closing **

                segments.push({ text: boldText, bold: true, italic: false, strikethrough: false });
            }
            // Check for strikethrough (~~text~~)
            else if (text.substr(i, 2) === '~~') {
                if (currentText) {
                    segments.push({ text: currentText, bold: false, italic: false, strikethrough: false });
                    currentText = '';
                }

                i += 2;
                let strikeText = '';
                while (i < text.length && text.substr(i, 2) !== '~~') {
                    strikeText += text[i];
                    i++;
                }
                i += 2; // Skip closing ~~

                segments.push({ text: strikeText, bold: false, italic: false, strikethrough: true });
            }
            // Check for underline/highlight (++text++)
            else if (text.substr(i, 2) === '++') {
                if (currentText) {
                    segments.push({ text: currentText, bold: false, italic: false, strikethrough: false });
                    currentText = '';
                }

                i += 2;
                let highlightText = '';
                while (i < text.length && text.substr(i, 2) !== '++') {
                    highlightText += text[i];
                    i++;
                }
                i += 2; // Skip closing ++

                // Treat ++ as bold for now (you can customize this)
                segments.push({ text: highlightText, bold: true, italic: false, strikethrough: false });
            }
            // Check for italic (*text* or _text_)
            else if (text[i] === '*' || text[i] === '_') {
                const marker = text[i];
                if (currentText) {
                    segments.push({ text: currentText, bold: false, italic: false, strikethrough: false });
                    currentText = '';
                }

                i++;
                let italicText = '';
                while (i < text.length && text[i] !== marker) {
                    italicText += text[i];
                    i++;
                }
                i++; // Skip closing marker

                segments.push({ text: italicText, bold: false, italic: true, strikethrough: false });
            }
            // Regular character
            else {
                currentText += text[i];
                i++;
            }
        }

        // Add remaining text
        if (currentText) {
            segments.push({ text: currentText, bold: false, italic: false, strikethrough: false });
        }

        return segments;
    }

    /**
     * Strip all markdown syntax from text (for clean display in headings)
     */
    stripAllMarkdown(text) {
        return text
            .replace(/\*\*(.+?)\*\*/g, '$1')  // Bold
            .replace(/\*(.+?)\*/g, '$1')       // Italic
            .replace(/_(.+?)_/g, '$1')         // Italic
            .replace(/~~(.+?)~~/g, '$1')       // Strikethrough
            .replace(/\+\+(.+?)\+\+/g, '$1')   // Underline/Highlight
            .replace(/^#{1,6}\s+/, '')         // Headings
            .replace(/^[-*+]\s+/, '')          // List items
            .replace(/^\d+\.\s+/, '');         // Numbered lists
    }
}

module.exports = PDFMarkdownRenderer;