import { api } from "../axios.config";
export const createNewClient = async (data) => {
    try {
        const response = await api.post("/clients", data);
        return response.data;
    } catch (error) {
        return error?.response?.data;
    }
};
