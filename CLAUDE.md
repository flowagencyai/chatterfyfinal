# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chat SaaS boilerplate with OpenAI-compatible API endpoints and multi-provider support. Monorepo structure with Express API backend, Next.js frontend, and shared packages. Features include chat completions, file uploads, usage tracking, and multi-tenant support with plan-based limits.

## Development Commands

### Initial Setup
```bash
# Install dependencies (monorepo uses pnpm/npm workspaces)
pnpm install  # or npm install

# Setup environment
cp .env.example .env  # Configure API keys and database

# Database setup (SQLite for dev, PostgreSQL for production)
cd apps/api
pnpm prisma:generate  # Generate Prisma client
pnpm prisma:push     # Create/update database schema
```

### Running Services
```bash
# API Backend (Express on port 8787)
cd apps/api
pnpm dev  # Runs tsx watch src/index.ts

# Web Frontend (Next.js on port 3001 with custom port)
cd apps/web
PORT=3001 pnpm dev  # Runs next dev on port 3001

# Build production
cd apps/web
pnpm build  # Creates optimized production build
pnpm start  # Starts production server
```

### Database Management
```bash
cd apps/api
pnpm prisma:generate  # Regenerate client after schema changes
pnpm prisma:push     # Push schema to database (development)

# Test database connection
DATABASE_URL=file:./dev.db node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.$connect().then(() => console.log('✅ Connected')).catch(e => console.error(e))"
```

## Architecture

### Monorepo Structure
- **apps/api**: Express backend with OpenAI-compatible endpoints
  - `src/routes/`: API endpoint handlers
  - `src/middleware/`: Authentication, rate limiting, tenant isolation
  - `src/util/`: Helper functions (metering, etc.)
  - `prisma/`: Database schema and migrations
  
- **apps/web**: Next.js frontend with App Router
  - `app/`: Next.js 14 app directory structure
  - `app/components/`: React components (ChatArea, Sidebar, etc.)
  - `app/contexts/`: React contexts for state management
  - `app/api/auth/`: NextAuth configuration

- **packages/core**: Shared provider adapters
  - `src/adapters/`: Provider-specific implementations (OpenAI, DeepSeek, Anthropic, Google, Ollama)
  - `src/generate.ts`: Main generation logic

### Core API Endpoints

#### Chat Completions
`POST /v1/chat/completions` - OpenAI-compatible chat endpoint
```json
{
  "model": "deepseek-chat",
  "messages": [{"role": "user", "content": "Hello"}],
  "provider": "deepseek",  // or "openai", "anthropic", "google", "ollama"
  "temperature": 0.7,
  "stream": false
}
```

#### Anonymous Chat (No auth required)
`POST /v1/anonymous/chat/completions` - Limited free tier access
- 5 messages per session limit for anonymous users
- Automatic session tracking via cookies
- Session data persists in localStorage

#### File Management
- `POST /v1/files` - Upload files (multipart/form-data)
- `POST /v1/files/presign` - Get S3 presigned URL
- `POST /v1/files/confirm` - Confirm S3 upload
- `GET /v1/files/:id` - Download file (dev mode only)

#### Admin Endpoints
- `POST /admin/seed-plans` - Initialize default plans (FREE, STARTER, PRO)
- `POST /admin/set-plan` - Assign plan to organization
- `GET /admin/usage?org=ORG_ID&from=YYYY-MM-DD&to=YYYY-MM-DD` - Query usage metrics

### Database Schema (SQLite/PostgreSQL via Prisma)

Key models:
- **Organization**: Multi-tenant organizations
- **User**: Users within organizations  
- **Plan**: Available subscription plans (FREE, STARTER, PRO)
- **Subscription**: Active plan subscriptions for organizations
- **Usage**: Token usage tracking per request
- **Thread/Message**: Conversation history
- **FileAsset**: Uploaded file metadata
- **Account/Session**: NextAuth authentication tables

### Middleware Stack

1. **tenant**: Extracts org/user from headers (`X-Org-Id`, `X-User-Id`)
2. **rateLimit**: Global rate limiting (100 req/min default)
3. **orgUserRateLimit**: Per-organization limits (600 req/min org, 240 req/min user)
4. **planGuard**: Enforces plan-based token/storage limits
5. **anonymousGuard**: Manages anonymous session limits (5 messages max)

### Provider Support

Current providers configured:
- **DeepSeek**: Default provider (deepseek-chat model) - most cost-effective
- **OpenAI**: GPT models with streaming support
- **Anthropic**: Claude models
- **Google**: Gemini models
- **Ollama**: Local model support

Provider selection in frontend via ModelSelector component.

## Environment Configuration

### Required Variables
```bash
# Database (SQLite for dev, PostgreSQL for production)
DATABASE_URL="file:./dev.db"  # or postgresql://...

# API Keys (add as needed)
OPENAI_API_KEY=sk-...
DEEPSEEK_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
OLLAMA_API_URL=http://localhost:11434

# Server Configuration
API_PORT=8787
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://yourdomain.com

# Frontend Configuration
NEXT_PUBLIC_API_BASE=http://localhost:8787

# Rate Limiting
RATE_LIMIT_RPM=120
ORG_RATE_LIMIT_RPM=600
USER_RATE_LIMIT_RPM=240

# NextAuth (apps/web)
NEXTAUTH_URL=http://localhost:3001
NEXTAUTH_SECRET=your-secret-here
EMAIL_SERVER=smtp://user:pass@smtp.example.com:587
EMAIL_FROM=noreply@example.com

# S3 Upload (Optional - set USE_S3=true for production)
USE_S3=false
AWS_S3_BUCKET=your-bucket
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
MAX_FILE_SIZE_MB=50
```

## Authentication Flow

1. **Frontend**: NextAuth with magic link email authentication
   - Access `/auth` to login
   - Email verification at `/auth/verify-request`
   - Session management via cookies

2. **API Access**: Headers-based authentication
   - Authenticated: `X-Org-Id` and `X-User-Id` headers required
   - Anonymous: Automatic session tracking with limits

## Usage Tracking & Limits

### Plan Tiers
- **FREE**: 10K tokens/day, 10MB storage
- **STARTER**: 100K tokens/day, 100MB storage  
- **PRO**: 1M tokens/day, 1GB storage

### Metering
- Every API call logs to `Usage` table
- Tracks prompt/completion/total tokens
- Estimates cost per provider/model
- Daily aggregation for reporting via `/admin/usage`

## Frontend Architecture

### Key Components
- **ChatArea**: Main chat interface with message input and loading states
- **MessageList**: Renders conversation history with markdown support
- **Sidebar**: Thread management and navigation
- **ModelSelector**: Provider/model selection dropdown
- **FileDropZone**: Drag-and-drop file upload
- **UpgradeModal**: Prompts anonymous users to sign up
- **ChatHeader**: Displays current thread info and controls
- **SettingsModal**: User preferences and configuration

### State Management
- **ChatContext**: Global chat state (threads, messages, user status)
  - Handles thread creation/deletion
  - Manages message sending and receiving
  - Controls loading states
- **Session**: NextAuth session management
- Thread persistence in localStorage for anonymous users

## Testing

### API Testing
```bash
# Authenticated request
curl -X POST http://localhost:8787/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "X-Org-Id: org123" \
  -H "X-User-Id: user456" \
  -d '{"model": "deepseek-chat", "messages": [{"role": "user", "content": "Hello"}]}'

# Anonymous request
curl -X POST http://localhost:8787/v1/anonymous/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "deepseek-chat", "messages": [{"role": "user", "content": "Hello"}]}'
```

### Frontend Testing
Test scripts available in project root:
- `test-anonymous-loading.js` - Tests loading indicator behavior
- `test-login-flow.js` - Tests authentication flow
- `test-streaming.js` - Tests streaming responses

## Critical Bug Fixes Applied

### Loading Indicator First Message Issue - RESOLVED ✅ (2025-08-19)
**Problem:** Loading indicator would not appear on first message in draft mode, only from second message onwards.

**Root Cause:** 
- First message in draft mode triggers automatic navigation from `/` to `/c/thread-id`
- This navigation remounts ChatArea component, losing local `isLoading` state
- Loading appeared briefly (100ms) but disappeared immediately after navigation

**Solution Applied:**
- Moved `isLoading` state from ChatArea (local) to ChatContext (global)
- Added `isLoading` and `setIsLoading` to ChatContext interface and provider
- Updated ChatArea to use context-based loading state instead of local state
- Loading now persists through navigation and works consistently on all messages

**Files Modified:**
- `apps/web/app/contexts/ChatContext.tsx`: Added isLoading state management
- `apps/web/app/components/ChatArea.tsx`: Removed local isLoading, uses context

**Test Results:** ✅ Loading appears correctly on first message, persists through navigation, clears after response

### Technical Implementation Details

#### **Problem Investigation Process:**
1. **Initial Symptom**: User reported loading indicator missing on first message only
2. **Hypothesis Testing**: Created multiple test scripts to isolate the issue:
   - `debug-handlesubmit-flow.js` - Traced handleSubmit execution
   - `debug-timing.js` - Monitored DOM state changes during submission
   - `test-navigation-timing.js` - Analyzed navigation vs loading timing
3. **Root Cause Discovery**: Loading was created but disappeared after automatic navigation

#### **Key Findings:**
- Loading indicator WAS being created (confirmed via DOM monitoring)
- Navigation from `/` to `/c/thread-id` occurred at ~143ms after message send
- Component remounting during navigation reset local `isLoading` state to `false`
- Second+ messages worked because no navigation occurred (already in thread mode)

#### **Architecture Decision:**
```javascript
// BEFORE (Problematic - Local State)
function ChatArea() {
  const [isLoading, setIsLoading] = useState(false); // Lost on navigation
  // ...
}

// AFTER (Solution - Global Context State)  
function ChatArea() {
  const { isLoading, setIsLoading } = useChatContext(); // Survives navigation
  // ...
}
```

#### **State Management Pattern Applied:**
```javascript
// ChatContext.tsx - Global State Management
interface ChatContextType {
  // ... existing properties
  isLoading: boolean;                    // ← Added
  setIsLoading: (loading: boolean) => void; // ← Added
}

const [isLoading, setIsLoading] = useState(false); // ← Centralized state
```

#### **Why This Solution Works:**
1. **Persistence**: Context state survives component remounting during navigation
2. **Centralization**: Single source of truth for loading state across all components
3. **React Lifecycle Safe**: Context persists while individual components mount/unmount
4. **Navigation Safe**: State maintained during automatic route transitions

#### **Validation Method:**
```javascript
// Test sequence that confirmed the fix
[985] Loading: 2, URL: home         ← Loading appears
🔗 [143] NAVEGAÇÃO: URL mudou       ← Navigation happens  
[146] Loading: 2, URL: thread-id    ← Loading PERSISTS (fixed!)
```

## Development Strategy & Quality Assurance

### 🛡️ Pre-Development Checklist (MANDATORY)
**Before implementing ANY new feature, ALWAYS follow this protocol:**

#### 1. **Backup Strategy** 
```bash
# Create timestamped backups before ANY changes
cp apps/web/app/components/ComponentName.tsx ComponentName.tsx.backup-$(date +%Y%m%d-%H%M%S)
cp apps/web/app/contexts/ContextName.tsx ContextName.tsx.backup-$(date +%Y%m%d-%H%M%S)
```

#### 2. **Impact Analysis**
- 📋 **State Dependencies**: Map all state dependencies (local vs context vs external)
- 🔄 **Navigation Flows**: Identify if feature affects routing/navigation 
- 🎯 **Component Lifecycle**: Check if feature involves component mounting/unmounting
- 🔗 **Context Interactions**: Verify interactions with ChatContext, AuthContext, etc.
- 📱 **User Experience**: Map complete user journey for the feature

#### 3. **Testing Strategy**
```bash
# Create test scripts BEFORE implementation
# Example: test-new-feature-NAME.js
```

### 🏗️ Implementation Best Practices

#### **State Management Hierarchy**
```
1. Global State (ChatContext) - For data that survives navigation
   ├─ isLoading, currentThread, threads
   └─ Use for: Authentication, loading states, thread data

2. Local Component State - For UI-only data  
   ├─ input, showModal, selectedOption
   └─ Use for: Form inputs, UI toggles, temporary data
```

#### **Navigation-Safe Patterns**
```javascript
// ❌ AVOID - Local state lost on navigation
const [isLoading, setIsLoading] = useState(false);

// ✅ PREFER - Context state survives navigation  
const { isLoading, setIsLoading } = useChatContext();
```

#### **Critical Architecture Lessons Learned**
**From Loading State Bug Resolution (2025-08-19):**

1. **Navigation Timing Issues**:
   ```javascript
   // Problem: Automatic navigation in ChatContext.createThread()
   setTimeout(() => {
     router.push(`/c/${newThread.id}`); // Causes component remount
   }, 100);
   
   // Impact: Any local state in ChatArea is lost during this navigation
   ```

2. **State Scope Decision Matrix**:
   ```
   ┌─────────────────────┬─────────────┬──────────────┐
   │ State Type          │ Scope       │ Survives Nav │
   ├─────────────────────┼─────────────┼──────────────┤
   │ isLoading           │ Context     │ ✅ Yes       │
   │ currentThread       │ Context     │ ✅ Yes       │
   │ input text          │ Local       │ ❌ No        │
   │ showModal           │ Local       │ ❌ No        │
   │ form validation     │ Local       │ ❌ No        │
   └─────────────────────┴─────────────┴──────────────┘
   ```

3. **Debug Strategy That Worked**:
   ```javascript
   // Step 1: Confirm the problem exists
   node test-duplicate-messages.js
   
   // Step 2: Isolate the timing issue  
   node debug-timing.js
   
   // Step 3: Identify navigation impact
   node test-navigation-timing.js
   
   // Step 4: Implement & validate fix
   node test-final-loading-fix.js
   ```

4. **When to Use Context vs Local State**:
   ```javascript
   // Use Context for:
   ✅ Data that needs to survive navigation
   ✅ Data shared between multiple components  
   ✅ Loading states during async operations
   ✅ Authentication/session data
   
   // Use Local State for:
   ✅ Form input values
   ✅ UI toggles (modals, dropdowns)
   ✅ Component-specific temporary data
   ✅ Data that should reset on navigation
   ```

#### **React Context Guidelines**
- **Global State**: Authentication, chat threads, loading states
- **Local State**: Form inputs, modals, UI toggles
- **Session Storage**: Temporary data that survives page refresh
- **Local Storage**: Persistent user preferences

### 🧪 Mandatory Testing Protocol

#### **For Every New Feature:**
1. **Draft Mode Testing**: Test feature when no thread exists (`/` route)
2. **Thread Mode Testing**: Test feature within existing thread (`/c/thread-id`)
3. **Navigation Testing**: Test feature during automatic navigation transitions
4. **Anonymous vs Authenticated**: Test in both user states
5. **Edge Cases**: Empty states, loading states, error states

#### **Critical Test Scenarios:**
```javascript
// Always test these scenarios
1. First message (draft mode → thread creation → navigation)
2. Subsequent messages (existing thread)
3. Context switching (thread to thread)
4. Authentication state changes (login/logout)
5. Component remounting (page refresh, navigation)
```

### 🔍 Debugging Methodology

#### **When Issues Occur:**
1. **Identify Scope**: Is it state-related, navigation-related, or lifecycle-related?
2. **Create Isolation Tests**: Test feature in isolation before integration
3. **State Tracing**: Add temporary logs to trace state changes
4. **Timeline Analysis**: Use browser tools to analyze component lifecycle
5. **Rollback Ready**: Always have working backup to revert to

#### **Proven Debug Pattern (Used in Loading State Fix):**

**Phase 1: Problem Confirmation**
```javascript
// Create comprehensive test to confirm issue exists
const { chromium } = require('playwright');
// Monitor both DOM state AND console logs simultaneously
// Focus on: What SHOULD happen vs What ACTUALLY happens
```

**Phase 2: Deep Investigation**
```javascript
// Add detailed logging to isolate timing issues
page.on('console', msg => {
  // Capture ALL relevant events with precise timestamps
  const timestamp = new Date().toLocaleTimeString('pt-BR', { 
    hour12: false, fractionalSecondDigits: 3 
  });
});
```

**Phase 3: Root Cause Analysis**
```javascript
// Test specific hypothesis with focused scenarios
// Example: "Is the problem navigation-related?"
page.on('framenavigated', (frame) => {
  console.log(`🔗 NAVEGAÇÃO: ${frame.url()}`);
});
```

**Phase 4: Solution Validation**
```javascript
// Comprehensive test covering all edge cases
// Test sequence: Draft mode → Navigation → Thread mode → Response
// Verify: Problem fixed + No regressions introduced
```

#### **Debug Tools Template**:
```javascript
// Always include in debug scripts:
1. Precise timestamps with milliseconds
2. DOM state monitoring (MutationObserver)
3. Navigation event tracking
4. Console log filtering for relevant events
5. Before/after state comparisons
6. Multiple scenario testing (first msg, second msg, etc.)
```

#### **Common Pitfalls to Avoid:**
- ❌ Using local state for data that needs to survive navigation
- ❌ Not accounting for component remounting during navigation  
- ❌ Ignoring anonymous vs authenticated user differences
- ❌ Not testing draft mode vs thread mode scenarios
- ❌ Assuming state persists across page transitions

### 📋 Feature Implementation Workflow

#### **STEP 1: Planning & Analysis**
```
□ Read existing CLAUDE.md thoroughly
□ Identify all components/contexts that will be affected
□ Map state dependencies and data flow
□ Create backup of all files to be modified
□ Design test scenarios for the feature
```

#### **STEP 2: Implementation**
```
□ Follow state management hierarchy guidelines
□ Implement feature with navigation safety in mind
□ Add appropriate error handling and fallbacks
□ Keep changes minimal and focused
□ Test immediately after each significant change
```

#### **STEP 3: Testing & Validation**
```
□ Run feature in draft mode (first message scenario)
□ Run feature in thread mode (subsequent messages)
□ Test navigation scenarios and component remounting
□ Test both anonymous and authenticated states
□ Verify no regression in existing functionality
```

#### **STEP 4: Documentation**
```
□ Update CLAUDE.md with any new patterns or learnings
□ Document any state changes or new dependencies
□ Add feature to appropriate section of documentation
□ Remove temporary debug code and test files
```

### 🎯 Quality Gates

**No feature ships without:**
- ✅ Backup of original files created
- ✅ Testing in both draft mode and thread mode
- ✅ Verification that navigation doesn't break functionality
- ✅ Testing in both anonymous and authenticated states
- ✅ Documentation updated in CLAUDE.md

## Architectural Patterns & Solutions

### 🏗️ **Navigation-Safe State Management**
**Pattern discovered during Loading State Bug Fix (2025-08-19)**

#### **Problem Pattern:**
```javascript
// ❌ This pattern WILL break during navigation
function Component() {
  const [criticalState, setCriticalState] = useState(false);
  
  // State is lost when:
  // 1. Component unmounts due to route change
  // 2. Page refresh occurs  
  // 3. Automatic navigation happens (like draft→thread)
}
```

#### **Solution Pattern:**
```javascript
// ✅ Navigation-safe pattern
function Component() {
  const { criticalState, setCriticalState } = useAppContext();
  
  // State survives:
  // ✅ Route changes
  // ✅ Component remounting  
  // ✅ Automatic navigation
  // ✅ Page refresh (with proper persistence)
}
```

### 🎯 **State Scope Decision Framework**

#### **Use Context/Global State When:**
- ✅ Data needs to survive navigation transitions
- ✅ Multiple components need access to the same data
- ✅ State changes during async operations (loading, API calls)
- ✅ Data represents application-wide state (auth, themes, etc.)

#### **Use Local State When:**
- ✅ Data is purely UI-related (form inputs, modal visibility)
- ✅ State should reset when user navigates away
- ✅ Component-specific temporary data
- ✅ Performance-sensitive frequent updates

### 🔬 **Systematic Debugging Approach**

#### **The 4-Phase Method (Proven Effective):**
1. **Confirmation**: Reproduce issue reliably with comprehensive tests
2. **Investigation**: Deep dive with precise logging and state monitoring  
3. **Analysis**: Form and test specific hypotheses about root cause
4. **Validation**: Verify fix works + no regressions across all scenarios

#### **Debug Script Standards:**
```javascript
// Template for effective debugging
const debugScript = {
  timestamps: 'pt-BR with milliseconds',
  monitoring: ['DOM changes', 'Navigation events', 'State changes'],
  scenarios: ['First message', 'Subsequent messages', 'Edge cases'],
  validation: 'Before/after comparisons with multiple test cases'
};
```

### 🛠️ **React + Next.js Navigation Gotchas**

#### **Known Issue Patterns:**
1. **Automatic Navigation State Loss**: Local state lost during programmatic navigation
2. **Component Lifecycle Assumptions**: Assuming state persists across remounts
3. **Route-Dependent Behavior**: Features working in one route but not another
4. **Timing Dependencies**: Race conditions between navigation and state updates

#### **Proven Solutions:**
- Context for navigation-persistent state
- useRef for values that must survive re-renders
- sessionStorage for temporary navigation-safe data  
- localStorage for true persistence across sessions

## Key Implementation Notes

- Default model is DeepSeek (deepseek-chat) for cost efficiency
- Anonymous users limited to 5 messages per session
- File uploads stored locally in development (`uploads/` directory), S3 in production
- Streaming only supported for OpenAI provider currently
- Rate limits: 100 req/min global, configurable per org/user
- Session data persists in localStorage for anonymous users
- Magic link authentication requires email server configuration
- Database uses SQLite for development (file:./dev.db)
- Frontend runs on port 3001 to avoid conflicts (use PORT=3001 pnpm dev)
- API runs on port 8787 by default

## Common Issues & Solutions

### Database Connection Issues
```bash
# Check if database file exists
ls -la apps/api/prisma/dev.db

# Recreate database if needed
cd apps/api
rm prisma/dev.db
pnpm prisma:push
```

### Port Conflicts
```bash
# Kill process on port if needed
lsof -ti:8787 | xargs kill -9  # API port
lsof -ti:3001 | xargs kill -9  # Frontend port
```

### Authentication Not Working
- Ensure EMAIL_SERVER is configured correctly
- Check NEXTAUTH_URL matches your frontend URL
- Verify NEXTAUTH_SECRET is set