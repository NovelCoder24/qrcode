import axios from 'axios';

// 1. Create an Axios Instance
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true' // Bypass Ngrok interstitial screen
    },
    withCredentials: true, // Send cookies with every request
});

// 2. Request Interceptor — Attach the access token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// 3. Response Interceptor — Silent refresh on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Only attempt refresh on 401 and if we haven't already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Don't try to refresh auth endpoints or if no token exists (user simply not logged in)
            const skipRefreshUrls = ['/users/refresh', '/users/login', '/users/register', '/users/google', '/users/me'];
            if (skipRefreshUrls.includes(originalRequest.url) || !localStorage.getItem('token')) {
                return Promise.reject(error);
            }

            if (isRefreshing) {
                // Queue this request until the refresh completes
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return api(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // Call the refresh endpoint (cookie is sent automatically)
                const { data } = await api.post('/users/refresh');
                const newAccessToken = data.token;

                // Store the new access token
                localStorage.setItem('token', newAccessToken);

                // Update the failed request's auth header
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                // Process any queued requests
                processQueue(null, newAccessToken);

                // Retry the original request
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed — clear token, let Redux handle redirect
                processQueue(refreshError, null);
                localStorage.removeItem('token');
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
}

export default api;
