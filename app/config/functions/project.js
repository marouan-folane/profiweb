// @/config/functions/project.js

import { api } from "../axios.config";

export const getProjects = async () => {
    try {
        const response = await api.get("/projects");
        return response.data;
    } catch (error) {
        return error.response?.data;
    }
};

export const getProjectStats = async () => {
    try {
        const response = await api.get("/projects/stats");
        return response.data;
    } catch (error) {
        return error.response?.data;
    }
};

export const createProject = async (projectData) => {
    try {
        const response = await api.post("/projects", projectData);
        return response.data;
    } catch (error) {
        return error.response?.data;
    }
};

export const updateProject = async (projectId, projectData) => {
    try {
        const response = await api.patch(`/projects/${projectId}`, projectData);
        return response.data;
    } catch (error) {
        return error.response?.data;
    }
};

export const archiveProject = async (projectId) => {
    try {
        const response = await api.patch(`/projects/${projectId}/archived`);
        return response.data;
    } catch (error) {
        return error.response?.data;
    }
};

export const getArchivedProjects = async (params = {}) => {
    try {
        const response = await api.get("/projects/archived", { params });
        return response.data;
    } catch (error) {
        return error.response?.data;
    }
};

export const getClients = async (params = {}) => {
    try {
        const response = await api.get("/clients", { params });
        return response.data;
    } catch (error) {
        return error.response?.data;
    }
};

export const restoreProject = async (id, data) => {
    try {
        const response = await api.patch(`/projects/${id}/restore`, data);
        return response.data;
    } catch (error) {
        return error.response?.data;
    }
};

export const getProject = async (id) => {
    try {
        const response = await api.get(`/projects/${id}`);
        return response.data;
    } catch (error) {
        return error.response?.data;
    }
};

export const createOrUpdateQuestions = async (projectId, data) => {
    try {
        const response = await api.patch(`/projects/${projectId}/questions`, data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error creating/updating questions:', error);

        // Log the actual request data for debugging
        console.log('Request data sent:', data);

        return error.response?.data || {
            error: true,
            message: 'Failed to save questions'
        };
    }
};

export const getQuestionsForProject = async (projectId) => {
    try {
        const response = await api.get(`/projects/${projectId}/questions`);
        return response.data;
    } catch (error) {
        console.error('Error fetching questions questions:', error);
    }
};

export const deleteProject = async (projectId) => {
    try {
        const response = await api.delete(`/projects/${projectId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching questions questions:', error);
    }
};

export const completeInfoQuestionnaire = async (projectId) => {
    try {
        const response = await api.patch(`/projects/${projectId}/complete-info-questionnaire`);
        return response.data;
    } catch (error) {
        return error.response?.data;
    }
};

export const validateContentChecklist = async (projectId) => {
    try {
        const response = await api.patch(`/projects/${projectId}/validate-content-checklist`);
        return response.data;
    } catch (error) {
        return error.response?.data;
    }
};

export const completeContentWorkflow = async (projectId) => {
    try {
        const response = await api.patch(`/projects/${projectId}/complete-content-workflow`);
        return response.data;
    } catch (error) {
        return error.response?.data;
    }
};

export const validateITSetupChecklist = async (projectId) => {
    try {
        const response = await api.patch(`/projects/${projectId}/validate-it-setup-checklist`);
        return response.data;
    } catch (error) {
        return error.response?.data;
    }
};

export const completeITIntegration = async (projectId) => {
    try {
        const response = await api.patch(`/projects/${projectId}/complete-integration`);
        return response.data;
    } catch (error) {
        return error.response?.data;
    }
};

export const validateDesignChecklist = async (projectId) => {
    try {
        const response = await api.patch(`/projects/${projectId}/validate-design-checklist`);
        return response.data;
    } catch (error) {
        return error.response?.data;
    }
};

export const completeDesignWorkflow = async (projectId) => {
    try {
        const response = await api.patch(`/projects/${projectId}/complete-design-workflow`);
        return response.data;
    } catch (error) {
        return error.response?.data;
    }
};

// Toggle visibility of a section or single question (admin only)
// payload: { section: 'business', isVisible: false }
//       OR { questionKey: 'companyName', isVisible: false }
export const toggleQuestionVisibility = async (projectId, payload) => {
    try {
        const response = await api.patch(
            `/projects/${projectId}/questions/visibility`,
            payload
        );
        return response.data;
    } catch (error) {
        return error.response?.data;
    }
};

// Update a single question's metadata: label, placeholder, isRequired (admin only)
// patch: { label?: string, placeholder?: string, isRequired?: boolean }
export const updateQuestionMeta = async (projectId, questionKey, patch) => {
    try {
        const response = await api.patch(
            `/projects/${projectId}/questions/${encodeURIComponent(questionKey)}/meta`,
            patch
        );
        return response.data;
    } catch (error) {
        return error.response?.data;
    }
};