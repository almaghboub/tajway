# Overview

This project is a comprehensive logistics and order management system built with React, Express, and PostgreSQL. It offers role-based access for various staff (owner, customer service, receptionist, sorter, stock manager, shipping), enabling management of orders, customers, inventory, profits, and delivery tasks. Key features include modern authentication, real-time data, bilingual support (English/Arabic), a responsive UI, streamlined data entry, and a complete shipping/delivery task management system. The system aims to optimize logistics, enhance profit tracking, and improve delivery coordination. It includes advanced features like an owner-only performance report system with key KPIs and a comprehensive LYD currency conversion system tracking per-order exchange rates.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The frontend is a React 18 TypeScript SPA using Wouter for routing, TanStack Query for server state, and Tailwind CSS with shadcn/ui for styling. React Hook Form with Zod handles forms, and Vite is used for building. Global state is managed via React Context. The UI/UX emphasizes responsiveness, bilingual support, and streamlined data entry across desktop and mobile.

## Backend Architecture

The backend is an Express.js TypeScript REST API. It uses Passport.js for authentication and role-based access control. PostgreSQL with Drizzle ORM handles data persistence and session management. Business logic includes a commission calculation engine. API endpoints are feature-organized with Zod for request validation.

## Data Storage Solutions

PostgreSQL is the primary database, accessed via Drizzle ORM. Neon serverless PostgreSQL provides cloud deployment. The schema is relational, with foreign keys across users, customers, orders, inventory, and shipping rates, utilizing enums for roles/statuses and numeric types for currency.

## Authentication and Authorization Mechanisms

Security involves session-based authentication with Passport.js and bcrypt-hashed passwords. Role-based middleware enforces authorization. Sessions are persistent and stored in PostgreSQL. Both frontend and backend implement route guards for authentication and authorization.

## UI/UX Decisions & Feature Specifications

The system features:
- **Comprehensive Shipping/Delivery Task Management**: Dedicated "shipping_staff" role with dashboard, task assignment, status updates (completed, to collect with customer code), payment collection, and performance tracking. Full bilingual support (English/Arabic) with RTL layout.
- **Internal Messaging System**: Conversation threading, real-time notifications, and chat-style UI.
- **User Profile Management**: Users can edit username, name, and password.
- **Enhanced Profit Page**: Detailed metrics, average order value, country-specific filtering, and customer shipping code reporting.
- **Performance Report System (Owner-Only)**: Analytics dashboard with 10 KPIs (Total Orders, Sales, Profit, Discounted Orders, Average Order Value/Profit, Exchange Rate, Growth %), time range filters (Daily, Weekly, Monthly), bilingual display, visual growth indicators, dual-currency display (USD/LYD), and performance summaries.
- **LYD Currency Conversion System**: `useLydExchangeRate` hook for centralized management, dual-currency display (USD/LYD) across dashboards, orders, customers, invoices, and profit reports. Color-coded LYD amounts, locale-aware invoice numbering (Dinar/دينار), and exchange rate configurable in settings.
- **Per-Order LYD Exchange Rate Tracking**: Edit order modal allows recording order-specific LYD exchange rates, stored in `orders.lyd_exchange_rate` for precise historical tracking.
- **Order Statuses**: "Partially Arrived," "Ready to Collect," "With Shipping Company."
- **Dynamic Filtering**: Country filtering, LYD exchange rate, and date range filters for orders and customers.
- **Customer Management**: Customer-level down payment management, multi-field customer search (phone, name, code), enhanced visibility of customer codes.
- **Streamlined Workflows**: Simplified customer editing, product code workflows, flexible order creation without prior shipping calculation.
- **Complete Arabic Translation Coverage**: All UI elements, including modals and reports, fully translated with proper RTL layout.
- **Responsive Design Implementation**: Fully responsive UI across phones, tablets, and desktops. Includes responsive sidebar navigation (hamburger menu on mobile), header, main layout, tables with horizontal scrolling, dashboard cards, and action buttons. Specific fixes for iOS Safari RTL initialization and mobile dialog opening. Dialogs are perfectly centered in both LTR and RTL.

# External Dependencies

## Third-Party Services

- **Neon Database**: Serverless PostgreSQL hosting.
- **Replit Integration**: Development environment plugins.

## Key Libraries and Frameworks

- **Frontend**: React, TypeScript, Vite, Wouter, TanStack Query, Tailwind CSS, shadcn/ui, React Hook Form, Zod.
- **Backend**: Express.js, Passport.js, Drizzle ORM, connect-pg-simple.
- **UI Components**: Radix UI primitives.
- **Utilities**: date-fns, class-variance-authority, clsx.