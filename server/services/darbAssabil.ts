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

      console.log('Darb Assabil: Sending to', `/orders/${USERNAME}/?autoGenerateRef=true`);

      const response = await this.apiClient.post(
        `/orders/${USERNAME}/?autoGenerateRef=true`,
        payload
      );

      console.log('Darb Assabil: Raw API response:', JSON.stringify(response.data));

      // The API uses "status" field (true/false) not "success"
      if (response.data && (response.data.status === false || response.data.success === false)) {
        const messages = response.data.messages?.map((m: any) => m.message || m).join(', ') || '';
        return {
          success: false,
          error: messages || response.data.error || response.data.message || 'Order rejected by Darb Assabil',
          message: messages || response.data.message || 'Failed to create order in Darb Assabil system',
        };
      }

      // Extract order data from API response - may be in data field or directly in response
      const orderData = response.data?.data || response.data;
      
      return {
        success: true,
        data: {
          orderId: orderData?.orderId || orderData?.id || orderData?._id || '',
          reference: orderData?.reference || orderData?.ref || '',
          trackingNumber: orderData?.trackingNumber || orderData?.tracking || orderData?.reference || '',
          status: orderData?.status || 'created',
        },
      };
    } catch (error: any) {
      console.error('Darb Assabil API Error:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      
      const apiError = error.response?.data;
      const messages = apiError?.messages?.map((m: any) => m.message || m).join(', ') || '';
      const errorMessage = messages || apiError?.message || apiError?.error || error.message;
      
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

      if (response.data && (response.data.status === false || response.data.success === false)) {
        const messages = response.data.messages?.map((m: any) => m.message || m).join(', ') || '';
        return {
          success: false,
          error: messages || response.data.error || response.data.message || 'Failed to fetch order status',
        };
      }

      return {
        success: true,
        data: response.data?.data || response.data,
      };
    } catch (error: any) {
      console.error('Darb Assabil API Error:', error.response?.data || error.message);
      const apiError = error.response?.data;
      const messages = apiError?.messages?.map((m: any) => m.message || m).join(', ') || '';
      const errorMessage = messages || apiError?.message || apiError?.error || error.message;
      
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

      if (response.data && (response.data.status === false || response.data.success === false)) {
        const messages = response.data.messages?.map((m: any) => m.message || m).join(', ') || '';
        return {
          success: false,
          error: messages || response.data.error || response.data.message || 'Failed to track order',
        };
      }

      return {
        success: true,
        data: response.data?.data || response.data,
      };
    } catch (error: any) {
      console.error('Darb Assabil API Error:', error.response?.data || error.message);
      const apiError = error.response?.data;
      const messages = apiError?.messages?.map((m: any) => m.message || m).join(', ') || '';
      const errorMessage = messages || apiError?.message || apiError?.error || error.message;
      
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
