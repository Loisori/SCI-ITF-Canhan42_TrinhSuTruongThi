# InvestPro - Project File Structure

## 📂 Root Level
```
SCI-ITF-Canhan42_TrinhSuTruongThi/
├── client/                 # Next.js Frontend (App Router)
├── server/                 # NestJS Backend
├── API.MD                  # API Documentation
├── DATABASE.md             # Database Schema & Migrations
├── FILE_STRUCTURE.md       # Directory Structure (This File)
├── MONEYFLOW.md            # Financial Logic Documentation
├── README.MD               # Project Overview
├── SUMMARY.md              # Project Progress Summary
├── package.json            # Workspace Configuration
└── .env                    # Root Environment Variables
```

---

## 💻 Client Directory (`/client`)
The frontend is built with **Next.js 14+** using the **App Router** and **Tailwind CSS**.

```
client/
├── app/                    # Main routing logic
│   ├── (admin)/            # Route Group: Admin Dashboard
│   │   └── admin-dashboard/
│   ├── (main)/             # Route Group: Public & Investor views
│   │   ├── (auth)/         # Auth pages (Login, Signup)
│   │   ├── dashboard/      # Investor Dashboard
│   │   ├── projects/       # Project listing & details
│   │   └── aboutus, contact, help... # Static pages
│   ├── layout.tsx          # Root layout with providers
│   └── page.tsx            # Home landing page
├── components/             # Reusable UI components
├── context/                # React Context (Auth, UI state)
├── lib/                    # API services (Axios), Utils, Hooks
├── public/                 # Static assets (images, icons)
├── styles/                 # Global styles (Tailwind, animations)
├── types/                  # TypeScript interface definitions
├── next.config.ts          # Next.js configuration
├── tailwind.config.ts      # Tailwind CSS theme & plugins
└── package.json            # Frontend dependencies
```

---

## ⚙️ Server Directory (`/server`)
The backend is built with **NestJS**, following a modular architecture.

```
server/
├── src/
│   ├── modules/            # Business Logic Modules
│   │   ├── auth/           # JWT, Passport, Google OAuth
│   │   ├── users/          # User management, Roles
│   │   ├── projects/       # Core project & funding logic
│   │   ├── investments/    # Investment tracking & analytics
│   │   ├── transactions/   # Withdrawals & balance history
│   │   ├── payment/        # VNPay & MoMo integrations
│   │   ├── ai-chat/        # AI assistant & chat history
│   │   ├── media/          # Cloudinary file uploads
│   │   ├── notifications/  # Real-time WebSocket notifications
│   │   └── admin-dashboard/# System-wide analytics
│   ├── common/             # Shared resources
│   │   ├── decorators/     # Custom NestJS decorators
│   │   ├── guards/         # Auth & Role guards
│   │   ├── interceptors/   # Response & Error mapping
│   │   ├── pipes/          # Validation & Transformation
│   │   └── utils/          # Helper functions
│   ├── config/             # System configuration (TypeORM, Env)
│   ├── data/               # Seed data and static resources
│   ├── main.ts             # App boostrap entry point
│   └── app.module.ts       # Root application module
├── test/                   # E2E & Unit tests
├── knexfile.js             # Knex migration config
└── package.json            # Backend dependencies
```

---

## 🔑 Key Files Reference

### Configuration
- `client/tailwind.config.ts`: Visual theme, colors, and design tokens.
- `server/src/config/`: Centralized backend configuration.

### Entities & Data
- `server/src/modules/*/entities/`: Database schema definitions (TypeORM).
- `server/src/modules/*/dto/`: Request validation schemas.

### Business Logic
- `server/src/modules/*/*.controller.ts`: API Endpoints.
- `server/src/modules/*/*.service.ts`: Core business logic & database queries.

### Frontend Logic
- `client/lib/api.ts`: Central Axios instance with interceptors.
- `client/context/AuthContext.tsx`: Global user session management.

---

## 💡 Navigation Tips
- **Adding a new API**: Start by creating a module in `server/src/modules/`.
- **Modifying UI theme**: Edit `client/tailwind.config.ts` or `client/app/globals.css`.
- **Database updates**: Sync the corresponding `*.entity.ts` file in the module and check `DATABASE.md`.
