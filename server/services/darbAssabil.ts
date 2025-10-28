import axios from 'axios';

const DARB_ASSABIL_API_BASE = 'https://api.sabil.ly/v1';
const API_TOKEN = process.env.DARB_ASSABIL_API_TOKEN;
const USERNAME = process.env.DARB_ASSABIL_USERNAME;

interface DarbAssabilOrderItem {
  name: string;
  quantity: number;
  price: number;
  weight?: number;
}

interface DarbAssabilAddress {
  city: string;
  street?: string;
  building?: string;
  floor?: string;
  apartment?: string;
  notes?: string;
}

interface CreateOrderPayload {
  receiverName: string;
  receiverPhone: string;
  receiverAddress: DarbAssabilAddress;
  items: DarbAssabilOrderItem[];
  totalAmount: number;
  notes?: string;
  collectOnDelivery?: boolean;
  codAmount?: number;
}

interface DarbAssabilOrderResponse {
  success: boolean;
  data?: {
    orderId: string;
    reference: string;
    trackingNumber?: string;
    status: string;
  };
  error?: string;
  message?: string;
}

export class DarbAssabilService {
  private apiClient;

  constructor() {
    if (!API_TOKEN || !USERNAME) {
      console.warn('Darb Assabil API credentials not configured');
    }

    this.apiClient = axios.create({
      baseURL: DARB_ASSABIL_API_BASE,
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async createOrder(payload: CreateOrderPayload): Promise<DarbAssabilOrderResponse> {
    try {
      if (!API_TOKEN || !USERNAME) {
        throw new Error('Darb Assabil API credentials not configured');
      }

      const response = await this.apiClient.post(
        `/orders/${USERNAME}/?autoGenerateRef=true`,
        payload
      );

      // Check if the API response itself indicates success
      // The API may return HTTP 200 but with success: false in the body
      if (response.data && response.data.success === false) {
        return {
          success: false,
          error: response.data.error || response.data.message || 'Order rejected by Darb Assabil',
          message: response.data.message || 'Failed to create order in Darb Assabil system',
        };
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Darb Assabil API Error:', error.response?.data || error.message);
      
      // Extract detailed error message from API response if available
      const apiError = error.response?.data;
      const errorMessage = apiError?.message || apiError?.error || error.message;
      
      return {
        success: false,
        error: errorMessage,
        message: 'Failed to create order in Darb Assabil system',
      };
    }
  }

  async getOrderStatus(orderId: string): Promise<any> {
    try {
      if (!API_TOKEN || !USERNAME) {
        throw new Error('Darb Assabil API credentials not configured');
      }

      const response = await this.apiClient.get(
        `/orders/${USERNAME}/${orderId}`
      );

      // Check API response success flag
      if (response.data && response.data.success === false) {
        return {
          success: false,
          error: response.data.error || response.data.message || 'Failed to fetch order status',
        };
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Darb Assabil API Error:', error.response?.data || error.message);
      const apiError = error.response?.data;
      const errorMessage = apiError?.message || apiError?.error || error.message;
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  async trackOrder(reference: string): Promise<any> {
    try {
      if (!API_TOKEN || !USERNAME) {
        throw new Error('Darb Assabil API credentials not configured');
      }

      const response = await this.apiClient.get(
        `/tracking/${reference}`
      );

      // Check API response success flag
      if (response.data && response.data.success === false) {
        return {
          success: false,
          error: response.data.error || response.data.message || 'Failed to track order',
        };
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Darb Assabil API Error:', error.response?.data || error.message);
      const apiError = error.response?.data;
      const errorMessage = apiError?.message || apiError?.error || error.message;
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  isConfigured(): boolean {
    return !!(API_TOKEN && USERNAME);
  }
}

export const darbAssabilService = new DarbAssabilService();
