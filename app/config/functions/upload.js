// config/functions/upload.js
import { api } from "../axios.config";

export const uploadFiles = async (files, projectId, folderId, token) => {
    try {
        console.log("files: ", files);
        console.log("projectId: ", projectId);
        console.log("folderId: ", folderId);
        console.log("token: ", token);

        const formData = new FormData();

        // Append files
        files.forEach(file => {
            formData.append('files', file);
        });

        // Append projectId if provided
        if (projectId) {
            console.log("📤 Appending projectId to FormData:", projectId);
            formData.append('projectId', projectId);
        }

        // Append folderId if provided
        if (folderId) {
            console.log("📤 Appending folderId to FormData:", folderId);
            formData.append('folderId', folderId);
        }

        // Determine destination URL and headers
        let endpoint = "/upload";
        let headers = {
            'Content-Type': 'multipart/form-data',
        };

        // For temporary uploads with token
        if (token) {
            console.log("📤 Using token for upload");
            endpoint = `/upload/temp?token=${token}`;

            // Disable Authorization header to avoid interceptor adding session token
            headers['Authorization'] = undefined;

            // Also append token to FormData as backup
            formData.append('token', token);
        }

        console.log("📤 Upload Function Called:");
        console.log("  files count:", files.length);
        console.log("  projectId:", projectId);
        console.log("  folderId:", folderId);
        console.log("  token:", token ? "present" : "not present");
        console.log("  endpoint:", endpoint);

        const response = await api.post(endpoint, formData, {
            headers: headers,
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                console.log(`Upload progress: ${percentCompleted}%`);
            }
        });

        console.log("✅ Upload successful:", response.data);
        return response.data;
    } catch (error) {
        console.error("❌ Upload error:", error);

        // Provide better error information
        if (error.response) {
            console.error("Error response data:", error.response.data);
            console.error("Error status:", error.response.status);
            console.error("Error headers:", error.response.headers);
            throw error.response.data;
        } else if (error.request) {
            console.error("No response received:", error.request);
            throw { message: "No response from server. Check your network connection." };
        } else {
            console.error("Error setting up request:", error.message);
            throw { message: error.message };
        }
    }
};

export const uploadFilesClient = async (files, projectId) => {
    try {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        const endpoint = `/upload/client/${projectId}`;
        const response = await api.post(endpoint, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': undefined
            },
            onUploadProgress: (progressEvent) => {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                console.log(`Upload progress: ${percentCompleted}%`);
            }
        });
        return response.data;
    } catch (error) {
        if (error.response) throw error.response.data;
        if (error.request) throw { message: "No response from server. Check your network connection." };
        throw { message: error.message };
    }
};