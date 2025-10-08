# Claude Code Instructions

This file contains instructions and context for Claude Code to help with this project.

## Project Overview
Chit Fund Management System with Field Collectors & Cash Closing Workflows

**Core Concept**: A digital system to manage chit funds with field collectors who collect payments from members, submit cash batches for admin approval, and track all financial operations with proper audit trails.

**Key Features Implemented**:
- ✅ Admin/Collector role-based authentication system
- ✅ Real-time chit fund and member management
- ✅ Collection entry recording with closing session workflows (Phase 3)
- ✅ Cash batch submission and approval process (Phase 4)
- ✅ Comprehensive audit trails and reporting (Phase 4)

## Tech Stack
- **Framework**: Next.js 15 with App Router
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **UI Components**: Shadcn/ui with Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **Authentication**: ✅ Supabase Auth with email/password login

## Common Commands
- **Development**: `npm run dev`
- **Build**: `npm run build`
- **Test**: `npm test`
- **Lint**: `npm run lint`
- **Start**: `npm start`
- **Database**: Supabase migrations via MCP tools

## Project Structure
```
src/
├── app/
│   ├── (auth)/
│   │   └── login/             # Login page with Supabase Auth (invitation-only)
│   ├── (main)/
│   │   ├── collect/           # Collection entry interface
│   │   ├── my-collections/    # Collection history view
│   │   ├── collections/       # Pending collections dashboard
│   │   ├── closings/          # Closing session management
│   │   │   ├── create/        # Create closing session
│   │   │   └── [id]/          # View/edit closing sessions
│   │   ├── approvals/         # Admin approval interface
│   │   ├── chit-funds/        # Chit fund management
│   │   │   └── [id]/cycles/   # Phase 5: Cycle management dashboard
│   │   ├── arrears/           # Phase 5: Arrears management
│   │   ├── advances/          # Phase 5: Advance payment management
│   │   ├── members/           # Member management
│   │   └── users/             # User management
│   ├── dashboard/             # Main dashboard with statistics
│   ├── api/                   # API routes (if needed)
│   └── middleware.ts          # Auth middleware for route protection
├── components/
│   ├── ui/                    # Shadcn UI components
│   ├── shared/                # Shared selectors and components
│   ├── cycles/                # Phase 5: Cycle management components
│   ├── arrears/               # Phase 5: Arrears management components
│   ├── advances/              # Phase 5: Advance payment components
│   └── layout/                # Layout components
└── lib/
    ├── supabase/              # Supabase client configurations
    └── utils.ts               # Utility functions (formatCurrency, formatDate)
```

## Database Schema (Phase 5 Complete)
- **profiles**: Admin/Collector users with roles
- **members**: Chit fund members (no login required)
- **chit_funds**: Fund details with amounts and duration
- **cycles**: Monthly cycles for each chit fund (enhanced with winner tracking)
- **chit_fund_members**: Member assignments to funds
- **collection_entries**: Individual payment records
- **closing_sessions**: Cash batch submissions for approval
- **member_balances**: Phase 5 - Advance/arrears tracking per member per fund
- **payouts**: Phase 5 - Detailed payout transaction records with receipt generation

## Development Status

### ✅ Phase 1: Database Foundation & Auth
- ✅ Supabase Auth integration with email/password login (invitation-only)
- ✅ Enhanced profiles table with admin/collector roles
- ✅ Members table for non-login users (chit fund members)
- ✅ Cycles table with auto-generation
- ✅ Collection entries and closing sessions tables
- ✅ Row Level Security (RLS) policies implemented
- ✅ Middleware for route protection and session management
- ✅ Secure login page with controlled access (no public signup)

### ✅ Phase 2: Admin Dashboard & Management
- Real-time dashboard with role-based statistics
- Chit fund creation with automatic cycle generation
- Member management with collector assignment
- Form validation and error handling
- Professional UI with Shadcn components

### ✅ Phase 3: Collection & Payment Tracking (Complete)
**Goal**: Enable field collectors to record individual payments and submit cash batches

**Features Implemented**:
- ✅ Collection entry interface (`/collect`)
  - Select chit fund → cycle → member → enter amount
  - Payment method selection (cash/transfer)
  - Auto-save functionality for data protection
  - Real-time validation and member lookup
- ✅ Collection history view (`/my-collections`)
  - Collector's personal collection records
  - Filter by date, chit fund, status
  - Export functionality for reports
- ✅ Pending collections dashboard for admins (`/collections/pending`)
  - Overview of all unclosed collection entries
  - Sort and filter by collector, date, amount

### ✅ Phase 4: Closing Session Workflow (Complete)
**Goal**: Implement cash batch submission and approval process

**Features Implemented**:
- ✅ Create closing session (`/closings/create`)
  - Auto-aggregate pending collections by collector/date
  - Declared total vs system total comparison
  - Real-time variance detection and alerts
  - Notes and remarks section
  - Save as draft or submit for approval
- ✅ Closing session management (`/closings`)
  - Draft → Submitted → Approved/Rejected workflow
  - Edit draft closings before submission (`/closings/[id]/edit`)
  - View submission history and status (`/closings/[id]/view`)
  - Complete CRUD operations with proper validation
- ✅ Admin approval interface (`/approvals`)
  - Review submitted closings with mismatch alerts
  - Approve/reject with comments
  - Bulk approval for perfect matches
  - Auto-post collections on approval
  - Comprehensive review modal with detailed breakdown

### ✅ Phase 5: Cycle & Payout Management (Complete)
**Goal**: Complete the chit fund cycle operations

**Features Implemented**:
- ✅ Cycle dashboard (`/chit-funds/[id]/cycles`)
  - Month-wise cycle timeline with visual status indicators
  - Interactive Member × Cycle payment matrix with tooltips
  - Real-time collection progress tracking with percentages
  - Comprehensive cycle statistics and overview cards
- ✅ Payout winner selection system
  - Eligible member dropdown (excludes previous winners)
  - Automatic payout calculation (total_collected - commission)
  - Receipt generation with unique numbering system
  - Complete winner selection workflow with validation
- ✅ Arrears management (`/arrears`)
  - Automatic overdue payment detection and categorization
  - Severity-based arrears tracking (severe/moderate/minor)
  - Member reminder system (SMS/call/email integration ready)
  - Payment recording and balance adjustment functionality
- ✅ Advance payment handling (`/advances`)
  - Automatic excess payment detection and processing
  - Smart auto-application to future cycle payments
  - Advance balance tracking with cycle coverage display
  - Manual advance application to specific cycles

### Phase 5 Technical Implementation:
- **Database Extensions**: 
  - `member_balances` table for tracking advances/arrears
  - `payouts` table for detailed payout transaction records
  - 15+ database functions for balance calculations and automation
- **UI Components**: 
  - `CyclePaymentMatrix` - Interactive Member × Cycle grid with real-time status
  - `WinnerSelectionDialog` - Complete winner selection workflow
  - `PayoutDialog` - Multi-method payout processing (cash/transfer/UPI/cheque)
  - `ArrearsActions` - Member communication and payment tools
  - `AdvanceActions` - Advance management and application controls
- **Navigation Integration**: Added Cycles, Arrears, and Advances to main navigation
- **Business Logic**: Automated advance detection, balance calculations, and cycle progression

### 🚧 Phase 6: Reporting & Analytics
**Goal**: Comprehensive reporting and business intelligence

**Features to Implement**:
- Collector performance reports
  - Daily/monthly collection summaries
  - Collection efficiency metrics
  - Closing accuracy rates
  - Performance comparison charts
- Chit fund financial reports
  - Profit & loss statements per fund
  - Cash flow analysis
  - Member contribution summaries
  - Cycle-wise collection progress
- Member statements
  - Individual payment history
  - Outstanding dues and advances
  - Personalized payment schedules
- Administrative reports
  - System-wide statistics
  - Regulatory compliance reports
  - Audit trail reports
  - Export to Excel/PDF functionality

### 🚧 Phase 7: Advanced Features & Optimization
**Goal**: Enhanced functionality and user experience

**Features to Implement**:
- Mobile optimization
  - Progressive Web App (PWA) setup
  - Offline collection entry with sync
  - Touch-friendly interfaces for field use
- Bulk operations
  - Bulk member import via CSV
  - Bulk payment processing
  - Mass notifications and reminders
- Advanced reconciliation
  - Automated mismatch detection
  - Smart reconciliation suggestions
  - Integration with banking APIs
- Enhanced user management
  - Collector performance tracking
  - Access logs and audit trails
  - Advanced role-based permissions and granular access control

### 🚧 Phase 8: Integration & Automation
**Goal**: External integrations and workflow automation

**Features to Implement**:
- Communication integrations
  - SMS notifications for due dates
  - WhatsApp integration for receipts
  - Email statements and reports
- Payment gateway integration
  - Online payment options for members
  - Digital wallet integration
  - Bank transfer automation
- Backup and security
  - Automated database backups
  - Data export/import functionality
  - Security audit logs
- API development
  - REST API for third-party integrations
  - Webhook support for external systems
  - Mobile app API endpoints

## Key Business Rules
1. ✅ **Authentication required** - Admin/Collector users must login to access the system
2. ✅ **Role-based access control** - Different permissions for Admin and Collector roles
3. ✅ **Collection → Close → Approve workflow** - All payments must go through closing sessions (Phase 4)
4. ✅ **Reconciliation required** - Declared totals must match system totals (Phase 4)
5. ✅ **Audit trail mandatory** - All financial operations logged with user tracking (Phase 4)
6. ✅ **Protected routes** - Middleware enforces authentication on all main application pages

## Development Guidelines
- Use Supabase MCP tools for database operations
- Use Shadcn MCP tools for new UI components
- Follow existing patterns for forms (React Hook Form + Zod)
- Maintain proper TypeScript typing throughout
- Keep components focused and reusable
- Test with Playwright for UI validation

## Environment Setup
- **Authentication required** - Users must login with email/password to access the system
- **Supabase Auth integration** - Session-based authentication with cookie management
- **Protected routes** - Middleware redirects unauthenticated users to /login
- **User profiles** - Linked to profiles table with role and metadata
- Real database connections work in both dev and production
- Statistics pull from actual database in all modes
- RLS policies enforce data access based on authenticated user

## Authentication Status: ACTIVE ✅
- **Invitation-only access** - Users must be created by administrators via Supabase Dashboard
- **Login required** - All protected routes require authentication
- **Session management** - Supabase Auth handles user sessions with secure cookies
- **Role-based workflow** - Admin and Collector roles with different permissions
- **User context**: Retrieved from `supabase.auth.getUser()` in middleware and server components
- **Protected paths**: `/dashboard`, `/collect`, `/my-collections`, `/collections`, `/closings`, `/approvals`, `/chit-funds`, `/members`, `/users`, `/arrears`, `/advances`
- **Public paths**: `/login`, static assets (signup disabled for security)

### Authentication Implementation Details
**Files**:
- `src/middleware.ts` - Route protection and session validation
- `src/app/(auth)/login/page.tsx` - Login form with Supabase Auth
- `src/lib/supabase/client.ts` - Browser-side Supabase client
- `src/lib/supabase/server.ts` - Server-side Supabase client with cookie handling
- `src/components/layout/user-nav.tsx` - User profile menu with logout
- `src/app/(main)/users/page.tsx` - Read-only user management (view, edit, activate/deactivate)

**Authentication Flow**:
1. **Admin creates user** → Via Supabase Dashboard → Authentication → Users → Invite User
2. **User receives invitation** → Email with login credentials or password reset link
3. User visits protected route → Middleware checks `supabase.auth.getUser()`
4. If no user → Redirect to `/login?redirectTo=/original-path`
5. User logs in → `supabase.auth.signInWithPassword()`
6. Success → Redirect to dashboard or original path
7. All subsequent requests include auth cookie
8. Server components use `createClient()` from `lib/supabase/server.ts` to get user

**Getting Current User**:
```typescript
// In server components or API routes
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

// In client components
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
```

## User Management Policy

**Security Model**: Invitation-only access for financial security and compliance

**User Creation Process**:
1. Admin accesses Supabase Dashboard → Authentication → Users
2. Click "Invite User" button
3. Enter email, assign role metadata (admin/collector)
4. System sends invitation email with credentials
5. User receives email and sets password
6. User can now login via `/login` page

**User Management Interface** (`/users`):
- **Read-only from frontend** - No "Add User" button for security
- **View all users** - List administrators and collectors
- **Edit user details** - Update name, phone, role, address
- **Activate/Deactivate** - Soft delete via `is_active` flag (preserves data)
- **Statistics** - Total users, admins, collectors count

**Why This Approach**:
- ✅ Prevents unauthorized account creation
- ✅ Ensures proper vetting of financial system users
- ✅ Maintains audit trail of user creation
- ✅ Compliance-ready for financial regulations
- ✅ Centralized access control via Supabase Dashboard

**User Types**:
1. **System Users (profiles with auth)** - Admin/Collector who can login
2. **Chit Fund Members (members table)** - Payment recipients, no login access

## Role-Based Access Control (RBAC)

**Security Model**: Strict role-based permissions with UI and server-side enforcement

### Admin vs Collector Permissions

**Admin Access** (Full System Access):
- ✅ Dashboard - System-wide analytics and KPIs
- ✅ Chit Funds - Create, edit, delete funds
- ✅ Collections - Record, view all collections (including pending)
- ✅ Closings - Create, manage, and **approve** closing sessions
- ✅ Cashbook - View ledger and cash summary
- ✅ Members - Manage all chit fund members
- ✅ Arrears - View and manage overdue payments
- ✅ Advances - View and manage advance payments
- ✅ Users - Manage system users (read-only, creation via Supabase)

**Collector Access** (Limited Field Operations):
- ❌ Dashboard - No access (redirects to `/collect`)
- ❌ Chit Funds - No access to fund management
- ✅ Collections - **Record Collection** and **My Collections** only
- ❌ Pending Collections - Admin only
- ✅ Closings - **Create** and **Manage** their own closing sessions
- ❌ Approval Queue - Admin only
- ❌ Cashbook - No access
- ❌ Members - No access
- ❌ Arrears - No access
- ❌ Advances - No access
- ❌ Users - No access

### Implementation Details

**1. UI-Level Protection** (`src/components/layout/app-sidebar.tsx`):
- Navigation items filtered based on `user.role`
- Uses `roles` array on each navigation item
- Collectors only see: Collections (2 items) and Closings (2 items)

**2. Server-Side Protection** (`src/lib/auth/utils.ts`):
- `requireAdmin()` - Guards admin-only pages
- Redirects collectors to `/collect` if they try to access admin pages
- Applied to: Dashboard, Chit Funds, Pending Collections, Approval Queue, Cashbook, Members, Arrears, Users

**3. Landing Page Logic** (`src/app/page.tsx`):
- Admins → Redirected to `/dashboard`
- Collectors → Redirected to `/collect`

**4. Data Filtering** (To be implemented):
- Collectors should only see their own collections and closings
- Queries need `WHERE collector_id = current_user.id` filter
- Applies to: `/my-collections`, `/closings` pages

### Adding Role Protection to New Pages

```typescript
// At the top of any admin-only page:
import { requireAdmin } from '@/lib/auth/utils'

export default async function AdminOnlyPage() {
  await requireAdmin() // Redirects collectors to /collect

  // Rest of page logic
}
```

### Navigation Role Configuration

```typescript
// In app-sidebar.tsx
{
  label: 'Page Name',
  href: '/page',
  icon: IconComponent,
  roles: ['admin']  // or ['admin', 'collector'] or undefined for all
}
```

## Navigation Structure
- **Header**: "Chit Fund Management System" with user profile menu
- **Sidebar Navigation**:
  - Dashboard | Chit Funds | Collections | Closings | Members | Arrears | Advances | Users Management
  - **Collections Submenu**: Record Collection | My Collections | Pending Collections
  - **Closings Submenu**: Create Closing Session | Manage Closings | Approval Queue
  - **Chit Funds**: Individual fund pages now include "Cycles" button for cycle management
- **User Menu**: Profile, theme toggle, and logout options
- **Role-based Dashboard**: Statistics and views adjusted based on admin/collector role
- **Protected Navigation**: All main pages require authentication

## Phase 4 Implementation Status ✅

### Completed Features:
- **Complete closing session workflow** from creation to approval
- **Real-time variance detection** with visual indicators
- **Comprehensive approval system** with bulk operations
- **Full audit trail** with status tracking and timestamps
- **Proper error handling** and validation throughout
- **Mobile-responsive UI** with professional design
- **TypeScript integration** with proper type safety

### Technical Architecture:
- **Database Integration**: Proper foreign key relationships and constraints
- **State Management**: React hooks with proper dependency management
- **Form Validation**: Zod schemas with React Hook Form
- **UI Components**: Shadcn/ui with consistent styling
- **Navigation**: Integrated dropdown menus with active state management

### Workflow Status:
1. **Collection Entry** → ✅ Pending Close
2. **Closing Session** → ✅ Draft/Submitted/Approved/Rejected
3. **Admin Approval** → ✅ With variance analysis and bulk operations
4. **Collection Posting** → ✅ Auto-update to 'closed' status