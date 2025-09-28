import { apiRequest } from "./queryClient";
import type { LoginCredentials, User } from "@shared/schema";

export interface AuthResponse {
  user: User;
}

export interface DashboardMetrics {
  totalProfit: number;
  totalRevenue: number;
  activeOrders: number;
  profitMargin: number;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiRequest("POST", "/api/auth/login", credentials);
    return response.json();
  },

  logout: async (): Promise<void> => {
    await apiRequest("POST", "/api/auth/logout");
  },

  me: async (): Promise<AuthResponse> => {
    const response = await apiRequest("GET", "/api/auth/me");
    return response.json();
  },
};

export const analyticsApi = {
  getDashboardMetrics: async (): Promise<DashboardMetrics> => {
    const response = await apiRequest("GET", "/api/analytics/dashboard");
    return response.json();
  },
};
