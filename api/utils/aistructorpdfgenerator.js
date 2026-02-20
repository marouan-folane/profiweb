const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const AIInteraction = require('../models/AIInteraction');
const PDFMarkdownRenderer = require('./PDFMarkdownRenderer');

class AiStructorPdfGenerator {
    constructor() {
        this.uploadsDir = path.join(__dirname, '../uploads/pdfs');
        if (!fs.existsSync(this.uploadsDir)) {
            fs.mkdirSync(this.uploadsDir, { recursive: true });
        }

        // Professional page layout constants
        this.PAGE_MARGIN = {
            top: 60,
            bottom: 60,
            left: 60,
            right: 60
        };
        this.CONTENT_PADDING = 20;
        this.HEADER_HEIGHT = 100;

        // Professional color scheme
        this.COLORS = {
            primary: '#1a365d',      // Deep blue
            secondary: '#2c5282',    // Medium blue
            accent: '#4299e1',       // Light blue
            text: '#2d3748',         // Dark gray
            textLight: '#4a5568',    // Medium gray
            background: '#f7fafc',   // Very light gray
            border: '#e2e8f0',       // Light border
            success: '#2f855a',      // Green for answers
            headerBg: '#1a202c'      // Almost black for header
        };

        // AI Global Instructions
        // Replace the existing AI_GLOBAL_INSTRUCTIONS with this corrected version
        this.AI_GLOBAL_INSTRUCTIONS = `
AI WORK INSTRUCTIONS – WORKING METHODS, LANGUAGE LOGIC, PAGE FLOW

1. Principle
The AI receives a PDF file that:
- Contains all customer information
- Contains the chosen communication language of the case worker
- Contains the output languages for the texts (one, two, or three languages)
- Contains all template codes (T1–Txx) for all pages

The AI always processes data page by page, not across multiple pages.

2. Communication language (case worker)
The AI communicates exclusively in the language specified in the questionnaire as the language for internal communication.

This language is used for:
- Questions
- Notes
- Confirmations ("Yes / No")
- Status messages

3. Output Languages (Website Texts)

3.1 Basic Rule
- The texts will only be output in the languages defined as output languages in the questionnaire
- It can be one, two, or three languages.

3.2 Order when using multiple languages (mandatory)
If multiple languages are selected:
- The order is fixed and is defined once (e.g.:
  1. English
  2. German
  3. French)

This order applies:
- For all texts
- For all pages
- Without deviation

3.3 Output format for multiple languages (mandatory)
The AI outputs field by field, not page by page per language.

Example (3 languages):
T1 (EN):
Text English

T1 (DE):
German Text

T1 (FR):
French Text

T2 (EN):
…

T2 (DE):
…

T2 (FR):
…

Not allowed: First the entire page in English, then the entire page in German, then French

4. Translation rule (content identity)

4.1 Mandatory Rule
- All language versions of a text field must be identical in content
- There must be no meaningful alternatives, changes in proverbs, or shifts in meaning.

Forbidden:
- Different statements per language
- Different metaphors or idioms
- Different Focus Areas

4.2 Special Case: Meaningless or Non-existent Translation
When a literal translation makes no sense or does not exist culturally:
- The AI creates the best possible meaningful translation.
- In addition, it sends a note to the case worker:

NOTE:
The translation of Txx has been adapted to language [XY] as appropriate,
since a direct equivalent does not meaningfully exist
Please review and approve, or provide an alternative.

The AI does not make decisions itself, but only points things out.

5. Page Order (mandatory)
- The AI always starts with the home page.
- The home page will be:
  - Complete
  - In all output languages
  - For all T-fields on this page
created.

The next page may only be edited once the home page is complete.

6. Completion & Approval per page
After a page is completed, the AI only issues the following query (in communication language):

The page [page name] is fully created.
Is everything ok?

Please reply with:
- "YES" → edit next page
- "NO" → report changes

Rules:
- If YES: start next page
- If NO: only correct the points mentioned

7. Text lengths & layout stability
- If no text lengths are specified in the questionnaire:
  - AI decides the ideal text length
  - Please always choose the most ideal method to meet the customer's goal.
- The goal is layout stability, in particular:
  - Texts of equal length when elements are adjacent
  - No "sagging" of individual cards or columns
- Better:
  - shorter and more precise than:
  - long and layout-ruining

8. Absolute Rules
The AI:
- Only fills in the specified T-fields
- Does not change any codes
- Does not skip fields
- Does not add additional text

The AI is working:
- Page by page
- Structured
- Reproducible

--------------------------------------------------

AI WORK INSTRUCTIONS – IMAGES, KEYWORDS & APPROVAL PROCESS

9. Image generation – principle
The AI does not create images itself. It exclusively provides structured image suggestions for use in external image databases (e.g., stock photo platforms or internal media pools).

10. Image output per page (mandatory)
In addition to text creation, the following applies to each page:
- After the text fields on a page are completed, the AI outputs a separate section:
  "IMAGE SUGGESTIONS – PAGE [Page Name]"
- The image suggestions appear only after the text has been output, but before the approval question.

11. Structure of the image proposals (binding)
The AI outputs images in a numbered and structured manner:

Example:
Template: STACK2_HOME_V1
Page: HOME
Image 1 (Hero Area):
• Keywords:
freight aircraft loading, air cargo logistics, cargo plane warehouse, global logistics hub, professional transport industry
• Description:
Large cargo plane being loaded in a modern logistics hall. Professional, international atmosphere, neutral business style
Image 2 (Service Area):
• Keywords:
Web design team working, digital agency office, modern workspace laptop, creative professionals collaboration
• Description:
Team in a professional agency environment, working on websites and digital projects, factual and modern.

12. Keyword Quality
- Keywords must:
  - Be internationally understandable
  - Be formulated in English
  - Be suitable for common image databases
- Goal:
  - Maximum hit quality
  - Clear visual language
  - No abstract terms without visual reference

13. Image approval per page (mandatory)
After displaying the image suggestions, the AI asks only the following question:

The page [page name] including text and image suggestions is fully created.
Is everything ok?

Please reply with:
- "YES" → Edit next page
- "NO" → Report changes to text and/or images
- "NEW IMAGES" → Request alternative image suggestions

14. Page logic remains mandatory
- Without an explicit "YES":
  - No next page
  - No further image output
- Each page is:
  - Self-contained
  - Reproducible
  - Subject to approval

--------------------------------------------------

AI WORK INSTRUCTIONS – INPUT, INTERPRETATION, HINT LOGIC

0. Purpose
This guide defines how the AI works with customer data, how it interprets and creatively formulates it, and how it handles missing or contradictory information. It makes no statements about page layout, page structure, or text lengths.

1. Inputs
The AI processes only:
- Customer data from the questionnaire
- Information in any format:
  - Bullet points
  - Running text
  - Short or long answers
  - Unordered content

Rule:
The AI uses only the information provided. No external data sources are used.

2. Preliminary review – mandatory before any text creation
Before the text is generated, the AI checks:

2.1 Missing Information
If relevant information is missing, the following must be displayed at the beginning:
NOTICE – INFORMATION MISSING
- Missing information: …

2.2 Conflicting Information
If information is contradictory, the following must be displayed at the beginning:
NOTICE – DISCREET
- Contradictory information: …

Important:
Even in case of missing or contradictory data:
- The AI starts anyway
- It only works with consistent information.
- It doesn't invent new facts.

3. Interpretation – expressly permitted (clearly limited)

3.1 Basic Rule
The AI may interpret if the interpretation:
- Is directly based on a customer statement
- Is logically comprehensible
- No new fact is asserted

Internal logic:
Customer statement → Factual derivation → Careful wording

3.2 Examples of permissible interpretation
- Long-term employment → "many years of experience"
- Previous professional contact with an industry → "early interest / early reference"
- Location + Industry → Description of typical fields of application, without claiming references

3.3 Inadmissible
The AI must not:
- Invent new resumes, references, or achievements
- Exaggerate or distort facts
- Formulating statements that could be interpreted as untrue

4. Creativity – allowed, but data-driven
Creativity is expressly desired, but only:
- In language
- In style
- In the combination of existing information
- In storytelling based on real information

Not allowed:
- Marketing promises
- Superlatives ("leading", "the best", "No. 1")
- Guarantees
- Strategic goal definitions not mentioned by the client

5. Tone & Text Format

5.1 Tone
- Tone is requested from the customer
- If no tone is specified:
  - The AI selects the next best standard tone.
    • professional
    • factual
    • neutral
  - And mandatorily issues the following notice:

Texts must not contain any AI-like elements.
NOTE – TONALITY NOT DEFINED
- No specific tone was indicated. The standard tone was used.

5.2 Text format (bullet points / body text)
- If the text format is not specified:
  - The AI chooses a factually appropriate standard format.
  - And mandatorily issues the following notice:

NOTE – TEXT FORMAT NOT SET
- No text format was specified. The default format was used.

6. What AI is NOT allowed to do (absolutely)
AI must never:
- Lie or invent content
- Make legal assessments
- Formulate prices, guarantees or liability statements without this being explicitly stated in the information sheet
- Conduct competitive analyses
- Make strategic decisions

7. Fallback tone
If no control information is available:
- Professional
- Factual
- Clear
- B2B-suitable
- No colloquial language
- No emotionalization

--------------------------------------------------

AI WORK INSTRUCTIONS – HANDLING BAD INPUTS & CONTRADICTIONS

0. Purpose
This instruction regulates how the AI deals with poor texts and content contradictions, and when the case worker must be involved.

1. Poor texts (quality problem)

1.1 Definition of "bad text"
A text is considered bad if at least one of the following applies:
- The content is very thin or empty
- Linguistically incomprehensible or chaotic
- Just empty phrases without any real meaning
- Highly emotional, but without facts
- Technically or professionally unusable

1.2 AI behavior with poor texts
Obligatory behavior:
- The AI does NOT creatively edit the text to "save" it
- The AI only uses clearly usable facts
- The AI flags the case for the case worker.

Mandatory output:
NOTE – QUALITY OF CUSTOMER INPUT
The texts provided are inadequate in terms of content or language. Review and revision by the case worker is recommended.
The AI still generates a text, but only minimally, neutrally and fact-based, without any enhancement.

2. Contradictory information (content conflict)

2.1 Definition of "Contradiction"
A contradiction exists when:
- Statements are logically mutually exclusive
- The goals cannot be achieved simultaneously.
- Positioning unclear or contradictory

2.2 AI behavior in case of contradictions
Obligatory behavior:
1. Clearly state the objection
2. Inform the case worker
3. Make one or more proposed solutions

2.3 Mandatory output in case of contradictions
NOTE – CONTRADICTORY INFORMATION
Contradictory content was detected: – [Briefly state the contradiction]
Clarification by the case worker is recommended.

3. AI-proposed solutions for contradictions (new, binding)
The AI may and should suggest solutions, but only under the following rules:

3.1 Data Basis
- Proposed solutions must be based on:
  - Official
  - Professional
  - Preferably official or statistical data sources
Examples:
- National statistical institutes
- Official industry figures
- Publicly available market or structural data
- Neutral, recognized sources

3.2 Type of proposed solutions
The AI:
- Does not decide
- Does not resolve the contradiction itself
- Proposes objectively justified options

Form:
- Option A: …
- Option B: …
- Each with a brief, factual explanation of why this option is plausible

3.3 Presentation in the text
- The actual website text will be:
  - Kept neutral
  - Reduced to the common denominator
- Proposed solutions only appear in the notes section for the case worker, not in the customer text.

4. Demarcation (important)
The AI may:
- Inform
- Structure
- Suggest options

The AI must not:
- Make decisions
- Define strategic directions
- "Correct" customer information
- Resolve contradictions independently

5. Summary for AI (short logic)
- Poor text → Inform case worker, minimal output
- Contradiction → Inform case worker + proposed solutions
- Proposed solutions → Data-driven, official, neutral
- Decision → Always Human
`;


    }

    /**
     * Generate a professional project information PDF
     */
    async generateAiInstructions(project, questions, templateStructure) {
        return new Promise(async (resolve, reject) => {

            console.log(`
                templateStructure: ${templateStructure}
            `);

            try {
                const filename = `instructeur-${project._id}.pdf`;
                const filePath = path.join(this.uploadsDir, filename);

                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 0,
                    bufferPages: true // Enable page numbering
                });

                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                // ===== PAGE 1: PROJECT INFORMATION =====
                await this.addProfessionalHeader(doc, 'PROJECT INFORMATION');
                this.addProjectInformation(doc, project);

                // ===== PAGE 2+: QUESTIONS & ANSWERS =====
                doc.addPage();
                await this.addProfessionalHeader(doc, 'PROJECT QUESTIONS');
                this.addQuestionsSection(doc, questions);

                // ===== NEXT PAGES: AI GLOBAL INSTRUCTIONS =====
                doc.addPage();
                await this.addProfessionalHeader(doc, 'AI GLOBAL INSTRUCTIONS');

                // Fetch dynamic instructions from database, fallback to hardcoded if not found
                let dynamicInstructions = this.AI_GLOBAL_INSTRUCTIONS;
                try {
                    const globalDocs = await AIInteraction.findOne({ type: 'global' });

                    if (globalDocs && globalDocs.instructions) {
                        dynamicInstructions = globalDocs.instructions;
                        console.log("✅ Using dynamic AI instructions from database");
                    } else {
                        console.log("⚠️ Global instructions not found in database, using fallback");
                    }
                } catch (err) {
                    console.error("❌ Error fetching global instructions for PDF:", err);
                }

                this.addAiGlobalInstructions(doc, dynamicInstructions);

                // ===== LAST PAGES: TEMPLATE STRUCTIONS (ADDED AT THE BOTTOM) =====
                const hasTemplateStructure = templateStructure && (
                    typeof templateStructure === 'string'
                        ? templateStructure.trim() !== ''
                        : Object.keys(templateStructure).length > 0
                );

                if (hasTemplateStructure) {
                    doc.addPage();
                    await this.addProfessionalHeader(doc, 'TEMPLATE INSTRUCTIONS');
                    await this.addTemplateStructure(doc, templateStructure);

                    // Add a note that this is template-specific
                    doc.moveDown(1.5);
                    const pageWidth = 595.28;
                    const contentWidth = pageWidth - this.PAGE_MARGIN.left - this.PAGE_MARGIN.right;

                    doc.fontSize(10)
                        .font('Helvetica-Oblique')
                        .fillColor(this.COLORS.textLight)
                        .text('These template instructions are specific to the selected website template and must be followed for layout and content placement.',
                            this.PAGE_MARGIN.left,
                            doc.y,
                            {
                                width: contentWidth,
                                align: 'center'
                            });
                } else {
                    // If no template structure, add a placeholder page
                    doc.addPage();
                    await this.addProfessionalHeader(doc, 'TEMPLATE INSTRUCTIONS');

                    const pageWidth = 595.28;
                    const contentWidth = pageWidth - this.PAGE_MARGIN.left - this.PAGE_MARGIN.right;

                    doc.fontSize(12)
                        .font('Helvetica')
                        .fillColor(this.COLORS.textLight)
                        .text('No template structure available. Either no template was selected or the template structure is empty.',
                            this.PAGE_MARGIN.left,
                            doc.y,
                            {
                                width: contentWidth,
                                align: 'center',
                                lineGap: 10
                            });
                }

                // Add page numbers to all pages (AFTER all content is added)
                const pageCount = doc.bufferedPageRange().count;
                for (let i = 0; i < pageCount; i++) {
                    doc.switchToPage(i);
                    this.addPageNumber(doc, i + 1, pageCount);
                }

                doc.end();

                stream.on('finish', () => {
                    resolve({
                        filename,
                        filePath,
                        url: `/uploads/pdfs/${filename}`,
                        documentId: `doc_${Date.now()}`,
                        pages: pageCount,
                        message: 'Professional PDF created successfully!',
                        includesTemplateInstructions: !!templateStructure
                    });
                });

                stream.on('error', (error) => {
                    console.error("❌ Stream error:", error);
                    reject(error);
                });

            } catch (error) {
                console.error('❌ Error generating PDF:', error);
                reject(error);
            }
        });
    }

    /**
     * Add Template Structure content (LAST PAGES)
     * Header only appears on first page, not on continuation pages
     */
    async addTemplateStructure(doc, templateStructure) {
        if (!templateStructure) {
            doc.fontSize(12)
                .fillColor(this.COLORS.textLight)
                .text('No template structure available.', {
                    align: 'center'
                });
            return;
        }

        const pageWidth = 595.28;
        const pageHeight = 841.89;
        const contentWidth = pageWidth - this.PAGE_MARGIN.left - this.PAGE_MARGIN.right;
        const maxY = pageHeight - this.PAGE_MARGIN.bottom - 40;

        // Convert template structure to string if it's an object
        const templateText = typeof templateStructure === 'string'
            ? templateStructure
            : JSON.stringify(templateStructure, null, 2);

        const lines = templateText.split('\n');

        for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
            const line = lines[lineIndex];

            // Check if we need a new page
            if (doc.y > maxY) {
                doc.addPage();
                // Don't add header on continuation pages - just reset position
                doc.x = this.PAGE_MARGIN.left;
                doc.y = this.PAGE_MARGIN.top + 20;
            }

            const trimmedLine = line.trim();

            // Skip completely empty lines but add spacing
            if (!trimmedLine) {
                doc.moveDown(0.2);
                continue;
            }

            // Detect different line types and format accordingly

            // Page/Template headers (e.g., "TEMPLATE 1 (Page 1: HOME)")
            if (trimmedLine.startsWith('TEMPLATE') && trimmedLine.includes('Page')) {
                doc.moveDown(1);
                const headerY = doc.y;
                const headerHeight = 35;

                // Background
                doc.roundedRect(this.PAGE_MARGIN.left, headerY, contentWidth, headerHeight, 5)
                    .fillColor(this.COLORS.primary)
                    .fill();

                // Text
                doc.fontSize(14)
                    .font('Helvetica-Bold')
                    .fillColor('#ffffff')
                    .text(trimmedLine,
                        this.PAGE_MARGIN.left + 15,
                        headerY + 10,
                        {
                            width: contentWidth - 30,
                            align: 'left'
                        });

                doc.y = headerY + headerHeight;
                doc.moveDown(0.8);
            }
            // Main property keys (e.g., "template:", "fill_policy:", "sections:")
            else if (/^[a-z_]+:$/i.test(trimmedLine) && !trimmedLine.includes(' ')) {
                doc.moveDown(0.5);
                doc.fontSize(11)
                    .font('Helvetica-Bold')
                    .fillColor(this.COLORS.secondary)
                    .text(trimmedLine, this.PAGE_MARGIN.left + 5, doc.y, {
                        width: contentWidth - 10
                    });
                doc.moveDown(0.3);
            }
            // List items with dash
            else if (trimmedLine.startsWith('-')) {
                const bulletY = doc.y;
                const indent = (line.length - line.trimLeft().length) / 2;

                // Bullet point
                doc.circle(this.PAGE_MARGIN.left + 15 + indent, bulletY + 5, 2)
                    .fillColor(this.COLORS.accent)
                    .fill();

                // Text
                doc.fontSize(9)
                    .font('Helvetica')
                    .fillColor(this.COLORS.text)
                    .text(trimmedLine.substring(1).trim(),
                        this.PAGE_MARGIN.left + 25 + indent,
                        bulletY,
                        {
                            width: contentWidth - 30 - indent,
                            lineGap: 1
                        });
                doc.moveDown(0.2);
            }
            // Property with value (e.g., "id: 'T1'", "role: 'Hero Headline'")
            else if (trimmedLine.includes(':') && !trimmedLine.endsWith(':')) {
                const indent = (line.length - line.trimLeft().length) / 2;
                const [key, ...valueParts] = trimmedLine.split(':');
                const value = valueParts.join(':').trim();

                doc.fontSize(9)
                    .font('Helvetica-Bold')
                    .fillColor(this.COLORS.text)
                    .text(`${key}:`,
                        this.PAGE_MARGIN.left + 10 + indent,
                        doc.y,
                        {
                            continued: true,
                            width: contentWidth - 15 - indent
                        })
                    .font('Helvetica')
                    .fillColor(this.COLORS.textLight)
                    .text(` ${value}`);

                doc.moveDown(0.15);
            }
            // Regular text or description
            else {
                const indent = (line.length - line.trimLeft().length) / 2;
                doc.fontSize(9)
                    .font('Helvetica')
                    .fillColor(this.COLORS.text)
                    .text(trimmedLine,
                        this.PAGE_MARGIN.left + 10 + indent,
                        doc.y,
                        {
                            width: contentWidth - 15 - indent,
                            lineGap: 1
                        });
                doc.moveDown(0.15);
            }
        }

        // Footer note
        doc.moveDown(2);
        doc.fontSize(9)
            .font('Helvetica-Oblique')
            .fillColor(this.COLORS.textLight)
            .text('This template structure defines the layout and content fields for the website.',
                this.PAGE_MARGIN.left,
                doc.y,
                {
                    width: contentWidth,
                    align: 'center'
                });
    }

    /**
     * Add AI Global Instructions content (MIDDLE PAGES)
     */
    addAiGlobalInstructions(doc, instructions) {
        const pageWidth = 595.28;
        const pageHeight = 841.89;
        const contentWidth = pageWidth - this.PAGE_MARGIN.left - this.PAGE_MARGIN.right;
        const maxY = pageHeight - this.PAGE_MARGIN.bottom - 40; // Leave space for page numbers

        // Use provided instructions or fallback to hardcoded ones
        const activeInstructions = instructions || this.AI_GLOBAL_INSTRUCTIONS;

        // Split the instructions into sections
        const sections = activeInstructions.trim().split('--------------------------------------------------');

        sections.forEach((section, sectionIndex) => {
            if (!section.trim()) return;

            // Check if we need a new page before starting a new section
            if (doc.y > maxY - 100) {
                doc.addPage();
                doc.x = this.PAGE_MARGIN.left;
                doc.y = this.PAGE_MARGIN.top + 20;
            }

            const lines = section.trim().split('\n');

            lines.forEach((line, lineIndex) => {
                // Check if we need a new page
                if (doc.y > maxY) {
                    doc.addPage();
                    doc.x = this.PAGE_MARGIN.left;
                    doc.y = this.PAGE_MARGIN.top + 20;
                }

                const trimmedLine = line.trim();

                // Skip empty lines but add small spacing
                if (!trimmedLine) {
                    doc.moveDown(0.3);
                    return;
                }

                // Main section title (starts with "AI WORK INSTRUCTIONS")
                if (trimmedLine.startsWith('AI WORK INSTRUCTIONS')) {
                    doc.moveDown(0.5);
                    doc.fontSize(16)
                        .font('Helvetica-Bold')
                        .fillColor(this.COLORS.primary)
                        .text(trimmedLine, this.PAGE_MARGIN.left, doc.y, {
                            width: contentWidth,
                            align: 'left'
                        });
                    doc.moveDown(1);
                }
                // Major numbered sections (e.g., "1. Principle", "2. Communication language")
                else if (/^\d+\.\s+[A-Z]/.test(trimmedLine)) {
                    doc.moveDown(0.8);

                    // Add subtle background for section headers
                    const headerY = doc.y;
                    const headerHeight = 30;

                    doc.roundedRect(this.PAGE_MARGIN.left, headerY, contentWidth, headerHeight, 4)
                        .fillColor(this.COLORS.background)
                        .fill();

                    // Left accent bar
                    doc.rect(this.PAGE_MARGIN.left, headerY, 4, headerHeight)
                        .fillColor(this.COLORS.accent)
                        .fill();

                    doc.fontSize(13)
                        .font('Helvetica-Bold')
                        .fillColor(this.COLORS.secondary)
                        .text(trimmedLine,
                            this.PAGE_MARGIN.left + 15,
                            headerY + 8,
                            {
                                width: contentWidth - 20,
                                align: 'left'
                            });

                    doc.y = headerY + headerHeight;
                    doc.moveDown(0.5);
                }
                // Sub-sections (e.g., "3.1 Basic rule", "4.2 Special case")
                else if (/^\d+\.\d+\s+/.test(trimmedLine)) {
                    doc.moveDown(0.6);
                    doc.fontSize(11)
                        .font('Helvetica-Bold')
                        .fillColor(this.COLORS.text)
                        .text(trimmedLine, this.PAGE_MARGIN.left + 10, doc.y, {
                            width: contentWidth - 10,
                            align: 'left',
                            indent: 0
                        });
                    doc.moveDown(0.4);
                }
                // Bullet points or list items
                else if (trimmedLine.startsWith('-')) {
                    const bulletY = doc.y;

                    // Bullet point
                    doc.circle(this.PAGE_MARGIN.left + 15, bulletY + 6, 2.5)
                        .fillColor(this.COLORS.accent)
                        .fill();

                    // Text
                    doc.fontSize(10)
                        .font('Helvetica')
                        .fillColor(this.COLORS.text)
                        .text(trimmedLine.substring(1).trim(),
                            this.PAGE_MARGIN.left + 25,
                            bulletY,
                            {
                                width: contentWidth - 30,
                                lineGap: 2
                            });
                    doc.moveDown(0.3);
                }
                // Special sections (e.g., "Rule:", "Logic:", "Example", "Not allowed:", "Forbidden:")
                else if (trimmedLine.endsWith(':')) {
                    doc.moveDown(0.4);
                    doc.fontSize(10)
                        .font('Helvetica-Bold')
                        .fillColor(this.COLORS.secondary)
                        .text(trimmedLine, this.PAGE_MARGIN.left + 10, doc.y, {
                            width: contentWidth - 10,
                            align: 'left'
                        });
                    doc.moveDown(0.3);
                }
                // Regular paragraph text
                else {
                    doc.fontSize(10)
                        .font('Helvetica')
                        .fillColor(this.COLORS.text)
                        .text(trimmedLine, this.PAGE_MARGIN.left + 10, doc.y, {
                            width: contentWidth - 10,
                            align: 'left',
                            lineGap: 3
                        });
                    doc.moveDown(0.2);
                }
            });

            // Add extra space between major sections
            if (sectionIndex < sections.length - 1) {
                doc.moveDown(1.5);
            }
        });

        // Footer note at bottom of last AI instructions page
        doc.moveDown(2);
        doc.fontSize(9)
            .font('Helvetica-Oblique')
            .fillColor(this.COLORS.textLight)
            .text('These AI instructions are binding and must be followed for all content generation tasks.',
                this.PAGE_MARGIN.left,
                doc.y,
                {
                    width: contentWidth,
                    align: 'center'
                });
    }

    /**
     * Add professional project information section (PAGE 1)
     */
    addProjectInformation(doc, project) {
        if (!project) {
            doc.fontSize(14)
                .fillColor(this.COLORS.text)
                .text('No project information available.');
            return;
        }

        const pageWidth = 595.28;
        const contentWidth = pageWidth - this.PAGE_MARGIN.left - this.PAGE_MARGIN.right;

        // ===== PROJECT TITLE =====
        doc.fontSize(28)
            .font('Helvetica-Bold')
            .fillColor(this.COLORS.primary)
            .text(project.title || 'Untitled Project', {
                align: 'left',
                width: contentWidth
            });

        doc.moveDown(0.3);

        // Subtle underline
        doc.moveTo(this.PAGE_MARGIN.left, doc.y)
            .lineTo(this.PAGE_MARGIN.left + 80, doc.y)
            .lineWidth(3)
            .strokeColor(this.COLORS.accent)
            .stroke();

        doc.moveDown(2);

        // ===== DESCRIPTION SECTION =====
        if (project.description) {
            this.addSectionHeader(doc, 'Project Description', contentWidth);
            doc.moveDown(0.8);

            // Description in elegant box
            const descBoxY = doc.y;
            const descHeight = Math.min(
                doc.heightOfString(project.description, {
                    width: contentWidth - 40,
                    align: 'justify'
                }) + 30,
                250
            );

            doc.roundedRect(this.PAGE_MARGIN.left, descBoxY, contentWidth, descHeight, 6)
                .fillColor('#ffffff')
                .fill()
                .strokeColor(this.COLORS.border)
                .lineWidth(1)
                .stroke();

            // Left accent border
            doc.rect(this.PAGE_MARGIN.left, descBoxY, 4, descHeight)
                .fillColor(this.COLORS.accent)
                .fill();

            doc.fontSize(11)
                .font('Helvetica')
                .fillColor(this.COLORS.text)
                .text(project.description,
                    this.PAGE_MARGIN.left + 24,
                    descBoxY + 15,
                    {
                        width: contentWidth - 48,
                        align: 'justify',
                        lineGap: 4
                    });

            doc.y = descBoxY + descHeight + 20;
        }

        doc.moveDown(1.5);

        // ===== PROJECT DETAILS IN VERTICAL LIST =====
        this.addSectionHeader(doc, 'Project Details', contentWidth);
        doc.moveDown(1);

        const projectDetails = [
            { label: 'Client', value: project.client?.name || 'Not specified' },
            { label: 'Category', value: project.category || 'Not specified' },
            { label: 'Priority', value: project.priority || 'Not specified' },
            { label: 'Start Date', value: project.startDate ? new Date(project.startDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified' },
            { label: 'End Date', value: project.endDate ? new Date(project.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not specified' },
            { label: 'Budget', value: `${project.budget || 0} ${project.currency || 'MAD'}` },
        ];

        // Vertical list layout (like ul > li)
        projectDetails.forEach((detail, index) => {
            const itemY = doc.y;

            // Bullet point
            doc.circle(this.PAGE_MARGIN.left + 10, itemY + 6, 2.5)
                .fillColor(this.COLORS.accent)
                .fill();

            // Label (bold)
            doc.fontSize(11)
                .font('Helvetica-Bold')
                .fillColor(this.COLORS.text)
                .text(`${detail.label}:`, this.PAGE_MARGIN.left + 25, itemY, {
                    continued: true
                })
                // Value (normal, on same line)
                .font('Helvetica')
                .fillColor(this.COLORS.textLight)
                .text(` ${detail.value}`, {
                    width: contentWidth - 35
                });

            doc.moveDown(0.6);
        });

        // Add footer note for page 1
        doc.fontSize(9)
            .font('Helvetica-Oblique')
            .fillColor(this.COLORS.textLight)
            .text('Continue to next page for project questions and answers →',
                this.PAGE_MARGIN.left,
                780,
                {
                    width: contentWidth,
                    align: 'right'
                });
    }

    /**
     * Add questions section (PAGE 2+)
     */
    addQuestionsSection(doc, questions) {
        const pageWidth = 595.28;
        const contentWidth = pageWidth - this.PAGE_MARGIN.left - this.PAGE_MARGIN.right;

        if (!questions || questions.length === 0) {
            doc.fontSize(12)
                .fillColor(this.COLORS.textLight)
                .text('No questions have been added to this project yet.', {
                    align: 'center',
                    width: contentWidth
                });
            return;
        }

        // Group questions by section
        const questionsBySection = {};
        questions.forEach((q) => {
            const section = q.section || 'general';
            if (!questionsBySection[section]) {
                questionsBySection[section] = {
                    sectionName: q.sectionName || 'General Information',
                    questions: []
                };
            }
            questionsBySection[section].questions.push(q);
        });

        // Render each section
        Object.keys(questionsBySection).forEach((sectionKey, sectionIndex) => {
            const section = questionsBySection[sectionKey];

            // Check if we need a new page
            this.checkPageBreakQuestions(doc, 100);

            // Section header
            this.addSectionHeader(doc, section.sectionName, contentWidth, true);
            doc.moveDown(0.8);

            // Questions in this section
            section.questions.forEach((question, qIndex) => {
                this.checkPageBreakQuestions(doc, 80);

                // Question card
                const cardY = doc.y;
                const questionHeight = this.calculateQuestionHeight(doc, question, contentWidth);

                // Card background
                doc.roundedRect(this.PAGE_MARGIN.left, cardY, contentWidth, questionHeight, 5)
                    .fillColor('#ffffff')
                    .fill()
                    .strokeColor(this.COLORS.border)
                    .lineWidth(0.5)
                    .stroke();

                // Question number badge
                doc.circle(this.PAGE_MARGIN.left + 20, cardY + 20, 14)
                    .fillColor(this.COLORS.secondary)
                    .fill();

                doc.fontSize(11)
                    .font('Helvetica-Bold')
                    .fillColor('#ffffff')
                    .text(`${qIndex + 1}`,
                        this.PAGE_MARGIN.left + 15,
                        cardY + 14,
                        { width: 10, align: 'center' });

                // Question text
                doc.fontSize(11)
                    .font('Helvetica-Bold')
                    .fillColor(this.COLORS.text)
                    .text(question.question,
                        this.PAGE_MARGIN.left + 45,
                        cardY + 14,
                        { width: contentWidth - 60 });

                const answerY = cardY + 38;

                // Handle different answer types
                if (question.type === 'brand-colors' ||
                    (question.answer && question.answer.includes('#'))) {
                    this.displayBrandColorsProfessional(doc, question.answer, answerY, contentWidth);
                } else {
                    // Regular text answer
                    const answerText = question.answer || 'Not answered yet';
                    const answerColor = question.answer ? this.COLORS.success : this.COLORS.textLight;

                    // Answer background
                    doc.roundedRect(
                        this.PAGE_MARGIN.left + 45,
                        answerY - 4,
                        contentWidth - 60,
                        questionHeight - 48,
                        3
                    )
                        .fillColor(this.COLORS.background)
                        .fill();

                    doc.fontSize(10)
                        .font('Helvetica')
                        .fillColor(answerColor)
                        .text(answerText,
                            this.PAGE_MARGIN.left + 55,
                            answerY + 4,
                            {
                                width: contentWidth - 80,
                                lineGap: 2
                            });
                }

                doc.y = cardY + questionHeight + 15;
            });

            doc.moveDown(1);
        });

        // Add generation timestamp
        doc.moveDown(2);
        doc.fontSize(9)
            .font('Helvetica-Oblique')
            .fillColor(this.COLORS.textLight)
            .text(`Document generated on ${new Date().toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })}`, {
                align: 'center',
                width: contentWidth
            });
    }

    /**
     * Calculate question card height dynamically
     */
    calculateQuestionHeight(doc, question, contentWidth) {
        const questionHeight = doc.heightOfString(question.question, {
            width: contentWidth - 60,
            font: 'Helvetica-Bold',
            fontSize: 11
        });

        let answerHeight = 30;
        if (question.answer) {
            if (question.type === 'brand-colors' || question.answer.includes('#')) {
                answerHeight = 50; // Fixed height for color swatches
            } else {
                answerHeight = Math.max(30, doc.heightOfString(question.answer, {
                    width: contentWidth - 80,
                    font: 'Helvetica',
                    fontSize: 10
                }) + 16);
            }
        }

        return Math.max(70, questionHeight + answerHeight + 30);
    }

    /**
     * Professional brand colors display
     */
    displayBrandColorsProfessional(doc, colorsString, startY, contentWidth) {
        try {
            const colors = colorsString.split(',').map(color => color.trim()).filter(color => color);

            if (colors.length === 0) {
                doc.fontSize(10)
                    .font('Helvetica')
                    .fillColor(this.COLORS.textLight)
                    .text('No colors specified',
                        this.PAGE_MARGIN.left + 55,
                        startY + 4);
                return;
            }

            // Background for colors
            doc.roundedRect(
                this.PAGE_MARGIN.left + 45,
                startY - 4,
                contentWidth - 60,
                60,
                3
            )
                .fillColor(this.COLORS.background)
                .fill();

            // Display colors horizontally
            let currentX = this.PAGE_MARGIN.left + 60;
            const swatchSize = 32;
            const spacing = 15;

            colors.forEach((colorHex, index) => {
                if (index > 0 && index % 8 === 0) {
                    // New row if too many colors
                    currentX = this.PAGE_MARGIN.left + 60;
                    startY += swatchSize + 10;
                }

                // Color swatch with shadow effect
                doc.roundedRect(currentX, startY + 2, swatchSize, swatchSize, 4)
                    .fillColor(colorHex)
                    .fill()
                    .strokeColor('#000000')
                    .lineWidth(1)
                    .opacity(0.2)
                    .stroke()
                    .opacity(1);

                // Hex code below swatch
                doc.fontSize(7)
                    .font('Helvetica')
                    .fillColor(this.COLORS.textLight)
                    .text(colorHex,
                        currentX - 5,
                        startY + swatchSize + 6,
                        { width: swatchSize + 10, align: 'center' });

                currentX += swatchSize + spacing;
            });

        } catch (error) {
            console.error('Error displaying brand colors:', error);
            doc.fontSize(10)
                .font('Helvetica')
                .fillColor(this.COLORS.textLight)
                .text(colorsString || 'Not answered yet',
                    this.PAGE_MARGIN.left + 55,
                    startY + 4);
        }
    }

    /**
     * Download image from URL
     */
    downloadImage(url) {
        return new Promise((resolve, reject) => {
            const protocol = url.startsWith('https') ? https : http;

            protocol.get(url, (response) => {
                if (response.statusCode !== 200) {
                    console.error(`❌ Failed to download image: ${response.statusCode}`);
                    reject(new Error(`Failed to download image: ${response.statusCode}`));
                    return;
                }

                const chunks = [];
                response.on('data', (chunk) => chunks.push(chunk));
                response.on('end', () => {
                    const buffer = Buffer.concat(chunks);
                    resolve(buffer);
                });
            }).on('error', (error) => {
                console.error(`❌ Network error downloading logo:`, error);
                reject(error);
            });
        });
    }

    /**
     * Add professional header with logo and title
     */
    async addProfessionalHeader(doc, pageTitle) {
        const pageWidth = 595.28;
        const headerHeight = this.HEADER_HEIGHT;

        // Modern gradient header background
        doc.rect(0, 0, pageWidth, headerHeight)
            .fillColor(this.COLORS.headerBg)
            .fill();

        // Subtle accent line at bottom of header
        doc.rect(0, headerHeight - 3, pageWidth, 3)
            .fillColor(this.COLORS.accent)
            .fill();

        try {
            // Download and add logo on LEFT side
            const logoUrl = 'https://mayabusinessclub.com/wp-content/uploads/2025/11/logo-horizontal-maya-vct.png';
            const logoBuffer = await this.downloadImage(logoUrl);

            const logoWidth = 130;
            const logoHeight = 45;
            const logoX = this.PAGE_MARGIN.left;
            const logoY = (headerHeight - logoHeight - 3) / 2;

            doc.image(logoBuffer, logoX, logoY, {
                width: logoWidth,
                height: logoHeight
            });
        } catch (error) {
            console.warn('⚠️ Could not load logo:', error.message);

            // Placeholder if logo fails
            doc.fillColor('#ffffff')
                .font('Helvetica-Bold')
                .fontSize(14)
                .text('Maya Business Club', this.PAGE_MARGIN.left, headerHeight / 2 - 7);
        }

        // Add page title on RIGHT side
        doc.fillColor('#ffffff')
            .font('Helvetica-Bold')
            .fontSize(20)
            .text(pageTitle,
                pageWidth - this.PAGE_MARGIN.right - 220,
                headerHeight / 2 - 13,
                {
                    width: 220,
                    align: 'right'
                });

        // Set starting position for content
        doc.x = this.PAGE_MARGIN.left;
        doc.y = headerHeight + 40;
    }

    /**
     * Add page number footer
     */
    addPageNumber(doc, currentPage, totalPages) {
        const pageHeight = 841.89;
        const pageWidth = 595.28;

        doc.fontSize(9)
            .font('Helvetica')
            .fillColor(this.COLORS.textLight)
            .text(
                `Page ${currentPage} of ${totalPages}`,
                this.PAGE_MARGIN.left,
                pageHeight - this.PAGE_MARGIN.bottom + 20,
                {
                    width: pageWidth - this.PAGE_MARGIN.left - this.PAGE_MARGIN.right,
                    align: 'center'
                }
            );
    }

    /**
     * Add professional section header
     */
    addSectionHeader(doc, title, contentWidth, isSubSection = false) {
        const headerY = doc.y;
        const headerHeight = isSubSection ? 35 : 40;

        // Header background gradient effect
        doc.roundedRect(this.PAGE_MARGIN.left, headerY, contentWidth, headerHeight, 6)
            .fillColor(isSubSection ? this.COLORS.background : this.COLORS.secondary)
            .fill();

        // Left accent
        doc.rect(this.PAGE_MARGIN.left, headerY, 5, headerHeight)
            .fillColor(this.COLORS.accent)
            .fill();

        // Title
        doc.fontSize(isSubSection ? 13 : 16)
            .font('Helvetica-Bold')
            .fillColor(isSubSection ? this.COLORS.text : '#ffffff')
            .text(title,
                this.PAGE_MARGIN.left + 20,
                headerY + (headerHeight / 2) - 7,
                { width: contentWidth - 40 });

        doc.y = headerY + headerHeight;
    }

    /**
     * Check page break for questions section
     */
    checkPageBreakQuestions(doc, neededHeight = 80) {
        const pageHeight = 841.89;
        const remainingHeight = pageHeight - doc.y - this.PAGE_MARGIN.bottom - 30;

        if (remainingHeight < neededHeight) {
            doc.addPage();
            doc.x = this.PAGE_MARGIN.left;
            doc.y = this.PAGE_MARGIN.top + 20;
            return true;
        }
        return false;
    }

    /**
     * Generate a professional PDF from formatted content text
     */
    async generateFormattedContentPdf(project, contentText) {
        return new Promise(async (resolve, reject) => {
            try {
                const filename = `content-${project._id}-${Date.now()}.pdf`;
                const filePath = path.join(this.uploadsDir, filename);

                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 0,
                    bufferPages: true
                });

                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                // Add Header
                await this.addProfessionalHeader(doc, 'FORMATTED CONTENT');

                // Content Section
                const pageWidth = 595.28;
                const contentWidth = pageWidth - this.PAGE_MARGIN.left - this.PAGE_MARGIN.right;
                const maxY = 841.89 - this.PAGE_MARGIN.bottom - 40;

                const renderer = new PDFMarkdownRenderer(doc, this.COLORS, this.PAGE_MARGIN);
                renderer.renderMarkdownText(contentText, doc.y, contentWidth, maxY);

                // Add page numbers
                const pageCount = doc.bufferedPageRange().count;
                for (let i = 0; i < pageCount; i++) {
                    doc.switchToPage(i);
                    this.addPageNumber(doc, i + 1, pageCount);
                }

                doc.end();

                stream.on('finish', () => {
                    resolve({
                        filename,
                        filePath,
                        url: `/uploads/pdfs/${filename}`,
                        pages: pageCount,
                        message: 'Content PDF created successfully!'
                    });
                });

                stream.on('error', (error) => {
                    reject(error);
                });

            } catch (error) {
                console.error('❌ Error generating content PDF:', error);
                reject(error);
            }
        });
    }
    /**
     * Generate a professional checklist completion PDF for Content Department
     */
    async generateChecklistCompletionPdf(project, user, checklistSections = []) {
        return new Promise(async (resolve, reject) => {
            try {
                const filename = `checklist-${project._id}-${Date.now()}.pdf`;
                const filePath = path.join(this.uploadsDir, filename);

                const doc = new PDFDocument({
                    size: 'A4',
                    margin: 0,
                    bufferPages: true
                });

                const stream = fs.createWriteStream(filePath);
                doc.pipe(stream);

                const pageWidth = 595.28;
                const contentWidth = pageWidth - this.PAGE_MARGIN.left - this.PAGE_MARGIN.right;
                const maxY = 841.89 - this.PAGE_MARGIN.bottom - 40;

                // ===== PAGE 1: Header + Project Info =====
                await this.addProfessionalHeader(doc, 'CHECKLIST COMPLETION');

                // Project title
                doc.fontSize(24)
                    .font('Helvetica-Bold')
                    .fillColor(this.COLORS.primary)
                    .text(project.title || 'Untitled Project', this.PAGE_MARGIN.left, doc.y, {
                        width: contentWidth
                    });
                doc.moveDown(0.4);

                // Accent underline
                doc.moveTo(this.PAGE_MARGIN.left, doc.y)
                    .lineTo(this.PAGE_MARGIN.left + 80, doc.y)
                    .lineWidth(3)
                    .strokeColor(this.COLORS.accent)
                    .stroke();
                doc.moveDown(1.5);

                // ===== VALIDATION INFO BOX =====
                // Compute stats from sections
                const allSectionItems = checklistSections.flatMap(s => s.items || []);
                const totalItems = allSectionItems.length;
                const checkedItems = allSectionItems.filter(i => i.checked).length;

                const infoBoxY = doc.y;
                const infoBoxH = 100;
                doc.roundedRect(this.PAGE_MARGIN.left, infoBoxY, contentWidth, infoBoxH, 6)
                    .fillColor(this.COLORS.background)
                    .fill()
                    .strokeColor(this.COLORS.border)
                    .lineWidth(1)
                    .stroke();
                doc.rect(this.PAGE_MARGIN.left, infoBoxY, 4, infoBoxH)
                    .fillColor(this.COLORS.accent)
                    .fill();

                const validatedDate = new Date().toLocaleString('en-US', {
                    weekday: 'long', year: 'numeric', month: 'long',
                    day: 'numeric', hour: '2-digit', minute: '2-digit'
                });
                const validatedBy = user?.name || user?.email || 'Content Department';

                doc.fontSize(11).font('Helvetica-Bold').fillColor(this.COLORS.text)
                    .text('Validated by:', this.PAGE_MARGIN.left + 20, infoBoxY + 16, { continued: true })
                    .font('Helvetica').fillColor(this.COLORS.textLight)
                    .text(` ${validatedBy}`);
                doc.moveDown(0.4);
                doc.fontSize(11).font('Helvetica-Bold').fillColor(this.COLORS.text)
                    .text('Validated on:', this.PAGE_MARGIN.left + 20, doc.y, { continued: true })
                    .font('Helvetica').fillColor(this.COLORS.textLight)
                    .text(` ${validatedDate}`);
                doc.moveDown(0.4);
                doc.fontSize(11).font('Helvetica-Bold').fillColor(this.COLORS.text)
                    .text('Client:', this.PAGE_MARGIN.left + 20, doc.y, { continued: true })
                    .font('Helvetica').fillColor(this.COLORS.textLight)
                    .text(` ${project.client?.name || 'N/A'}`);
                doc.moveDown(0.4);
                if (totalItems > 0) {
                    doc.fontSize(11).font('Helvetica-Bold').fillColor(this.COLORS.text)
                        .text('Items completed:', this.PAGE_MARGIN.left + 20, doc.y, { continued: true })
                        .font('Helvetica').fillColor(checkedItems === totalItems ? this.COLORS.success : this.COLORS.textLight)
                        .text(` ${checkedItems} / ${totalItems} checked`);
                }

                doc.y = infoBoxY + infoBoxH + 20;

                // ===== VERIFIED BADGE =====
                const badgeY = doc.y;
                doc.roundedRect(this.PAGE_MARGIN.left, badgeY, contentWidth, 36, 6)
                    .fillColor(this.COLORS.success)
                    .fill();
                doc.fontSize(14).font('Helvetica-Bold').fillColor('#ffffff')
                    .text('✓  Checklist Validated & Completed by Content Department',
                        this.PAGE_MARGIN.left + 20, badgeY + 10,
                        { width: contentWidth - 40, align: 'left' });
                doc.y = badgeY + 36 + 20;

                // ===== CHECKLIST SECTIONS =====
                this.addSectionHeader(doc, 'Checklist Summary', contentWidth);
                doc.moveDown(1);

                if (checklistSections.length === 0) {
                    // No checklist data stored — render generic completion note
                    doc.fontSize(11).font('Helvetica').fillColor(this.COLORS.textLight)
                        .text('Checklist items were validated and confirmed complete by the Content Department.',
                            this.PAGE_MARGIN.left, doc.y, { width: contentWidth, lineGap: 4 });
                } else {
                    checklistSections.forEach((section) => {
                        this.checkPageBreakQuestions(doc, 80);

                        // Section sub-header
                        this.addSectionHeader(doc, section.title || 'Section', contentWidth, true);
                        doc.moveDown(0.8);

                        const items = section.items || [];
                        items.forEach((item) => {
                            if (doc.y > maxY - 20) {
                                doc.addPage();
                                doc.x = this.PAGE_MARGIN.left;
                                doc.y = this.PAGE_MARGIN.top + 20;
                            }

                            const itemY = doc.y;
                            const isChecked = item.checked === true;

                            // Checkbox square
                            doc.rect(this.PAGE_MARGIN.left + 10, itemY + 2, 12, 12)
                                .strokeColor(isChecked ? this.COLORS.success : this.COLORS.border)
                                .lineWidth(1.5)
                                .stroke();

                            if (isChecked) {
                                doc.fontSize(10).font('Helvetica-Bold')
                                    .fillColor(this.COLORS.success)
                                    .text('✓', this.PAGE_MARGIN.left + 11, itemY + 2);
                            }

                            // Item label
                            doc.fontSize(10)
                                .font(isChecked ? 'Helvetica-Bold' : 'Helvetica')
                                .fillColor(isChecked ? this.COLORS.text : this.COLORS.textLight)
                                .text(item.label || '',
                                    this.PAGE_MARGIN.left + 32, itemY + 2,
                                    { width: contentWidth - 42, lineGap: 2 });

                            doc.moveDown(0.5);
                        });

                        doc.moveDown(0.8);
                    });
                }

                // ===== PAGE NUMBERS =====
                const pageCount = doc.bufferedPageRange().count;
                for (let i = 0; i < pageCount; i++) {
                    doc.switchToPage(i);
                    this.addPageNumber(doc, i + 1, pageCount);
                }

                doc.end();

                stream.on('finish', () => {
                    const stats = fs.statSync(filePath);
                    resolve({
                        filename,
                        path: `uploads/pdfs/${filename}`,
                        size: stats.size.toString(),
                        pages: pageCount,
                        message: 'Checklist PDF created successfully!'
                    });
                });

                stream.on('error', (error) => {
                    reject(error);
                });

            } catch (error) {
                console.error('❌ Error generating checklist PDF:', error);
                reject(error);
            }
        });
    }
}

module.exports = new AiStructorPdfGenerator();
