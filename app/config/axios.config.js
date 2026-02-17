import axios from "axios";
import { getSession } from "next-auth/react";

const baseURL = process.env.NEXT_PUBLIC_API_URL + '/api/v1';

export const api = axios.create({
  baseURL,
});

// Interceptor to automatically add token from session
api.interceptors.request.use(
  async (config) => {
    // Get the session and its token
    const session = await getSession();

    if (session?.apiToken) {
      config.headers["Authorization"] = `Bearer ${session.apiToken}`;
      // console.log("session?.user?.role: " , session?.user?.role);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);