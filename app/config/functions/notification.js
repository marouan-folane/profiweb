import { api } from "../axios.config";

export const getUnreadNotifications = async () => {
    try {
        const response = await api.get("/notifications/unread");
        return response.data;
    } catch (error) {
        return error?.response?.data;
    }
};

export const getAllNotifications = async (page = 1, limit = 20) => {
    try {
        const response = await api.get(`/notifications?page=${page}&limit=${limit}`);
        return response.data;
    } catch (error) {
        return error?.response?.data;
    }
};

export const markNotificationRead = async (notificationId) => {
    try {
        const response = await api.patch(`/notifications/${notificationId}/read`);
        return response.data;
    } catch (error) {
        return error?.response?.data;
    }
};

export const markAllNotificationsRead = async () => {
    try {
        const response = await api.patch("/notifications/read-all");
        return response.data;
    } catch (error) {
        return error?.response?.data;
    }
};
