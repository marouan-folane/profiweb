/**
 * EditorJS to PDF Converter
 * Converts EditorJS JSON format to professional PDF layout
 */
class EditorJSToPDF {
    constructor(doc, colors, pageMargin) {
        this.doc = doc;
        this.COLORS = colors;
        this.PAGE_MARGIN = pageMargin;
    }

    /**
     * Check if content is in EditorJS format
     */
    isEditorJSFormat(content) {
        if (!content) return false;
        
        // If it's a string, try to parse it
        if (typeof content === 'string') {
            try {
                content = JSON.parse(content);
            } catch (e) {
                return false;
            }
        }
        
        // Check if it has EditorJS structure
        return content && 
               typeof content === 'object' && 
               content.blocks && 
               Array.isArray(content.blocks);
    }

    /**
     * Main rendering function
     */
    renderToPDF(editorJSData, startY, contentWidth, maxY) {
        // Parse if string
        let data = editorJSData;
        if (typeof editorJSData === 'string') {
            try {
                data = JSON.parse(editorJSData);
            } catch (e) {
                console.error('Failed to parse EditorJS data:', e);
                return;
            }
        }

        if (!data.blocks || !Array.isArray(data.blocks)) {
            console.error('Invalid EditorJS format: no blocks array');
            return;
        }

        this.doc.y = startY;

        // Render each block
        data.blocks.forEach((block, index) => {
            this.checkPageBreak(maxY, 80);
            this.renderBlock(block, contentWidth, maxY);
        });
    }

    /**
     * Render individual block based on type
     */
    renderBlock(block, contentWidth, maxY) {
        switch (block.type) {
            case 'header':
                this.renderHeader(block, contentWidth);
                break;
            case 'paragraph':
                this.renderParagraph(block, contentWidth);
                break;
            case 'list':
                this.renderList(block, contentWidth);
                break;
            case 'delimiter':
                this.renderDelimiter(contentWidth);
                break;
            case 'quote':
                this.renderQuote(block, contentWidth);
                break;
            case 'code':
                this.renderCode(block, contentWidth);
                break;
            default:
                console.warn(`Unknown block type: ${block.type}`);
                this.renderParagraph(block, contentWidth);
        }
    }

    /**
     * Render header block
     */
    renderHeader(block, contentWidth) {
        const level = block.data.level || 1;
        const text = this.stripHTML(block.data.text || '');

        this.doc.moveDown(level === 1 ? 1.5 : 1);

        // Different styles for different header levels
        if (level === 1) {
            // H1 - Large, bold, with background
            const headerY = this.doc.y;
            const headerHeight = 45;

            this.doc.roundedRect(this.PAGE_MARGIN.left, headerY, contentWidth, headerHeight, 6)
                .fillColor(this.COLORS.primary)
                .fill();

            this.doc.fontSize(16)
                .font('Helvetica-Bold')
                .fillColor('#ffffff')
                .text(text,
                    this.PAGE_MARGIN.left + 20,
                    headerY + 14,
                    {
                        width: contentWidth - 40,
                        align: 'left'
                    });

            this.doc.y = headerY + headerHeight;
        } else if (level === 2) {
            // H2 - Medium, bold, with subtle background
            const headerY = this.doc.y;
            const headerHeight = 35;

            this.doc.roundedRect(this.PAGE_MARGIN.left, headerY, contentWidth, headerHeight, 5)
                .fillColor(this.COLORS.background)
                .fill();

            this.doc.rect(this.PAGE_MARGIN.left, headerY, 5, headerHeight)
                .fillColor(this.COLORS.accent)
                .fill();

            this.doc.fontSize(14)
                .font('Helvetica-Bold')
                .fillColor(this.COLORS.secondary)
                .text(text,
                    this.PAGE_MARGIN.left + 20,
                    headerY + 10,
                    {
                        width: contentWidth - 25
                    });

            this.doc.y = headerY + headerHeight;
        } else {
            // H3+ - Simple bold text
            this.doc.fontSize(12)
                .font('Helvetica-Bold')
                .fillColor(this.COLORS.text)
                .text(text, this.PAGE_MARGIN.left + 15, this.doc.y, {
                    width: contentWidth - 15
                });
        }

        this.doc.moveDown(0.8);
    }

    /**
     * Render paragraph block
     */
    renderParagraph(block, contentWidth) {
        const text = this.stripHTML(block.data.text || '');
        
        if (!text.trim()) {
            this.doc.moveDown(0.4);
            return;
        }

        this.doc.fontSize(10)
            .font('Helvetica')
            .fillColor(this.COLORS.text)
            .text(text, this.PAGE_MARGIN.left + 15, this.doc.y, {
                width: contentWidth - 15,
                align: 'left',
                lineGap: 4
            });

        this.doc.moveDown(0.5);
    }

    /**
     * Render list block
     */
    renderList(block, contentWidth) {
        const items = block.data.items || [];
        const isOrdered = block.data.style === 'ordered';

        items.forEach((item, index) => {
            const itemText = this.stripHTML(item);
            const bulletY = this.doc.y;

            if (isOrdered) {
                // Numbered list
                this.doc.fontSize(10)
                    .font('Helvetica-Bold')
                    .fillColor(this.COLORS.accent)
                    .text(`${index + 1}.`, this.PAGE_MARGIN.left + 15, bulletY, {
                        width: 20,
                        continued: true
                    })
                    .font('Helvetica')
                    .fillColor(this.COLORS.text)
                    .text(` ${itemText}`, {
                        width: contentWidth - 50,
                        lineGap: 3
                    });
            } else {
                // Bullet list
                this.doc.circle(this.PAGE_MARGIN.left + 20, bulletY + 6, 2.5)
                    .fillColor(this.COLORS.accent)
                    .fill();

                this.doc.fontSize(10)
                    .font('Helvetica')
                    .fillColor(this.COLORS.text)
                    .text(itemText,
                        this.PAGE_MARGIN.left + 30,
                        bulletY,
                        {
                            width: contentWidth - 35,
                            lineGap: 3
                        });
            }

            this.doc.moveDown(0.4);
        });

        this.doc.moveDown(0.3);
    }

    /**
     * Render delimiter block
     */
    renderDelimiter(contentWidth) {
        this.doc.moveDown(1);

        const dividerY = this.doc.y;
        this.doc.moveTo(this.PAGE_MARGIN.left + 50, dividerY)
            .lineTo(this.PAGE_MARGIN.left + contentWidth - 50, dividerY)
            .lineWidth(1)
            .strokeColor(this.COLORS.border)
            .opacity(0.5)
            .stroke()
            .opacity(1);

        this.doc.moveDown(1);
    }

    /**
     * Render quote block
     */
    renderQuote(block, contentWidth) {
        const text = this.stripHTML(block.data.text || '');
        const caption = this.stripHTML(block.data.caption || '');

        this.doc.moveDown(0.8);

        const quoteY = this.doc.y;
        const quoteHeight = this.doc.heightOfString(text, {
            width: contentWidth - 60,
            lineGap: 4
        }) + 30;

        // Quote background
        this.doc.roundedRect(this.PAGE_MARGIN.left + 20, quoteY, contentWidth - 40, quoteHeight, 4)
            .fillColor(this.COLORS.background)
            .fill();

        // Left accent bar
        this.doc.rect(this.PAGE_MARGIN.left + 20, quoteY, 4, quoteHeight)
            .fillColor(this.COLORS.accent)
            .fill();

        // Quote text
        this.doc.fontSize(10)
            .font('Helvetica-Oblique')
            .fillColor(this.COLORS.text)
            .text(text,
                this.PAGE_MARGIN.left + 35,
                quoteY + 10,
                {
                    width: contentWidth - 60,
                    lineGap: 4
                });

        if (caption) {
            this.doc.fontSize(9)
                .font('Helvetica')
                .fillColor(this.COLORS.textLight)
                .text(`— ${caption}`,
                    this.PAGE_MARGIN.left + 35,
                    this.doc.y + 5,
                    {
                        width: contentWidth - 60
                    });
        }

        this.doc.y = quoteY + quoteHeight;
        this.doc.moveDown(0.8);
    }

    /**
     * Render code block
     */
    renderCode(block, contentWidth) {
        const code = block.data.code || '';

        this.doc.moveDown(0.5);

        const codeY = this.doc.y;
        const codeHeight = this.doc.heightOfString(code, {
            width: contentWidth - 40,
            lineGap: 2
        }) + 20;

        // Code background
        this.doc.roundedRect(this.PAGE_MARGIN.left, codeY, contentWidth, codeHeight, 4)
            .fillColor('#f5f5f5')
            .fill()
            .strokeColor('#ddd')
            .lineWidth(1)
            .stroke();

        // Code text
        this.doc.fontSize(9)
            .font('Courier')
            .fillColor('#333')
            .text(code,
                this.PAGE_MARGIN.left + 15,
                codeY + 10,
                {
                    width: contentWidth - 30,
                    lineGap: 2
                });

        this.doc.y = codeY + codeHeight;
        this.doc.moveDown(0.5);
    }

    /**
     * Strip HTML tags from text
     */
    stripHTML(html) {
        if (!html) return '';
        
        return html
            .replace(/<b>/g, '')
            .replace(/<\/b>/g, '')
            .replace(/<strong>/g, '')
            .replace(/<\/strong>/g, '')
            .replace(/<i>/g, '')
            .replace(/<\/i>/g, '')
            .replace(/<em>/g, '')
            .replace(/<\/em>/g, '')
            .replace(/<u>/g, '')
            .replace(/<\/u>/g, '')
            .replace(/<br\s*\/?>/g, '\n')
            .replace(/<[^>]+>/g, '') // Remove any other HTML tags
            .trim();
    }

    /**
     * Check if page break is needed
     */
    checkPageBreak(maxY, neededHeight = 80) {
        if (this.doc.y > maxY - neededHeight) {
            this.doc.addPage();
            this.doc.x = this.PAGE_MARGIN.left;
            this.doc.y = this.PAGE_MARGIN.top + 20;
            return true;
        }
        return false;
    }
}

module.exports = EditorJSToPDF;