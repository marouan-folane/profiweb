import { api } from "../axios.config";
export const getFolders = async (projectId) => {
    try {
        const response = await api.get(`/folders/${projectId}/project`);
        return response.data;
    } catch (error) {
        console.log("response error: ", error);
        return error?.response?.data;
    }
};
export const createFolder = async (data) => {
    try {
        const response = await api.post("/folders", data);
        return response.data;
    } catch (error) {
        return error?.response?.data || error;
    }
};

// get files for this folder
export const getFilesByFolder = async (id) => {
    try {
        const response = await api.get(`/folders/${id}`);
        console.log("response: ", response.data)
        return response.data;
    } catch (error) {
        console.log("response error: ", error);
        return error?.response?.data;
    }
};

export const deleteFolder = async (id) => {
    try {
        const response = await api.delete(`/folders/${id}`);
        return response.data;
    } catch (error) {
        console.log("response error: ", error);
        return error?.response?.data;
    }
};