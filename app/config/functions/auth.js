import { api } from "../axios.config";
export const LoginFunction = async (data) => {
    try {
        console.log("LoginFunction: ", data);        
        const response = await api.post("/auth/login", data);
        return response.data;
    } catch (error) {
        return error;
    }
};
