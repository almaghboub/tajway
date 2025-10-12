# Overview

This project is a comprehensive logistics and order management system built with React, Express, and PostgreSQL. It provides role-based access control for owners, customer service, receptionists, sorters, stock managers, and shipping staff, enabling them to manage orders, customers, inventory, profits, delivery tasks, and system administration. Key capabilities include modern authentication, real-time data management, bilingual support (English/Arabic), a responsive UI, streamlined data entry, and a complete shipping/delivery staff task management system. The system aims to optimize logistics operations, enhance profit tracking, and improve delivery coordination.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The frontend is a React 18 single-page application using TypeScript. It employs Wouter for routing, TanStack Query for server state management, and Tailwind CSS with shadcn/ui for styling. Form handling is managed with React Hook Form and Zod for validation, and Vite is used for building. The architecture is component-based with global state managed via React Context.

## Backend Architecture

The backend is an Express.js application with TypeScript, serving as a REST API. It uses Passport.js for authentication and role-based access control. PostgreSQL, accessed via Drizzle ORM, handles data persistence. Session management is also PostgreSQL-based. Business logic includes a commission calculation engine with country-specific rules. API endpoints are organized by feature with Zod for request validation.

## Data Storage Solutions

PostgreSQL is the primary database, utilizing Drizzle ORM for type-safe operations. Neon serverless PostgreSQL provides cloud deployment with connection pooling. The schema is relational with foreign key constraints across users, customers, orders, inventory, and shipping rates, employing enums for roles and statuses and numeric types for currency.

## Authentication and Authorization Mechanisms

Security is multi-layered, featuring session-based authentication with Passport.js and bcrypt-hashed passwords. Role-based middleware enforces authorization. Sessions are persistent and stored in PostgreSQL. Both frontend and backend implement route guards to verify authentication and authorization, granting different access levels to various user roles.

## UI/UX Decisions

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

# External Dependencies

## Third-Party Services

- **Neon Database**: Serverless PostgreSQL hosting.
- **Replit Integration**: Development environment plugins.

## Key Libraries and Frameworks

- **Frontend**: React, TypeScript, Vite, Wouter, TanStack Query, Tailwind CSS, shadcn/ui, React Hook Form, Zod.
- **Backend**: Express.js, Passport.js, Drizzle ORM, connect-pg-simple.
- **UI Components**: Radix UI primitives.
- **Utilities**: date-fns, class-variance-authority, clsx.