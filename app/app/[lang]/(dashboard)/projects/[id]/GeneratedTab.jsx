// app/[lang]/(dashboard)/projects/[id]/overview/GeneratedTab.jsx
"use client";
import { useState, useRef, useEffect } from "react";

const GeneratedTab = () => {
  const [generatedContent, setGeneratedContent] = useState({
    projectBrief: "",
    designMockups: [],
    contentPlan: "",
    seoAnalysis: "",
    technicalSpecs: ""
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("chat"); // "chat" or "content"
  
  // Chat state
  const [messages, setMessages] = useState([
    { id: 1, sender: "ai", text: "Hello! I'm your AI project assistant. You can upload your 'AI PDF Project Structure' document, and I'll help you analyze it and generate comprehensive project specifications.", timestamp: new Date() }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleGenerateAll = () => {
    setIsGenerating(true);
    
    // Simulate API call
    setTimeout(() => {
      setGeneratedContent({
        projectBrief: `PROJECT BRIEF - Tech Solutions SARL Website
=========================================

Company: Tech Solutions SARL
Industry: Technology & Software Development
Template Selected: Modern Business

PROJECT OVERVIEW:
- Company: Tech Solutions SARL (SARL)
- Founded: 2018
- Location: Casablanca, Morocco
- Contact: contact@techsolutions.ma / +212 661-123456
- Managing Director: Ahmed Benali

BUSINESS OBJECTIVES:
1. Acquire new customers in Moroccan market
2. Showcase portfolio of web and mobile projects
3. Establish company as technology leader
4. Generate qualified leads through contact forms

TARGET AUDIENCE:
- Small to medium businesses in Morocco
- B2B clients seeking digital solutions
- Budget range: 20,000 - 200,000 MAD

SERVICES TO HIGHLIGHT:
1. Web Development (Custom websites, web applications)
2. Mobile App Development (iOS & Android)
3. E-commerce Solutions
4. Digital Marketing Services

TIMELINE:
- Design Phase: 2 weeks
- Development: 4 weeks
- Testing & Launch: 1 week
- Total: 7 weeks

BUDGET ESTIMATE:
- Design: 15,000 MAD
- Development: 45,000 MAD
- Content: 10,000 MAD
- Maintenance: 5,000 MAD/month
- Total Initial: 70,000 MAD

DELIVERABLES:
- Responsive website (Desktop, Tablet, Mobile)
- Admin dashboard for content management
- SEO optimization
- Contact management system
- Analytics integration

SUCCESS METRICS:
- 50% increase in website traffic
- 30% increase in lead generation
- 20% improvement in conversion rate
- Positive client feedback

Generated on: ${new Date().toLocaleDateString()}`,

        designMockups: [
          { id: 1, name: "Homepage Design", status: "completed", preview: "/mockups/homepage.jpg" },
          { id: 2, name: "Services Page Layout", status: "completed", preview: "/mockups/services.jpg" },
          { id: 3, name: "Portfolio Gallery", status: "in-progress", preview: "/mockups/portfolio.jpg" },
          { id: 4, name: "Contact Page", status: "pending", preview: "/mockups/contact.jpg" },
          { id: 5, name: "Mobile Navigation", status: "pending", preview: "/mockups/mobile-nav.jpg" }
        ],

        contentPlan: `CONTENT STRATEGY PLAN
=====================

1. HOMEPAGE CONTENT:
   - Hero Section: "Innovative Digital Solutions for Moroccan Businesses"
   - Value Proposition: Highlight 24/7 support and local expertise
   - Call-to-Action: "Get Your Free Consultation"

2. SERVICES PAGES:
   - Web Development: Focus on custom solutions and latest technologies
   - Mobile Apps: Emphasize iOS/Android development and app store optimization
   - E-commerce: Highlight payment integration and security features
   - Digital Marketing: Showcase ROI and campaign management

3. ABOUT PAGE:
   - Company story since 2018
   - Team introduction with photos
   - Client testimonials and case studies
   - Mission and vision statements

4. PORTFOLIO:
   - 6-8 featured projects with detailed case studies
   - Before/after comparisons
   - Client testimonials for each project
   - Technologies used

5. BLOG STRATEGY:
   - Monthly posts on digital trends in Morocco
   - How-to guides for business owners
   - Case studies and success stories
   - Industry insights and updates

6. SEO KEYWORDS:
   - Primary: "web development Morocco", "mobile app development Casablanca"
   - Secondary: "e-commerce solutions", "digital marketing agency"
   - Long-tail: "custom website design for small businesses"`,

        seoAnalysis: `SEO ANALYSIS REPORT
===================

STRENGTHS:
- Clear business model and services
- Professional company information
- Local market focus (Morocco)
- Complete contact details

OPPORTUNITIES:
- Target local keywords: "Casablanca web development"
- Create location-specific pages
- Build local citations and directory listings
- Optimize for mobile search (high in Morocco)

RECOMMENDATIONS:
1. Technical SEO:
   - Implement schema markup for business
   - Optimize page speed for mobile
   - Create XML sitemap
   - Set up Google Search Console

2. On-Page SEO:
   - Target 5 main service pages
   - Create location pages for major cities
   - Optimize meta descriptions with local keywords
   - Use header tags properly

3. Content Strategy:
   - Create blog about digital trends in Morocco
   - Publish case studies with local clients
   - Guest post on Moroccan business blogs
   - Create video content in Arabic/French

4. Local SEO:
   - Google My Business optimization
   - Local directory submissions
   - Customer reviews strategy
   - Local backlink building`,

        technicalSpecs: `TECHNICAL SPECIFICATIONS
========================

FRONTEND:
- Framework: Next.js 14 (React)
- Styling: Tailwind CSS
- Icons: Lucide React
- Charts: Recharts
- Forms: React Hook Form
- Validation: Zod

BACKEND:
- Framework: Node.js with Express
- Database: MongoDB with Mongoose
- Authentication: NextAuth.js
- File Upload: Cloudinary
- Email: Nodemailer with SendGrid
- Payments: Stripe (for future e-commerce)

HOSTING & DEPLOYMENT:
- Frontend: Vercel
- Backend: Railway or AWS
- Database: MongoDB Atlas
- CDN: Cloudflare
- Monitoring: Sentry

PERFORMANCE TARGETS:
- Page Load: < 2 seconds
- Mobile Score: > 90 (Google PageSpeed)
- Uptime: 99.9%
- Security: SSL/TLS, regular updates

ACCESSIBILITY:
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- Color contrast checking`
      });
      setIsGenerating(false);
    }, 2000);
  };

  const handleDownload = (content, filename) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Chat functions
  const handleSendMessage = () => {
    if (!inputMessage.trim() && !uploadedFile) return;

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      sender: "user",
      text: inputMessage,
      timestamp: new Date(),
      file: uploadedFile
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    
    // Clear uploaded file
    if (uploadedFile) {
      setUploadedFile(null);
    }

    // Simulate AI response
    setTimeout(() => {
      const aiResponses = [
        "I've analyzed your project structure document. Based on the requirements, I suggest focusing on these key areas...",
        "From the uploaded PDF, I can see you need a robust backend architecture. Consider using Node.js with Express for better performance.",
        "The design mockups look great! For the frontend, Next.js would be perfect for this type of project.",
        "I notice you're targeting the Moroccan market. Have you considered adding Arabic language support?",
        "Based on the budget mentioned, here's a breakdown of how to allocate resources effectively..."
      ];

      const aiMessage = {
        id: messages.length + 2,
        sender: "ai",
        text: uploadedFile 
          ? `I've received your "${uploadedFile.name}" file (${(uploadedFile.size / 1024).toFixed(1)} KB). Analyzing the project structure now... ${aiResponses[Math.floor(Math.random() * aiResponses.length)]}`
          : aiResponses[Math.floor(Math.random() * aiResponses.length)],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setIsUploading(true);
      
      // Simulate upload
      setTimeout(() => {
        setUploadedFile(file);
        setIsUploading(false);
        
        // Auto-send message about uploaded file
        const fileMessage = {
          id: messages.length + 1,
          sender: "user",
          text: `Uploaded PDF: ${file.name}`,
          timestamp: new Date(),
          file: file
        };
        
        setMessages(prev => [...prev, fileMessage]);
        
        // AI response
        setTimeout(() => {
          const aiMessage = {
            id: messages.length + 2,
            sender: "ai",
            text: `📄 I've received your project structure document "${file.name}". Analyzing the 12-page PDF now...\n\nBased on the structure, I recommend:\n1. Implementing a modular architecture\n2. Adding API documentation\n3. Setting up CI/CD pipeline\n4. Creating comprehensive test suites\n\nWould you like me to generate specific technical specifications from this?`,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, aiMessage]);
        }, 1500);
      }, 1500);
    } else {
      alert("Please upload a PDF file only.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleGenerateFromChat = () => {
    handleGenerateAll();
    setActiveTab("content");
    
    // Add AI message about generation
    const aiMessage = {
      id: messages.length + 1,
      sender: "ai",
      text: "I've generated comprehensive project documents based on our discussion and your uploaded project structure. Check the 'Generated Content' tab to view and download them.",
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, aiMessage]);
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === "chat"
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              💬 AI Chat Assistant
            </button>
            <button
              onClick={() => setActiveTab("content")}
              className={`px-6 py-3 font-medium text-sm transition-colors ${
                activeTab === "content"
                  ? "border-b-2 border-primary text-primary"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              📄 Generated Content
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === "chat" ? (
            /* Chat Interface */
            <div className="space-y-6">
              {/* Chat Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">AI Project Assistant</h3>
                  <p className="text-sm text-gray-600">Upload your "AI PDF Project Structure" and discuss project requirements</p>
                </div>
                <button
                  onClick={handleGenerateFromChat}
                  className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Generate Documents
                </button>
              </div>

              {/* Chat Container */}
              <div className="bg-gray-50 rounded-lg border border-gray-200 h-[500px] flex flex-col">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.sender === "user"
                            ? "bg-primary text-white rounded-tr-none"
                            : "bg-white border border-gray-200 rounded-tl-none"
                        }`}
                      >
                        {message.file && (
                          <div className={`mb-2 p-2 rounded ${message.sender === "user" ? "bg-primary-dark" : "bg-blue-50"}`}>
                            <div className="flex items-center gap-2">
                              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              <div>
                                <p className="text-sm font-medium">{message.file.name}</p>
                                <p className="text-xs opacity-75">{(message.file.size / 1024).toFixed(1)} KB • PDF</p>
                              </div>
                            </div>
                          </div>
                        )}
                        <p className="text-sm">{message.text}</p>
                        <p className={`text-xs mt-1 ${message.sender === "user" ? "text-blue-200" : "text-gray-500"}`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t border-gray-200 p-4">
                  {/* File Upload Status */}
                  {uploadedFile && (
                    <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-md flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-green-700">
                          Ready: {uploadedFile.name}
                        </span>
                      </div>
                      <button
                        onClick={() => setUploadedFile(null)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {/* File Upload Button */}
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={isUploading}
                      />
                      <div className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2">
                        {isUploading ? (
                          <>
                            <svg className="w-4 h-4 animate-spin text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="text-sm">Uploading...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="text-sm">Upload PDF</span>
                          </>
                        )}
                      </div>
                    </label>

                    {/* Message Input */}
                    <div className="flex-1 relative">
                      <textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask about project structure or upload your AI PDF..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none pr-10 resize-none"
                        rows={1}
                        style={{ minHeight: "40px", maxHeight: "120px" }}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() && !uploadedFile}
                        className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded ${
                          !inputMessage.trim() && !uploadedFile
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-primary hover:text-primary-dark"
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mt-2">
                    Upload your "AI PDF Project Structure" document or ask questions about project requirements, architecture, or implementation details.
                  </p>
                </div>
              </div>

              {/* Quick Prompts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => setInputMessage("Analyze the project structure and suggest improvements")}
                  className="text-left p-3 border border-gray-200 rounded-md hover:border-primary hover:bg-blue-50 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900">Analyze Structure</p>
                  <p className="text-xs text-gray-600">Get AI suggestions for project architecture</p>
                </button>
                <button
                  onClick={() => setInputMessage("Generate technical specifications from my document")}
                  className="text-left p-3 border border-gray-200 rounded-md hover:border-primary hover:bg-blue-50 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900">Tech Specs</p>
                  <p className="text-xs text-gray-600">Create detailed technical requirements</p>
                </button>
                <button
                  onClick={() => setInputMessage("What's missing from my current project structure?")}
                  className="text-left p-3 border border-gray-200 rounded-md hover:border-primary hover:bg-blue-50 transition-colors"
                >
                  <p className="text-sm font-medium text-gray-900">Gap Analysis</p>
                  <p className="text-xs text-gray-600">Identify missing components and requirements</p>
                </button>
              </div>
            </div>
          ) : (
            /* Generated Content */
            <div className="space-y-6">
              {/* Generation Controls */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Generated Project Content</h3>
                  <p className="text-sm text-gray-600">AI-generated documents based on project requirements</p>
                </div>
                <button
                  onClick={handleGenerateAll}
                  disabled={isGenerating}
                  className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center gap-2 ${
                    isGenerating
                      ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                      : "bg-primary text-white hover:bg-primary-dark"
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Regenerate All
                    </>
                  )}
                </button>
              </div>

              {/* Content Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Project Brief */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-blue-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-gray-900">Project Brief</h4>
                    </div>
                    <button
                      onClick={() => handleDownload(generatedContent.projectBrief, "project-brief.txt")}
                      className="text-sm text-primary hover:text-primary-dark"
                    >
                      Download
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="bg-gray-50 rounded-md p-3 font-mono text-sm h-64 overflow-y-auto whitespace-pre-wrap">
                      {generatedContent.projectBrief || "Generate content to see project brief here..."}
                    </div>
                  </div>
                </div>

                {/* Design Mockups */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-purple-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-gray-900">Design Mockups</h4>
                    </div>
                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                      {generatedContent.designMockups.length} files
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3">
                      {generatedContent.designMockups.map((mockup) => (
                        <div key={mockup.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              mockup.status === "completed" ? "bg-green-500" :
                              mockup.status === "in-progress" ? "bg-yellow-500" : "bg-gray-300"
                            }`}></div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{mockup.name}</p>
                              <p className="text-xs text-gray-500 capitalize">{mockup.status}</p>
                            </div>
                          </div>
                          <button className="text-sm text-primary hover:text-primary-dark">
                            Preview
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Content Plan */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-green-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-gray-900">Content Plan</h4>
                    </div>
                    <button
                      onClick={() => handleDownload(generatedContent.contentPlan, "content-plan.txt")}
                      className="text-sm text-primary hover:text-primary-dark"
                    >
                      Download
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="bg-gray-50 rounded-md p-3 font-mono text-sm h-64 overflow-y-auto whitespace-pre-wrap">
                      {generatedContent.contentPlan || "Generate content to see content plan here..."}
                    </div>
                  </div>
                </div>

                {/* Technical Specs */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-red-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-gray-900">Technical Specifications</h4>
                    </div>
                    <button
                      onClick={() => handleDownload(generatedContent.technicalSpecs, "technical-specs.txt")}
                      className="text-sm text-primary hover:text-primary-dark"
                    >
                      Download
                    </button>
                  </div>
                  <div className="p-4">
                    <div className="bg-gray-50 rounded-md p-3 font-mono text-sm h-64 overflow-y-auto whitespace-pre-wrap">
                      {generatedContent.technicalSpecs || "Generate content to see technical specs here..."}
                    </div>
                  </div>
                </div>
              </div>

              {/* Full SEO Analysis */}
              <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-yellow-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-gray-900">SEO Analysis Report</h4>
                  </div>
                  <button
                    onClick={() => handleDownload(generatedContent.seoAnalysis, "seo-analysis.txt")}
                    className="text-sm text-primary hover:text-primary-dark"
                  >
                    Download
                  </button>
                </div>
                <div className="p-4">
                  <div className="bg-gray-50 rounded-md p-3 font-mono text-sm h-48 overflow-y-auto whitespace-pre-wrap">
                    {generatedContent.seoAnalysis || "Generate content to see SEO analysis here..."}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => handleDownload(
                    Object.values(generatedContent).filter(v => typeof v === 'string').join('\n\n==========\n\n'),
                    "complete-project-documents.txt"
                  )}
                  className="px-4 py-2 border border-primary text-primary rounded-md hover:bg-primary hover:text-white transition-colors"
                >
                  Download All as ZIP
                </button>
                <button
                  onClick={() => setActiveTab("chat")}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Back to AI Chat
                </button>
                <button
                  onClick={() => alert("Shared with team successfully!")}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Share with Team
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneratedTab;