import { api } from "../axios.config";

export const getAdminDashboardStats = async () => {
    try {
        const response = await api.get('/stats/admin-dashboard');
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};
