// components/questions/TemplateSelector.jsx
const TemplateSelector = ({ selectedTemplate, onSelect }) => {
  const templates = [
    {
      id: "wp-business",
      name: "WordPress Business",
      description: "Modern, professional design perfect for corporate websites",
      colors: ["#2563EB", "#1E40AF", "#F3F4F6"],
      category: "Corporate Website"
    },
    {
      id: "wp-ecommerce",
      name: "WordPress E-commerce",
      description: "Optimized for WooCommerce with product-focused layouts",
      colors: ["#059669", "#047857", "#FDE047"],
      category: "WordPress E-commerce"
    },
    {
      id: "wp-landing",
      name: "WordPress Landing Page",
      description: "High-converting single-page design for campaigns",
      colors: ["#8B5CF6", "#6366F1", "#FCA5A5"],
      category: "Landing Page"
    },
    {
      id: "wp-portfolio",
      name: "WordPress Portfolio",
      description: "Visual-focused design for creatives and agencies",
      colors: ["#DC2626", "#EA580C", "#000000"],
      category: "Corporate Website"
    }
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="bg-primary px-6 py-4">
        <h3 className="text-lg font-semibold text-white">WordPress Template Selection</h3>
        <p className="text-sm text-primary-100 mt-1">Choose a template for your website</p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              onClick={() => onSelect(template.id)}
              className={`cursor-pointer border rounded-lg p-4 transition-all hover:shadow-md ${
                selectedTemplate === template.id
                  ? 'border-primary border-2 bg-primary/5 shadow-md'
                  : 'border-gray-200 hover:border-primary'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900">{template.name}</h4>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {template.category}
                  </span>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                  selectedTemplate === template.id
                    ? 'border-primary bg-primary'
                    : 'border-gray-300'
                }`}>
                  {selectedTemplate === template.id && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600 mb-3 min-h-[40px]">{template.description}</p>
              <div className="flex gap-1">
                {template.colors.map((color, idx) => (
                  <div
                    key={idx}
                    className="w-6 h-6 rounded border border-gray-200"
                    style={{ backgroundColor: color }}
                    title={color}
                  ></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;