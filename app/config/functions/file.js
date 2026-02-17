import { api } from "../axios.config";

export const deleteFile = async (id) => {
    try {
        const response = await api.delete(`/files/${id}`);
        return response.data;
    } catch (error) {
        console.log("response error: ", error);
        return error?.response?.data;
    }
};