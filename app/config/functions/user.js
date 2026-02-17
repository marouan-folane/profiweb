import { api } from "../axios.config";

export const updateMe = async (data) => {
    try {
        const response = await api.patch('/profile/update-me', data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const updateAvatar = async (formData) => {
    try {
        const response = await api.patch('/profile/update-avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const requestEmailChange = async (data) => {
    try {
        const response = await api.post('/profile/request-email-change', data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const verifyEmailChange = async (data) => {
    try {
        const response = await api.post('/profile/verify-email-change', data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const requestPasswordVerify = async () => {
    try {
        const response = await api.post('/profile/request-password-verify');
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

export const updatePassword = async (data) => {
    try {
        const response = await api.patch('/profile/update-password', data);
        return response.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};
