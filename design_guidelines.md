# Design Guidelines: Bilingual Logistics & Order Management System

## Design Approach
**System-Based Approach**: Material Design principles adapted for enterprise logistics, prioritizing data clarity, form efficiency, and bilingual accessibility. This is a utility-focused application where function and learnability drive every design decision.

---

## Core Design Elements

### A. Color Palette

**Light Mode:**
- Primary: 212 100% 45% (Deep Blue - trust, professionalism)
- Primary Hover: 212 100% 40%
- Surface: 0 0% 98% (Near-white background)
- Surface Elevated: 0 0% 100% (Cards, modals)
- Border: 220 13% 91%
- Text Primary: 220 13% 18%
- Text Secondary: 220 9% 46%
- Success: 142 71% 45% (Completed orders)
- Warning: 38 92% 50% (Pending actions)
- Error: 0 84% 60% (Cancelled/issues)

**Dark Mode:**
- Primary: 212 100% 55%
- Primary Hover: 212 100% 60%
- Surface: 220 13% 12%
- Surface Elevated: 220 13% 16%
- Border: 220 13% 24%
- Text Primary: 220 13% 95%
- Text Secondary: 220 9% 65%

### B. Typography

**Font Stack:**
- Primary: 'Inter' (English), 'IBM Plex Sans Arabic' (Arabic) via Google Fonts
- Monospace: 'JetBrains Mono' (for order IDs, tracking numbers)

**Scale:**
- Headings: text-2xl (Page titles), text-xl (Section headers), text-lg (Card headers)
- Body: text-base (Forms, tables), text-sm (Secondary info, labels)
- Small: text-xs (Timestamps, metadata)
- Weights: font-semibold (Headings, labels), font-medium (Buttons, emphasis), font-normal (Body)

### C. Layout System

**Spacing Primitives:** Consistently use 2, 4, 6, 8, 12, 16 units
- Component padding: p-4 (cards), p-6 (modals)
- Section spacing: space-y-6 (form groups), space-y-4 (form fields)
- Grid gaps: gap-4 (form layouts), gap-6 (card grids)

**Containers:**
- Max-width: max-w-7xl for main content area
- Form containers: max-w-4xl centered
- Sidebar: w-64 (collapsed: w-16)

### D. Component Library

**Navigation:**
- Fixed sidebar with logo, main navigation, user profile at bottom
- Top bar with breadcrumbs (Home > Orders > New Order), search, language toggle (EN/AR), notifications, theme toggle
- Sticky position for both during scroll

**Forms (Critical for Order Creation):**
- Two-column responsive layout (grid grid-cols-1 md:grid-cols-2 gap-4)
- Grouped sections with subtle background (bg-surface-elevated rounded-lg p-6)
- Labels: text-sm font-medium mb-2, required indicator with asterisk
- Inputs: h-12 with px-4, border-2 focus:border-primary, rounded-lg
- Down Payment & After Discount fields: Side-by-side in same row, equal width
- Calculate total automatically with visual feedback
- Dropdown selects with search capability for customers/products
- Date pickers with both Gregorian and Hijri calendar support
- Currency inputs with proper RTL/LTR number formatting

**Data Tables:**
- Zebra striping (alternate row backgrounds)
- Sticky headers during vertical scroll
- Action column (right for LTR, left for RTL)
- Status badges with color coding
- Sortable columns with icons
- Pagination at bottom (showing "1-20 of 156 orders")

**Cards:**
- Elevated surface with shadow-sm hover:shadow-md transition
- 8px border-radius
- Header with title + action button/menu
- Consistent padding (p-6)

**Buttons:**
- Primary: bg-primary text-white h-10 px-6 rounded-lg
- Secondary: border-2 border-primary text-primary bg-transparent
- Text buttons for tertiary actions
- Icon buttons: h-10 w-10 rounded-full for menus/actions
- Loading states with spinner replacing text

**Modals/Dialogs:**
- Centered overlay with backdrop blur
- Max-width based on content (max-w-2xl for forms)
- Header with title + close button
- Footer with cancel/confirm actions aligned right (LTR) or left (RTL)

**Status Badges:**
- Pill-shaped (rounded-full px-3 py-1 text-xs font-medium)
- Pending: bg-yellow-100 text-yellow-800
- In Transit: bg-blue-100 text-blue-800
- Delivered: bg-green-100 text-green-800
- Cancelled: bg-red-100 text-red-800

**Data Visualization:**
- Dashboard cards showing KPIs (total orders, revenue, pending deliveries)
- Simple bar/line charts using Chart.js with brand colors
- Stats with large numbers + percentage change indicators

### E. Bilingual & RTL Considerations

**Layout Direction:**
- HTML dir attribute switches entire layout
- Flexbox and Grid automatically reverse in RTL
- Icons remain in logical positions (checkmarks, arrows flip)
- Numeric data remains LTR even in RTL context

**Text Alignment:**
- Auto-align based on language (text-start instead of text-left)
- Numbers and dates: Always LTR format
- Mixed content: Proper Unicode bidirectional handling

**Form Fields:**
- Placeholder text in active language
- Validation messages in user's language
- Currency symbols position correctly ($ before in English, after in Arabic)

### F. Interactions & States

**Minimal Animations:**
- Transitions: transition-colors duration-200 for hover states
- Modals: Fade in backdrop, slide up content
- Notifications: Slide in from top-right (LTR) or top-left (RTL)
- No decorative animations

**Feedback:**
- Inline validation with icon + message below field
- Toast notifications for save/error confirmations
- Loading skeletons for data fetching
- Disabled states with reduced opacity (opacity-50)

---

## New Order Form Specifications

**Layout Structure:**
- Full-width form container with max-w-4xl
- Sections: Customer Info, Order Details, Financial Summary, Shipping Details
- Financial Summary section contains: Subtotal, Discount, After Discount, Down Payment (side-by-side), Remaining Balance (calculated auto)

**Down Payment Implementation:**
- Position: Same row as "After Discount" field in two-column grid
- Label: "Down Payment" / "الدفعة المقدمة"
- Validation: Cannot exceed "After Discount" amount
- Visual indicator showing remaining balance updates live
- Currency input with proper formatting

**Save Actions:**
- Sticky footer with "Save as Draft" (secondary) and "Create Order" (primary)
- Auto-save indicator in top-right of form
- Confirmation modal before navigating away with unsaved changes

---

## Images
No hero images required. This is a business application where images would be:
- User avatars in navigation and customer selection
- Product thumbnails in order item selection
- Company logo in sidebar header
- Empty state illustrations for zero-data screens (use simple line illustrations, not photos)

All imagery serves functional purposes rather than marketing/emotional appeal.