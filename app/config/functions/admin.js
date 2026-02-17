// @/config/functions/user

import { api } from "../axios.config";

export const createUser = async (data) => {
    try {
        const response = await api.post("/admins/users/add", data);
        return response.data;
    } catch (error) {
        console.log("error.response.data ==> ", error);
        
        return error.response.data;
    }
};

export const getAllUsers = async () => {
    try {
        const response = await api.get("/admins/users/all");
        return response.data;
    } catch (error) {
        return error.response.data;
    }
};

export const deactivateUserById = async (userId) => {
    try {
        const response = await api.delete(`/admins/users/${userId}/deactivate`);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
};

export const activateUserById = async (userId) => {
    try {
        const response = await api.post(`/admins/users/${userId}/activate`);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
};

export const deleteUserPermanently = async (userId) => {
    try {
        const response = await api.delete(`/admins/users/${userId}/permanent`);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
};