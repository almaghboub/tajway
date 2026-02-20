import axios, { AxiosInstance } from 'axios';

const DARB_ASSABIL_API_BASE = 'https://api.sabil.ly';

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
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  private getUsername(): string | undefined {
    return process.env.DARB_ASSABIL_USERNAME;
  }

  private getPassword(): string | undefined {
    return process.env.DARB_ASSABIL_PASSWORD;
  }

  private getApiToken(): string | undefined {
    const raw = process.env.DARB_ASSABIL_API_TOKEN;
    return raw ? raw.trim() : undefined;
  }

  private async login(): Promise<string> {
    const username = this.getUsername();
    const password = this.getPassword();
    
    if (!username || !password) {
      throw new Error('Darb Assabil login credentials not configured');
    }

    console.log(`[DarbAssabil] Attempting v2 login for user: ${username}`);

    const response = await axios.post(
      `${DARB_ASSABIL_API_BASE}/v2/user/access/`,
      `type=Authorization&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 15000,
      }
    );

    console.log('[DarbAssabil] Login response status:', response.data?.status);
    console.log('[DarbAssabil] Login response code:', response.data?.code);

    if (response.data?.status === false) {
      const messages = response.data.messages?.map((m: any) => m.message || m).join(', ') || '';
      throw new Error(`Login failed: ${messages}`);
    }

    const token = response.data?.data?.token || response.data?.data?.accessToken || response.data?.token || response.data?.accessToken;
    if (!token) {
      console.log('[DarbAssabil] Full login response keys:', Object.keys(response.data || {}));
      console.log('[DarbAssabil] Login data keys:', Object.keys(response.data?.data || {}));
      throw new Error('No access token returned from login');
    }

    this.accessToken = token.trim();
    this.tokenExpiry = Date.now() + (3600 * 1000);
    console.log(`[DarbAssabil] Login successful, token length=${this.accessToken.length}`);
    return this.accessToken;
  }

  private async getValidToken(): Promise<string> {
    if (this.accessToken !== null && Date.now() < this.tokenExpiry) {
      console.log('[DarbAssabil] Using cached access token');
      return this.accessToken as string;
    }

    const password = this.getPassword();
    if (password) {
      try {
        return await this.login();
      } catch (loginError: any) {
        console.log('[DarbAssabil] Login failed, falling back to API token:', loginError.message);
      }
    }

    const apiToken = this.getApiToken();
    if (apiToken) {
      console.log(`[DarbAssabil] Using API token from env`);
      console.log(`[DarbAssabil] Token length: ${apiToken.length}`);
      console.log(`[DarbAssabil] Token preview: ${apiToken.slice(0, 4)}...${apiToken.slice(-4)}`);
      console.log(`[DarbAssabil] Token has whitespace: ${apiToken !== apiToken.trim()}`);
      console.log(`[DarbAssabil] Token has newlines: ${apiToken.includes('\n') || apiToken.includes('\r')}`);
      
      const parts = apiToken.split('.');
      console.log(`[DarbAssabil] JWT parts count: ${parts.length}`);
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          console.log('[DarbAssabil] JWT payload:', JSON.stringify({
            sub: payload.sub,
            iss: payload.iss,
            aud: payload.aud,
            iat: payload.iat,
            exp: payload.exp,
            secretId: payload.secretId?.slice(0, 8) + '...',
          }));
          if (payload.exp) {
            const expDate = new Date(payload.exp * 1000);
            console.log(`[DarbAssabil] Token expires: ${expDate.toISOString()}`);
            console.log(`[DarbAssabil] Token expired: ${Date.now() > payload.exp * 1000}`);
          } else {
            console.log('[DarbAssabil] Token has no expiration field');
          }
        } catch (e) {
          console.log('[DarbAssabil] Could not decode JWT payload');
        }
      }
      
      return apiToken;
    }

    throw new Error('No valid Darb Assabil credentials available');
  }

  private async createClient(): Promise<{ client: AxiosInstance; token: string }> {
    const token = await this.getValidToken();
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    console.log('[DarbAssabil] Final headers:', {
      ...headers,
      'Authorization': `Bearer ***${token.slice(-4)}`,
    });
    console.log('[DarbAssabil] Base URL:', `${DARB_ASSABIL_API_BASE}/v1`);

    const client = axios.create({
      baseURL: `${DARB_ASSABIL_API_BASE}/v1`,
      headers,
      timeout: 30000,
    });

    return { client, token };
  }

  private buildFormData(payload: CreateOrderPayload): string {
    const params = new URLSearchParams();
    
    params.append('title', `Order - ${payload.receiverName}`);
    params.append('servicePackageId', 'tosyl-rgaly');
    params.append('destination[from][city]', 'Tripoli');
    params.append('destination[to][city]', payload.receiverAddress.city);
    params.append('receivers[0][fullName]', payload.receiverName);
    params.append('receivers[0][contact]', payload.receiverPhone);
    
    if (payload.receiverAddress.street) {
      params.append('receivers[0][address]', payload.receiverAddress.street);
    }
    if (payload.receiverAddress.notes || payload.notes) {
      params.append('receivers[0][notes]', payload.receiverAddress.notes || payload.notes || '');
    }

    payload.items.forEach((item, index) => {
      params.append(`products[${index}][title]`, item.name);
      params.append(`products[${index}][amount]`, String(item.price));
      params.append(`products[${index}][quantity]`, String(item.quantity));
      if (item.weight) {
        params.append(`products[${index}][weight]`, String(item.weight));
      }
    });

    if (payload.collectOnDelivery && payload.codAmount) {
      params.append('paymentBy', 'Receiver');
      params.append('codAmount', String(payload.codAmount));
    } else {
      params.append('paymentBy', 'Sender');
    }

    if (payload.notes) {
      params.append('notes', payload.notes);
    }

    return params.toString();
  }

  async createOrder(payload: CreateOrderPayload): Promise<DarbAssabilOrderResponse> {
    try {
      const username = this.getUsername();
      if (!username) {
        throw new Error('Darb Assabil username not configured');
      }

      const { client } = await this.createClient();
      const formData = this.buildFormData(payload);
      const endpoint = `/orders/${username}/?autoGenerateRef=true`;

      console.log('=== Darb Assabil Send Request ===');
      console.log('[DarbAssabil] Endpoint:', endpoint);
      console.log('[DarbAssabil] Full URL:', `${DARB_ASSABIL_API_BASE}/v1${endpoint}`);
      console.log('[DarbAssabil] Method: POST');
      console.log('[DarbAssabil] Form data length:', formData.length);

      const response = await client.post(endpoint, formData);

      console.log('[DarbAssabil] Response status:', response.status);
      console.log('[DarbAssabil] Response body:', JSON.stringify(response.data));

      if (response.data && (response.data.status === false || response.data.success === false)) {
        const messages = response.data.messages?.map((m: any) => m.message || m).join(', ') || '';
        return {
          success: false,
          error: messages || response.data.error || response.data.message || 'Order rejected by Darb Assabil',
          message: messages || response.data.message || 'Failed to create order in Darb Assabil system',
        };
      }

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
      console.error('=== Darb Assabil API Error ===');
      console.error('[DarbAssabil] Error status:', error.response?.status);
      console.error('[DarbAssabil] Error statusText:', error.response?.statusText);
      console.error('[DarbAssabil] Error response body:', JSON.stringify(error.response?.data));
      console.error('[DarbAssabil] Error code:', error.response?.data?.code);
      console.error('[DarbAssabil] Error message:', error.message);
      
      if (error.response?.status === 403 || error.response?.status === 401) {
        this.accessToken = null;
        this.tokenExpiry = 0;
      }

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
      const username = this.getUsername();
      if (!username) {
        throw new Error('Darb Assabil username not configured');
      }

      const { client } = await this.createClient();
      const response = await client.get(`/orders/${username}/${orderId}`);

      console.log('[DarbAssabil] getOrderStatus response:', response.status, JSON.stringify(response.data));

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
      console.error('[DarbAssabil] getOrderStatus error:', error.response?.status, error.response?.data || error.message);
      if (error.response?.status === 403 || error.response?.status === 401) {
        this.accessToken = null;
        this.tokenExpiry = 0;
      }
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
      const username = this.getUsername();
      if (!username) {
        throw new Error('Darb Assabil username not configured');
      }

      const { client } = await this.createClient();
      const response = await client.get(`/tracking/${reference}`);

      console.log('[DarbAssabil] trackOrder response:', response.status, JSON.stringify(response.data));

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
      console.error('[DarbAssabil] trackOrder error:', error.response?.data || error.message);
      if (error.response?.status === 403 || error.response?.status === 401) {
        this.accessToken = null;
        this.tokenExpiry = 0;
      }
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
    const hasLogin = !!(this.getUsername() && this.getPassword());
    const hasApiToken = !!(this.getApiToken() && this.getUsername());
    return hasLogin || hasApiToken;
  }
}

export const darbAssabilService = new DarbAssabilService();
