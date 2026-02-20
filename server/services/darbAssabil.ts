import axios, { AxiosInstance } from 'axios';

const DARB_ASSABIL_API_BASE = 'https://api.sabil.ly/v1';

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
  private getToken(): string | undefined {
    return process.env.DARB_ASSABIL_API_TOKEN;
  }

  private getUsername(): string | undefined {
    return process.env.DARB_ASSABIL_USERNAME;
  }

  private createClient(): AxiosInstance {
    const token = this.getToken();
    console.log(`Darb Assabil: Token length=${token?.length || 0}, starts with=${token?.substring(0, 8)}...`);
    return axios.create({
      baseURL: DARB_ASSABIL_API_BASE,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async createOrder(payload: CreateOrderPayload): Promise<DarbAssabilOrderResponse> {
    try {
      const token = this.getToken();
      const username = this.getUsername();
      if (!token || !username) {
        throw new Error('Darb Assabil API credentials not configured');
      }

      const client = this.createClient();
      console.log('Darb Assabil: Sending to', `/orders/${username}/?autoGenerateRef=true`);

      const response = await client.post(
        `/orders/${username}/?autoGenerateRef=true`,
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
      const token = this.getToken();
      const username = this.getUsername();
      if (!token || !username) {
        throw new Error('Darb Assabil API credentials not configured');
      }

      const client = this.createClient();
      const response = await client.get(
        `/orders/${username}/${orderId}`
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
      const token = this.getToken();
      const username = this.getUsername();
      if (!token || !username) {
        throw new Error('Darb Assabil API credentials not configured');
      }

      const client = this.createClient();
      const response = await client.get(
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
    return !!(this.getToken() && this.getUsername());
  }
}

export const darbAssabilService = new DarbAssabilService();
