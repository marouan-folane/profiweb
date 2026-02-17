import { api } from "../axios.config";

export const getGlobalInstructions = async () => {
    try {
        const response = await api.get('/ai-interactions');
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const updateGlobalInstructions = async (data) => {
    try {
        const response = await api.put('/ai-interactions', data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const getInstructionHistory = async () => {
    try {
        const response = await api.get('/ai-interactions/history');
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};
