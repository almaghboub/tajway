import axios, { AxiosInstance } from 'axios';

const DARB_ASSABIL_API_BASE = 'https://v2.sabil.ly';
const DARB_ASSABIL_API_VERSION = '1.0.0';
const DEFAULT_SERVICE_ID = '6783c612dcf305c9e775c987';

const CITY_NAME_MAP: Record<string, string> = {
  'tripoli': 'طرابلس',
  'tajoura': 'تاجوراء',
  'tajura': 'تاجوراء',
  'tarhuna': 'ترهونة',
  'tarhunah': 'ترهونة',
  'misrata': 'مصراتة',
  'misurata': 'مصراتة',
  'misratah': 'مصراتة',
  'benghazi': 'بنغازي',
  'bengazi': 'بنغازي',
  'sebha': 'سبها',
  'sabha': 'سبها',
  'zawiya': 'الزاوية',
  'zawia': 'الزاوية',
  'alzawiya': 'الزاوية',
  'al-zawiya': 'الزاوية',
  'zliten': 'الخمس',
  'zlitan': 'الخمس',
  'khoms': 'الخمس',
  'alkhoms': 'الخمس',
  'al-khoms': 'الخمس',
  'gharyan': 'غريان',
  'gharian': 'غريان',
  'sirte': 'سرت',
  'sirt': 'سرت',
  'derna': 'درنة',
  'darnah': 'درنة',
  'tobruk': 'طبرق',
  'tubrug': 'طبرق',
  'bayda': 'البيضاء',
  'al-bayda': 'البيضاء',
  'albayda': 'البيضاء',
  'marj': 'المرج',
  'al-marj': 'المرج',
  'almarj': 'المرج',
  'sabratha': 'صبراتة',
  'sabratah': 'صبراتة',
  'zuwarah': 'زوارة',
  'zuwara': 'زوارة',
  'ajdabiya': 'اجدابيا',
  'ejdabia': 'اجدابيا',
  'bani walid': 'بني وليد',
  'baniwalid': 'بني وليد',
  'brega': 'البريقة',
  'buraiqah': 'البريقة',
  'jufra': 'الجفرة',
  'aljufra': 'الجفرة',
  'al-jufra': 'الجفرة',
  'kufra': 'الكفرة',
  'alkufra': 'الكفرة',
  'al-kufra': 'الكفرة',
  'ras lanuf': 'رأس لانوف',
  'raslanuf': 'رأس لانوف',
  'jalu': 'جالو اوجلة',
  'awjila': 'جالو اوجلة',
  'quba': 'القبة',
  'al-quba': 'القبة',
  'qasr khiar': 'قصر خيار',
  'ajaylat': 'العجيلات',
  'ajelat': 'العجيلات',
};

interface DarbAssabilOrderItem {
  name: string;
  quantity: number;
  price: number;
  weight?: number;
}

interface DarbAssabilAddress {
  city: string;
  area?: string;
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
  serviceId?: string;
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
  private getApiToken(): string | undefined {
    const raw = process.env.DARB_ASSABIL_API_TOKEN;
    return raw ? raw.trim() : undefined;
  }

  private getAccountId(): string | undefined {
    return process.env.DARB_ASSABIL_ACCOUNT_ID;
  }

  private createClient(): AxiosInstance {
    const token = this.getApiToken();
    const accountId = this.getAccountId();

    if (!token || !accountId) {
      throw new Error('Darb Assabil API credentials not configured');
    }

    return axios.create({
      baseURL: `${DARB_ASSABIL_API_BASE}/api`,
      headers: {
        'Authorization': `apikey ${token}`,
        'Content-Type': 'application/json',
        'X-API-VERSION': DARB_ASSABIL_API_VERSION,
        'X-ACCOUNT-ID': accountId,
      },
      timeout: 30000,
    });
  }

  private translateCity(city: string): string {
    if (!city) return city;
    const arabicPattern = /[\u0600-\u06FF]/;
    if (arabicPattern.test(city)) return city;
    const normalized = city.toLowerCase().trim();
    const mapped = CITY_NAME_MAP[normalized];
    if (mapped) {
      console.log(`[DarbAssabil] City translated: "${city}" → "${mapped}"`);
      return mapped;
    }
    console.log(`[DarbAssabil] No translation for city "${city}", using as-is`);
    return city;
  }

  private formatPhone(phone: string): string {
    let cleaned = phone.replace(/\s+/g, '');
    if (cleaned.startsWith('00218')) {
      cleaned = '+218' + cleaned.slice(5);
    } else if (cleaned.startsWith('218')) {
      cleaned = '+218' + cleaned.slice(3);
    } else if (cleaned.startsWith('09') || cleaned.startsWith('092') || cleaned.startsWith('091')) {
      cleaned = '+218' + cleaned.slice(1);
    } else if (!cleaned.startsWith('+')) {
      cleaned = '+218' + cleaned;
    }
    return cleaned;
  }

  private async findOrCreateContact(client: AxiosInstance, name: string, phone: string): Promise<string> {
    const formattedPhone = this.formatPhone(phone);

    const searchResponse = await client.get(`/contacts?phone=${encodeURIComponent(formattedPhone)}&limit=1`);
    if (searchResponse.data?.status && searchResponse.data?.data?.results?.length > 0) {
      const existingContact = searchResponse.data.data.results[0];
      console.log('[DarbAssabil] Found existing contact:', existingContact._id);
      return existingContact._id;
    }

    console.log('[DarbAssabil] Creating new contact:', { name, phone: formattedPhone });
    const createResponse = await client.post('/contacts', {
      name,
      phone: formattedPhone,
    });

    if (createResponse.data?.status && createResponse.data?.data?._id) {
      console.log('[DarbAssabil] Created contact:', createResponse.data.data._id);
      return createResponse.data.data._id;
    }

    throw new Error('Failed to create contact in Darb Assabil');
  }

  async createOrder(payload: CreateOrderPayload): Promise<DarbAssabilOrderResponse> {
    try {
      const client = this.createClient();

      const contactId = await this.findOrCreateContact(
        client,
        payload.receiverName,
        payload.receiverPhone
      );

      const shipmentData = {
        service: payload.serviceId || DEFAULT_SERVICE_ID,
        notes: payload.notes || '',
        contacts: [contactId],
        products: payload.items.map(item => ({
          title: item.name,
          quantity: item.quantity,
          amount: item.price,
          currency: 'lyd',
          isChargeable: true,
        })),
        paymentBy: payload.collectOnDelivery ? 'receiver' : 'sender',
        to: {
          countryCode: 'lby',
          city: this.translateCity(payload.receiverAddress.city),
          area: this.translateCity(payload.receiverAddress.area || payload.receiverAddress.city),
          address: payload.receiverAddress.street || payload.receiverAddress.notes || '',
        },
      };

      console.log('=== Darb Assabil V2 Create Shipment ===');
      console.log('[DarbAssabil] Contact ID:', contactId);
      console.log('[DarbAssabil] Payload:', JSON.stringify(shipmentData, null, 2));

      const response = await client.post('/local/shipments', shipmentData);

      console.log('[DarbAssabil] Response status:', response.status);

      if (response.data?.status === false) {
        const messages = response.data.messages?.map((m: any) => m.message || m).join(', ') || '';
        return {
          success: false,
          error: messages || 'Order rejected by Darb Assabil',
          message: 'Failed to create order in Darb Assabil system',
        };
      }

      const orderData = response.data?.data || response.data;

      return {
        success: true,
        data: {
          orderId: orderData?._id || '',
          reference: orderData?.reference || '',
          trackingNumber: orderData?.reference || '',
          status: orderData?.status || 'pending',
        },
      };
    } catch (error: any) {
      console.error('=== Darb Assabil API Error ===');
      console.error('[DarbAssabil] Status:', error.response?.status);
      console.error('[DarbAssabil] Response:', JSON.stringify(error.response?.data));
      console.error('[DarbAssabil] Message:', error.message);

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
      const client = this.createClient();
      const response = await client.get(`/local/shipments/${orderId}`);

      if (response.data?.status === false) {
        const messages = response.data.messages?.map((m: any) => m.message || m).join(', ') || '';
        return { success: false, error: messages || 'Failed to fetch order status' };
      }

      return { success: true, data: response.data?.data || response.data };
    } catch (error: any) {
      const apiError = error.response?.data;
      const messages = apiError?.messages?.map((m: any) => m.message || m).join(', ') || '';
      return { success: false, error: messages || apiError?.message || error.message };
    }
  }

  async trackOrder(reference: string): Promise<any> {
    try {
      const client = this.createClient();
      const response = await client.get(`/public/local/shipments/?reference=${encodeURIComponent(reference)}`);

      if (response.data?.status === false) {
        const messages = response.data.messages?.map((m: any) => m.message || m).join(', ') || '';
        return { success: false, error: messages || 'Failed to track order' };
      }

      return { success: true, data: response.data?.data || response.data };
    } catch (error: any) {
      const apiError = error.response?.data;
      const messages = apiError?.messages?.map((m: any) => m.message || m).join(', ') || '';
      return { success: false, error: messages || apiError?.message || error.message };
    }
  }

  async getServices(): Promise<any> {
    try {
      const client = this.createClient();
      const response = await client.get('/local/service/rates/public/?limit=50');
      return { success: true, data: response.data?.data?.results || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getBranches(): Promise<any> {
    try {
      const client = this.createClient();
      const response = await client.get('/local/branches/public/?limit=100');
      return { success: true, data: response.data?.data?.results || [] };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async calculateShipping(fromCity: string, toCity: string): Promise<any> {
    try {
      const client = this.createClient();
      const response = await client.post('/local/shipments/calculate/shipping', {
        from: { city: fromCity },
        to: { city: toCity },
      });
      return { success: true, data: response.data?.data || response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.messages?.[0]?.message || error.message };
    }
  }

  isConfigured(): boolean {
    return !!(this.getApiToken() && this.getAccountId());
  }
}

export const darbAssabilService = new DarbAssabilService();
