# InvestPro Authentication Module

Complete authentication system for the InvestPro crowdfunding platform using NestJS, Passport.js, JWT, and TypeORM.

## Features

- **User Registration & Login** with email/password
- **JWT Authentication** with Passport.js
- **Role-Based Access Control** (RBAC)
- **Password Hashing** with bcrypt
- **Input Validation** with class-validator
- **MySQL Database** integration with TypeORM

## User Roles

The system supports three user roles:

- `investor` - Regular investors (default role)
- `owner` - Project owners who raise funds
- `admin` - System administrators

## API Endpoints

### Authentication

#### Register User

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "role": "investor"  // optional, defaults to "investor"
}
```

#### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

Response:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Get Current User

```http
GET /auth/me
Authorization: Bearer <access_token>
```

### User Management

#### Get User Profile

```http
GET /users/profile
Authorization: Bearer <access_token>
```

#### Admin: Get All Users

```http
GET /users
Authorization: Bearer <access_token>
```

_Requires `admin` role_

#### Admin: Update User Role

```http
PATCH /users/:id/role
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "role": "admin"
}
```

_Requires `admin` role_

## Usage Examples

### Protecting Routes with Authentication

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('protected')
export class ProtectedController {
  @UseGuards(JwtAuthGuard)
  @Get()
  getProtectedData() {
    return { message: 'This is protected data' };
  }
}
```

### Protecting Routes with Role-Based Access

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('admin')
export class AdminController {
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Get('dashboard')
  getAdminDashboard() {
    return { message: 'Admin dashboard data' };
  }
}
```

### Getting Current User in Controller

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserEntity } from '../users/user.entity';

@Controller('profile')
export class ProfileController {
  @UseGuards(JwtAuthGuard)
  @Get()
  getProfile(@GetUser() user: UserEntity) {
    return user;
  }
}
```

## Environment Variables

Add these to your `.env` file:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=your_mysql_password
DB_DATABASE=investpro

# JWT
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRATION=3600s

# Server
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

## Database Schema

The `users` table includes:

- `id` (Primary Key, Auto Increment)
- `email` (Unique, VARCHAR(255))
- `password` (VARCHAR(255), hashed)
- `fullName` (VARCHAR(255))
- `role` (ENUM: 'investor', 'owner', 'admin')
- `balance` (DECIMAL(15,2), default 0)
- `createdAt` (TIMESTAMP)
- `updatedAt` (TIMESTAMP)

## Security Features

- **Password Hashing**: Uses bcrypt with 10 salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Input Validation**: All inputs validated with class-validator
- **Role-Based Access**: Granular permissions system
- **CORS Protection**: Configurable CORS settings

## Error Handling

The API returns appropriate HTTP status codes:

- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid credentials)
- `403` - Forbidden (insufficient permissions)
- `409` - Conflict (email already exists)
- `500` - Internal Server Error

## Testing the API

1. Start the NestJS server:

```bash
npm run start:dev
```

2. Register a new user:

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123","fullName":"Admin User","role":"admin"}'
```

3. Login to get JWT token:

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}'
```

4. Use the token to access protected routes:

```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3001/users
```

## File Structure

```
src/
├── auth/
│   ├── auth.controller.ts      # Auth endpoints
│   ├── auth.service.ts         # Auth business logic
│   ├── auth.module.ts          # Auth module configuration
│   ├── jwt.strategy.ts         # JWT Passport strategy
│   ├── auth.constants.ts       # JWT constants
│   ├── dto/
│   │   ├── login.dto.ts        # Login validation
│   │   └── register.dto.ts     # Registration validation
│   ├── guards/
│   │   ├── jwt-auth.guard.ts   # JWT authentication guard
│   │   └── roles.guard.ts      # Role-based authorization guard
│   └── decorators/
│       ├── get-user.decorator.ts # Extract user from request
│       └── roles.decorator.ts     # Set required roles metadata
└── users/
    ├── users.controller.ts     # User management endpoints
    ├── users.service.ts        # User business logic
    ├── users.module.ts         # Users module configuration
    ├── user.entity.ts          # User database entity
    └── dto/
        └── update-role.dto.ts   # Role update validation
```
