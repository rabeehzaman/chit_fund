# Claude Code Instructions

This file contains instructions and context for Claude Code to help with this project.

## Project Overview
Chit Fund Management System with Field Collectors & Cash Closing Workflows

**Core Concept**: A digital system to manage chit funds with field collectors who collect payments from members, submit cash batches for admin approval, and track all financial operations with proper audit trails.

**Key Features Implemented**:
- ❌ ~~Admin/Collector role-based system~~ → **Simplified single-admin system**
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
- **Authentication**: ❌ REMOVED - Direct database access

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
│   └── api/                   # API routes (if needed)
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
- Enhanced profiles table with admin/collector roles
- Members table for non-login users
- Cycles table with auto-generation
- Collection entries and closing sessions tables
- Row Level Security (RLS) policies implemented

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
  - Role-based permissions (if auth is re-added)

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

## Key Business Rules (Updated)
1. ❌ ~~Only Admin/Collectors login~~ → **No authentication required - direct access**
2. ✅ **Collection → Close → Approve workflow** - All payments must go through closing sessions (Phase 4)
3. ✅ **Reconciliation required** - Declared totals must match system totals (Phase 4) 
4. ✅ **Audit trail mandatory** - All financial operations logged (Phase 4)
5. ❌ ~~Role-based access~~ → **Single admin context for all operations**

## Development Guidelines
- Use Supabase MCP tools for database operations
- Use Shadcn MCP tools for new UI components
- Follow existing patterns for forms (React Hook Form + Zod)
- Maintain proper TypeScript typing throughout
- Keep components focused and reusable
- Test with Playwright for UI validation

## Environment Setup
- **Authentication completely removed** - System now works without any auth requirements
- **Simplified access model** - Direct database access for all operations
- **Default admin context** - Uses system-admin user for operations that need user context
- Real database connections work in both dev and production
- Statistics pull from actual database in all modes

## Authentication Status: REMOVED ❌
- **No login required** - All pages accessible directly
- **No user sessions** - System operates with default admin context
- **Simplified workflow** - Forms and operations work immediately without auth barriers
- **Default user context**: 
  ```javascript
  {
    id: 'system-admin',
    email: 'admin@chitfund.com', 
    full_name: 'System Administrator',
    role: 'admin'
  }
  ```

## Navigation Structure (Updated)
- **Header**: "Chit Fund Management System" with Home button
- **Navigation Tabs**: 
  - Dashboard | Chit Funds | Collections | Closings | Members | Arrears | Advances | Users Management
  - **Collections Dropdown**: Record Collection | My Collections | Pending Collections
  - **Closings Dropdown**: Create Closing Session | Manage Closings | Approval Queue
  - **Chit Funds**: Individual fund pages now include "Cycles" button for cycle management
- **Simplified Dashboard**: Removed role-based conditional logic
- **Direct Access**: All management pages accessible without authentication

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