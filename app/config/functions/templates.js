import { api } from "../axios.config";
export const getAllTemplates = async () => {
    try {
        const response = await api.get("/templates");
        return response.data;
    } catch (error) {
        return error.response.data;
    }
};