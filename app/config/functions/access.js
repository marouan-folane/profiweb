// config/functions/access.js
import { api } from "../axios.config";

export const getSiteAccess = async (projectId) => {
    try {
        const response = await api.get(`/site-access/${projectId}`);
        return response.data;
    } catch (error) {
        console.error("Error fetching site access:", error);
        throw error;
    }
};

export const createOrUpdateSiteAccess = async (projectId, data) => {
    try {
        const response = await api.post(`/site-access/${projectId}`, data);
        return response.data;
    } catch (error) {
        console.error("Error creating/updating site access:", error);
        throw error;
    }
};

export const updateSiteAccess = async (projectId, data) => {
    try {
        const response = await api.patch(`/site-access/${projectId}`, data);
        return response.data;
    } catch (error) {
        console.error("Error updating site access:", error);
        throw error;
    }
};

export const getCredentials = async (projectId) => {
    try {
        const response = await api.get(`/site-access/${projectId}/credentials`);
        return response.data;
    } catch (error) {
        console.error("Error getting credentials:", error);
        throw error;
    }
};

export const deleteSiteAccess = async (projectId) => {
    try {
        const response = await api.delete(`/site-access/${projectId}`);
        return response.data;
    } catch (error) {
        console.error("Error deleting site access:", error);
        throw error;
    }
};

// Alias for CreateAccess (keeping backward compatibility)
export const CreateAccess = async (projectId, data) => {
    return createOrUpdateSiteAccess(projectId, data);
};