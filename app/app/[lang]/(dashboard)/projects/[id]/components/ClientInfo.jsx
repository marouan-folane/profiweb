import React from 'react';

const ClientInfo = ({
  formData,
  handleInputChange,
  validationErrors,
  requiredFields,
  disabled
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 mb-6">
      <div className="bg-primary px-6 py-4">
        <h3 className="text-lg font-semibold text-white">2. Client Information</h3>
      </div>
      <div className="p-6 space-y-4">
        {/* Client Company Name */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Client Company Name
            {requiredFields.includes('client.name') && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="text"
            value={formData.client?.name || ""}
            onChange={(e) => handleInputChange('client.name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none ${validationErrors['client.name'] ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Enter client company name"
            disabled={disabled}
            data-field="client.name" // Add this attribute
          />
          {validationErrors['client.name'] && (
            <p className="text-sm text-red-600">{validationErrors['client.name']}</p>
          )}
        </div>

        {/* Contact Person Name */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Contact Person Name
          </label>
          <input
            type="text"
            value={formData.client?.contactPerson?.name || ""}
            onChange={(e) => handleInputChange('client.contactPerson.name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none ${validationErrors['client.contactPerson.name'] ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="Person responsible for the project"
            disabled={disabled}
          />
        </div>

        {/* Contact Email */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Contact Email
            {requiredFields.includes('client.contactPerson.email') && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="email"
            value={formData.client?.contactPerson?.email || ""}
            onChange={(e) => handleInputChange('client.contactPerson.email', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none ${validationErrors['client.contactPerson.email'] ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="project.contact@company.com"
            disabled={disabled}
          />
          {validationErrors['client.contactPerson.email'] && (
            <p className="text-sm text-red-600">{validationErrors['client.contactPerson.email']}</p>
          )}
        </div>

        {/* Contact Phone */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Contact Phone
          </label>
          <input
            type="number"
            value={formData.client?.contactPerson?.phone || ""}
            onChange={(e) => handleInputChange('client.contactPerson.phone', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary focus:border-primary outline-none ${validationErrors['client.contactPerson.phone'] ? 'border-red-500' : 'border-gray-300'}`}
            placeholder="+212 XXX-XXXXXX"
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
};

export default ClientInfo;