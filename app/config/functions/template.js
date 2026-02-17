import { api } from "../axios.config";
export const createTemplate = async (data) => {
    try {
        const response = await api.post("/templates", data);
        return response.data;
    } catch (error) {
        return error?.response?.data;
    }
};
export const getTemplates = async () => {
    try {
        const response = await api.get("/templates");
        return response.data;
    } catch (error) {
        return error?.response?.data;
    }
};
export const deleteTemplate = async (id) => {
    try {
        const response = await api.delete(`/templates/${id}`);
        return response.data;
    } catch (error) {
        return error?.response?.data;
    }
};
export const getAllTemplates = async () => {
    try {
        const response = await api.get("/templates");
        return response.data;
    } catch (error) {
        return error?.response?.data;
    }
};
export const getTemplateById = async (id) => {
    try {
        const response = await api.get(`/templates/${id}`);
        return response.data;
    } catch (error) {
        return error?.response?.data;
    }
};

export const updateTemplate = async (id, data) => {
    try {
        const response = await api.patch(`/templates/${id}`, data);
        return response.data;
    } catch (error) {
        return error?.response?.data;
    }
};