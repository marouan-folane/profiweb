// ─────────────────────────────────────────────────────────────────────────────
// questionTranslations.js
//
// Multi-language descriptions (EN / FR / AR / DE) for every question key.
// Used in DynamicField to show the ❓ help popout (FieldDescriptionPopout).
// Add new keys here whenever a new question is added to the system.
// ─────────────────────────────────────────────────────────────────────────────

export const questionTranslations = {
    // ── Preliminary ──────────────────────────────────────────────────────────
    caseWorkerName: {
        en: "The name of the employee responsible for this project and client communication.",
        fr: "Le nom de l'employé responsable de ce projet et de la communication avec le client.",
        ar: "اسم الموظف المسؤول عن هذا المشروع والتواصل مع العميل.",
        de: "Der Name des für dieses Projekt und die Kundenkommunikation zuständigen Mitarbeiters.",
    },
    caseWorkerLanguage: {
        en: "The working language preferred by the case worker for internal communication.",
        fr: "La langue de travail préférée par le gestionnaire de dossier pour la communication interne.",
        ar: "لغة العمل المفضلة لمسؤول الملف في التواصل الداخلي.",
        de: "Die bevorzugte Arbeitssprache des Sachbearbeiters für die interne Kommunikation.",
    },
    communicationLanguage: {
        en: "The language used for all communication with the client throughout the project.",
        fr: "La langue utilisée pour toute communication avec le client tout au long du projet.",
        ar: "اللغة المستخدمة في جميع الاتصالات مع العميل طوال المشروع.",
        de: "Die Sprache, die für die gesamte Kommunikation mit dem Kunden während des Projekts verwendet wird.",
    },
    contactName: {
        en: "The main point of contact for the client's side.",
        fr: "Le point de contact principal du côté du client.",
        ar: "نقطة الاتصال الرئيسية من جانب العميل.",
        de: "Der Hauptansprechpartner auf der Seite des Kunden.",
    },
    whatsappNumber: {
        en: "The WhatsApp number used for quick communication and coordination.",
        fr: "Le numéro WhatsApp utilisé pour la communication rapide et la coordination.",
        ar: "رقم الوتساب المستخدم للتواصل السريع والتنسيق.",
        de: "Die WhatsApp-Nummer für die schnelle Kommunikation und Koordination.",
    },

    // ── Business Information ──────────────────────────────────────────────────
    companyName: {
        en: "The official legal name of the company as it should appear on the website and legal documents.",
        fr: "Le nom légal officiel de l'entreprise tel qu'il doit apparaître sur le site web et les documents juridiques.",
        ar: "الاسم القانوني الرسمي للشركة كما يجب أن يظهر على الموقع الإلكتروني والمستندات القانونية.",
        de: "Der offizielle rechtliche Name des Unternehmens, wie er auf der Website und in rechtlichen Dokumenten erscheinen soll.",
    },
    legalForm: {
        en: "The legal structure of the company (e.g., LLC, Corporation, Sole Proprietorship).",
        fr: "La structure juridique de l'entreprise (p. ex., SARL, SA, auto-entrepreneur).",
        ar: "الشكل القانوني للشركة (مثلاً: شركة ذات مسؤولية محدودة، شركة مساهمة).",
        de: "Die Rechtsform des Unternehmens (z. B. GmbH, AG, Einzelunternehmen).",
    },
    businessAddress: {
        en: "The physical address of your business premises for the contact page and imprint.",
        fr: "L'adresse physique de vos locaux commerciaux pour la page de contact et les mentions légales.",
        ar: "العنوان الفعلي لمقر عملك لصفحة الاتصال والبيانات القانونية.",
        de: "Die physische Adresse Ihrer Geschäftsräume für die Kontaktseite und das Impressum.",
    },
    companyTelephone: {
        en: "General business phone number for customers to reach you.",
        fr: "Numéro de téléphone général de l'entreprise pour que les clients puissent vous joindre.",
        ar: "رقم الهاتف العام للشركة ليتمكن العملاء من الوصول إليك.",
        de: "Allgemeine geschäftliche Telefonnummer, unter der Kunden Sie erreichen können.",
    },
    companyEmail: {
        en: "The official email address for business inquiries (e.g., info@company.com).",
        fr: "L'adresse e-mail officielle pour les demandes de renseignements commerciaux (par exemple, info@entreprise.com).",
        ar: "عنوان البريد الإلكتروني الرسمي للاستفسارات التجارية (مثلاً info@company.com).",
        de: "Die offizielle E-Mail-Adresse für geschäftliche Anfragen (z. B. info@unternehmen.de).",
    },
    companyDescription: {
        en: "A detailed description of the company's mission, vision, history, and values for website content.",
        fr: "Une description détaillée de la mission, de la vision, de l'historique et des valeurs de l'entreprise.",
        ar: "وصف تفصيلي لمهمة الشركة ورؤيتها وتاريخها وقيمها لمحتوى الموقع.",
        de: "Eine detaillierte Beschreibung der Mission, Vision, Geschichte und Werte des Unternehmens.",
    },
    briefCompanyDescription: {
        en: "A short 1–2 sentence summary of the company, ideal for the homepage hero section.",
        fr: "Un résumé court de 1 à 2 phrases sur l'entreprise, idéal pour la section hero de la page d'accueil.",
        ar: "ملخص قصير من 1-2 جملة عن الشركة، مثالي لقسم البطل في الصفحة الرئيسية.",
        de: "Eine kurze Zusammenfassung von 1-2 Sätzen über das Unternehmen, ideal für den Hero-Bereich der Homepage.",
    },
    industry: {
        en: "The sector or industry your company operates in (e.g., Healthcare, Retail, Technology).",
        fr: "Le secteur ou l'industrie dans lequel votre entreprise opère (p. ex., santé, commerce de détail, technologie).",
        ar: "القطاع أو الصناعة التي تعمل بها شركتك (مثلاً: الرعاية الصحية، التجزئة، التكنولوجيا).",
        de: "Der Sektor oder die Branche, in der Ihr Unternehmen tätig ist (z. B. Gesundheitswesen, Einzelhandel, Technologie).",
    },
    servicesOffered: {
        en: "List the main services or products your company provides. Be specific — this appears directly on the website.",
        fr: "Listez les principaux services ou produits que votre entreprise fournit. Soyez précis — cela apparaît directement sur le site web.",
        ar: "قائمة بالخدمات أو المنتجات الرئيسية التي تقدمها شركتك. كن محدداً — يظهر هذا مباشرة على الموقع.",
        de: "Listen Sie die wichtigsten Dienstleistungen oder Produkte Ihres Unternehmens auf. Seien Sie spezifisch — dies erscheint direkt auf der Website.",
    },
    uniqueSellingPoints: {
        en: "What makes your business different from competitors? Key benefits that clients should know.",
        fr: "Qu'est-ce qui distingue votre entreprise de la concurrence ? Avantages clés que les clients doivent connaître.",
        ar: "ما الذي يميز عملك عن المنافسين؟ المزايا الرئيسية التي يجب أن يعرفها العملاء.",
        de: "Was unterscheidet Ihr Unternehmen von Mitbewerbern? Wichtige Vorteile, die Kunden kennen sollten.",
    },
    callToAction: {
        en: "What action should visitors take after reading your content? (e.g., 'Order now', 'Contact us', 'Get a free quote').",
        fr: "Quelle action les visiteurs doivent-ils effectuer après avoir lu votre contenu ? (p. ex., 'Commander maintenant', 'Contactez-nous').",
        ar: "ما الإجراء الذي يجب على الزوار اتخاذه بعد قراءة المحتوى؟ (مثلاً: 'اطلب الآن'، 'تواصل معنا').",
        de: "Welche Aktion sollen Besucher nach dem Lesen Ihres Inhalts durchführen? (z. B. 'Jetzt bestellen', 'Kontaktieren Sie uns').",
    },
    websiteObjective: {
        en: "The main goal of the website: sell, inform, generate leads, build brand awareness, etc.",
        fr: "L'objectif principal du site web : vendre, informer, générer des prospects, renforcer la notoriété de la marque, etc.",
        ar: "الهدف الرئيسي للموقع: البيع، الإعلام، توليد العملاء المحتملين، بناء الوعي بالعلامة التجارية، إلخ.",
        de: "Das Hauptziel der Website: Verkaufen, Informieren, Leads generieren, Markenbekanntheit aufbauen usw.",
    },
    toneAndDemeanor: {
        en: "Select adjectives that describe how your brand should sound and feel to visitors.",
        fr: "Sélectionnez les adjectifs qui décrivent la façon dont votre marque doit sonner et se sentir pour les visiteurs.",
        ar: "اختر الصفات التي تصف كيف يجب أن تبدو علامتك التجارية وتشعر بها للزوار.",
        de: "Wählen Sie Adjektive aus, die beschreiben, wie Ihre Marke für Besucher klingen und sich anfühlen sollte.",
    },

    // ── Company Legal & Background ────────────────────────────────────────────
    managingDirector: {
        en: "Full name of the company's managing director or CEO, for legal pages.",
        fr: "Nom complet du directeur général ou PDG de l'entreprise, pour les pages légales.",
        ar: "الاسم الكامل للمدير العام أو الرئيس التنفيذي للشركة، للصفحات القانونية.",
        de: "Vollständiger Name des Geschäftsführers oder CEO des Unternehmens, für rechtliche Seiten.",
    },
    iceNumber: {
        en: "The company's ICE (Identifiant Commun de l'Entreprise) number for legal/tax purposes.",
        fr: "Le numéro ICE (Identifiant Commun de l'Entreprise) de l'entreprise à des fins juridiques/fiscales.",
        ar: "رقم ICE (المعرّف المشترك للمؤسسة) الخاص بالشركة لأغراض قانونية/ضريبية.",
        de: "Die ICE-Nummer (Identifiant Commun de l'Entreprise) des Unternehmens für rechtliche/steuerliche Zwecke.",
    },
    yearOfFoundation: {
        en: "The year the company was officially established or registered.",
        fr: "L'année de création ou d'enregistrement officiel de l'entreprise.",
        ar: "السنة التي تأسست أو سُجّلت فيها الشركة رسمياً.",
        de: "Das Jahr, in dem das Unternehmen offiziell gegründet oder eingetragen wurde.",
    },

    // ── Website Goals & Target Audience ─────────────────────────────────────
    websitePurpose: {
        en: "Define the primary goals of your website (e.g., sales, brand awareness, lead generation).",
        fr: "Définissez les objectifs primaires de votre site web (p. ex., ventes, notoriété de la marque, génération de prospects).",
        ar: "حدد الأهداف الأساسية لموقعك الإلكتروني (مثلاً المبيعات، الوعي بالعلامة التجارية، جذب العملاء المحتملين).",
        de: "Definieren Sie die primären Ziele Ihrer Website (z. B. Verkauf, Markenbekanntheit, Lead-Generierung).",
    },
    targetCustomers: {
        en: "Identify your ideal customers, including their demographics, interests, and needs.",
        fr: "Identifiez vos clients idéaux, y compris leur démographie, leurs intérêts et leurs besoins.",
        ar: "حدد عملاءك المثاليين، بما في ذلك ديموغرافيتهم واهتماماتهم واحتياجاتهم.",
        de: "Identifizieren Sie Ihre idealen Kunden, einschließlich Ihrer Demografie, Interessen und Bedürfnisse.",
    },
    businessType: {
        en: "Whether your company sells to other businesses (B2B), directly to consumers (B2C), or both.",
        fr: "Si votre entreprise vend à d'autres entreprises (B2B), directement aux consommateurs (B2C), ou les deux.",
        ar: "ما إذا كانت شركتك تبيع لشركات أخرى (B2B)، مباشرة للمستهلكين (B2C)، أو كليهما.",
        de: "Ob Ihr Unternehmen an andere Unternehmen (B2B), direkt an Verbraucher (B2C) oder an beides verkauft.",
    },

    // ── Market Analysis ───────────────────────────────────────────────────────
    likedCompetitors: {
        en: "List competitor websites you admire — their design or features can inspire your project.",
        fr: "Listez les sites concurrents que vous appréciez — leur design ou fonctionnalités peuvent inspirer votre projet.",
        ar: "قائمة بمواقع المنافسين التي تعجبك — يمكن أن يلهم تصميمهم أو ميزاتهم مشروعك.",
        de: "Listen Sie Konkurrenz-Websites auf, die Sie bewundern — deren Design oder Funktionen können Ihr Projekt inspirieren.",
    },
    differentiationCompetitors: {
        en: "List direct competitors your website should clearly differentiate from.",
        fr: "Listez les concurrents directs dont votre site web doit clairement se différencier.",
        ar: "قائمة بالمنافسين المباشرين الذين يجب أن يتمايز عنهم موقعك بوضوح.",
        de: "Listen Sie direkte Mitbewerber auf, from denen sich Ihre Website klar abheben soll.",
    },
    competitiveEnvironment: {
        en: "Describe the overall competitive landscape in your market.",
        fr: "Décrivez le paysage concurrentiel général de votre marché.",
        ar: "صف البيئة التنافسية العامة في سوقك.",
        de: "Beschreiben Sie das allgemeine Wettbewerbsumfeld in Ihrem Markt.",
    },
    contentRestrictions: {
        en: "Any content, topics, or imagery that should NOT appear on the website.",
        fr: "Tout contenu, sujet ou image qui ne doit PAS apparaître sur le site web.",
        ar: "أي محتوى أو موضوعات أو صور يجب ألا تظهر على الموقع.",
        de: "Inhalte, Themen oder Bilder, die NICHT auf der Website erscheinen sollen.",
    },

    // ── Website Structure & Pages ─────────────────────────────────────────────
    websitePages: {
        en: "Select the essential pages for your website structure.",
        fr: "Sélectionnez les pages essentielles pour la structure de votre site web.",
        ar: "اختر الصفحات الأساسية لهيكل موقعك الإلكتروني.",
        de: "Wählen Sie die wesentlichen Seiten für Ihre Websitestruktur aus.",
    },
    websiteLanguages: {
        en: "Choose the languages in which your website content should be available.",
        fr: "Choisissez les langues dans lesquelles le contenu de votre site web doit être disponible.",
        ar: "اختر اللغات التي يجب أن يتوفر بها محتوى موقعك الإلكتروني.",
        de: "Wählen Sie die Sprachen aus, in denen Ihre Website-Inhalte verfügbar sein sollen.",
    },
    outputLanguages: {
        en: "Languages in which the AI-generated instructions and content should be delivered.",
        fr: "Langues dans lesquelles les instructions et le contenu générés par l'IA doivent être livrés.",
        ar: "اللغات التي يجب تقديم التعليمات والمحتوى المُولَّد بالذكاء الاصطناعي بها.",
        de: "Sprachen, in denen die KI-generierten Anweisungen und Inhalte geliefert werden sollen.",
    },
    highlightedService: {
        en: "The primary service or product to feature most prominently on the homepage.",
        fr: "Le service ou produit principal à mettre le plus en avant sur la page d'accueil.",
        ar: "الخدمة أو المنتج الرئيسي الذي يجب إبرازه بشكل أكثر بروزاً على الصفحة الرئيسية.",
        de: "Der primäre Dienst oder das primäre Produkt, das auf der Homepage am prominentesten hervorgehoben werden soll.",
    },
    mandatoryHomepageContent: {
        en: "Specific content sections that MUST appear on the homepage (e.g., certifications, awards).",
        fr: "Sections de contenu spécifiques qui DOIVENT apparaître sur la page d'accueil (p. ex., certifications, récompenses).",
        ar: "أقسام المحتوى المحددة التي يجب أن تظهر على الصفحة الرئيسية (مثلاً: الشهادات، الجوائز).",
        de: "Spezifische Inhaltsbereiche, die auf der Homepage erscheinen MÜSSEN (z.B. Zertifizierungen, Auszeichnungen).",
    },

    // ── Design Requirements ───────────────────────────────────────────────────
    logoAvailability: {
        en: "Indicates whether a high-quality logo file is available for use on the website.",
        fr: "Indique si un fichier logo de haute qualité est disponible pour utilisation sur le site web.",
        ar: "يشير إلى ما إذا كان ملف الشعار عالي الجودة متاحاً للاستخدام على الموقع.",
        de: "Gibt an, ob eine hochwertige Logo-Datei für die Verwendung auf der Website verfügbar ist.",
    },
    colorScheme: {
        en: "Your brand's primary and secondary colors (hex codes preferred, e.g., #1A2B3C).",
        fr: "Les couleurs primaires et secondaires de votre marque (codes hex de préférence, p. ex., #1A2B3C).",
        ar: "الألوان الأساسية والثانوية لعلامتك التجارية (يفضل استخدام رموز hex، مثلاً #1A2B3C).",
        de: "Die Primär- und Sekundärfarben Ihrer Marke (Hex-Codes bevorzugt, z. B. #1A2B3C).",
    },
    tonality: {
        en: "The visual style and mood that the website design should convey.",
        fr: "Le style visuel et l'ambiance que le design du site web doit véhiculer.",
        ar: "الأسلوب البصري والمزاج الذي يجب أن يعبّر عنه تصميم الموقع.",
        de: "Der visuelle Stil und die Stimmung, die das Website-Design vermitteln soll.",
    },
    imageAvailability: {
        en: "Whether professional or amateur photos are available, or if stock images should be used.",
        fr: "Si des photos professionnelles ou amateurs sont disponibles, ou si des images stock doivent être utilisées.",
        ar: "ما إذا كانت الصور الاحترافية أو الهواة متاحة، أو ما إذا كان يجب استخدام صور مخزنة.",
        de: "Ob professionelle oder Amateur-Fotos verfügbar sind oder ob Stockbilder verwendet werden sollen.",
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// STATIC QUESTION REGISTRY
//
// The canonical definition of all built-in (non-custom) questions.
// This array is the single source of truth.
// Use it to seed a new project's questions or to reset to defaults.
// DynamicSection reads from API (which reflects DB state); this is the
// initialization template used on first save inside QuestionsTab.handleSubmit.
// ─────────────────────────────────────────────────────────────────────────────
export const QUESTION_REGISTRY = [
    // ── Preliminary ──────────────────────────────────────────────────────────
    { questionKey: "caseWorkerName", section: "preliminary", sectionName: "Preliminary Information", order: 1, type: "text", question: "Case Worker Name", isRequired: false },
    { questionKey: "caseWorkerLanguage", section: "preliminary", sectionName: "Preliminary Information", order: 2, type: "text", question: "Language of Case Worker", isRequired: false },
    {
        questionKey: "communicationLanguage", section: "preliminary", sectionName: "Preliminary Information", order: 3, type: "select", question: "Communication Language", isRequired: false,
        options: [{ value: "French", label: "French" }, { value: "Arabic", label: "Arabic" }, { value: "English", label: "English" }, { value: "German", label: "German" }]
    },
    { questionKey: "contactName", section: "preliminary", sectionName: "Preliminary Information", order: 4, type: "text", question: "Contact Name", isRequired: false },
    { questionKey: "whatsappNumber", section: "preliminary", sectionName: "Preliminary Information", order: 5, type: "tel", question: "WhatsApp Number", isRequired: false, placeholder: "+212 ..." },

    // ── Business Information ──────────────────────────────────────────────────
    { questionKey: "companyName", section: "business", sectionName: "Business Information", order: 10, type: "text", question: "Full Company Name", isRequired: true, placeholder: "Will appear in website header and footer" },
    {
        questionKey: "legalForm", section: "business", sectionName: "Business Information", order: 11, type: "select", question: "Legal Form", isRequired: false,
        options: ["SARL", "SA", "SNC", "SCS", "SCA", "SCOP", "EI", "Micro-entreprise", "Auto-entrepreneur", "Association", "Other"].map(v => ({ value: v, label: v }))
    },
    { questionKey: "businessAddress", section: "business", sectionName: "Business Information", order: 12, type: "textarea", question: "Business Address", isRequired: true, placeholder: "Full company address for contact page" },
    { questionKey: "companyTelephone", section: "business", sectionName: "Business Information", order: 13, type: "tel", question: "Telephone Number", isRequired: true, placeholder: "+212 XXX-XXXXXX" },
    { questionKey: "companyEmail", section: "business", sectionName: "Business Information", order: 14, type: "email", question: "Email Address", isRequired: true, placeholder: "info@company.com" },
    { questionKey: "companyDescription", section: "business", sectionName: "Business Information", order: 15, type: "textarea", question: "Detailed Company Description", isRequired: false, placeholder: "Mission, vision, and values" },
    { questionKey: "briefCompanyDescription", section: "business", sectionName: "Business Information", order: 16, type: "textarea", question: "Brief Company Description", isRequired: false, placeholder: "Short summary for homepage (1-2 sentences)", settings: { maxLength: 200 } },
    { questionKey: "industry", section: "business", sectionName: "Business Information", order: 17, type: "text", question: "Industry / Field of Activity", isRequired: false, placeholder: "e.g., Marketing, Technology, Healthcare" },
    { questionKey: "servicesOffered", section: "business", sectionName: "Business Information", order: 18, type: "textarea", question: "Services Offered", isRequired: true, placeholder: "List all services offered by the company" },
    { questionKey: "uniqueSellingPoints", section: "business", sectionName: "Business Information", order: 19, type: "textarea", question: "Unique Selling Points", isRequired: false, placeholder: "Key benefits or differentiators" },
    { questionKey: "callToAction", section: "business", sectionName: "Business Information", order: 20, type: "textarea", question: "Call to Action", isRequired: false, placeholder: "e.g., Order now, Contact us, Get a quote" },
    { questionKey: "websiteObjective", section: "business", sectionName: "Business Information", order: 21, type: "textarea", question: "Website Objective", isRequired: false, placeholder: "Main goal of the website" },
    {
        questionKey: "toneAndDemeanor", section: "business", sectionName: "Business Information", order: 22, type: "checkbox", question: "Tone & Demeanor", isRequired: false,
        options: ["Professional", "Reliable", "International", "Friendly", "Formal", "Casual", "Innovative", "Traditional"].map(v => ({ value: v, label: v }))
    },

    // ── Company Legal & Background ────────────────────────────────────────────
    { questionKey: "managingDirector", section: "legal", sectionName: "Company Legal & Background", order: 30, type: "text", question: "Managing Director", isRequired: false },
    { questionKey: "iceNumber", section: "legal", sectionName: "Company Legal & Background", order: 31, type: "text", question: "ICE Number", isRequired: false },
    { questionKey: "yearOfFoundation", section: "legal", sectionName: "Company Legal & Background", order: 32, type: "number", question: "Year of Foundation", isRequired: false },

    // ── Website Goals & Target Audience ─────────────────────────────────────
    { questionKey: "websitePurpose", section: "goals", sectionName: "Website Goals & Target Audience", order: 40, type: "textarea", question: "Website Goals", isRequired: false },
    { questionKey: "targetCustomers", section: "goals", sectionName: "Website Goals & Target Audience", order: 41, type: "textarea", question: "Target Audience", isRequired: false },
    {
        questionKey: "businessType", section: "goals", sectionName: "Website Goals & Target Audience", order: 42, type: "select", question: "Business Type", isRequired: false,
        options: ["B2B", "B2C", "B2B2C", "Non-profit", "Government", "Other"].map(v => ({ value: v, label: v }))
    },

    // ── Market Analysis ───────────────────────────────────────────────────────
    { questionKey: "likedCompetitors", section: "market", sectionName: "Market Analysis", order: 50, type: "textarea", question: "Competitors You Like", isRequired: false },
    { questionKey: "marketSize", section: "market", sectionName: "Market Analysis", order: 51, type: "text", question: "Market Size", isRequired: false },
    { questionKey: "marketGrowthRate", section: "market", sectionName: "Market Analysis", order: 52, type: "text", question: "Market Growth Rate", isRequired: false },
    { questionKey: "marketShare", section: "market", sectionName: "Market Analysis", order: 53, type: "text", question: "Market Share", isRequired: false },
    { questionKey: "differentiationCompetitors", section: "market", sectionName: "Market Analysis", order: 54, type: "textarea", question: "Competitors to Differentiate From", isRequired: false },
    { questionKey: "competitiveEnvironment", section: "market", sectionName: "Market Analysis", order: 55, type: "textarea", question: "Competitive Environment", isRequired: false },
    { questionKey: "specialFeaturesCompared", section: "market", sectionName: "Market Analysis", order: 56, type: "textarea", question: "Special Features vs Competitors", isRequired: false },
    { questionKey: "contentRestrictions", section: "market", sectionName: "Market Analysis", order: 57, type: "textarea", question: "Content Restrictions", isRequired: false },

    // ── Website Structure & Pages ─────────────────────────────────────────────
    {
        questionKey: "websitePages", section: "structure", sectionName: "Website Structure & Pages", order: 60, type: "checkbox", question: "Required Website Pages", isRequired: false,
        options: ["Home", "About Us", "Services", "Portfolio", "Blog", "Contact", "FAQ", "Pricing", "Team", "Testimonials"].map(v => ({ value: v, label: v }))
    },
    { questionKey: "highlightedService", section: "structure", sectionName: "Website Structure & Pages", order: 61, type: "text", question: "Service to Highlight", isRequired: false },
    { questionKey: "lowPriorityServices", section: "structure", sectionName: "Website Structure & Pages", order: 62, type: "textarea", question: "Services Not to Feature", isRequired: false },
    { questionKey: "mandatoryHomepageContent", section: "structure", sectionName: "Website Structure & Pages", order: 63, type: "textarea", question: "Mandatory Homepage Content", isRequired: false },
    {
        questionKey: "websiteLanguages", section: "structure", sectionName: "Website Structure & Pages", order: 64, type: "checkbox", question: "Website Languages", isRequired: false,
        options: ["French", "Arabic", "English", "German", "Spanish"].map(v => ({ value: v, label: v }))
    },
    {
        questionKey: "outputLanguages", section: "structure", sectionName: "Website Structure & Pages", order: 65, type: "checkbox", question: "Output Languages (AI)", isRequired: false,
        options: ["French", "Arabic", "English", "German"].map(v => ({ value: v, label: v }))
    },

    // ── Revenue Streams ───────────────────────────────────────────────────────
    { questionKey: "revenueStreams", section: "revenue", sectionName: "Revenue Streams", order: 70, type: "text", question: "Revenue Streams", isRequired: false },
    { questionKey: "subscriptionModel", section: "revenue", sectionName: "Revenue Streams", order: 71, type: "text", question: "Subscription Model", isRequired: false },
    { questionKey: "subscriptionFee", section: "revenue", sectionName: "Revenue Streams", order: 72, type: "text", question: "Subscription Fee", isRequired: false },
    { questionKey: "subscriptionDuration", section: "revenue", sectionName: "Revenue Streams", order: 73, type: "text", question: "Subscription Duration", isRequired: false },
    { questionKey: "subscriptionFrequency", section: "revenue", sectionName: "Revenue Streams", order: 74, type: "text", question: "Subscription Frequency", isRequired: false },

    // ── Social Media Strategy ─────────────────────────────────────────────────
    { questionKey: "socialMediaStrategy", section: "social", sectionName: "Social Media Strategy", order: 80, type: "textarea", question: "Social Media Strategy", isRequired: false },

    // ── Design Requirements ───────────────────────────────────────────────────
    {
        questionKey: "logoAvailability", section: "design", sectionName: "Design Requirements", order: 90, type: "select", question: "Logo Availability", isRequired: false,
        options: ["Yes - High quality", "Yes - Low quality", "No - Needs to be created"].map(v => ({ value: v, label: v }))
    },
    {
        questionKey: "corporateDesignAvailability", section: "design", sectionName: "Design Requirements", order: 91, type: "select", question: "Corporate Design", isRequired: false,
        options: ["Yes - Complete brand guide", "Yes - Partial", "No"].map(v => ({ value: v, label: v }))
    },
    {
        questionKey: "imageAvailability", section: "design", sectionName: "Design Requirements", order: 92, type: "select", question: "Images for Website", isRequired: false,
        options: ["Yes - Professional photos", "Yes - Amateur photos", "No - Please use stock images"].map(v => ({ value: v, label: v }))
    },
    { questionKey: "imageNotes", section: "design", sectionName: "Design Requirements", order: 93, type: "textarea", question: "Image Preferences/Notes", isRequired: false },
    { questionKey: "colorScheme", section: "design", sectionName: "Design Requirements", order: 94, type: "text", question: "Brand Colors", isRequired: false, placeholder: "e.g. #1A2B3C, #FFFFFF" },
    {
        questionKey: "tonality", section: "design", sectionName: "Design Requirements", order: 95, type: "checkbox", question: "Design Style & Tone", isRequired: false,
        options: ["Modern", "Classic", "Minimalist", "Bold", "Elegant", "Playful", "Corporate", "Creative"].map(v => ({ value: v, label: v }))
    },
];
