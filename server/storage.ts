import {
  type User,
  type InsertUser,
  type Customer,
  type InsertCustomer,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type Inventory,
  type InsertInventory,
  type ShippingRate,
  type InsertShippingRate,
  type OrderWithCustomer,
  type CustomerWithOrders,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { hashPassword } from "./auth";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  // Customers
  getCustomer(id: string): Promise<Customer | undefined>;
  getCustomerWithOrders(id: string): Promise<CustomerWithOrders | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;
  getAllCustomers(): Promise<Customer[]>;

  // Orders
  getOrder(id: string): Promise<Order | undefined>;
  getOrderWithCustomer(id: string): Promise<OrderWithCustomer | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: string): Promise<boolean>;
  getAllOrders(): Promise<OrderWithCustomer[]>;

  // Order Items
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  updateOrderItem(id: string, item: Partial<InsertOrderItem>): Promise<OrderItem | undefined>;
  deleteOrderItem(id: string): Promise<boolean>;

  // Inventory
  getInventoryItem(id: string): Promise<Inventory | undefined>;
  getInventoryBySku(sku: string): Promise<Inventory | undefined>;
  createInventoryItem(item: InsertInventory): Promise<Inventory>;
  updateInventoryItem(id: string, item: Partial<InsertInventory>): Promise<Inventory | undefined>;
  deleteInventoryItem(id: string): Promise<boolean>;
  getAllInventory(): Promise<Inventory[]>;

  // Shipping Rates
  getShippingRate(id: string): Promise<ShippingRate | undefined>;
  getShippingRateByCountry(country: string): Promise<ShippingRate | undefined>;
  createShippingRate(rate: InsertShippingRate): Promise<ShippingRate>;
  updateShippingRate(id: string, rate: Partial<InsertShippingRate>): Promise<ShippingRate | undefined>;
  deleteShippingRate(id: string): Promise<boolean>;
  getAllShippingRates(): Promise<ShippingRate[]>;

  // Analytics
  getTotalProfit(): Promise<number>;
  getTotalRevenue(): Promise<number>;
  getActiveOrdersCount(): Promise<number>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private customers: Map<string, Customer>;
  private orders: Map<string, Order>;
  private orderItems: Map<string, OrderItem>;
  private inventory: Map<string, Inventory>;
  private shippingRates: Map<string, ShippingRate>;
  private orderCounter: number = 1;

  constructor() {
    this.users = new Map();
    this.customers = new Map();
    this.orders = new Map();
    this.orderItems = new Map();
    this.inventory = new Map();
    this.shippingRates = new Map();
    
    // Initialize with default data
    this.initializeDefaultData();
  }

  private async initializeDefaultData() {
    // Create default owner user with hashed password
    const hashedPassword = await hashPassword("admin");
    const defaultUser: User = {
      id: randomUUID(),
      username: "admin",
      password: hashedPassword,
      role: "owner",
      firstName: "Admin",
      lastName: "User",
      email: "admin@lynxly.com",
      isActive: true,
      createdAt: new Date(),
    };
    this.users.set(defaultUser.id, defaultUser);

    // Create default shipping rates
    const defaultRates: ShippingRate[] = [
      {
        id: randomUUID(),
        country: "China",
        baseRate: "25.00",
        perKgRate: "8.00",
        commissionRate: "0.1800",
      },
      {
        id: randomUUID(),
        country: "Turkey",
        baseRate: "30.00",
        perKgRate: "12.00",
        commissionRate: "0.2000",
      },
      {
        id: randomUUID(),
        country: "UK",
        baseRate: "35.00",
        perKgRate: "15.00",
        commissionRate: "0.1500",
      },
      {
        id: randomUUID(),
        country: "UAE",
        baseRate: "40.00",
        perKgRate: "18.00",
        commissionRate: "0.1200",
      },
    ];

    defaultRates.forEach(rate => this.shippingRates.set(rate.id, rate));

    // Create sample inventory
    const sampleInventory: Inventory[] = [
      {
        id: randomUUID(),
        productName: "Premium Widget",
        sku: "PWG-001",
        quantity: 50,
        unitCost: "25.00",
        sellingPrice: "45.00",
        lowStockThreshold: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        productName: "Standard Gadget",
        sku: "SGD-002",
        quantity: 75,
        unitCost: "15.00",
        sellingPrice: "35.00",
        lowStockThreshold: 15,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    sampleInventory.forEach(item => this.inventory.set(item.id, item));
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      role: insertUser.role || "customer_service",
      isActive: insertUser.isActive ?? true,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Customers
  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async getCustomerWithOrders(id: string): Promise<CustomerWithOrders | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;
    
    const orders = Array.from(this.orders.values()).filter(order => order.customerId === id);
    return { ...customer, orders };
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    const customer: Customer = {
      ...insertCustomer,
      id,
      phone: insertCustomer.phone || null,
      address: insertCustomer.address || null,
      city: insertCustomer.city || null,
      postalCode: insertCustomer.postalCode || null,
      createdAt: new Date(),
    };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: string, customerData: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;
    
    const updatedCustomer = { ...customer, ...customerData };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    return this.customers.delete(id);
  }

  async getAllCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  // Orders
  async getOrder(id: string): Promise<Order | undefined> {
    return this.orders.get(id);
  }

  async getOrderWithCustomer(id: string): Promise<OrderWithCustomer | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const customer = this.customers.get(order.customerId);
    if (!customer) return undefined;
    
    const items = Array.from(this.orderItems.values()).filter(item => item.orderId === id);
    
    return { ...order, customer, items };
  }

  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const orderNumber = `ORD-${String(this.orderCounter++).padStart(4, '0')}`;
    const now = new Date();
    
    const order: Order = {
      ...insertOrder,
      id,
      orderNumber,
      status: insertOrder.status || "pending",
      shippingCost: insertOrder.shippingCost || "0.00",
      commission: insertOrder.commission || "0.00",
      profit: insertOrder.profit || "0.00",
      notes: insertOrder.notes || null,
      createdAt: now,
      updatedAt: now,
    };
    this.orders.set(id, order);
    return order;
  }

  async updateOrder(id: string, orderData: Partial<InsertOrder>): Promise<Order | undefined> {
    const order = this.orders.get(id);
    if (!order) return undefined;
    
    const updatedOrder = { ...order, ...orderData, updatedAt: new Date() };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }

  async deleteOrder(id: string): Promise<boolean> {
    // Delete associated order items
    Array.from(this.orderItems.keys())
      .filter(itemId => this.orderItems.get(itemId)?.orderId === id)
      .forEach(itemId => this.orderItems.delete(itemId));
    
    return this.orders.delete(id);
  }

  async getAllOrders(): Promise<OrderWithCustomer[]> {
    const orders: OrderWithCustomer[] = [];
    
    for (const order of Array.from(this.orders.values())) {
      const customer = this.customers.get(order.customerId);
      if (customer) {
        const items = Array.from(this.orderItems.values()).filter(item => item.orderId === order.id);
        orders.push({ ...order, customer, items });
      }
    }
    
    return orders;
  }

  // Order Items
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values()).filter(item => item.orderId === orderId);
  }

  async createOrderItem(insertOrderItem: InsertOrderItem): Promise<OrderItem> {
    const id = randomUUID();
    const item: OrderItem = {
      ...insertOrderItem,
      id,
    };
    this.orderItems.set(id, item);
    return item;
  }

  async updateOrderItem(id: string, itemData: Partial<InsertOrderItem>): Promise<OrderItem | undefined> {
    const item = this.orderItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...itemData };
    this.orderItems.set(id, updatedItem);
    return updatedItem;
  }

  async deleteOrderItem(id: string): Promise<boolean> {
    return this.orderItems.delete(id);
  }

  // Inventory
  async getInventoryItem(id: string): Promise<Inventory | undefined> {
    return this.inventory.get(id);
  }

  async getInventoryBySku(sku: string): Promise<Inventory | undefined> {
    return Array.from(this.inventory.values()).find(item => item.sku === sku);
  }

  async createInventoryItem(insertInventory: InsertInventory): Promise<Inventory> {
    const id = randomUUID();
    const now = new Date();
    const item: Inventory = {
      ...insertInventory,
      id,
      quantity: insertInventory.quantity ?? 0,
      lowStockThreshold: insertInventory.lowStockThreshold ?? 10,
      createdAt: now,
      updatedAt: now,
    };
    this.inventory.set(id, item);
    return item;
  }

  async updateInventoryItem(id: string, itemData: Partial<InsertInventory>): Promise<Inventory | undefined> {
    const item = this.inventory.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...itemData, updatedAt: new Date() };
    this.inventory.set(id, updatedItem);
    return updatedItem;
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    return this.inventory.delete(id);
  }

  async getAllInventory(): Promise<Inventory[]> {
    return Array.from(this.inventory.values());
  }

  // Shipping Rates
  async getShippingRate(id: string): Promise<ShippingRate | undefined> {
    return this.shippingRates.get(id);
  }

  async getShippingRateByCountry(country: string): Promise<ShippingRate | undefined> {
    return Array.from(this.shippingRates.values()).find(rate => rate.country === country);
  }

  async createShippingRate(insertShippingRate: InsertShippingRate): Promise<ShippingRate> {
    const id = randomUUID();
    const rate: ShippingRate = {
      ...insertShippingRate,
      id,
      commissionRate: insertShippingRate.commissionRate || "0.15",
    };
    this.shippingRates.set(id, rate);
    return rate;
  }

  async updateShippingRate(id: string, rateData: Partial<InsertShippingRate>): Promise<ShippingRate | undefined> {
    const rate = this.shippingRates.get(id);
    if (!rate) return undefined;
    
    const updatedRate = { ...rate, ...rateData };
    this.shippingRates.set(id, updatedRate);
    return updatedRate;
  }

  async deleteShippingRate(id: string): Promise<boolean> {
    return this.shippingRates.delete(id);
  }

  async getAllShippingRates(): Promise<ShippingRate[]> {
    return Array.from(this.shippingRates.values());
  }

  // Analytics
  async getTotalProfit(): Promise<number> {
    const orders = Array.from(this.orders.values());
    return orders.reduce((total, order) => total + parseFloat(order.profit), 0);
  }

  async getTotalRevenue(): Promise<number> {
    const orders = Array.from(this.orders.values());
    return orders.reduce((total, order) => total + parseFloat(order.totalAmount), 0);
  }

  async getActiveOrdersCount(): Promise<number> {
    const orders = Array.from(this.orders.values());
    return orders.filter(order => order.status !== "delivered" && order.status !== "cancelled").length;
  }
}

export const storage = new MemStorage();
