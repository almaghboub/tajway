# Overview

This is a comprehensive logistics and order management system built with React, Express, and PostgreSQL. The application provides role-based access control for different user types (owner, customer service, receptionist, sorter, stock manager) with features including order management, customer management, inventory tracking, shipping rate calculations, and profit reporting. The system includes JWT-based authentication, commission calculations based on country-specific rules, and PDF invoice generation capabilities.

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

The application follows a component-based architecture with separate pages for different features (dashboard, orders, customers, inventory, profits, settings) and reusable UI components. Authentication state is managed globally through React Context.

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

## Authentication and Authorization Mechanisms

The system implements a multi-layered security approach:

- **Authentication**: Session-based authentication using Passport.js with bcrypt-style password hashing
- **Session Management**: Express-session with PostgreSQL store for persistent sessions across server restarts
- **Authorization**: Role-based access control with middleware functions that check user roles before granting access to specific endpoints
- **Password Security**: Async scrypt hashing with random salt for secure password storage
- **Protected Routes**: Frontend route protection that redirects unauthenticated users to login page

Role hierarchy provides different access levels:
- Owner: Full system access including profit reports and user management
- Customer Service: Access to orders and customers
- Receptionist: Access to orders and customers
- Sorter: Access to orders and inventory
- Stock Manager: Access to inventory and orders

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with WebSocket support for real-time connections
- **Drizzle ORM**: Type-safe database query builder and migration tool

## UI and Styling
- **Radix UI**: Unstyled, accessible UI primitives for complex components like dialogs, dropdowns, and form controls
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **Shadcn/ui**: Pre-built component library built on Radix UI and Tailwind CSS

## Development and Build Tools
- **Vite**: Fast build tool with hot module replacement for development
- **TypeScript**: Type safety across the entire application
- **Replit Plugins**: Development environment integration for error handling and debugging

## Form and Data Handling
- **React Hook Form**: Efficient form handling with minimal re-renders
- **Zod**: Schema validation library for runtime type checking
- **TanStack Query**: Server state management with intelligent caching and synchronization

## Authentication Libraries
- **Passport.js**: Authentication middleware with local strategy support
- **Express Session**: Session management middleware with PostgreSQL store integration

## Utility Libraries
- **Date-fns**: Modern JavaScript date utility library
- **Nanoid**: Unique ID generation for secure random strings
- **Class Variance Authority**: Utility for managing conditional CSS classes