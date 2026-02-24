// @/config/functions/controlChecklist.js

import { api } from "../axios.config";

export const getControlChecklist = async (projectId) => {
    try {
        const response = await api.get(`/projects/${projectId}/control-checklist`);
        return response.data;
    } catch (error) {
        return error.response?.data;
    }
};

export const toggleControlChecklistItem = async (projectId, itemData) => {
    try {
        const response = await api.patch(`/projects/${projectId}/control-checklist/toggle`, itemData);
        return response.data;
    } catch (error) {
        return error.response?.data;
    }
};

export const confirmProjectFinished = async (projectId) => {
    try {
        const response = await api.patch(`/projects/${projectId}/confirm-finished`);
        return response.data;
    } catch (error) {
        return error.response?.data;
    }
};
