# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MagIQ is a full-stack application for managing construction work orders and shift scheduling. It consists of a React frontend and Supabase backend with Edge Functions for PDF processing using AI.

**Project Structure:**
- `/app/frontend` - React TypeScript frontend
- `/app/supabase` - Backend (Edge Functions, migrations, configuration)

**Key Technologies:**

Frontend:
- React 19 with TypeScript
- Vite 6.2 with @tailwindcss/vite plugin
- Tailwind CSS v4
- React Router v7
- Zustand for state management
- react-pdf for PDF rendering
- shadcn/ui components

Backend:
- Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- Deno runtime for Edge Functions
- Google Gemini AI API for PDF processing
- TypeScript

## Common Development Commands

### Frontend Commands
```bash
cd /app/frontend
npm run dev        # Start development server (port 5173)
npm run build      # TypeScript check + production build
npm run lint       # Run ESLint
npm run preview    # Preview production build
```

### Backend Commands
```bash
cd /app
supabase start     # Start local Supabase (requires Docker)
supabase db reset  # Reset database and apply migrations
supabase functions serve process-pdf-single --env-file supabase/functions/process-pdf-single/.env
```

**Environment Setup:**
- Frontend: Create `/app/frontend/.env` with Supabase URL and anon key
- Backend: Create `/app/supabase/functions/process-pdf-single/.env` with `GEMINI_API_KEY`

**Note:** There are no test scripts configured. When implementing tests, add appropriate test commands to package.json.

## High-Level Architecture

### Multi-Company Architecture
The application supports multiple construction companies through dynamic configuration:
- Company ID is determined at runtime and stored in Zustand store (`useCompanyStore`)
- Configuration loaded from `/public/config/active.json`
- Company-specific prompts for PDF processing in backend

### Authentication Flow
- Supabase Auth handles user authentication
- `ProtectedRoute` component wraps authenticated pages
- After login, users are redirected to `/admin` (admin dashboard)
- User sessions managed through Supabase client

### PDF Processing Pipeline
1. **Frontend Upload**: Files uploaded via drag-and-drop or file input in `WorkOrderTool`
2. **Backend Processing**: Supabase Edge Function `process-pdf-single` extracts text using Google Gemini API
   - Converts PDF to Base64 for Gemini API
   - Uses `gemini-2.5-flash-preview-04-17` model
   - Tracks token usage and processing time
3. **Company-Specific Prompts**: Different prompts based on `companyId`
   - `NOHARA_G`: 野原G住環境
   - `KATOUBENIYA_MISAWA`: 加藤ベニヤ池袋_ミサワホーム
   - Prompts enforce strict formatting (全角/半角)
4. **Database Storage**: Results saved to `work_orders` table
5. **Result Display**: Extracted text shown in `GeneratedTextPanel` for review/editing

### State Management Patterns
- **Global State**: Zustand for company configuration
- **Component State**: Local React state for UI interactions
- **Server State**: Supabase queries for data fetching
- **PDF State**: Custom hooks (`usePdfDocument`, `usePdfControls`) for PDF viewer state

### Routing Architecture
```
/ (Home)
/login
/admin/* (Protected)
  - /admin (Dashboard)
  - /admin/projects/* (Project management)
  - /admin/work-order-tool (PDF processing)
/dashboard (User dashboard)
/shift-form (Shift submission)
```

## Backend Architecture

### Database Schema

**work_orders table:**
- Stores PDF processing results
- Fields: `id`, `file_name`, `uploaded_at`, `company_name`, `prompt_identifier`, `generated_text`, `edited_text`, `status`, `error_message`, `gemini_processed_at`

**shifts table:**
- Manages staff shift scheduling
- Fields: `id`, `user_id`, `date`, `shift_type`, `custom_end_time`, `note`

### Edge Functions

**process-pdf-single:**
- Endpoint: `/functions/v1/process-pdf-single`
- Method: POST (multipart/form-data)
- Required: PDF file, company ID
- Returns: Generated text and metadata

## Key Implementation Details

### Environment Variables

Frontend (`/app/frontend/.env`):
```env
VITE_PUBLIC_SUPABASE_URL=your_supabase_url
VITE_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Backend (`/app/supabase/functions/process-pdf-single/.env`):
```env
GEMINI_API_KEY=your_gemini_api_key
```

### Frontend Implementation Details

**Path Aliases:**
- TypeScript configured with `@/*` → `./src/*` for clean imports

**PDF Worker Configuration:**
- PDF.js worker files must be copied to `public/pdfjs-dist/` for PDF rendering

**Company-Specific Features:**
1. Check `useCompanyStore` for current company context
2. Reference company constants in `frontend/src/constants/company.ts`
3. Company-specific prompts in `supabase/functions/process-pdf-single/prompts/`

**Supabase Integration:**
- Client initialized in `frontend/lib/supabase.ts`
- API calls centralized in `frontend/lib/api.ts`
- Database types defined in `frontend/types/index.ts`

### Backend Implementation Details

**Prompt Registry:**
- Mapping in `supabase/functions/process-pdf-single/promptRegistry.ts`
- Each company has versioned prompts (e.g., "V20250526")
- Strict formatting rules for Japanese text processing

**Security:**
- Uses Supabase service role for database access
- CORS headers configured for cross-origin requests
- Proper error handling for API failures

## Git Branch Strategy

This project follows Git-Flow principles for branch management:

### Branch Structure
```
main (production-ready)
├── dev (development/integration)
├── feature/* (new features)
├── fix/* (bug fixes)
├── hotfix/* (urgent production fixes)
└── release/* (release preparation)
```

### Branch Types and Usage

1. **Feature Branches** (`feature/*`)
   - Created from: `dev`
   - Merge back to: `dev`
   - Examples: `feature/add-export-pdf`, `feature/multi-language-support`
   - Use for: New functionality, enhancements

2. **Fix Branches** (`fix/*`)
   - Created from: `dev`
   - Merge back to: `dev`
   - Examples: `fix/pdf-viewer-crash`, `fix/auth-redirect-loop`
   - Use for: Non-urgent bug fixes in development

3. **Hotfix Branches** (`hotfix/*`)
   - Created from: `main`
   - Merge back to: `main` AND `dev`
   - Examples: `hotfix/critical-security-patch`, `hotfix/payment-processing`
   - Use for: Critical production issues requiring immediate fix

4. **Release Branches** (`release/*`)
   - Created from: `dev`
   - Merge back to: `main` AND `dev`
   - Examples: `release/1.2.0`, `release/2.0.0-beta`
   - Use for: Preparing releases, final testing, version bumps

### Branch Selection Guidelines

When deciding which branch to create:

- **New functionality or enhancement** → `feature/*`
- **Bug in development environment** → `fix/*`
- **Critical bug in production** → `hotfix/*`
- **Preparing for deployment** → `release/*`
- **Small documentation updates** → Can work directly on `dev`

### Best Practices

- **Descriptive Names**: Use clear, kebab-case names that describe the change
- **Small, Focused Changes**: Keep branches focused on a single issue or feature
- **Regular Updates**: Sync with `dev` regularly to avoid conflicts
- **Testing**: Always run `npm run build` and `npm run lint` before creating PR
- **Clean History**: Use meaningful commit messages

## Automated Commit and PR Creation

Claude Code will automatically handle commits and PR creation with appropriate granularity:

### Auto-Commit Guidelines

**When to Commit:**
- After completing a logical unit of work (e.g., implementing a function, fixing a specific bug)
- When switching between different files or components
- Before running tests or build commands
- After significant refactoring

**Commit Message Format:**
```
<type>: <subject>

<body (optional)>
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring without changing functionality
- `test`: Adding or updating tests
- `chore`: Maintenance tasks, dependency updates

### Auto-PR Guidelines

**PR Creation Triggers:**
- Feature implementation complete
- Bug fix verified and tested
- Multiple related commits ready for review
- User explicitly requests deployment

**PR Format:**
```markdown
## Summary
- Brief description of changes
- Impact on existing functionality

## Changes Made
- Specific file/component changes
- Technical approach taken

## Testing
- Commands run: `npm run lint`, `npm run build`
- Manual testing performed
- Edge cases considered

🤖 Generated with [Claude Code](https://claude.ai/code)
```

### Automatic Workflow Example

When you ask me to implement a feature, I will:

1. Create appropriate branch (`feature/`, `fix/`, etc.)
2. Make changes with logical commits
3. Run tests and linting
4. Create PR when the work is complete
5. Provide you with the PR URL

You can always tell me to:
- "Hold off on commits" if you want to review first
- "Create PR now" if you want to merge work-in-progress
- "Squash commits" if you prefer a cleaner history

### Example Workflow
```bash
# For a new feature
git checkout dev
git pull origin dev
git checkout -b feature/add-email-notifications

# Make changes and test...
npm run lint
npm run build

# Commit with descriptive message
git add .
git commit -m "feat: Add email notification system with customizable templates"
git push origin feature/add-email-notifications

# Create PR to dev branch
gh pr create --base dev --title "Add email notification system" --body "..."

# For a hotfix
git checkout main
git pull origin main
git checkout -b hotfix/fix-auth-token-expiry

# Fix, test, and push...
# Create PRs to both main and dev
```

## Important Notes

- No test framework is currently configured
- Using Tailwind CSS v4 with Vite plugin (not PostCSS)
- Frontend deployment configured for Vercel with SPA routing
- PDF processing requires backend Gemini API key configuration
- Database uses PostgreSQL 15 through Supabase
- Edge Functions use Deno v1 runtime
- Local development requires Docker for Supabase services