# Overview

This is a comprehensive logistics and order management system built with React, Express, and PostgreSQL. The application provides role-based access control for different user types (owner, customer service, receptionist, sorter, stock manager) with distinct capabilities for managing orders, customers, inventory, profits, and system administration. The system features modern authentication, real-time data management, bilingual support (English/Arabic), and a responsive UI designed for logistics operations with streamlined data entry workflows.

# Recent Changes (October 2025)

## Customer-Level Down Payment Management (Latest)
- **Down Payment Moved to Customer Level**: Down payment editing moved from individual orders to customer edit modal for centralized management
- **Customer Edit Modal Enhanced**: Now shows Total Amount (sum of all customer orders), Down Payment (editable), and Remaining Balance (auto-calculated)
- **Proportional Distribution**: When editing customer down payment, the amount is automatically distributed proportionally across all customer orders based on each order's total amount
- **Robust Validation**: Backend validates down payment is non-negative, caps at total order amount, and prevents division by zero
- **Rounding Fix**: Last order absorbs any rounding differences to ensure exact distribution with no negative balances
- **API Endpoint**: New `/api/customers/:id/update-with-payment` endpoint handles atomic customer and payment updates

## Customer Dashboard Payment Display (Latest Update)
- **Email Column Removed**: Removed email column from customer dashboard table
- **Total Amount Column Added**: Displays sum of all customer orders with proper aggregation
- **Down Payment Column Added**: Shows total down payments across all customer orders (green text)
- **Payment Details in Order Modals**: Both View Order Details and Print Invoice modals now display:
  - Down Payment (green text)
  - Remaining Balance (orange text, prominently displayed)
  - Proper calculation verification (Down Payment + Remaining Balance = Total)

## Customer Code Display Enhancement
- **Customer Code in Invoices**: Customer code (shippingCode) now displayed in invoice Bill To section with red color highlight
- **Customer Code in Orders Table**: Added Customer Code column to orders list (displayed after customer name)
- **Customer Code in Customers Table**: Added Customer Code column to customers list (displayed after name)
- **Customer View Modal**: Customer code moved to Personal Information section for better visibility

## Data Entry Simplification
- **Simplified Customer Editing**: Customer edit modal streamlined to show only essential fields: First Name, Last Name, Phone, and Customer Code (removed email, address, city, postal code, country from edit view)
- **Product Code Workflow**: Product Code field removed from create new order form for faster data entry; users can add product codes later when editing orders

## Shipping Calculation Improvements  
- Orders can now be updated with shipping country and category selections for proper shipping recalculation
- Warning banner displays for orders missing shipping data with inline selection fields
- Shipping weight and category persist correctly through async recalculation flow
- Fixed state management race conditions in shipping recalculation

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The frontend is built using React with TypeScript and implements a modern single-page application architecture:

- **Framework**: React 18 with TypeScript for type safety and better developer experience
- **Routing**: Wouter for lightweight client-side routing with protected routes based on authentication status
- **State Management**: TanStack Query (React Query) for server state management with optimistic updates and caching
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent, accessible UI components
- **Forms**: React Hook Form with Zod schema validation for type-safe form handling
- **Build Tool**: Vite for fast development and optimized production builds

The application follows a component-based architecture with separate pages for different features (dashboard, orders, customers, inventory, profits, settings) and reusable UI components. Authentication state is managed globally through React Context, providing seamless user experience across the application.

## Backend Architecture

The backend follows a traditional Express.js architecture with PostgreSQL for data persistence:

- **Framework**: Express.js with TypeScript for the REST API server
- **Authentication**: Passport.js with local strategy for user authentication and session management
- **Authorization**: Role-based access control middleware to restrict access based on user roles
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations and migrations
- **Session Storage**: PostgreSQL-based session store for persistent user sessions
- **Business Logic**: Commission calculation engine with country-specific rules for China, Turkey, UK, UAE, and default rates

The API endpoints are organized by feature area with proper error handling and request validation using Zod schemas.

## Data Storage Solutions

The system uses PostgreSQL as the primary database with the following key design decisions:

- **ORM Choice**: Drizzle ORM chosen for its TypeScript-first approach and better performance compared to traditional ORMs
- **Database Connection**: Neon serverless PostgreSQL for cloud deployment with connection pooling
- **Schema Design**: Relational design with proper foreign key constraints between users, customers, orders, order items, inventory, and shipping rates
- **Data Types**: Uses appropriate PostgreSQL data types including numeric for precise currency calculations

The schema includes enums for user roles and order statuses, ensuring data consistency and type safety throughout the application.

## Authentication and Authorization Mechanisms

The system implements a multi-layered security approach:

- **Authentication**: Session-based authentication using Passport.js with bcrypt-style password hashing
- **Authorization**: Role-based middleware that restricts access to specific endpoints based on user roles
- **Session Management**: Persistent sessions stored in PostgreSQL with configurable expiration
- **Route Protection**: Frontend and backend route guards that verify authentication and authorization

Different user roles have access to different features: owners have full access, customer service can manage orders and customers, receptionists handle customer interactions, sorters manage order processing, and stock managers control inventory.

# External Dependencies

## Third-Party Services

- **Neon Database**: Serverless PostgreSQL hosting for production database with automatic scaling
- **Replit Integration**: Development environment plugins for enhanced development experience

## Key Libraries and Frameworks

- **Frontend**: React, TypeScript, Vite, Wouter, TanStack Query, Tailwind CSS, shadcn/ui, React Hook Form, Zod
- **Backend**: Express.js, Passport.js, Drizzle ORM, connect-pg-simple for session storage
- **UI Components**: Radix UI primitives for accessible component foundation
- **Utilities**: date-fns for date manipulation, class-variance-authority for component variants, clsx for conditional classes

The application is designed to be self-contained with minimal external API dependencies, focusing on core logistics management functionality with room for future integrations.