import { api } from "../axios.config";

export const getAllChecklistItems = async () => {
  try {
    const response = await api.get('/checklist/items');
    return response.data;
  } catch (error) {
    console.error("Error fetching checklist items:", error);
    if (error.response) {
      console.error("Error: ", error.response.data);
      return error.response.data;
    }
    throw error;
  }
};

export const getProjectChecklist = async (projectId) => {
  try {
    const response = await api.get(`/checklist/${projectId}/items`);
    return response.data;
  } catch (error) {
    console.error("Error fetching project checklist:", error);
    if (error.response) {
      console.error("Error: ", error.response.data);
      return error.response.data;
    }
    throw error;
  }
};

export const createOrUpdateItem = async (projectId, data) => {
  try {
    const response = await api.post(`/checklist/${projectId}/items`, data);
    return response.data;
  } catch (error) {
    console.error("Error creating/updating checklist item:", error);
    if (error.response) {
      console.error("Error: ", error.response.data);
      return error.response.data;
    }
    throw error;
  }
};

export const deleteChecklistItem = async (projectId, itemId) => {
  try {
    const response = await api.delete(`/checklist/${projectId}/items/${itemId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting checklist item:", error);
    if (error.response) {
      console.error("Error: ", error.response.data);
      return error.response.data;
    }
    throw error;
  }
};

export const bulkUpdateChecklist = async (projectId, data) => {
  try {
    const response = await api.put(`/checklist/${projectId}/items/bulk`, data);
    return response.data;
  } catch (error) {
    console.error("Error bulk updating checklist:", error);
    if (error.response) {
      console.error("Error: ", error.response.data);
      return error.response.data;
    }
    throw error;
  }
};