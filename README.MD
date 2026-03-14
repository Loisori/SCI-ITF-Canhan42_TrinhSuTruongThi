npm run dev in root to run both client and server folder 
port 3000 for client and port 3001 for server
# SmartVest AI - Đồ Án Tốt Nghiệp

Hệ thống phân tích dự án đầu tư thông minh tích hợp trí tuệ nhân tạo (Gemini API).

## 🚀 Công nghệ sử dụng
- **Frontend:** Next.js, Tailwind CSS
- **Backend:** NestJS, TypeORM
- **AI:** Google Gemini API
- **Database:** SQL Server

## 🛠️ Hướng dẫn cài đặt
1. Clone dự án.
2. Tại thư mục gốc, cài đặt tất cả thư viện:
   ```bash
   npm run install-all (Hoặc lệnh setup bạn đã tạo)

   # InvestHub AI - Crowdfunding Platform with AI Investment Advisory

A modern monorepo project for a Kickstarter-like crowdfunding platform with AI-powered investment analysis.

## 📋 Tech Stack

### Frontend

- **Next.js 14+** (App Router)
- **Tailwind CSS** (Pure, no Shadcn/UI)
- **Lucide Icons** (Minimalist icon library)
- **Zustand** (Lightweight state management)
- **TypeScript**

### Backend

- **NestJS** (TypeScript Framework)
- **Prisma ORM** (Type-safe database)
- **PostgreSQL** (Direct connection)
- **Swagger** (API documentation)
- **JWT** (Authentication)

### AI Integration

- **Google Gemini API** (Business plan analysis)
- **LangChain** (RAG flow for intelligent analysis)

### Database

- **PostgreSQL** (Direct connection - no Docker)

## 🏗️ Project Structure

```
investhub-ai/
├── client/                          # Next.js Frontend
│   ├── src/
│   │   ├── app/                    # App Router pages
│   │   │   ├── layout.tsx          # Root layout
│   │   │   ├── page.tsx            # Home page
│   │   │   ├── globals.css         # Global styles
│   │   │   └── dashboard/
│   │   │       ├── layout.tsx      # Dashboard layout
│   │   │       └── page.tsx        # Dashboard page
│   │   ├── components/             # Reusable components
│   │   │   ├── Navigation.tsx      # Main navigation
│   │   │   ├── ProjectCard.tsx     # Project card component
│   │   │   └── ...
│   │   ├── store/                  # Zustand stores
│   │   │   ├── auth.ts            # Auth state
│   │   │   ├── projects.ts        # Projects state
│   │   │   └── ...
│   │   └── lib/                    # Utilities & API calls
│   │       ├── api.ts             # Axios instance
│   │       ├── projects.ts        # Projects API
│   │       ├── investments.ts     # Investments API
│   │       └── ai-analysis.ts     # AI Analysis API
│   ├── tailwind.config.ts          # Tailwind configuration
│   ├── postcss.config.js           # PostCSS setup
│   ├── next.config.ts              # Next.js configuration
│   ├── tsconfig.json               # TypeScript config
│   ├── package.json
│   ├── .env.example
│   └── .eslintrc.json
│
├── server/                          # NestJS Backend
│   ├── src/
│   │   ├── main.ts                # Application entry point
│   │   ├── app.module.ts          # Root module
│   │   ├── modules/               # Feature modules
│   │   │   ├── users/
│   │   │   │   ├── users.module.ts
│   │   │   │   ├── users.service.ts
│   │   │   │   ├── users.controller.ts
│   │   │   │   └── ...
│   │   │   ├── projects/
│   │   │   │   ├── projects.module.ts
│   │   │   │   ├── projects.service.ts
│   │   │   │   ├── projects.controller.ts
│   │   │   │   └── ...
│   │   │   ├── investments/
│   │   │   │   ├── investments.module.ts
│   │   │   │   ├── investments.service.ts
│   │   │   │   ├── investments.controller.ts
│   │   │   │   └── ...
│   │   │   └── ai-analysis/
│   │   │       ├── ai-analysis.module.ts
│   │   │       ├── ai-analysis.service.ts
│   │   │       ├── ai-analysis.controller.ts
│   │   │       └── ...
│   │   └── common/
│   │       ├── prisma/
│   │       │   ├── prisma.service.ts
│   │       │   └── prisma.module.ts
│   │       ├── auth/
│   │       │   ├── auth.module.ts
│   │       │   ├── jwt.strategy.ts
│   │       │   └── auth.guard.ts
│   │       └── decorators/
│   │           └── current-user.decorator.ts
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── tsconfig.json               # TypeScript config
│   ├── package.json
│   ├── .env.example
│   └── .decorators/
│
├── shared/                          # Shared Types & Interfaces
│   ├── types/
│   │   ├── index.ts               # Export all types
│   │   ├── user.ts                # User interfaces
│   │   ├── project.ts             # Project interfaces
│   │   ├── investment.ts          # Investment interfaces
│   │   └── ai-analysis.ts         # AI Analysis interfaces
│   ├── tsconfig.json
│   └── package.json
│
├── package.json                     # Root workspace config
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **PostgreSQL** 13+
- **npm** or **yarn**

### Installation

1. **Clone the repository**

   ```bash
   git clone <repo-url>
   cd investhub-ai
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Setup shared types**

   ```bash
   npm run build -w shared
   ```

4. **Setup Backend**

   ```bash
   cd server
   cp .env.example .env
   # Edit .env with your database credentials
   npm install
   npx prisma db push  # Create database tables
   ```

5. **Setup Frontend**
   ```bash
   cd ../client
   cp .env.example .env.local
   npm install
   ```

### Running Locally

**Development Mode (All services)**

```bash
npm run dev
```

**Frontend only**

```bash
npm run client:dev
# Runs on http://localhost:3000
```

**Backend only**

```bash
npm run server:dev
# Runs on http://localhost:3001
# Swagger docs: http://localhost:3001/api
```

### Database Management

**Push schema to database**

```bash
npm run db:push -w server
```

**Open Prisma Studio (GUI)**

```bash
npm run db:studio -w server
```

## 🗄️ Database Schema

### Users

```prisma
- id (String, primary key)
- email (String, unique)
- password (String, hashed)
- firstName, lastName (String)
- avatar, bio (String, optional)
- role (investor, creator, admin)
- timestamps
```

### Projects

```prisma
- id (String, primary key)
- title, description (String)
- slug (String, unique)
- fundingGoal, currentFunding (Float)
- category (String)
- deadline (DateTime)
- status (draft, live, funded, failed, completed)
- creatorId (Foreign key to User)
- timestamps
```

### Investments

```prisma
- id (String, primary key)
- amount, shares (Float)
- status (pending, completed, refunded)
- investorId (Foreign key to User)
- projectId (Foreign key to Project)
- timestamps
```

### AI Analysis

```prisma
- id (String, primary key)
- score (Float, 0-100)
- summary, marketAnalysis, financialProjection (Text)
- risks, opportunities (String[])
- recommendation (highly-recommended, recommended, neutral, not-recommended)
- projectId (Foreign key to Project)
- timestamps
```

## 🔌 API Endpoints

### Authentication

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`

### Users

- `GET /users` - List all users
- `GET /users/:id` - Get user by ID
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Projects

- `GET /projects` - List all projects
- `GET /projects/:id` - Get project by ID
- `GET /projects/by-slug/:slug` - Get project by slug
- `POST /projects` - Create project (requires auth)
- `PATCH /projects/:id` - Update project (requires auth)
- `DELETE /projects/:id` - Delete project (requires auth)
- `GET /projects/creator/:creatorId` - Get projects by creator

### Investments

- `GET /investments` - List all investments
- `GET /investments/:id` - Get investment by ID
- `POST /investments` - Create investment (requires auth)
- `PATCH /investments/:id` - Update investment (requires auth)
- `DELETE /investments/:id` - Delete investment (requires auth)
- `GET /investments/portfolio/:investorId` - Get investor portfolio
- `GET /investments/project/:projectId` - Get project investments

### AI Analysis

- `GET /ai-analysis` - List all analyses
- `GET /ai-analysis/project/:projectId` - Get analysis for project
- `POST /ai-analysis` - Analyze business plan (requires auth)
- `DELETE /ai-analysis/project/:projectId` - Delete analysis (requires auth)

## 🎨 Tailwind CSS

The project uses **pure Tailwind CSS** without component libraries. Custom components are in `/client/src/components`.

**Configured colors:**

- `primary`: Brand color (blue)
- `secondary`: Secondary color (purple)
- `muted`: Light gray
- `background`: Background color
- `foreground`: Text color

Customize in [tailwind.config.ts](client/tailwind.config.ts)

## 🧠 AI Integration

### Google Gemini API

Used for analyzing business plans and generating investment insights.

**Setup:**

1. Get API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add to `.env`:
   ```
   GOOGLE_API_KEY=your-api-key
   ```

### LangChain (RAG)

Implements Retrieval-Augmented Generation for contextual business analysis.

**Features:**

- Document retrieval from business plans
- Context-aware analysis
- Historical case study reference

## 🔐 Authentication

Uses **JWT** (Bearer tokens) with Passport.js

**Flow:**

1. User registers/logs in
2. Server returns JWT token
3. Client stores token in localStorage
4. Client includes token in `Authorization: Bearer <token>` header
5. Server validates token with JwtStrategy

## 📊 State Management (Zustand)

**Auth Store**

```typescript
useAuthStore()
- user: User | null
- token: string | null
- isAuthenticated: boolean
- login(user, token)
- logout()
```

**Projects Store**

```typescript
useProjectsStore()
- projects: IProject[]
- loading: boolean
- error: string | null
- setProjects()
- addProject()
- updateProject()
- removeProject()
```

## 🛠️ Environment Variables

### Backend (.env)

```
DATABASE_URL=postgresql://user:password@localhost:5432/investhub_ai
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h
GOOGLE_API_KEY=your-google-api-key
PORT=3001
CLIENT_URL=http://localhost:3000
```

### Frontend (.env.local)

```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 📦 Building for Production

**Build all**

```bash
npm run build
```

**Build frontend**

```bash
npm run client:build
```

**Build backend**

```bash
npm run server:build
```

## 📝 License

MIT

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For issues and questions, please open an issue on the repository.
