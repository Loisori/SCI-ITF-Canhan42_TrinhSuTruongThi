# InvestPro API Documentation

Base URL: `/api`

This document details the available API endpoints for the InvestPro platform.

---

## 🔐 Authentication (`/auth`)

| Method | Endpoint           | Description                             | Auth Required |
| :----- | :----------------- | :-------------------------------------- | :------------ |
| `POST` | `/register`        | Register a new account.                 | No            |
| `POST` | `/login`           | Login and receive a JWT token.          | No            |
| `GET`  | `/me`              | Get current authenticated user info.    | JWT           |
| `GET`  | `/profile`         | Get current user profile (alternative). | JWT           |
| `GET`  | `/google`          | Initiate Google OAuth2 login.           | No            |
| `GET`  | `/google/callback` | Google OAuth2 callback redirect.        | No            |

---

## 👤 Users (`/users`)

| Method  | Endpoint                                   | Description                                    | Auth Required |
| :------ | :----------------------------------------- | :--------------------------------------------- | :------------ |
| `GET`   | `/profile`                                 | Get detailed user profile data.                | JWT           |
| `PATCH` | `/profile`                                 | Update user profile (bio, social links, etc.). | JWT           |
| `PATCH` | `/avatar`                                  | Update user avatar (File Upload).              | JWT           |
| `PATCH` | `/change-password`                         | Change user password.                          | JWT           |
| `PATCH` | `/preferences/category/:categoryId/toggle` | Toggle favorite/blacklist for a category.      | JWT           |
| `GET`   | `/:id/public`                              | Get public profile of a user.                  | No            |
| `GET`   | `/`                                        | List all users.                                | JWT + Admin   |
| `PATCH` | `/:id/role`                                | Update user role (e.g., Owner, Investor).      | JWT + Admin   |

---

## 🆔 KYC (`/users/kyc`)

| Method  | Endpoint           | Description                       | Auth Required |
| :------ | :----------------- | :-------------------------------- | :------------ |
| `POST`  | `/upload`          | Upload KYC identity image.        | JWT           |
| `POST`  | `/`                | Submit KYC verification request.  | JWT           |
| `GET`   | `/status`          | Check current user KYC status.    | JWT           |
| `GET`   | `/pending`         | List all pending KYC requests.    | JWT + Admin   |
| `PATCH` | `/:id/approve`     | Approve a KYC request.            | JWT + Admin   |
| `PATCH` | `/:id/reject`      | Reject a KYC request with reason. | JWT + Admin   |
| `GET`   | `/image/:id/:type` | View KYC image (front/back).      | JWT + Admin   |

---

## 🏗️ Projects (`/projects`)

| Method   | Endpoint                        | Description                                           | Auth Required  |
| :------- | :------------------------------ | :---------------------------------------------------- | :------------- |
| `GET`    | `/`                             | List funding projects (with search/category filters). | Optional       |
| `GET`    | `/suggestions`                  | Get project search suggestions.                       | No             |
| `GET`    | `/slug/:slug`                   | Get project details by URL slug.                      | No             |
| `GET`    | `/owner`                        | Get projects owned by the current user.               | JWT + Owner    |
| `GET`    | `/user/:userId/created`         | List projects created by a specific user.             | No             |
| `GET`    | `/user/:userId/invested`        | List projects invested by a specific user.            | No             |
| `GET`    | `/:id`                          | Get project details by ID.                            | No             |
| `POST`   | `/`                             | Create a new project.                                 | JWT + Owner    |
| `PUT`    | `/:id`                          | Update project details.                               | JWT + Owner    |
| `DELETE` | `/:id`                          | Delete a project.                                     | JWT + Owner    |
| `PUT`    | `/:id/stop-funding`             | Stop the funding phase manually.                      | JWT + Owner    |
| `POST`   | `/invest`                       | Invest in a specific project (alt endpoint).          | JWT + Investor |
| `PATCH`  | `/:id/milestones/:mId/proof`    | Submit proof for a milestone.                         | JWT + Owner    |
| `PUT`    | `/:id/milestones`               | Bulk update project milestones.                       | JWT + Owner    |
| `POST`   | `/milestones/:mId/start-voting` | Start voting for a milestone.                         | JWT + Owner    |
| `POST`   | `/milestones/:mId/vote`         | Submit a vote for a milestone.                        | JWT + Investor |
| `POST`   | `/milestones/:mId/response`     | Owner response to milestone discussions.              | JWT + Owner    |
| `GET`    | `/milestones/:mId/discussions`  | List discussions for a milestone.                     | No             |
| `POST`   | `/:id/disputes`                 | Create a dispute for a project.                       | JWT + Investor |

---

### 📂 Project Categories (`/project-categories`)

| Method | Endpoint | Description                            | Auth Required |
| :----- | :------- | :------------------------------------- | :------------ |
| `GET`  | `/`      | List all available project categories. | No            |

---

### 🛠️ Admin Projects (`/admin/projects`)

| Method  | Endpoint                         | Description                                | Auth Required |
| :------ | :------------------------------- | :----------------------------------------- | :------------ |
| `GET`   | `/pending`                       | List projects awaiting initial approval.   | JWT + Admin   |
| `GET`   | `/funding-review`                | List projects needing disbursement review. | JWT + Admin   |
| `GET`   | `/milestones/pending`            | List milestones awaiting fund release.     | JWT + Admin   |
| `GET`   | `/milestones/disputed`           | List milestones with active disputes.      | JWT + Admin   |
| `GET`   | `/disputes`                      | List frozen projects with active disputes. | JWT + Admin   |
| `PATCH` | `/:id/approve`                   | Approve a project for funding.             | JWT + Admin   |
| `PATCH` | `/:id/reject`                    | Reject a project.                          | JWT + Admin   |
| `PATCH` | `/:id/approve-disbursement`      | Approve fund disbursement after funding.   | JWT + Admin   |
| `POST`  | `/:id/milestones/:mId/finalize`  | Finalize milestone and release funds.      | JWT + Admin   |
| `PATCH` | `/:id/milestones/:mId/reject`    | Reject milestone proof.                    | JWT + Admin   |
| `POST`  | `/milestones/:mId/feedback`      | Admin feedback on a milestone.             | JWT + Admin   |
| `POST`  | `/milestones/:mId/reset-vote`    | Reset votes for a milestone.               | JWT + Admin   |
| `POST`  | `/milestones/:mId/simulate-time` | Simulate time passing for a milestone.     | JWT + Admin   |
| `POST`  | `/:id/terminate`                 | Terminate a project and handle refunds.    | JWT + Admin   |
| `POST`  | `/:id/disputes/resolve`          | Resolve disputes (Dismiss or Refund).      | JWT + Admin   |

---

## 📈 Investments (`/investments`)

| Method | Endpoint                  | Description                           | Auth Required  |
| :----- | :------------------------ | :------------------------------------ | :------------- |
| `GET`  | `/my-investments`         | List investments of the current user. | JWT            |
| `GET`  | `/analytics`              | Get portfolio analytics and charts.   | JWT + Investor |
| `POST` | `/`                       | Invest in a specific project.         | JWT + Investor |
| `POST` | `/handle-project-timeout` | Process project timeout events.       | JWT + Owner    |

---

## 💳 Wallets (`/wallets`)

| Method | Endpoint                         | Description                           | Auth Required |
| :----- | :------------------------------- | :------------------------------------ | :------------ |
| `POST` | `/deposit`                       | Request a fund deposit.               | JWT           |
| `POST` | `/withdraw`                      | Request a fund withdrawal.            | JWT           |
| `GET`  | `/history`                       | View wallet transaction history.      | JWT           |
| `GET`  | `/repayments/schedules`          | View owner repayment schedules.       | JWT + Owner   |
| `POST` | `/repay`                         | Repay project debt.                   | JWT + Owner   |
| `POST` | `/repay-milestone-interest`      | Repay specific milestone interest.    | JWT + Owner   |
| `GET`  | `/admin/pending-transactions`    | List all pending wallet transactions. | JWT + Admin   |
| `POST` | `/admin/approve-transaction/:id` | Approve a pending transaction.        | JWT + Admin   |
| `POST` | `/admin/reject-transaction/:id`  | Reject a pending transaction.         | JWT + Admin   |

---

## 💸 Transactions & Payments

### Transactions (`/transactions`)

| Method  | Endpoint                      | Description                              | Auth Required |
| :------ | :---------------------------- | :--------------------------------------- | :------------ |
| `GET`   | `/`                           | List user transaction history (General). | JWT           |
| `POST`  | `/withdraw`                   | Request a fund withdrawal (Legacy).      | JWT           |
| `GET`   | `/admin/pending-withdrawals`  | List pending withdrawals (Legacy).       | JWT + Admin   |
| `PATCH` | `/admin/withdraw/:id/:action` | Approve/Reject withdrawal (Legacy).      | JWT + Admin   |

### Payments (`/payment`)

| Method | Endpoint           | Description                      | Auth Required |
| :----- | :----------------- | :------------------------------- | :------------ |
| `POST` | `/create-url`      | Create VNPay payment URL.        | JWT           |
| `GET`  | `/vnpay-return`    | VNPay return handler (redirect). | No            |
| `GET`  | `/vnpay-ipn`       | VNPay IPN handler.               | No            |
| `POST` | `/create-momo-url` | Create MoMo payment URL.         | JWT           |
| `POST` | `/momo-ipn`        | MoMo IPN handler.                | No            |

---

## 🤖 AI Assistant (`/ai-chat`)

| Method   | Endpoint   | Description                         | Auth Required |
| :------- | :--------- | :---------------------------------- | :------------ |
| `GET`    | `/history` | Fetch user's chat history with AI.  | JWT           |
| `DELETE` | `/history` | Clear AI chat history.              | JWT           |
| `POST`   | `/message` | Send a message to the AI assistant. | JWT           |

---

## 📂 Media (`/media`)

| Method   | Endpoint  | Description                          | Auth Required |
| :------- | :-------- | :----------------------------------- | :------------ |
| `POST`   | `/upload` | Upload a file (Multer + Cloudinary). | JWT           |
| `GET`    | `/`       | List all files uploaded by user.     | JWT           |
| `DELETE` | `/:id`    | Remove a media file.                 | JWT           |

---

## 🔔 Notifications (`/notifications`)

| Method  | Endpoint    | Description                          | Auth Required |
| :------ | :---------- | :----------------------------------- | :------------ |
| `GET`   | `/`         | List notifications and unread count. | JWT           |
| `PATCH` | `/:id/read` | Mark specific notification as read.  | JWT           |
| `PATCH` | `/read-all` | Mark all notifications as read.      | JWT           |

---

## 📊 Admin Dashboard (`/admin/dashboard`)

| Method | Endpoint    | Description                           | Auth Required |
| :----- | :---------- | :------------------------------------ | :------------ |
| `GET`  | `/overview` | Get platform-wide statistics.         | JWT + Admin   |
| `GET`  | `/users`    | Get paginated user list with filters. | JWT + Admin   |
