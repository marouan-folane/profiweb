import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { api } from '@/config/axios.config';

const DesignRequirementsInfo = ({
  formData,
  handleInputChange,
  validationErrors,
  requiredFields,
  disabled,
  projectId
}) => {

  // Add this to the imageOptions array:
  const corporateDesignOptions = [
    "",
    "Yes - Complete corporate design available",
    "Partial - Some design elements available",
    "No - Need complete corporate design"
  ];

  // Logo availability options
  const logoOptions = [
    "",
    "Yes - I will provide logo files",
    "No - Need logo design"
  ];

  // Image availability options
  const imageOptions = [
    "",
    "Yes - I will provide professional images",
    "Limited - Have some images but need more",
    "No - Please use stock images"
  ];

  // Tonality options
  const tonalityOptions = [
    "Professional",
    "Reliable",
    "Trustworthy",
    "International",
    "Modern/Cool",
    "Friendly/Everyday",
    "Colloquial/Casual",
    "Luxury/Premium",
    "Innovative/Creative",
    "Traditional/Conservative"
  ];

  // Common brand colors
  const commonColors = [
    { name: "Primary Blue", value: "#2563EB" },
    { name: "Dark Blue", value: "#1E40AF" },
    { name: "Light Blue", value: "#60A5FA" },
    { name: "Red", value: "#DC2626" },
    { name: "Green", value: "#16A34A" },
    { name: "Yellow", value: "#F59E0B" },
    { name: "Purple", value: "#7C3AED" },
    { name: "Pink", value: "#DB2777" },
    { name: "Black", value: "#000000" },
    { name: "White", value: "#FFFFFF" },
    { name: "Gray", value: "#6B7280" },
    { name: "Dark Gray", value: "#374151" }
  ];

  const [newColor, setNewColor] = useState("");
  const [selectedColor, setSelectedColor] = useState("#2563EB");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [uploadLink, setUploadLink] = useState("");
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  // Check if user selected "No - Please use stock images"
  const showImagePreferences = formData.imageAvailability !== "No - Please use stock images";

  // Generate upload link when component mounts or projectId changes
  useEffect(() => {
    const generateUploadLink = async () => {
      if (projectId) {
        try {
          setIsGeneratingLink(true);
          // Use current language from params or default to fr
          const lang = window.location.pathname.split('/')[1] || 'fr';
          const response = await api.get(`/upload/generate-link/${projectId}?lang=${lang}`);
          
          if (response.data && response.data.uploadLink) {
            setUploadLink(response.data.uploadLink);
          } else {
            setUploadLink("Error: Could not generate upload link");
          }
        } catch (error) {
          console.error("Error generating upload link:", error);
          setUploadLink("Error generating link. Please try again later.");
        } finally {
          setIsGeneratingLink(false);
        }
      }
    };

    generateUploadLink();
  }, [projectId]);

  // Copy link to clipboard
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(uploadLink);
      // Show success message (you might want to use your toast system here)
      alert("Link copied to clipboard!");
    } catch (err) {
      console.error('Failed to copy: ', err);
      alert("Failed to copy link");
    }
  };

  const handleTonalityToggle = (tone) => {
    const currentTones = [...(formData.tonality || [])];
    let newTones;

    if (currentTones.includes(tone)) {
      newTones = currentTones.filter(t => t !== tone);
    } else {
      newTones = [...currentTones, tone];
    }

    console.log("Updated tonality array:", newTones);
    handleInputChange('tonality', newTones);
  };

  // Parse color tags from string to array
  const getColorTags = () => {
    if (!formData.colorScheme) return [];
    if (Array.isArray(formData.colorScheme)) return formData.colorScheme;

    // Try to parse as comma-separated string
    if (typeof formData.colorScheme === 'string') {
      return formData.colorScheme
        .split(',')
        .map(color => color.trim())
        .filter(color => color.length > 0);
    }

    return [];
  };

  // Add a new color
  const handleAddColor = (color) => {
    const colorTags = getColorTags();
    const colorValue = color.startsWith('#') ? color : `#${color}`;

    // Validate hex color
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexRegex.test(colorValue)) {
      alert("Please enter a valid hex color code (e.g., #2563EB or #FFF)");
      return;
    }

    // Check if color already exists
    if (colorTags.includes(colorValue)) {
      alert("This color is already added");
      return;
    }

    // Add new color
    const updatedColors = [...colorTags, colorValue];
    handleInputChange('colorScheme', updatedColors.join(', '));
    setNewColor("");
    setShowColorPicker(false);
  };

  // Add color from common colors
  const handleAddCommonColor = (color) => {
    const colorTags = getColorTags();

    if (colorTags.includes(color.value)) {
      alert("This color is already added");
      return;
    }

    const updatedColors = [...colorTags, color.value];
    handleInputChange('colorScheme', updatedColors.join(', '));
  };

  // Remove a color
  const handleRemoveColor = (colorToRemove) => {
    const colorTags = getColorTags();
    const updatedColors = colorTags.filter(color => color !== colorToRemove);
    handleInputChange('colorScheme', updatedColors.join(', '));
  };

  // Handle color picker change
  const handleColorPickerChange = (e) => {
    setSelectedColor(e.target.value);
  };

  // Validate hex color
  const isValidHex = (color) => {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color);
  };

  // Handle key press for adding color
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && newColor.trim()) {
      e.preventDefault();
      handleAddColor(newColor.trim());
    }
  };

  const colorTags = getColorTags();

  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-6">
      <div className="bg-primary px-6 py-4">
        <h3 className="text-lg font-semibold text-white">9. Design Requirements</h3>
      </div>
      <div className="p-6 space-y-4">
        {/* Logo Availability */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Do you have a logo?
          </label>
          <select
            value={formData.logoAvailability || ""}
            onChange={(e) => handleInputChange('logoAvailability', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            disabled={disabled}
          >
            {logoOptions.map((option, idx) => (
              <option key={idx} value={option}>
                {option || "Select an option..."}
              </option>
            ))}
          </select>
        </div>

        {/* Image Availability */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Images for website
          </label>
          <select
            value={formData.imageAvailability || ""}
            onChange={(e) => handleInputChange('imageAvailability', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            disabled={disabled}
          >
            {imageOptions.map((option, idx) => (
              <option key={idx} value={option}>
                {option || "Select an option..."}
              </option>
            ))}
          </select>

          {/* Helper text for stock images selection */}
          {formData.imageAvailability === "No - Please use stock images" && (
            <p className="text-xs text-blue-600 mt-1">
              <Icon icon="mdi:information" className="inline w-4 h-4 mr-1" />
              Image preferences field is hidden as you selected stock images
            </p>
          )}
        </div>

        {/* Image Notes - Only show if not using stock images */}
        {showImagePreferences && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Image Preferences
            </label>
            <textarea
              value={formData.imageNotes || ""}
              onChange={(e) => handleInputChange('imageNotes', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              rows={3}
              placeholder="Any specific image styles or requirements? (optional)"
              disabled={disabled}
            />
            <p className="text-xs text-gray-500">
              Describe preferred image styles, subjects, or any specific requirements
            </p>
          </div>
        )}

        {/* Brand Colors - Improved with tags and color picker */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            Brand Colors
          </label>

          {/* Color tags display */}
          {colorTags.length > 0 && (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {colorTags.map((color, index) => (
                  <div
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 shadow-sm"
                    style={{ backgroundColor: isValidHex(color) ? `${color}20` : '#f3f4f6' }}
                  >
                    <div
                      className="w-5 h-5 rounded-full border border-gray-300"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-sm font-medium text-gray-700">{color}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveColor(color)}
                      className="text-gray-400 hover:text-red-500 ml-1"
                      disabled={disabled}
                    >
                      <Icon icon="mdi:close" className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add color input */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  placeholder="Enter hex color (e.g., #2563EB)"
                  disabled={disabled}
                />
              </div>
              <button
                type="button"
                onClick={() => newColor.trim() && handleAddColor(newColor.trim())}
                disabled={disabled || !newColor.trim()}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Icon icon="mdi:plus" className="w-4 h-4" />
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowColorPicker(!showColorPicker)}
                disabled={disabled}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Icon icon="mdi:palette" className="w-4 h-4" />
                {showColorPicker ? "Hide Picker" : "Color Picker"}
              </button>
            </div>

            {/* Color picker */}
            {showColorPicker && (
              <div className="space-y-2 p-4 border border-gray-200 rounded-md bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-center">
                    <input
                      type="color"
                      value={selectedColor}
                      onChange={handleColorPickerChange}
                      className="w-16 h-16 cursor-pointer"
                      disabled={disabled}
                    />
                    <span className="text-xs text-gray-500 mt-1">Pick color</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-10 h-10 rounded border border-gray-300"
                        style={{ backgroundColor: selectedColor }}
                      />
                      <span className="font-mono text-sm">{selectedColor}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddColor(selectedColor)}
                      disabled={disabled}
                      className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-primary-dark transition-colors flex items-center gap-2"
                    >
                      <Icon icon="mdi:plus" className="w-3 h-3" />
                      Add Selected Color
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Common colors */}
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Common brand colors:</p>
              <div className="flex flex-wrap gap-2">
                {commonColors.map((color, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleAddCommonColor(color)}
                    disabled={disabled || colorTags.includes(color.value)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md border border-gray-200 hover:border-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={`${color.name} - ${color.value}`}
                  >
                    <div
                      className="w-6 h-6 rounded-full border border-gray-300"
                      style={{ backgroundColor: color.value }}
                    />
                    <span className="text-xs text-gray-600">{color.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-500">
              Add your brand colors as hex codes (e.g., #2563EB). Colors will be displayed as tags.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Corporate design available
          </label>
          <select
            value={formData.corporateDesignAvailability || ""}
            onChange={(e) => handleInputChange('corporateDesignAvailability', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none"
            disabled={disabled}
          >
            {corporateDesignOptions.map((option, idx) => (
              <option key={idx} value={option}>
                {option || "Select an option..."}
              </option>
            ))}
          </select>
        </div>

        {/* Tonality - Fixed: Using labels and preventing default */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Design Style & Tone
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tonalityOptions.map((tone, idx) => {
              const isChecked = (formData.tonality || []).includes(tone);
              return (
                <div key={idx} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`tone_${tone.toLowerCase().replace(/\s+/g, '_')}`}
                    checked={isChecked}
                    onChange={() => handleTonalityToggle(tone)}
                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
                    disabled={disabled}
                  />
                  <label
                    htmlFor={`tone_${tone.toLowerCase().replace(/\s+/g, '_')}`}
                    className="ml-2 text-sm text-gray-700 cursor-pointer select-none"
                  >
                    {tone}
                  </label>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-500">
            Select the tone and style that best represents your brand
          </p>
        </div>

        {/* Images Available */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Are there any images for the website?
          </label>
          <div className="flex space-x-4">
            {["Yes", "No", "Limited"].map((option, idx) => (
              <div key={idx} className="flex items-center">
                <input
                  type="radio"
                  id={`images_${option.toLowerCase()}`}
                  name="imagesAvailable"
                  value={option}
                  checked={formData.imagesAvailable === option}
                  onChange={(e) => handleInputChange('imagesAvailable', e.target.value)}
                  className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                  disabled={disabled}
                />
                <label htmlFor={`images_${option.toLowerCase()}`} className="ml-2 text-sm text-gray-700">
                  {option}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Logo Available */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Logo Available?
          </label>
          <div className="flex space-x-4">
            {["Yes", "No", "In Progress"].map((option, idx) => (
              <div key={idx} className="flex items-center">
                <input
                  type="radio"
                  id={`logo_${option.toLowerCase().replace(' ', '_')}`}
                  name="logoAvailable"
                  value={option}
                  checked={formData.logoAvailable === option}
                  onChange={(e) => handleInputChange('logoAvailable', e.target.value)}
                  className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                  disabled={disabled}
                />
                <label htmlFor={`logo_${option.toLowerCase().replace(' ', '_')}`} className="ml-2 text-sm text-gray-700">
                  {option}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Corporate Design Available */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Corporate Design Available?
          </label>
          <div className="flex space-x-4">
            {["Yes", "Partial", "No"].map((option, idx) => (
              <div key={idx} className="flex items-center">
                <input
                  type="radio"
                  id={`corporate_${option.toLowerCase()}`}
                  name="corporateDesignAvailable"
                  value={option}
                  checked={formData.corporateDesignAvailable === option}
                  onChange={(e) => handleInputChange('corporateDesignAvailable', e.target.value)}
                  className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                  disabled={disabled}
                />
                <label htmlFor={`corporate_${option.toLowerCase()}`} className="ml-2 text-sm text-gray-700">
                  {option}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* ============= UPLOAD LINK SECTION - ALWAYS VISIBLE ============= */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Icon icon="mdi:cloud-upload" className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-blue-800">File Upload Link</h4>
                  <p className="text-sm text-blue-600">
                    Use this link to upload logo, images, and other files for the project
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-2 text-sm text-blue-700 mb-1">
                  <Icon icon="mdi:timer" className="w-4 h-4" />
                  <span className="font-medium">Expires in 2 days</span>
                </div>
                <div className="text-xs text-blue-600">
                  This is a temporary upload link
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={uploadLink}
                  readOnly
                  className="flex-1 px-4 py-3 bg-white border border-blue-300 rounded-lg font-mono text-sm text-gray-700 cursor-not-allowed"
                  placeholder={isGeneratingLink ? "Generating upload link..." : "No upload link available"}
                />
                <button
                  type="button"
                  onClick={copyToClipboard}
                  disabled={disabled || !uploadLink || uploadLink.includes("Error") || isGeneratingLink}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {isGeneratingLink ? (
                    <>
                      <Icon icon="mdi:loading" className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Icon icon="mdi:content-copy" className="w-4 h-4" />
                      Copy Link
                    </>
                  )}
                </button>
                <a
                  href={uploadLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`px-6 py-3 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap ${(!uploadLink || uploadLink.includes("Error") || isGeneratingLink) ? 'pointer-events-none opacity-50' : ''}`}
                >
                  <Icon icon="mdi:open-in-new" className="w-4 h-4" />
                  Open Upload Page
                </a>
              </div>

              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <Icon icon="mdi:information" className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-blue-700 font-medium">Important Information:</p>
                    <ul className="text-xs text-blue-600 space-y-1 mt-1">
                      <li className="flex items-start gap-1">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>The link is valid for <span className="font-bold">2 days</span> from generation</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>Maximum file size: 100MB per file</span>
                      </li>
                      <li className="flex items-start gap-1">
                        <span className="text-blue-500 mt-0.5">•</span>
                        <span>Supported formats: Images (JPEG, PNG, GIF, WebP, SVG, BMP), Documents (PDF, Word, Excel, PowerPoint, TXT)</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {uploadLink.includes("Error") && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                  <Icon icon="mdi:alert-circle" className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-700">Unable to generate upload link</p>
                    <p className="text-xs text-red-600 mt-1">
                      Please try refreshing the page or contact support if the issue persists
                    </p>
                  </div>
                  <button
                    onClick={() => window.location.reload()}
                    className="ml-auto px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                  >
                    Refresh
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignRequirementsInfo;