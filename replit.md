# Overview

This project is a comprehensive logistics and order management system built with React, Express, and PostgreSQL. It offers role-based access for various staff (owner, customer service, receptionist, sorter, stock manager, shipping), enabling management of orders, customers, inventory, profits, and delivery tasks. Key features include modern authentication, real-time data, bilingual support (English/Arabic), a responsive UI, streamlined data entry, and a complete shipping/delivery task management system. The system aims to optimize logistics, enhance profit tracking, and improve delivery coordination. It includes advanced features like an owner-only performance report system with key KPIs and a comprehensive LYD currency conversion system tracking per-order exchange rates.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The frontend is a React 18 TypeScript SPA using Wouter for routing, TanStack Query for server state, and Tailwind CSS with shadcn/ui for styling. React Hook Form with Zod handles forms, and Vite is used for building. Global state is managed via React Context. The UI/UX emphasizes responsiveness, bilingual support, and streamlined data entry across desktop and mobile.

## Backend Architecture

<<<<<<< HEAD
The backend is an Express.js application with TypeScript, serving as a REST API. It uses Passport.js for authentication and role-based access control. PostgreSQL, accessed via Drizzle ORM, handles data persistence. Session management is also PostgreSQL-based. API endpoints are organized by feature with Zod for request validation.
=======
The backend is an Express.js TypeScript REST API. It uses Passport.js for authentication and role-based access control. PostgreSQL with Drizzle ORM handles data persistence and session management. Business logic includes a commission calculation engine. API endpoints are feature-organized with Zod for request validation.
>>>>>>> b4cd19e3118b682994d9d6e10aae8f6f392b2e04

## Data Storage Solutions

PostgreSQL is the primary database, accessed via Drizzle ORM. Neon serverless PostgreSQL provides cloud deployment. The schema is relational, with foreign keys across users, customers, orders, inventory, and shipping rates, utilizing enums for roles/statuses and numeric types for currency.

## Authentication and Authorization Mechanisms

Security involves session-based authentication with Passport.js and bcrypt-hashed passwords. Role-based middleware enforces authorization. Sessions are persistent and stored in PostgreSQL. Both frontend and backend implement route guards for authentication and authorization.

## UI/UX Decisions & Feature Specifications

<<<<<<< HEAD
The UI/UX design emphasizes a responsive interface, bilingual support (English/Arabic), and streamlined data entry. Recent enhancements include:
- A complete shipping/delivery staff task management system with full bilingual support:
  - New "shipping_staff" user role with dedicated dashboard
  - Task assignment interface for managers to assign delivery tasks to staff
  - Shipping staff can view assigned tasks, pickup/delivery locations, and payment information
  - Staff can mark tasks as completed or "to collect" with customer code tracking
  - Payment collection workflow with amount and customer code entry
  - Task history and performance tracking for managers
  - Staff-specific dashboard showing pending, completed, and payment collection tasks
  - All delivery pages (delivery-tasks, task-assignment, task-history) fully translated in English/Arabic with proper RTL layout
  - Customer code display in all delivery tables (with fallback to order number if no shipping code exists)
  - Smart search supporting customer code, name, phone, and order number across all fields
- A complete internal messaging system with conversation threading, real-time notifications, and chat-style UI for viewing full message history between users.
- User profile management allowing all users (including admin) to edit their own username, name, and password with secure validation.
- Enhanced profit page with detailed metrics, average order value, and country-specific filtering.
- Comprehensive profit report showing customer shipping codes and detailed profit breakdown (items profit, shipping profit, total profit).
- New order statuses: "Partially Arrived," "Ready to Collect," "With Shipping Company."
- Dynamic country filtering across dashboards and profit reports.
- Integrated LYD exchange rate and calendar date range filters for orders and customers.
- Down payment management moved to customer-level with proportional distribution across orders.
- Improved customer search supporting multiple fields (phone, name, code).
- Enhanced visibility of customer codes in invoices and order/customer tables.
- Simplified customer editing and product code workflows for faster data entry.
- Flexible order creation allowing orders without prior shipping calculation.
- **Complete Arabic Translation Coverage (October 2025)**:
  - All edit order modal fields now fully translated (Original Price → السعر الأصلي, Discounted Price → السعر المخفض, Shipping Country → دولة الشحن, Shipping Category → فئة الشحن)
  - All sales report types (Profit Analysis, Financial Summary) completely translated with Arabic table headers, metrics, and date formatting
  - Invoice and order details modals with locale-aware date formatting
  - Persistent dark mode functionality via ThemeProvider
- **Commission Functionality Removed (October 2025)**:
  - Complete removal of commission calculations and displays from all pages (orders, profits, invoices, sales reports)
  - Commission-related database fields remain in schema but are no longer calculated or displayed in UI
  - Simplified profit tracking focuses on items profit, shipping profit, and total profit without commission deductions
- **Number of Pieces Field Added (October 2025)**:
  - New "numberOfPieces" field added to order items schema (integer, default: 1)
  - Field appears in both new order creation form and edit order modal
  - Located beside quantity field for easy data entry when items have multiple pieces per unit
- **Mobile RTL (Arabic) Fixes (October 2025)**:
  - Fixed dialog/modal positioning in RTL mode - changed from `translate-x-[-50%]` to `-translate-x-1/2` for proper Tailwind RTL support
  - Added RTL-aware close button positioning in dialogs (`rtl:right-auto rtl:left-4`)
  - Fixed text alignment in dialog headers with RTL support (`rtl:sm:text-right`)
  - Added touch-action: none to dialog overlays to prevent mobile scroll issues
  - Fixed Select component padding and checkmark positioning for RTL (`rtl:pl-2 rtl:pr-8`, `rtl:left-auto rtl:right-2`)
  - Resolved freezing issues when using Arabic language with mobile zoom on touch devices
- **Dual Currency Display System (October 2025)**:
  - Comprehensive implementation of USD and LYD dual currency display across entire application
  - Global LYD exchange rate stored in settings table (key: 'lyd_exchange_rate', default: 4.85)
  - All pages updated to display amounts in both currencies: Expenses, Dashboard, Customers, Profits, Orders
  - Consistent visual formatting: Bold blue LYD amount displayed prominently with USD shown below in smaller muted text
  - Exchange rate fetched from global settings and applied consistently across all monetary displays
  - Fallback to USD-only display when no exchange rate is configured
  - Expenses page: New page added for tracking business expenses (Employee Salaries, Supplier Expenses, Marketing Commission, Rent, Cleaning Salaries, Other) with dual currency support
=======
The system features:
- **Comprehensive Shipping/Delivery Task Management**: Dedicated "shipping_staff" role with dashboard, task assignment, status updates (completed, to collect with customer code), payment collection, and performance tracking. Full bilingual support (English/Arabic) with RTL layout.
- **Internal Messaging System**: Conversation threading, real-time notifications, and chat-style UI.
- **User Profile Management**: Users can edit username, name, and password.
- **Enhanced Profit Page**: Detailed metrics, average order value, country-specific filtering, and customer shipping code reporting.
- **Unified Profit Reports Page (Owner-Only)**: 
  - **Single-page unified view (October 27, 2025)**: Removed tab navigation - all profit metrics and performance analytics in one scrollable page
  - **Profit Metrics Section**: 
    - Commission Breakdown showing actual commission rules from settings database
    - Profit Trend Analysis with real data (Items Profit, Shipping Profit, Total Profit)
    - Country filtering for profit calculations
    - Report generation buttons (Profit, Commission, Financial)
  - **Performance Report Section** (merged):
    - Analytics dashboard with 10 KPIs (Total Orders, Sales, Profit, Discounted Orders, Average Order Value/Profit, Exchange Rate, Growth %)
    - **Advanced Filtering**:
      - Time range filters: Daily, Weekly, Monthly
      - Country filter: Multi-select country filtering with checkboxes
      - Calendar/Date range filter: Custom date range with "from" and "to" date pickers
      - Filter badge shows active filter count
      - Clear filters and apply buttons for easy filter management
    - Visual growth indicators (TrendingUp/TrendingDown icons) with color-coded trends
    - Dual-currency display (USD/LYD)
    - Performance summaries with period-over-period comparisons
    - Backend: GET `/api/reports/performance?range=daily|weekly|monthly&country[]=...&dateFrom=...&dateTo=...`
    - Custom date range automatically calculates comparison period with same duration
    - All filters work together (time range + country + custom dates)
  - Bilingual display (English/Arabic) with proper RTL layout throughout
  - Clear visual separator between sections for better hierarchy
- **LYD Currency Conversion System**: `useLydExchangeRate` hook for centralized management, dual-currency display (USD/LYD) across dashboards, orders, customers, invoices, and profit reports. Color-coded LYD amounts, locale-aware invoice numbering (Dinar/دينار), and exchange rate configurable in settings.
- **Per-Order LYD Exchange Rate Tracking**: Edit order modal allows recording order-specific LYD exchange rates, stored in `orders.lyd_exchange_rate` for precise historical tracking.
- **Order Statuses**: "Partially Arrived," "Ready to Collect," "With Shipping Company."
- **Dynamic Filtering**: Country filtering, LYD exchange rate, and date range filters for orders and customers.
- **Customer Management**: 
  - Customer-level down payment management
  - Multi-field customer search (phone, name, code)
  - Enhanced visibility of customer codes
  - **Customer Creation Form (October 27, 2025)**: Updated to collect 5 essential fields:
    1. First Name (required) - separate field with placeholder
    2. Last Name (required) - separate field with placeholder  
    3. Phone Number (required) - unique constraint
    4. City (required)
    5. Customer Code (optional) - stored as shippingCode
  - Form layout: First Name and Last Name displayed side-by-side in a 2-column grid
  - All fields fully translated (English/Arabic) with proper RTL support
  - E2E tested and verified working correctly
- **Streamlined Workflows**: Simplified customer editing, product code workflows, flexible order creation without prior shipping calculation.
- **Order Image Upload System (October 28, 2025)**: 
  - Direct device file selection for order images (phone/computer camera or gallery)
  - Cloud-based object storage integration for scalable image hosting
  - ImageUploader component with real-time upload progress and preview
  - Support for up to 3 images per order with automatic file validation
  - Accepted formats: JPG, PNG, GIF (max 5MB per image)
  - Backend: POST `/api/upload-url` generates pre-signed URLs for secure uploads
  - Frontend: `ImageUploader` component handles file selection, validation, upload, and preview
  - Fully bilingual UI with proper RTL support
- **Complete Arabic Translation Coverage**: All UI elements, including modals and reports, fully translated with proper RTL layout.
  - **October 28, 2025**: 
    - Fixed all untranslated English text in Profit Reports page. Added 30+ translation keys including detailedMetrics, performanceSummary, revenueAndProfit, growthTrends, keyInsights, recommendations, numberOfDiscountedOrders, profitGeneratedPerOrder, averageUsdToLydRate, and more.
    - Implemented fully functional Financial Breakdown section displaying real data: Revenue, Total Costs (red), Items Profit (green), Shipping Profit (green), Total Profit (bold green), Profit Margin % (blue), Average Order Value (purple), and Number of Orders. Previously was just a placeholder.
    - E2E tested - all text correctly switches between English and Arabic with proper color coding and formatting.
- **Responsive Design Implementation**: Fully responsive UI across phones, tablets, and desktops. Includes responsive sidebar navigation (hamburger menu on mobile), header, main layout, tables with horizontal scrolling, dashboard cards, and action buttons. Specific fixes for iOS Safari RTL initialization and mobile dialog opening. Dialogs are perfectly centered in both LTR and RTL.
>>>>>>> b4cd19e3118b682994d9d6e10aae8f6f392b2e04

# External Dependencies

## Third-Party Services

- **Neon Database**: Serverless PostgreSQL hosting.
- **Replit Integration**: Development environment plugins.

## Key Libraries and Frameworks

- **Frontend**: React, TypeScript, Vite, Wouter, TanStack Query, Tailwind CSS, shadcn/ui, React Hook Form, Zod.
- **Backend**: Express.js, Passport.js, Drizzle ORM, connect-pg-simple.
- **UI Components**: Radix UI primitives.
- **Utilities**: date-fns, class-variance-authority, clsx.