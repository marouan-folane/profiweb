import { api } from "../axios.config";
export const createNewClient = async (data) => {
    try {
        const response = await api.post("/clients", data);
        return response.data;
    } catch (error) {
        return error?.response?.data;
    }
};

export const getAllClients = async (params) => {
    try {
        const response = await api.get("/clients", { params });
        return response.data;
    } catch (error) {
        return error?.response?.data;
    }
};

export const updateClient = async (id, data) => {
    try {
        const response = await api.patch(`/clients/${id}`, data);
        return response.data;
    } catch (error) {
        return error?.response?.data;
    }
};

export const deleteClient = async (id) => {
    try {
        const response = await api.delete(`/clients/${id}`);
        return response.data;
    } catch (error) {
        return error?.response?.data;
    }
};
