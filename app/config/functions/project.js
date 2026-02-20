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

export const getClients = async () => {
    try {
        const response = await api.get("/clients");
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