# Project Setup Notes

## Quick Start Commands

### Install & Setup

```bash
# Install all dependencies
npm install

# Build shared types
npm run build -w shared

# Setup backend database
cd server
cp .env.example .env
# Edit .env with your PostgreSQL credentials
npx prisma db push
cd ..

# Setup frontend env
cd client
cp .env.example .env.local
cd ..
```

### Development

```bash
# Start all services
npm run dev

# Or individually:
npm run client:dev    # Frontend on :3000
npm run server:dev    # Backend on :3001
```

### Database

```bash
# View/edit database
npm run db:studio -w server

# Reset database (CAREFUL!)
npx prisma migrate reset -w server
```

## PostgreSQL Setup (macOS with Homebrew)

```bash
# Install PostgreSQL
brew install postgresql

# Start PostgreSQL service
brew services start postgresql

# Create database
createdb investhub_ai

# Create user (optional)
psql investhub_ai
CREATE USER investhub_admin WITH PASSWORD 'password';
ALTER ROLE investhub_admin WITH CREATEDB;
```

## Environment Variables Checklist

### Backend (.env)

- [ ] DATABASE_URL set correctly
- [ ] GOOGLE_API_KEY configured
- [ ] JWT_SECRET changed from default
- [ ] CLIENT_URL matches frontend origin

### Frontend (.env.local)

- [ ] NEXT_PUBLIC_API_URL matches backend

## Key Directories to Know

- `/client/src/components` - React components (Tailwind CSS, no Shadcn)
- `/client/src/store` - Zustand state management
- `/client/src/lib` - API utilities and auth
- `/server/src/modules` - Feature modules (CRUD operations)
- `/server/prisma` - Database schema & migrations
- `/shared/types` - Shared TypeScript interfaces

## Next Steps to Implement

1. **Authentication Module**
   - [ ] Implement password hashing (bcrypt)
   - [ ] Create auth/login endpoint
   - [ ] Create auth/register endpoint
   - [ ] Create auth/refresh endpoint

2. **Frontend Auth**
   - [ ] Create login page
   - [ ] Create signup page
   - [ ] Implement token persistence
   - [ ] Add protected routes

3. **Projects Feature**
   - [ ] Create projects list page
   - [ ] Create project detail page
   - [ ] Create project creation form
   - [ ] Add image upload

4. **AI Integration**
   - [ ] Integrate Google Gemini API calls
   - [ ] Setup LangChain RAG pipeline
   - [ ] Create AI analysis UI

5. **Investments Feature**
   - [ ] Create investment form
   - [ ] Create portfolio dashboard
   - [ ] Add payment processing (Stripe)

6. **Testing**
   - [ ] Setup Jest for backend
   - [ ] Create API tests
   - [ ] Setup testing library for frontend

7. **Deployment**
   - [ ] Setup CI/CD (GitHub Actions)
   - [ ] Create Docker setup (optional, currently not used)
   - [ ] Setup production database
   - [ ] Configure environment variables

## Useful Tools

- **Prisma Studio**: `npm run db:studio -w server`
- **Swagger Docs**: http://localhost:3001/api (when server running)
- **Next.js DevTools**: Built-in devtools in browser
