# InvestPro API Documentation

Base URL: `/api`

This document details the available API endpoints for the InvestPro platform.

---

## 🔐 Authentication (`/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/register` | Register a new account. | No |
| `POST` | `/login` | Login and receive a JWT token. | No |
| `GET` | `/me` | Get current authenticated user info. | JWT |
| `GET` | `/profile` | Get current user profile (alternative). | JWT |
| `GET` | `/google` | Initiate Google OAuth2 login. | No |
| `GET` | `/google/callback` | Google OAuth2 callback redirect. | No |

---

## 👤 Users (`/users`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/profile` | Get detailed user profile data. | JWT |
| `PATCH` | `/avatar` | Update user avatar (File Upload). | JWT |
| `PATCH` | `/change-password` | Change user password. | JWT |
| `PATCH` | `/preferences/category/:categoryId/toggle` | Toggle favorite/blacklist for a category. | JWT |
| `GET` | `/` | List all users. | JWT + Admin |
| `PATCH` | `/:id/role` | Update user role (e.g., Owner, Investor). | JWT + Admin |

---

## 🏗️ Projects (`/projects`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | List funding projects (with search/category filters). | Optional |
| `GET` | `/suggestions` | Get project search suggestions. | No |
| `GET` | `/slug/:slug` | Get project details by URL slug. | No |
| `GET` | `/owner` | Get projects owned by the current user. | JWT + Owner |
| `GET` | `/:id` | Get project details by ID. | No |
| `POST` | `/` | Create a new project. | JWT + Owner |
| `PUT` | `/:id` | Update project details. | JWT + Owner |
| `DELETE` | `/:id` | Delete a project. | JWT + Owner |
| `PUT` | `/:id/stop-funding` | Stop the funding phase manually. | JWT + Owner |
| `PATCH` | `/:id/milestones/:mId/proof` | Submit proof for a milestone. | JWT + Owner |
| `POST` | `/:id/disputes` | Create a dispute for a project. | JWT + Investor |
| `PUT` | `/:id/milestones` | Bulk update project milestones. | JWT + Owner |

### 🛠️ Admin Projects (`/admin/projects`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/pending` | List projects awaiting approval. | JWT + Admin |
| `GET` | `/milestones/pending` | List milestones awaiting fund release. | JWT + Admin |
| `GET` | `/disputes` | List frozen projects with active disputes. | JWT + Admin |
| `PATCH` | `/:id/approve` | Approve a project. | JWT + Admin |
| `PATCH` | `/:id/reject` | Reject a project. | JWT + Admin |
| `POST` | `/:id/milestones/:mId/finalize` | Finalize milestone and release funds. | JWT + Admin |
| `PATCH` | `/:id/milestones/:mId/reject` | Reject milestone proof. | JWT + Admin |
| `POST` | `/:id/disputes/resolve` | Resolve disputes (Dismiss or Refund). | JWT + Admin |

---

## 📈 Investments (`/investments`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/my-investments` | List investments of the current user. | JWT |
| `GET` | `/analytics` | Get portfolio analytics and charts. | JWT + Investor |
| `POST` | `/` | Invest in a specific project. | JWT + Investor |
| `POST` | `/handle-project-timeout` | Process project timeout events. | JWT + Owner |

---

## 💸 Transactions & Payments

### Transactions (`/transactions`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | List user transaction history. | JWT |
| `POST` | `/withdraw` | Request a fund withdrawal. | JWT |
| `GET` | `/admin/pending-withdrawals` | List pending withdrawals. | JWT + Admin |
| `PATCH` | `/admin/withdraw/:id/:action` | Approve/Reject withdrawal. | JWT + Admin |

### Payments (`/payment`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/create-url` | Create VNPay payment URL. | JWT |
| `GET` | `/vnpay-return` | VNPay return handler (redirect). | No |
| `GET` | `/vnpay-ipn` | VNPay IPN handler. | No |
| `POST` | `/create-momo-url` | Create MoMo payment URL. | JWT |
| `POST` | `/momo-ipn` | MoMo IPN handler. | No |

---

## 🤖 AI Assistant (`/ai-chat`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/history` | Fetch user's chat history with AI. | JWT |
| `DELETE` | `/history` | Clear AI chat history. | JWT |
| `POST` | `/message` | Send a message to the AI assistant. | JWT |

---

## 📂 Media (`/media`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/upload` | Upload a file (Multer + Cloudinary). | JWT |
| `GET` | `/` | List all files uploaded by user. | JWT |
| `DELETE` | `/:id` | Remove a media file. | JWT |

---

## 🔔 Notifications (`/notifications`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | List notifications and unread count. | JWT |
| `PATCH` | `/:id/read` | Mark specific notification as read. | JWT |
| `PATCH` | `/read-all` | Mark all notifications as read. | JWT |

---

## 📊 Admin Dashboard (`/admin/dashboard`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/overview` | Get platform-wide statistics. | JWT + Admin |
| `GET` | `/users` | Get paginated user list with filters. | JWT + Admin |
