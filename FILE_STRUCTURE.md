# InvestHub AI - Complete Directory Structure

## Root Level Files

```
investhub-ai/
├── package.json                 # Workspaces config
├── .gitignore                   # Git ignore rules
├── README.md                    # Main documentation
├── SETUP.md                     # Setup instructions
```

## Client Directory (`/client`)

```
client/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with metadata
│   │   ├── page.tsx            # Home landing page
│   │   ├── globals.css         # Global Tailwind styles
│   │   ├── dashboard/
│   │   │   ├── layout.tsx      # Dashboard layout
│   │   │   └── page.tsx        # Dashboard page
│   │   └── projects/           # (To be created)
│   │       ├── page.tsx        # Projects listing
│   │       └── [id]/
│   │           └── page.tsx    # Project detail
│   ├── components/
│   │   ├── Navigation.tsx      # Top navigation bar
│   │   ├── ProjectCard.tsx     # Project card component
│   │   ├── Footer.tsx          # (To be created)
│   │   ├── Button.tsx          # (To be created)
│   │   └── Modal.tsx           # (To be created)
│   ├── store/                  # Zustand state stores
│   │   ├── auth.ts            # Auth store (login, user)
│   │   ├── projects.ts        # Projects store (list, cache)
│   │   └── investments.ts     # (To be created)
│   └── lib/
│       ├── api.ts             # Axios instance + interceptors
│       ├── projects.ts        # Projects API calls
│       ├── investments.ts     # Investments API calls
│       ├── ai-analysis.ts     # AI Analysis API calls
│       └── auth.ts            # (To be created) Auth API calls
├── public/                      # Static files
│   ├── favicon.ico
│   └── images/
├── .env.example                # Environment variables template
├── .eslintrc.json              # ESLint config
├── next.config.ts              # Next.js config
├── tailwind.config.ts          # Tailwind CSS config
├── postcss.config.js           # PostCSS config
├── tsconfig.json               # TypeScript config
└── package.json                # Dependencies
```

## Server Directory (`/server`)

```
server/
├── src/
│   ├── main.ts                 # Application bootstrap
│   ├── app.module.ts           # Root NestJS module
│   ├── modules/
│   │   ├── users/
│   │   │   ├── users.module.ts       # Users module
│   │   │   ├── users.service.ts      # Users business logic
│   │   │   ├── users.controller.ts   # Users endpoints
│   │   │   ├── dto/                  # (To be created)
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   └── update-user.dto.ts
│   │   │   └── users.service.spec.ts # (To be created)
│   │   ├── projects/
│   │   │   ├── projects.module.ts    # Projects module
│   │   │   ├── projects.service.ts   # Projects business logic
│   │   │   ├── projects.controller.ts# Projects endpoints
│   │   │   ├── dto/                  # (To be created)
│   │   │   └── projects.service.spec.ts # (To be created)
│   │   ├── investments/
│   │   │   ├── investments.module.ts     # Investments module
│   │   │   ├── investments.service.ts    # Investments business logic
│   │   │   ├── investments.controller.ts # Investments endpoints
│   │   │   ├── dto/                      # (To be created)
│   │   │   └── investments.service.spec.ts # (To be created)
│   │   └── ai-analysis/
│   │       ├── ai-analysis.module.ts     # AI Analysis module
│   │       ├── ai-analysis.service.ts    # AI Analysis business logic
│   │       ├── ai-analysis.controller.ts # AI Analysis endpoints
│   │       └── ai-analysis.service.spec.ts # (To be created)
│   └── common/
│       ├── prisma/
│       │   ├── prisma.service.ts    # Prisma ORM service
│       │   └── prisma.module.ts     # Prisma module
│       ├── auth/
│       │   ├── auth.module.ts       # Auth module
│       │   ├── jwt.strategy.ts      # JWT strategy
│       │   ├── auth.guard.ts        # (To be created)
│       │   └── auth.service.ts      # (To be created)
│       └── decorators/
│           └── current-user.decorator.ts # Current user decorator
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── migrations/             # (Auto-generated)
├── test/                        # Test files
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
├── .env.example                # Environment variables template
├── .nest-cli.json              # NestJS CLI config
├── .nestignore                 # Files to ignore
├── jest.config.ts              # Jest testing config
├── knexfile.js                 # Database migrations config
├── tsconfig.json               # TypeScript config
└── package.json                # Dependencies
```

## Shared Directory (`/shared`)

```
shared/
├── types/
│   ├── index.ts                # Exports all types
│   ├── user.ts                 # User interfaces (IUser, CreateUserDTO, etc.)
│   ├── project.ts              # Project interfaces (IProject, CreateProjectDTO, etc.)
│   ├── investment.ts           # Investment interfaces (IInvestment, CreateInvestmentDTO, etc.)
│   └── ai-analysis.ts          # AI Analysis interfaces (IAIAnalysis, AIAnalysisRequest, etc.)
├── tsconfig.json               # TypeScript config
└── package.json                # Package definition
```

## Key Files Reference

### Configuration Files

- `tailwind.config.ts` - Tailwind CSS configuration (colors, fonts, spacing)
- `next.config.ts` - Next.js compilation and optimization settings
- `tsconfig.json` - TypeScript compiler options
- `jest.config.ts` - Jest testing framework configuration
- `prisma/schema.prisma` - Database schema definitions

### Environment Files

- `.env.example` or `.env.local.example` - Template for environment variables
- `.env` or `.env.local` - Actual environment variables (not in git)

### Package Files

- `package.json` - Dependencies, scripts, metadata for each workspace
- `pnpm-lock.yaml` - Dependency lock file (if using pnpm)

## Quick File Navigation Tips

### Frontend Styling (Tailwind)

→ `client/tailwind.config.ts` (colors, theme)
→ `client/src/app/globals.css` (global styles)
→ `client/src/components/` (reusable components)

### Backend API

→ `server/src/modules/*/**.controller.ts` (endpoints)
→ `server/src/modules/*/**.service.ts` (business logic)
→ `server/prisma/schema.prisma` (database)

### Shared Types

→ `shared/types/` (all interfaces used by client & server)

### State Management

→ `client/src/store/` (Zustand stores)

### API Integration

→ `client/src/lib/` (axios + API methods)

## File Purpose Guide

| File Type        | Purpose                       | Location                |
| ---------------- | ----------------------------- | ----------------------- |
| `.tsx`           | React components (App Router) | `client/src/app/`       |
| `.ts` (store)    | Zustand state                 | `client/src/store/`     |
| `.ts` (lib)      | API utilities                 | `client/src/lib/`       |
| `.controller.ts` | HTTP endpoints                | `server/src/modules/*/` |
| `.service.ts`    | Business logic                | `server/src/modules/*/` |
| `.module.ts`     | NestJS modules                | `server/src/modules/*/` |
| `.ts` (shared)   | Interfaces & types            | `shared/types/`         |
| `schema.prisma`  | Database schema               | `server/prisma/`        |
| `.config.*`      | Configuration                 | Root or workspace root  |

## Files to Create Next (Priority Order)

1. **Authentication**
   - `/server/src/common/auth/auth.service.ts` - Login/register logic
   - `/server/src/modules/auth/` - Auth endpoints
   - `/client/src/app/auth/login/page.tsx` - Login page
   - `/client/src/app/auth/signup/page.tsx` - Signup page

2. **UI Components**
   - `/client/src/components/Button.tsx` - Button component
   - `/client/src/components/Form.tsx` - Form wrapper
   - `/client/src/components/Input.tsx` - Input field
   - `/client/src/components/Modal.tsx` - Modal dialog

3. **Pages**
   - `/client/src/app/explore/page.tsx` - Explore projects
   - `/client/src/app/projects/[slug]/page.tsx` - Project detail
   - `/client/src/app/profile/page.tsx` - User profile

4. **DTOs for Validation**
   - `/server/src/modules/users/dto/create-user.dto.ts`
   - `/server/src/modules/projects/dto/create-project.dto.ts`
   - `/server/src/modules/investments/dto/create-investment.dto.ts`

5. **Tests**
   - `/server/src/**/*.spec.ts` - Unit tests
   - `/server/test/**/*.e2e-spec.ts` - E2E tests
