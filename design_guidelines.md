# Design Guidelines: LYNX LY - Bilingual Logistics & Order Management System

## Design Approach
**Material Design System** adapted for enterprise logistics. This is a utility-focused, data-dense application where efficiency, clarity, and professional credibility are paramount. Every design decision prioritizes workflow speed, information hierarchy, and multi-user role accommodations.

---

## Core Design Elements

### A. Typography

**Font Families (via Google Fonts CDN):**
- Primary: 'Inter' (English/Latin), 'IBM Plex Sans Arabic' (Arabic script)
- Monospace: 'SF Mono' (tracking numbers, IDs, timestamps)

**Hierarchy:**
- Page Titles: text-3xl font-semibold (Dashboard, Orders, Reports)
- Section Headers: text-xl font-semibold (Today's Tasks, Recent Orders)
- Card Headers: text-lg font-medium
- Body Text: text-base font-normal (tables, descriptions)
- Labels: text-sm font-medium (form labels, table headers)
- Metadata: text-xs font-normal (timestamps, secondary info)

**Weights:** Semibold (600) for headings, Medium (500) for emphasis/CTAs, Normal (400) for body text

### B. Layout System

**Spacing Primitives:** Use Tailwind units of 2, 4, 6, 8, 12, 16
- Card padding: p-6
- Form groups: space-y-6
- Input fields: space-y-4
- Grid gaps: gap-6 (dashboard cards), gap-4 (forms)
- Section margins: mb-8 between major sections

**Container Strategy:**
- Main content: max-w-7xl with px-6
- Forms/modals: max-w-3xl centered
- Wide tables: w-full with horizontal scroll on mobile
- Sidebar: w-64 desktop, full-width mobile overlay

### C. Component Library

**Navigation Architecture:**
- Fixed left sidebar (w-64) with collapsible mode (w-16 icon-only)
- Logo/branding at top with company name
- Grouped navigation sections: Orders, Inventory, Customers, Analytics, Team, Settings
- User profile dropdown at bottom with role indicator and theme/language toggles
- Top bar: Breadcrumbs, global search, quick actions (+ New Order), notifications bell, user avatar

**Dashboard Cards:**
- Grid layout: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- KPI cards with large number (text-4xl font-bold), label, and trend indicator (↑ 12% vs last week)
- Mini charts embedded in cards using Chart.js
- Quick action cards with icon, title, description, CTA button

**Data Tables (Critical Component):**
- Sticky header with column sorting indicators
- Alternating row backgrounds for readability
- Dense mode option (reducing row height)
- Multi-select with bulk actions toolbar
- Inline editing for specific fields
- Expandable rows for detailed information
- Status badges in dedicated column
- Action menu (⋮) in last column with Edit/View/Delete/Assign options
- Pagination with "Showing 1-25 of 342" + page numbers
- Column visibility toggle and export buttons

**Forms (Order Entry, Customer Management, Inventory):**
- Two-column grid: grid-cols-1 lg:grid-cols-2 gap-6
- Grouped sections with bg-surface-elevated rounded-lg p-6
- Labels with required asterisks positioned above inputs
- Input height: h-12 with px-4, border-2 focus states
- Financial fields: Down Payment and After Discount side-by-side with auto-calculation of Remaining Balance
- Smart dropdowns with search (Select2-style) for customers/products
- Date pickers supporting both Gregorian and Hijri calendars
- Rich text editor for notes (Quill or TipTap)
- Attachment upload zone with drag-drop support
- Sticky footer with Cancel (secondary) and Save/Submit (primary) buttons

**Status System:**
- Pill badges: rounded-full px-3 py-1 text-xs font-semibold
- Pending: bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100
- Processing: bg-blue-100 text-blue-800
- In Transit: bg-indigo-100 text-indigo-800
- Delivered: bg-emerald-100 text-emerald-800
- Cancelled: bg-red-100 text-red-800
- On Hold: bg-gray-100 text-gray-800

**Analytics & Reporting:**
- Full-width chart containers with legend and filters
- Line charts for revenue trends (Chart.js with smooth curves)
- Bar charts for order volume by status
- Pie/donut charts for customer distribution
- Date range selector with presets (Today, This Week, This Month, Custom)
- Export options: PDF, Excel, CSV

**Task Assignment Panel:**
- Kanban board view: grid-cols-1 md:grid-cols-3 lg:grid-cols-4
- Columns: Unassigned, In Progress, Completed, Blocked
- Draggable task cards with assignee avatar, priority badge, due date
- Quick add button at top of each column
- Filter by assignee, priority, date

**Modals & Overlays:**
- Centered with backdrop-blur-sm
- Header with title (text-xl font-semibold) and close button
- Content area with max-h-[80vh] overflow-y-auto
- Footer with aligned actions (right in LTR, left in RTL)
- Slide-up animation on open

**Buttons:**
- Primary: h-11 px-6 rounded-lg font-medium shadow-sm
- Secondary: border-2 h-11 px-6 rounded-lg font-medium
- Ghost: h-11 px-4 rounded-lg font-medium (for tertiary actions)
- Icon-only: h-10 w-10 rounded-lg (for menus, quick actions)
- Loading state: Spinner replaces text/icon

**Notifications & Toasts:**
- Top-right position (LTR) / Top-left (RTL)
- Auto-dismiss after 5 seconds with progress bar
- Icon, message, close button
- Color-coded by type: success (green), error (red), warning (amber), info (blue)

### D. Bilingual & RTL Implementation

**Directional Handling:**
- HTML `dir` attribute switches entire layout flow
- Use `text-start` instead of `text-left` for auto-alignment
- Flexbox and Grid reverse automatically
- Icons that indicate direction (arrows, chevrons) flip in RTL
- Numeric data, currency, dates remain LTR formatted even in RTL contexts

**Language Toggle:**
- Prominent toggle in top bar: EN | العربية
- Switch triggers full page re-render with appropriate font and direction
- Form placeholders, labels, validation messages translate contextually
- Table headers, button text, navigation items all bilingual

**Typography Considerations:**
- Line-height slightly increased for Arabic script (1.6 vs 1.5)
- Letter-spacing disabled for Arabic (tracking-normal)
- Font-size may need 1-2px increase for Arabic readability

### E. Interactions & Micro-animations

**Transitions (Minimal, Purposeful):**
- Color changes: transition-colors duration-200
- Transform effects: transition-transform duration-300
- Opacity fades: transition-opacity duration-200
- Modal entry: Backdrop fade + content slide-up over 300ms

**Hover States:**
- Cards: shadow-sm to shadow-md elevation
- Buttons: Slight darkening/lightening
- Table rows: background color shift
- Icons: opacity-70 to opacity-100

**Loading States:**
- Skeleton screens for table/card grids (shimmer effect)
- Inline spinners for button actions
- Progress bars for file uploads
- Pulse animation for refreshing data

**Feedback Mechanisms:**
- Inline validation with icons (✓ for valid, ✗ for errors)
- Toast notifications for CRUD operations
- Confirmation dialogs for destructive actions
- Auto-save indicators with timestamp

---

## Images

This is a business application where imagery serves functional purposes:

**Functional Images:**
- User avatars in navigation, tables, and task assignments (circular, 32-40px diameter)
- Customer profile photos in customer database
- Product thumbnails in inventory (square, 80x80px)
- Company logo in sidebar header (120x40px)
- Empty state illustrations for zero-data screens (simple line art, 200x200px)

**No Hero Images:** This application has no marketing/landing pages requiring hero sections. All screens are functional dashboards, tables, and forms.

---

## Color Architecture

**Light Mode:**
- Primary: `hsl(217, 91%, 60%)` (Professional blue)
- Primary Hover: `hsl(217, 91%, 52%)`
- Surface: `hsl(220, 20%, 97%)` (Subtle warm gray)
- Surface Elevated: `hsl(0, 0%, 100%)` (Pure white cards)
- Border: `hsl(220, 13%, 87%)`
- Text Primary: `hsl(220, 20%, 15%)`
- Text Secondary: `hsl(220, 10%, 45%)`

**Dark Mode:**
- Primary: `hsl(217, 91%, 65%)`
- Primary Hover: `hsl(217, 91%, 72%)`
- Surface: `hsl(220, 20%, 11%)`
- Surface Elevated: `hsl(220, 20%, 14%)`
- Border: `hsl(220, 13%, 22%)`
- Text Primary: `hsl(220, 20%, 95%)`
- Text Secondary: `hsl(220, 10%, 65%)`

**Semantic Colors (Both Modes):**
- Success: `hsl(142, 76%, 36%)` / Dark: `hsl(142, 76%, 45%)`
- Warning: `hsl(38, 92%, 50%)` / Dark: `hsl(38, 92%, 55%)`
- Error: `hsl(0, 72%, 51%)` / Dark: `hsl(0, 72%, 58%)`
- Info: `hsl(199, 89%, 48%)` / Dark: `hsl(199, 89%, 55%)`

---

## Screen-Specific Layouts

**Dashboard:** 4-column KPI grid, 2-column chart section, recent activity feed
**Orders List:** Full-width table with filters sidebar, bulk action toolbar
**Order Detail:** Three-column layout (info, timeline, actions panel)
**Customer Database:** Card grid view and table view toggle
**Inventory:** Product grid with stock indicators, low-stock alerts highlighted
**Analytics:** Full-width charts with date range controls and metric toggles
**Task Board:** Kanban columns with drag-drop, assignee filters
**Settings:** Two-column form layout with navigation tabs