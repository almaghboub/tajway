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
- **Performance Report System (October 2025)**:
  - Owner-only analytics dashboard with comprehensive business metrics
  - Time range filters: Daily, Weekly, Monthly with automatic recalculation
  - 10 key performance indicators:
    1. Total Orders (current vs previous period)
    2. Total Sales (revenue tracking)
    3. Total Profit (profit tracking)
    4. Discounted Orders (orders with down payments)
    5. Average Order Value
    6. Average Profit Per Order
    7. Average Exchange Rate (LYD)
    8. Order Growth % (period-over-period comparison)
    9. Sales Growth % (revenue growth tracking)
    10. Profit Growth % (profitability trends)
  - Side-by-side bilingual display (English and Arabic) for detailed metrics and performance summaries
  - Visual growth indicators (TrendingUp/TrendingDown icons) with color-coded trends
  - Professional metric cards with dual-currency display (USD/LYD)
  - Automatic previous-period comparison for meaningful insights
  - Performance summaries with actionable recommendations
  - Backend: GET `/api/reports/performance?range=daily|weekly|monthly` with `requireOwner` middleware
  - Frontend: Protected by `RoleProtectedRoute` with owner-only access
  - Proper RTL support for Arabic section with responsive design
- New order statuses: "Partially Arrived," "Ready to Collect," "With Shipping Company."
- Dynamic country filtering across dashboards and profit reports.
- Integrated LYD exchange rate and calendar date range filters for orders and customers.
- **LYD Currency Conversion System (October 2025)**:
  - Created shared `useLydExchangeRate` custom hook in `client/src/hooks/use-lyd-exchange-rate.ts` for centralized exchange rate management
  - Hook provides `exchangeRate`, `convertToLYD(amount)` helper, and loading state
  - `convertToLYD` returns original USD amount when exchange rate is not set (≤0), preserving proper USD fallback behavior
  - Dual-currency display (USD/LYD) across Dashboard, Orders, Customers, Invoices, and Profit Reports
  - Color-coded LYD amounts for clarity: green (totals/revenue), blue (down payments), orange (remaining balance), purple (profit)
  - LYD amounts display conditionally when exchange rate is set (> 0)
  - Dashboard: Revenue and profit metrics show both USD and LYD
  - Orders page: Total amount, down payment, remaining balance, and profit all show USD/LYD
  - Customers page: Total order amount and down payment display in both currencies (table and view modal)
  - Invoice component: All monetary amounts (total, down payment, remaining) display in LYD with dynamic currency labels
  - Invoice number-to-words: Updated to output "Dinar(s)/دينار" instead of "Dollar(s)/دولار" for both English and Arabic
  - Profits page: All financial metrics (revenue, profit, average order value) display in LYD
  - SalesReport component: All three report types (Profit Analysis, Commission Breakdown, Financial Summary) display amounts in LYD
  - Report data flow: Profits page passes exchangeRate and currency props to SalesReport for consistent conversion
  - Exchange rate stored in settings table with key `lyd_exchange_rate`
  - All LYD values formatted to 2 decimal places for consistency
  - USD fallback: When no exchange rate is configured, all pages correctly display USD amounts instead of zeros
- **Per-Order LYD Exchange Rate Tracking (October 27, 2025)**:
  - Edit order modal now includes LYD Exchange Rate field allowing users to record order-specific exchange rates
  - Field accepts decimal values with up to 4 decimal places (e.g., 4.8500) for precise rate tracking
  - Stored in orders.lyd_exchange_rate column (decimal precision: 10, scale: 4)
  - Optional field - orders can have individual exchange rates or use the global setting rate
  - Fully bilingual with translations: "LYD Exchange Rate" / "سعر صرف الدينار الليبي"
  - Integration: Field positioned alongside order status and payment fields in edit modal
  - Backend: Automatically handled via existing schema validation and storage layer
  - Use case: Tracks historical exchange rates at time of order creation/modification for accurate profit calculations
- Down payment management moved to customer-level with proportional distribution across orders.
- Improved customer search supporting multiple fields (phone, name, code).
- Enhanced visibility of customer codes in invoices and order/customer tables.
- Simplified customer editing and product code workflows for faster data entry.
- Flexible order creation allowing orders without prior shipping calculation.
- **Complete Arabic Translation Coverage (October 2025)**:
  - All edit order modal fields now fully translated (Original Price → السعر الأصلي, Discounted Price → السعر المخفض, Shipping Country → دولة الشحن, Shipping Category → فئة الشحن)
  - All three sales report types (Profit Analysis, Commission Breakdown, Financial Summary) completely translated with Arabic table headers, metrics, and date formatting
  - Invoice and order details modals with locale-aware date formatting
  - Persistent dark mode functionality via ThemeProvider
- **Mobile RTL (Arabic) Fixes (October 2025)**:
  - Fixed dialog/modal positioning in RTL mode - changed from `translate-x-[-50%]` to `-translate-x-1/2` for proper Tailwind RTL support
  - Added RTL-aware close button positioning in dialogs (`rtl:right-auto rtl:left-4`)
  - Fixed text alignment in dialog headers with RTL support (`rtl:sm:text-right`)
  - Added touch-action: none to dialog overlays to prevent mobile scroll issues
  - Fixed Select component padding and checkmark positioning for RTL (`rtl:pl-2 rtl:pr-8`, `rtl:left-auto rtl:right-2`)
  - **Dialog Centering Fix (October 25, 2025)**:
    - Root cause: Dialog component needed direction-specific positioning AND translation for proper RTL centering
    - Issue: Dialogs appeared off-screen or overflowed viewport in Arabic (RTL) mode
    - Solution: Implemented direction-aware positioning and translation:
      - LTR: `left: 50%` + `translateX(-50%)` = centered
      - RTL: `right: 50%` + `translateX(+50%)` = centered
      - Implementation: `ltr:left-1/2 ltr:-translate-x-1/2 rtl:right-1/2 rtl:translate-x-1/2`
    - Width constraint: `w-[calc(100%-2rem)]` ensures 1rem margin on each side and prevents viewport overflow
    - Removed problematic `w-[95vw]` override from orders page dialog
    - Result: All dialogs now perfectly center with equal margins in both English (LTR) and Arabic (RTL) modes
    - Verified: E2E tested on desktop (1280x720) and mobile (390x844) with confirmed equal margins in both languages
  - **CRITICAL FIX: iOS Safari RTL Initialization Freeze (October 14, 2025)**:
    - Root cause: i18next auto-detecting Arabic from device system language and setting `dir="rtl"` before React finishes loading caused complete UI freeze on iOS Safari
    - Solution implemented: Force initial language to English in i18n config, disable navigator language detection (use localStorage only)
    - Safe initialization: Always start with LTR, then check localStorage after React mounts and safely switch to RTL if user previously selected Arabic
    - Trade-off: First-time Arabic users see English initially and must manually switch to Arabic (intentional safety measure)
    - Safari private mode safety: Wrapped localStorage access in try/catch with graceful fallback to English
    - Result: App now works perfectly in both LTR and RTL modes without any freezing on iOS Safari
    - E2E tested: Language toggle, dialogs, navigation, and all interactions work correctly in both directions
  - **CRITICAL FIX: Mobile Dialog Opening in RTL Mode (October 15, 2025)**:
    - Root cause: Dialog overlay lacked proper touch event handling, causing app to freeze on mobile when attempting to open dialogs
    - Solution implemented: Added `touch-none` class to dialog overlay to prevent mobile touch event blocking
    - Result: Dialogs now open smoothly on all mobile devices without freezing
    - Note: Dialog centering in RTL was later fixed with direction-aware positioning (see Dialog Centering Fix above)
- **Complete Responsive Design Implementation (October 25, 2025)**:
  - Implemented fully responsive UI working seamlessly on phones, tablets (iPad), and desktop computers
  - **Responsive Sidebar Navigation**:
    - Desktop: Fixed sidebar panel always visible on screens ≥768px
    - Mobile: Hamburger menu button triggers Sheet drawer with slide-in animation
    - Mobile drawer automatically closes when navigating to a new page
    - Sheet component uses CSS logical properties (`start-0`, `end-0`, `border-s`, `border-e`) for automatic RTL support
  - **Responsive Header**:
    - Mobile layout with hamburger menu (≤768px): `px-3 py-2` spacing
    - Desktop layout (>768px): `px-6 py-4` spacing, larger title text
    - Proper RTL alignment maintained across all breakpoints
  - **Responsive Main Layout**:
    - Desktop: Fixed sidebar + main content with `ml-64` margin
    - Mobile: Full-width main content without sidebar margin
    - Conditional rendering using `useIsMobile` hook (768px breakpoint)
  - **Responsive Tables**:
    - All data tables (Orders, Customers, Users) wrapped in `overflow-x-auto` containers
    - Horizontal scrolling enabled on mobile/tablet to preserve all columns
    - Tables maintain full functionality on narrow viewports
  - **Dashboard Cards**:
    - Responsive grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
    - Cards stack vertically on mobile, 2 columns on tablet, 4 columns on desktop
  - **Responsive Action Buttons**:
    - "New Order" and "Add Customer" buttons adapt to screen size
    - Mobile (< 640px): Show icon-only to prevent text cutoff
    - Desktop (≥ 640px): Show icon + text for clarity
    - Implementation: `hidden sm:inline` for text, `sm:ltr:mr-2 sm:rtl:ml-2` for RTL-aware spacing
  - **Architect Reviewed**: Pass rating with no critical regressions detected
  - **Key Implementation Details**:
    - Used shadcn/ui Sheet component for mobile drawer
    - Maintained bilingual support (English/Arabic) with proper RTL behavior
    - Preserved all existing functionality while adding responsive breakpoints
    - No hydration warnings or layout jumps observed

# External Dependencies

## Third-Party Services

- **Neon Database**: Serverless PostgreSQL hosting.
- **Replit Integration**: Development environment plugins.

## Key Libraries and Frameworks

- **Frontend**: React, TypeScript, Vite, Wouter, TanStack Query, Tailwind CSS, shadcn/ui, React Hook Form, Zod.
- **Backend**: Express.js, Passport.js, Drizzle ORM, connect-pg-simple.
- **UI Components**: Radix UI primitives.
- **Utilities**: date-fns, class-variance-authority, clsx.