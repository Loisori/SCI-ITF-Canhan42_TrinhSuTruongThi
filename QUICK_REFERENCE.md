# 🚀 InvestHub AI - Quick Start Reference

## 30 Second Setup

```bash
# 1. Install all dependencies
npm install

# 2. Setup .env files
cd server && cp .env.example .env && cd ..
cd client && cp .env.example .env.local && cd ..

# 3. Configure database (edit server/.env with your PostgreSQL credentials)
# Database should be: postgresql://user:password@localhost:5432/investhub_ai

# 4. Create database tables
npm run db:push -w server

# 5. Start all services
npm run dev
```

**Frontend**: http://localhost:3000  
**Backend**: http://localhost:3001  
**API Docs**: http://localhost:3001/api

---

## 📁 Key File Locations

### Frontend (Client)

| What            | Where                               |
| --------------- | ----------------------------------- |
| Home page       | `client/src/app/page.tsx`           |
| Dashboard       | `client/src/app/dashboard/page.tsx` |
| Styles          | `client/src/app/globals.css`        |
| Components      | `client/src/components/`            |
| State (Zustand) | `client/src/store/`                 |
| API calls       | `client/src/lib/`                   |

### Backend (Server)

| What            | Where                             |
| --------------- | --------------------------------- |
| Entry point     | `server/src/main.ts`              |
| Users API       | `server/src/modules/users/`       |
| Projects API    | `server/src/modules/projects/`    |
| Investments API | `server/src/modules/investments/` |
| AI Analysis API | `server/src/modules/ai-analysis/` |
| Database schema | `server/prisma/schema.prisma`     |
| Configuration   | `server/.env`                     |

### Shared Types

| What                  | Where                         |
| --------------------- | ----------------------------- |
| All types             | `shared/types/index.ts`       |
| User interfaces       | `shared/types/user.ts`        |
| Project interfaces    | `shared/types/project.ts`     |
| Investment interfaces | `shared/types/investment.ts`  |
| AI interfaces         | `shared/types/ai-analysis.ts` |

---

## 🛠️ Common Commands

### Development

```bash
npm run dev              # All services
npm run client:dev      # Frontend only
npm run server:dev      # Backend only
```

### Building

```bash
npm run build           # Build all
npm run client:build   # Frontend only
npm run server:build   # Backend only
```

### Database

```bash
npm run db:push -w server        # Update schema
npm run db:studio -w server      # Open GUI
npm run db:generate -w server    # Regenerate client
```

### Code Quality

```bash
npm run lint -w client      # Check frontend
npm run lint -w server      # Check backend
npm run type-check -w client # TypeScript check
```

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────┐
│              Frontend (Next.js)                  │
│  - Pages (App Router)                           │
│  - Components (Tailwind CSS)                    │
│  - Zustand Stores                               │
│  - Axios API Client                             │
└──────────────────┬──────────────────────────────┘
                   │
                   │ HTTP/JSON
                   │
┌──────────────────▼──────────────────────────────┐
│              Backend (NestJS)                    │
│  - Controllers (REST API)                       │
│  - Services (Business Logic)                    │
│  - Prisma ORM                                   │
│  - PostgreSQL Database                          │
└─────────────────────────────────────────────────┘

Shared Types Library:
│ - Interfaces for type safety across both sides │
└─────────────────────────────────────────────────┘
```

---

## 🔌 API Endpoints (All Implemented)

### Users

- `GET /users` - List all
- `GET /users/:id` - Get one
- `POST /users` - Create
- `PATCH /users/:id` - Update
- `DELETE /users/:id` - Delete

### Projects

- `GET /projects` - List (with filters)
- `GET /projects/:id` - Get one
- `GET /projects/by-slug/:slug` - Get by slug
- `POST /projects` - Create (auth required)
- `PATCH /projects/:id` - Update (auth required)
- `DELETE /projects/:id` - Delete (auth required)
- `GET /projects/creator/:id` - Get by creator

### Investments

- `GET /investments` - List all
- `GET /investments/:id` - Get one
- `POST /investments` - Create (auth required)
- `PATCH /investments/:id` - Update (auth required)
- `DELETE /investments/:id` - Delete (auth required)
- `GET /investments/portfolio/:id` - Get portfolio
- `GET /investments/project/:id` - Get project investments

### AI Analysis

- `GET /ai-analysis` - List all
- `GET /ai-analysis/project/:id` - Get by project
- `POST /ai-analysis` - Analyze (auth required)
- `DELETE /ai-analysis/project/:id` - Delete (auth required)

---

## 🎨 Tailwind CSS Customization

Edit colors in `client/tailwind.config.ts`:

```typescript
colors: {
  primary: 'hsl(var(--primary))',      // Change in :root
  secondary: 'hsl(var(--secondary))',
  // ...
}
```

Then update CSS variables in `client/src/app/globals.css`:

```css
:root {
  --primary: 220 90% 56%;      /* Blue */
  --secondary: 280 85% 50%;    /* Purple */
  // ...
}
```

---

## 🔐 Adding Authentication (Next Steps)

1. **Backend** - Install bcryptjs:

   ```bash
   npm install bcryptjs -w server
   ```

2. **Backend** - Create auth service:

   ```typescript
   // server/src/modules/auth/auth.service.ts
   import * as bcrypt from "bcryptjs";
   ```

3. **Backend** - Create auth endpoints:

   ```typescript
   // server/src/modules/auth/auth.controller.ts
   @Post('login')
   @Post('register')
   ```

4. **Frontend** - Create login page:

   ```typescript
   // client/src/app/auth/login/page.tsx
   ```

5. **Frontend** - Use auth store:
   ```typescript
   import { useAuthStore } from "@/store/auth";
   const { login } = useAuthStore();
   ```

---

## 📊 Zustand Store Examples

### Auth Store

```typescript
import { useAuthStore } from "@/store/auth";

function LoginComponent() {
  const { login, logout, isAuthenticated } = useAuthStore();

  const handleLogin = async () => {
    login(user, token);
  };
}
```

### Projects Store

```typescript
import { useProjectsStore } from "@/store/projects";

function ProjectsList() {
  const { projects, setProjects, addProject } = useProjectsStore();
}
```

---

## 🗄️ Database Models

### User

```
id, email, password, firstName, lastName, avatar, bio, role
```

### Project

```
id, title, slug, description, category, fundingGoal, currentFunding
deadline, status, imageUrl, businessPlanUrl, creatorId
```

### Investment

```
id, amount, shares, status, investorId, projectId, transactionId
```

### AIAnalysis

```
id, score, summary, risks[], opportunities[], marketAnalysis
financialProjection, recommendation, projectId
```

---

## 🚨 Troubleshooting

### PostgreSQL not connecting

```bash
# Check if running
pg_isready

# Start if needed
brew services start postgresql

# Check .env DATABASE_URL format
```

### Port already in use

```bash
# Kill process using port
lsof -i :3000  # Find frontend
lsof -i :3001  # Find backend
kill -9 <PID>
```

### Typescript errors

```bash
npm run build -w shared
npm run build -w server
```

### Database out of sync

```bash
npx prisma migrate reset -w server
npm run db:push -w server
```

---

## 📚 Documentation Files

- **README.md** - Full project documentation
- **SETUP.md** - Setup instructions
- **DEVELOPMENT.md** - Development workflow
- **FILE_STRUCTURE.md** - Complete file reference
- **SUMMARY.md** - Overview of what's created
- **QUICK_REFERENCE.md** - This file

---

## 🎯 Your First Task

**Implement Authentication:**

1. Install bcryptjs: `npm install bcryptjs -w server`
2. Create `server/src/modules/auth/auth.service.ts`
3. Implement login/register methods
4. Create auth endpoints
5. Test with Swagger: http://localhost:3001/api
6. Create login page in frontend
7. Test full auth flow

---

## 💡 Tips

- Use `npm run db:studio -w server` to view database visually
- Swagger docs auto-update from controllers
- Zustand stores don't need providers
- Tailwind classes work directly in JSX
- TypeScript path aliases work (`@/` for src)
- All endpoints ready - just add business logic

---

## 📞 Quick Links

- [Next.js Docs](https://nextjs.org/docs)
- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [Zustand GitHub](https://github.com/pmndrs/zustand)
- [Lucide Icons](https://lucide.dev)

---

_Ready to build? Start with `npm install` and `npm run dev` 🚀_
