import React, { useState, useEffect } from 'react';
import {
  getProjectChecklist,
  createOrUpdateItem,
  deleteChecklistItem
} from "@/config/functions/checklist";
import { useSession } from 'next-auth/react';

const CheckboxesTab = ({ projectId }) => {
  const { data: session } = useSession();
  const userRole = session?.user?.role?.toLowerCase(); // for department integration is d.i

  // Content Department Checklist (for d.c role)
  const contentDepartmentSections = [
    {
      id: 'content_planning',
      title: "Content Planning & Strategy",
      items: [
        { id: 'content_strategy', label: 'Content strategy document created', checked: false },
        { id: 'target_audience', label: 'Target audience defined and documented', checked: false },
        { id: 'content_calendar', label: 'Content calendar prepared', checked: false },
        { id: 'seo_keywords', label: 'SEO keywords researched and selected', checked: false },
      ]
    },
    {
      id: 'homepage_content',
      title: "Homepage Content",
      items: [
        { id: 'hero_section', label: 'Hero section copy written', checked: false },
        { id: 'value_proposition', label: 'Value proposition clearly defined', checked: false },
        { id: 'services_overview', label: 'Services/products overview content', checked: false },
        { id: 'about_section', label: 'About us section content', checked: false },
        { id: 'cta_sections', label: 'Call-to-action sections written', checked: false },
      ]
    },
    {
      id: 'page_content',
      title: "Page Content Creation",
      items: [
        { id: 'about_page', label: 'About page content complete', checked: false },
        { id: 'services_pages', label: 'Services/products pages content', checked: false },
        { id: 'contact_page', label: 'Contact page with forms and details', checked: false },
        { id: 'blog_posts', label: 'Initial blog posts (3-5 articles)', checked: false },
        { id: 'faq_section', label: 'FAQ section content', checked: false },
      ]
    },
    {
      id: 'seo_content',
      title: "SEO Content Optimization",
      items: [
        { id: 'meta_titles', label: 'Meta titles written for all pages', checked: false },
        { id: 'meta_descriptions', label: 'Meta descriptions optimized', checked: false },
        { id: 'header_tags', label: 'H1, H2, H3 tags properly used', checked: false },
        { id: 'image_alt_tags', label: 'Image alt text written', checked: false },
        { id: 'internal_linking', label: 'Internal linking strategy implemented', checked: false },
      ]
    },
    {
      id: 'content_quality',
      title: "Content Quality Assurance",
      items: [
        { id: 'proofreading', label: 'All content proofread for errors', checked: false },
        { id: 'brand_voice', label: 'Consistent brand voice maintained', checked: false },
        { id: 'readability', label: 'Readability score checked and optimized', checked: false },
        { id: 'legal_compliance', label: 'Legal compliance (GDPR, terms, privacy)', checked: false },
      ]
    }
  ];

  // Design Department Checklist (for d.d role)
  const designDepartmentSections = [
    {
      id: 'visual_identity',
      title: "Visual Identity",
      items: [
        { id: 'color_palette', label: 'Color palette selected and documented', checked: false },
        { id: 'typography', label: 'Typography system established', checked: false },
        { id: 'logo_usage', label: 'Logo usage guidelines created', checked: false },
        { id: 'iconography', label: 'Iconography style defined', checked: false },
      ]
    },
    {
      id: 'layout_design',
      title: "Layout & Wireframing",
      items: [
        { id: 'wireframes', label: 'Website wireframes created', checked: false },
        { id: 'responsive_design', label: 'Responsive design mockups', checked: false },
        { id: 'ui_components', label: 'UI component library created', checked: false },
        { id: 'spacing_system', label: 'Spacing and grid system defined', checked: false },
      ]
    },
    {
      id: 'graphic_elements',
      title: "Graphic Elements",
      items: [
        { id: 'custom_illustrations', label: 'Custom illustrations created', checked: false },
        { id: 'photo_selection', label: 'Photography selected/created', checked: false },
        { id: 'animations', label: 'Micro-animations designed', checked: false },
        { id: 'graphic_patterns', label: 'Graphic patterns/textures', checked: false },
      ]
    }
  ];

  // Integration Department Checklist (for d.i role) - EXPANDED VERSION
  const integrationDepartmentSections = [
    {
      id: 'environment_setup',
      title: "Environment Setup & Preparation",
      items: [
        { id: 'access_received', label: 'Access credentials received from IT Department', checked: false },
        { id: 'dev_environment', label: 'Development environment set up and tested', checked: false },
        { id: 'version_control', label: 'Version control (Git) repository initialized', checked: false },
        { id: 'deployment_pipeline', label: 'Deployment pipeline configured', checked: false },
        { id: 'dependencies_installed', label: 'All project dependencies installed', checked: false },
      ]
    },
    {
      id: 'cms_integration',
      title: "CMS Integration & Configuration",
      items: [
        { id: 'cms_theme', label: 'CMS theme/template installed and activated', checked: false },
        { id: 'cms_plugins', label: 'Required CMS plugins/extensions installed', checked: false },
        { id: 'content_structure', label: 'Content types and taxonomies configured', checked: false },
        { id: 'custom_fields', label: 'Custom fields and meta boxes set up', checked: false },
        { id: 'admin_interface', label: 'Admin interface optimized for content editors', checked: false },
        { id: 'media_library', label: 'Media library configured with proper sizes', checked: false },
      ]
    },
    {
      id: 'frontend_integration',
      title: "Frontend Integration & Development",
      items: [
        { id: 'html_markup', label: 'HTML markup implemented from designs', checked: false },
        { id: 'css_styling', label: 'CSS/Styling completed with responsive design', checked: false },
        { id: 'javascript_interactivity', label: 'JavaScript interactivity and animations', checked: false },
        { id: 'dynamic_content', label: 'Dynamic content integration with CMS', checked: false },
        { id: 'forms_integration', label: 'Contact forms integrated with backend', checked: false },
        { id: 'third_party_apis', label: 'Third-party API integrations (if required)', checked: false },
      ]
    },
    {
      id: 'backend_integration',
      title: "Backend Integration & Functionality",
      items: [
        { id: 'database_setup', label: 'Database schema and connections configured', checked: false },
        { id: 'user_authentication', label: 'User authentication and authorization', checked: false },
        { id: 'api_endpoints', label: 'Custom API endpoints created (if needed)', checked: false },
        { id: 'data_import', label: 'Initial data import/migration completed', checked: false },
        { id: 'cron_jobs', label: 'Scheduled tasks/cron jobs configured', checked: false },
        { id: 'security_measures', label: 'Security measures implemented (CSRF, XSS protection)', checked: false },
      ]
    },
    {
      id: 'testing_qa',
      title: "Testing & Quality Assurance",
      items: [
        { id: 'cross_browser', label: 'Cross-browser compatibility testing', checked: false },
        { id: 'mobile_responsive', label: 'Mobile responsive testing on various devices', checked: false },
        { id: 'performance_testing', label: 'Performance testing and optimization', checked: false },
        { id: 'accessibility_testing', label: 'Accessibility (WCAG) compliance testing', checked: false },
        { id: 'functionality_testing', label: 'Functionality testing - all features work as expected', checked: false },
        { id: 'security_testing', label: 'Security vulnerability testing', checked: false },
        { id: 'load_testing', label: 'Load testing (if applicable)', checked: false },
      ]
    },
    {
      id: 'seo_technical',
      title: "Technical SEO Implementation",
      items: [
        { id: 'sitemap', label: 'XML sitemap generated and submitted', checked: false },
        { id: 'robots_txt', label: 'robots.txt file configured', checked: false },
        { id: 'schema_markup', label: 'Schema.org structured data markup', checked: false },
        { id: 'canonical_tags', label: 'Canonical tags implemented', checked: false },
        { id: 'page_speed', label: 'Page speed optimization completed', checked: false },
        { id: 'ssl_certificate', label: 'SSL certificate installed and verified', checked: false },
      ]
    },
    {
      id: 'analytics_tracking',
      title: "Analytics & Tracking Setup",
      items: [
        { id: 'google_analytics', label: 'Google Analytics/GA4 installed and configured', checked: false },
        { id: 'search_console', label: 'Google Search Console verified', checked: false },
        { id: 'tag_manager', label: 'Google Tag Manager installed (if needed)', checked: false },
        { id: 'conversion_tracking', label: 'Conversion tracking set up', checked: false },
        { id: 'heatmap_tools', label: 'Heatmap/user behavior tools (if required)', checked: false },
      ]
    },
    {
      id: 'pre_launch_checklist',
      title: "Pre-Launch Final Checks",
      items: [
        { id: 'content_review', label: 'All content reviewed and approved', checked: false },
        { id: 'design_review', label: 'Design implementation reviewed', checked: false },
        { id: 'functionality_review', label: 'All functionality tested and verified', checked: false },
        { id: 'broken_links', label: 'Broken links check completed', checked: false },
        { id: 'spell_check', label: 'Spell check and grammar review', checked: false },
        { id: 'image_optimization', label: 'Images optimized for web', checked: false },
        { id: 'backup_system', label: 'Backup system configured and tested', checked: false },
      ]
    },
    {
      id: 'launch_deployment',
      title: "Launch & Deployment",
      items: [
        { id: 'staging_environment', label: 'Staging environment set up and tested', checked: false },
        { id: 'production_deployment', label: 'Production deployment completed', checked: false },
        { id: 'domain_pointing', label: 'Domain pointing verified', checked: false },
        { id: 'ssl_verification', label: 'SSL certificate working on production', checked: false },
        { id: 'dns_propagation', label: 'DNS propagation checked', checked: false },
        { id: 'monitoring_tools', label: 'Monitoring tools configured (uptime, errors)', checked: false },
      ]
    },
    {
      id: 'post_launch_tasks',
      title: "Post-Launch Tasks",
      items: [
        { id: 'analytics_verification', label: 'Analytics tracking verified post-launch', checked: false },
        { id: 'performance_monitoring', label: 'Performance monitoring established', checked: false },
        { id: 'backup_verification', label: 'Backup system verified on production', checked: false },
        { id: 'security_scan', label: 'Post-launch security scan completed', checked: false },
        { id: 'documentation_handoff', label: 'Documentation handed off to client/team', checked: false },
        { id: 'training_sessions', label: 'Training sessions conducted (if required)', checked: false },
        { id: 'support_plan', label: 'Support/maintenance plan established', checked: false },
      ]
    }
  ];

  // Technical Setup Checklist (for D.IT role - original)
  const technicalSetupSections = [
    {
      id: 'input_verification',
      title: "Input Verification",
      items: [
        { id: 'validated_form', label: 'Validated global information form received', checked: false },
        { id: 'template_confirmed', label: 'Selected website template confirmed', checked: false },
        { id: 'domain_reviewed', label: 'Domain information reviewed', checked: false },
        { id: 'hosting_reviewed', label: 'Hosting information reviewed', checked: false },
      ]
    },
    {
      id: 'domain_hosting',
      title: "Domain & Hosting Setup",
      items: [
        { id: 'hosting_access', label: 'Hosting access received and tested', checked: false },
        {
          id: 'domain_connected',
          label: 'Domain connected to hosting (if applicable)',
          checked: false,
          subItems: [
            { id: 'directory_selected', label: 'Correct hosting directory selected', checked: false },
            { id: 'no_conflict', label: 'No conflict with other domains or directories', checked: false },
          ]
        },
      ]
    },
    {
      id: 'template_cms',
      title: "Template & CMS Setup",
      items: [
        { id: 'cms_installed', label: 'CMS installed', checked: false },
        { id: 'stack_installed', label: 'Correct stack installed (matches chosen template)', checked: false },
      ]
    },
    {
      id: 'technical_checks',
      title: "Technical Checks",
      items: [
        { id: 'website_loads', label: 'Website loads correctly', checked: false },
        { id: 'pages_work', label: 'Pages and template structure work properly', checked: false },
        { id: 'no_errors', label: 'No technical errors detected', checked: false },
        { id: 'cache_checked', label: 'Cache checked and issues resolved (if any)', checked: false },
        { id: 'plugins_disabled', label: 'Conflicting or unnecessary plugins disabled', checked: false },
      ]
    },
    {
      id: 'access_management',
      title: "Access Management",
      items: [
        { id: 'access_integration', label: 'Back-office access created for Integration Department', checked: false },
        { id: 'access_design', label: 'Back-office access created for Design Department', checked: false },
        { id: 'access_tested', label: 'All accesses tested and confirmed working', checked: false },
      ]
    },
    {
      id: 'handoff',
      title: "Handoff",
      items: [
        { id: 'technically_ready', label: 'Website technically ready for integration', checked: false },
        { id: 'credentials_integration', label: 'Access credentials delivered to Integration Department', checked: false },
        { id: 'credentials_design', label: 'Access credentials delivered to Design Department', checked: false },
      ]
    }
  ];

  // Determine which checklist to show based on role
  const getChecklistForRole = () => {
    switch(userRole) {
      case 'd.it':
        return {
          title: 'Technical Setup Checklist',
          description: 'Department: IT / Technical - Install the correct template stack in the correct hosting environment',
          sections: technicalSetupSections,
          roleName: 'IT Department'
        };
      case 'd.c':
        return {
          title: 'Content Department Checklist',
          description: 'Department: Content - Create and optimize all website content for engagement and SEO',
          sections: contentDepartmentSections,
          roleName: 'Content Department'
        };
      case 'd.d':
        return {
          title: 'Design Department Checklist',
          description: 'Department: Design - Create visual assets and design system for the website',
          sections: designDepartmentSections,
          roleName: 'Design Department'
        };
      case 'd.in':
        return {
          title: 'Integration Department Checklist',
          description: 'Department: Integration - Implement frontend, backend, and ensure quality standards through deployment',
          sections: integrationDepartmentSections,
          roleName: 'Integration Department'
        };
      default:
        return {
          title: 'Project Checklist',
          description: 'General project tasks and milestones',
          sections: [],
          roleName: 'General'
        };
    }
  };

  const roleChecklist = getChecklistForRole();
  const defaultSections = roleChecklist.sections;

  const [checklistSections, setChecklistSections] = useState(defaultSections);
  const [newItemText, setNewItemText] = useState('');
  const [addingToSection, setAddingToSection] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load checklist data on component mount
  useEffect(() => {
    if (projectId && userRole) {
      loadChecklist();
    }
  }, [projectId, userRole]);

  const loadChecklist = async () => {
    try {
      setLoading(true);
      const response = await getProjectChecklist(projectId);

      if (response.status === 'success') {
        // Merge saved items with default sections
        const savedSections = response.data.sections;

        const mergedSections = defaultSections.map(section => {
          const savedSection = savedSections.find(s => s.id === section.id);
          if (savedSection) {
            // Update items with saved checked status
            const updatedItems = section.items.map(item => {
              const savedItem = savedSection.items.find(si => si.id === item.id);
              return savedItem ? { ...item, checked: savedItem.checked } : item;
            });

            // Add custom items from saved data
            const customItems = savedSection.items
              .filter(item => item.isCustom)
              .map(item => ({
                ...item,
                isCustom: true
              }));

            return {
              ...section,
              items: [...updatedItems, ...customItems]
            };
          }
          return section;
        });

        // Add custom sections that don't exist in defaults
        const customSections = savedSections.filter(savedSection =>
          !defaultSections.some(defaultSection => defaultSection.id === savedSection.id)
        );

        const formattedCustomSections = customSections.map(section => ({
          id: section.id,
          title: section.title || section.id,
          items: section.items.map(item => ({
            ...item,
            isCustom: true
          })),
          isCustom: true
        }));

        setChecklistSections([...mergedSections, ...formattedCustomSections]);
      }
    } catch (error) {
      console.error('Error loading checklist:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save item to backend
  const saveItem = async (item) => {
    if (!projectId) return;

    try {
      setSaving(true);
      await createOrUpdateItem(projectId, {
        itemId: item.id,
        label: item.label,
        checked: item.checked,
        isCustom: item.isCustom || false,
        sectionId: item.sectionId
      });

    } catch (error) {
      console.error('Error saving item:', error);
    } finally {
      setSaving(false);
    }
  };

  // Toggle checkbox
  const toggleCheckbox = async (itemId) => {
    const updatedSections = checklistSections.map(section => {
      const updatedItems = section.items.map(item => {
        // Check main item
        if (item.id === itemId) {
          const updatedItem = {
            ...item,
            checked: !item.checked,
            sectionId: section.id
          };
          saveItem(updatedItem);
          return updatedItem;
        }

        // Check sub-items
        if (item.subItems) {
          const updatedSubItems = item.subItems.map(subItem => {
            if (subItem.id === itemId) {
              const updatedSubItem = {
                ...subItem,
                checked: !subItem.checked,
                sectionId: section.id
              };
              saveItem(updatedSubItem);
              return updatedSubItem;
            }
            return subItem;
          });

          return { ...item, subItems: updatedSubItems };
        }

        return item;
      });

      return { ...section, items: updatedItems };
    });

    setChecklistSections(updatedSections);
  };

  // Add new custom item to a specific section
  const addCustomItem = async (sectionId) => {
    if (!newItemText.trim() || !sectionId) return;

    const newItem = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      label: newItemText,
      checked: false,
      isCustom: true,
      sectionId
    };

    try {
      // Save to backend
      await saveItem(newItem);

      // Update local state
      const updatedSections = checklistSections.map(section => {
        if (section.id === sectionId) {
          return {
            ...section,
            items: [...section.items, newItem]
          };
        }
        return section;
      });

      setChecklistSections(updatedSections);
      setNewItemText('');
      setAddingToSection(null);
    } catch (error) {
      console.error('Error adding custom item:', error);
    }
  };

  // Remove custom item
  const removeCustomItem = async (itemId, sectionId) => {
    try {
      if (projectId) {
        await deleteChecklistItem(projectId, itemId);
      }

      const updatedSections = checklistSections.map(section => {
        if (section.id === sectionId) {
          const updatedItems = section.items.filter(item => item.id !== itemId);
          return { ...section, items: updatedItems };
        }
        return section;
      });

      setChecklistSections(updatedSections);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  // Add new section
  const addNewSection = async () => {
    const sectionName = prompt('Enter new section name:');
    if (!sectionName) return;

    const newSection = {
      id: `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: sectionName,
      items: [],
      isCustom: true
    };

    setChecklistSections([...checklistSections, newSection]);
  };

  // Remove section
  const removeSection = (sectionId) => {
    if (!window.confirm('Are you sure you want to remove this section and all its items?')) return;

    const updatedSections = checklistSections.filter(section => section.id !== sectionId);
    setChecklistSections(updatedSections);
  };

  // Check/uncheck all in section
  const toggleAllInSection = async (sectionId) => {
    const section = checklistSections.find(s => s.id === sectionId);
    if (!section) return;

    const allChecked = section.items.every(item => item.checked);
    const newState = !allChecked;

    const updatedSections = checklistSections.map(section => {
      if (section.id === sectionId) {
        const updatedItems = section.items.map(item => {
          const updatedItem = { ...item, checked: newState, sectionId: section.id };

          // Save each item
          saveItem(updatedItem);

          if (item.subItems) {
            updatedItem.subItems = item.subItems.map(subItem => {
              const updatedSubItem = { ...subItem, checked: newState, sectionId: section.id };
              saveItem(updatedSubItem);
              return updatedSubItem;
            });
          }

          return updatedItem;
        });

        return { ...section, items: updatedItems };
      }
      return section;
    });

    setChecklistSections(updatedSections);
  };

  // Render checklist item
  const renderChecklistItem = (item, sectionId, isSubItem = false) => {
    return (
      <div key={item.id} className={`flex items-start justify-between ${isSubItem ? 'ml-8 mt-2' : 'mb-3'}`}>
        <div className="flex items-center">
          <div className="flex items-center h-5">
            <input
              id={item.id}
              type="checkbox"
              checked={item.checked || false}
              onChange={() => toggleCheckbox(item.id)}
              className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
              disabled={loading || saving}
            />
          </div>
          <label
            htmlFor={item.id}
            className={`ml-3 text-sm cursor-pointer select-none ${item.checked ? 'text-gray-500 line-through' : 'text-gray-700'}`}
          >
            {item.label}
            {item.isCustom && (
              <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                Custom
              </span>
            )}
          </label>
        </div>

        {/* Remove button for custom items */}
        {item.isCustom && !isSubItem && (
          <button
            type="button"
            onClick={() => removeCustomItem(item.id, sectionId)}
            className="text-red-500 hover:text-red-700 text-sm ml-4"
            title="Remove this item"
            disabled={loading || saving}
          >
            Remove
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading checklist...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with role indicator */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{roleChecklist.title}</h2>
            <p className="text-gray-600 text-sm mt-1">
              {roleChecklist.description}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
              {roleChecklist.roleName}
            </span>
            {saving && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                Saving...
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Add Section Button */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={addNewSection}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          disabled={loading || saving}
        >
          + Add New Section
        </button>
      </div>

      {/* Checklist Sections */}
      <div className="space-y-6">
        {checklistSections.map((section) => {
          return (
            <div
              key={section.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden"
            >
              {/* Section Header */}
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">
                      {section.title}
                    </h3>
                    {section.isCustom && (
                      <button
                        type="button"
                        onClick={() => removeSection(section.id)}
                        className="text-xs text-red-500 hover:text-red-700 ml-2"
                        title="Remove this section"
                        disabled={loading || saving}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleAllInSection(section.id)}
                    className="text-sm text-primary hover:text-primary-dark font-medium"
                    disabled={loading || saving}
                  >
                    {section.items.every(item => item.checked) ? 'Uncheck All' : 'Check All'}
                  </button>
                </div>
              </div>

              {/* Checklist Items */}
              <div className="p-4">
                <div className="space-y-3">
                  {section.items.map(item => (
                    <div key={item.id}>
                      {renderChecklistItem(item, section.id)}

                      {/* Sub-items */}
                      {item.subItems && (
                        <div className="ml-6 mt-2 space-y-2 border-l-2 border-gray-200 pl-4">
                          {item.subItems.map(subItem => renderChecklistItem(subItem, section.id, true))}
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Empty state */}
                  {section.items.length === 0 && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No items in this section yet. Click "Add Custom Item" below to add one.
                    </div>
                  )}
                </div>

                {/* Add Item Form for this specific section */}
                {addingToSection === section.id ? (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          New Item Text
                        </label>
                        <input
                          type="text"
                          value={newItemText}
                          onChange={(e) => setNewItemText(e.target.value)}
                          placeholder="Enter checklist item..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          autoFocus
                          disabled={loading || saving}
                        />
                      </div>

                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setNewItemText('');
                            setAddingToSection(null);
                          }}
                          className="px-3 py-1.5 text-gray-700 hover:text-gray-900 text-sm"
                          disabled={loading || saving}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => addCustomItem(section.id)}
                          disabled={!newItemText.trim() || loading || saving}
                          className="px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 text-sm"
                        >
                          {saving ? 'Adding...' : 'Add Item'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Add Custom Item Button for this section */
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setAddingToSection(section.id)}
                      className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                      disabled={loading || saving}
                    >
                      + Add Custom Item to this section
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CheckboxesTab;