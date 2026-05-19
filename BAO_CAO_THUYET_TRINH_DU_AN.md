
# Bao cao thuyet trinh du an InvestPro / AI-vest

## 1. Tong quan du an

**Ten du an:** InvestPro, con duoc mo ta trong code va metadata la AI-vest / SmartVest AI.

**Loai he thong:** Nen tang Fintech goi von cong dong va dau tu vi mo.

**Muc tieu:** Ket noi nha dau tu ca nhan voi chu du an can huy dong von, dong thoi giam rui ro bang co che vi noi bo, xac thuc KYC, giai ngan theo milestone, ledger giao dich, tranh chap, thong bao thoi gian thuc va tro ly AI.

**Doi tuong su dung chinh:**

- **Investor:** nap tien vao vi, tim du an, dau tu, theo doi danh muc, nhan lai/lai/goc/hoan tien, bo phieu milestone.
- **Owner:** tao du an, thiet lap milestone, nhan giai ngan, upload bang chung, tra lai va tra goc.
- **Admin:** duyet KYC, duyet du an, duyet giai ngan, quan ly tranh chap, duyet giao dich nap/rut, xem dashboard he thong.

**Gia tri noi bat cua du an:**

- Dau tu khong chuyen tien truc tiep 100% cho chu du an.
- Von duoc quan ly theo tung giai doan, gan voi bang chung hoan thanh milestone.
- Nha dau tu co quyen bieu quyet theo ty trong von da dau tu.
- Moi bien dong tien duoc ghi vao bang `transactions` de truy vet.
- Tich hop AI Gemini de tu van dau tu dua tren du lieu du an va danh muc cua nguoi dung.

## 2. Kien truc tong the

Du an duoc chia thanh 2 ung dung chinh:

- `client/`: frontend Next.js.
- `server/`: backend NestJS.

O root co script chay dong thoi:

```bash
npm run dev
```

Script nay goi:

- `npm run server`: chay NestJS backend.
- `npm run client`: chay Next.js frontend.

### 2.1 Frontend

Cong nghe chinh:

- **Next.js 16.1.6** voi App Router.
- **React 19.2.3**.
- **TypeScript**.
- **Tailwind CSS 4** va **Sass**.
- **next-intl** cho da ngon ngu.
- **TanStack React Query** cho fetch/cache du lieu.
- **Axios** de goi API.
- **Socket.io Client** de nhan thong bao realtime.
- **Recharts** de ve bieu do dashboard/analytics.
- **Lucide React** cho icon.
- **Sonner / React Hot Toast** cho toast notification.
- **next-themes** cho dark/light theme.

Cac nhom route frontend:

- `(main)`: trang public va dashboard nguoi dung.
- `(admin)`: trang admin dashboard.
- `(auth)`: login, register, forgot password, callback Google OAuth.

Mot so man hinh chinh:

- Trang chu: `client/app/(main)/page.tsx`
- Danh sach du an: `client/app/(main)/projects/page.tsx`
- Chi tiet du an: `client/app/(main)/projects/[slug]/page.tsx`
- Tao du an: `client/app/(main)/projects/create/page.tsx`
- Dashboard user: `client/app/(main)/dashboard/page.tsx`
- Nap tien: `client/app/(main)/dashboard/deposit/page.tsx`
- Quan ly du an cua owner: `client/app/(main)/dashboard/my-projects/[id]/page.tsx`
- Admin dashboard: `client/app/(admin)/admin-dashboard/page.tsx`
- Admin duyet du an: `client/app/(admin)/admin-dashboard/approval/page.tsx`
- Admin tranh chap: `client/app/(admin)/admin-dashboard/disputes/page.tsx`

Frontend dung `client/lib/axios.ts` de tao Axios instance. Base URL lay tu `NEXT_PUBLIC_API_URL`, mac dinh la `http://localhost:3001`. Interceptor tu dong doc cookie `access_token` va gan `Authorization: Bearer <token>`. Neu API tra ve `401`, token se bi xoa va user duoc dieu huong ve `/login`.

### 2.2 Backend

Cong nghe chinh:

- **NestJS 11**.
- **TypeScript**.
- **TypeORM 0.3**.
- **MySQL** voi driver `mysql2`.
- **JWT + Passport** cho xac thuc.
- **Google OAuth2** cho dang nhap Google.
- **class-validator / class-transformer** cho DTO validation.
- **Socket.io** cho thong bao realtime.
- **Cloudinary** cho upload anh/media.
- **VNPay va MoMo** cho nap tien.
- **Google Gemini API** cho AI assistant.
- **Jest** cho test.

Module backend duoc khai bao trong `server/src/app.module.ts`:

- `UsersModule`
- `AuthModule`
- `ProjectsModule`
- `InvestmentsModule`
- `TransactionsModule`
- `PaymentModule`
- `AdminDashboardModule`
- `NotificationsModule`
- `MediaModule`
- `AiChatModule`
- `WalletsModule`
- `BlogsModule`

Backend cau hinh database trong `server/src/config/typeorm.config.ts`. He thong ho tro 2 cach ket noi:

- Dung `DATABASE_URL`.
- Hoac dung cac bien rieng: `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`.

TypeORM bat `autoLoadEntities: true` de tu nap entity cua cac module. Bien `DB_SYNCHRONIZE=true` cho phep sync schema trong moi truong dev.

## 3. Mo hinh du lieu

### 3.1 Cac entity chinh

**users**

Luu tai khoan nguoi dung:

- `email`, `password`, `fullName`
- `role`: `investor`, `owner`, `admin`
- `balance`: so du vi noi bo
- `isVerified`: trang thai xac thuc
- `isFrozen`: trang thai dong bang tai khoan
- `slug`, `avatarUrl`, `bio`, `socialLinks`, `address`

**projects**

Luu thong tin du an goi von:

- `ownerId`, `categoryId`
- `title`, `slug`, `address`
- `shortDescription`, `content`
- `goalAmount`: muc tieu goi von
- `currentAmount`: so tien da huy dong
- `minInvestment`: muc dau tu toi thieu
- `interestRate`: lai suat nam
- `commissionRate`: phi san
- `durationMonths`: thoi han du an
- `riskLevel`: `low`, `medium`, `high`
- `status`: `pending`, `funding`, `active`, `pending_admin_review`, `completed`, `overdue`, `failed`
- `allowOverfunding`: co cho vuot muc tieu hay khong
- `totalDebt`: tong no owner can thanh toan

**project_milestones**

Luu cac giai doan giai ngan:

- `projectId`
- `title`, `content`
- `percentage`: ty le giai ngan cua milestone
- `stage`: thu tu giai doan
- `status`: `pending`, `uploading_proof`, `admin_review`, `voting`, `disbursed`, `completed`, `rejected`, `disputed`
- `evidenceUrls`: danh sach bang chung
- `votingEndsAt`: han bieu quyet
- `nextDisbursementDate`: ngay duoc phep mo giai doan tiep theo

**investments**

Luu khoan dau tu cua investor vao project:

- `userId`
- `projectId`
- `amount`
- `status`: active/completed/withdrawn
- `investedAt`

**payment_schedules**

Luu lich tra no/lai theo tung khoan dau tu:

- `investmentId`
- `dueDate`
- `amount`
- `status`: `unpaid`, `paid`, `overdue`
- `paidAt`

**transactions**

La ledger cua he thong, luu moi bien dong tien:

- `userId`
- `amount`
- `type`
- `status`
- `description`
- `referenceId`
- `parentTransactionId`
- `bankName`, `accountNumber` cho rut tien

Transaction types:

- `deposit`: nap tien
- `withdrawal`: rut tien
- `invest`: dau tu
- `interest_receive`: investor nhan lai
- `refund`: hoan tien
- `disbursement`: giai ngan cho owner
- `repayment`: thanh toan no tong hop
- `repay_interest`: owner tra lai
- `repay_principal`: owner tra goc
- `system_fee`: phi san
- `system_log`: log he thong

**kycs**

Luu thong tin xac thuc danh tinh:

- CCCD/CMND
- anh mat truoc/mat sau
- trang thai `PENDING`, `APPROVED`, `REJECTED`
- ly do tu choi

**notifications**

Luu thong bao nguoi dung, ket hop Socket.io de day realtime.

**chat_history**

Luu lich su hoi dap AI theo tung user.

**blogs**

Quan ly bai viet/tin tuc cua nen tang.

### 3.2 Quan he du lieu

- 1 user owner co nhieu projects.
- 1 project co nhieu milestones.
- 1 project co nhieu media.
- 1 project co nhieu investments.
- 1 user investor co nhieu investments.
- 1 investment co nhieu payment schedules.
- 1 user co nhieu transactions.
- Transaction co the co `parentTransactionId` de gan giao dich con voi giao dich cha.
- 1 project co the co nhieu disputes.
- 1 milestone co votes, discussions va snapshots.

## 4. Phan quyen va bao mat

### 4.1 Vai tro

He thong co 3 role:

- `investor`: dau tu, nap/rut tien, xem danh muc, bo phieu milestone.
- `owner`: tao du an, quan ly milestone, upload bang chung, nhan giai ngan, tra no.
- `admin`: duyet KYC, duyet du an, duyet giao dich, quan ly tranh chap va dashboard.

### 4.2 Xac thuc

Backend dung JWT:

- User dang nhap thanh cong se nhan access token.
- Frontend luu token trong cookie `access_token`.
- Moi request can bao mat se gui token qua header `Authorization`.

Backend co cac guard:

- `JwtAuthGuard`: yeu cau dang nhap.
- `RolesGuard`: kiem tra role.
- `AccountStatusGuard`: chan tai khoan bi dong bang/chua du dieu kien.
- `IsInvestorGuard`: chi cho investor.
- `IsOwnerGuard`: chi cho owner.
- `OptionalAuthGuard`: endpoint public nhung co the doc user neu co token.

### 4.3 KYC

Luồng KYC:

1. User upload anh CCCD/CMND.
2. User gui yeu cau KYC.
3. Admin xem danh sach pending.
4. Admin approve hoac reject kem ly do.
5. Trang thai KYC anh huong den do tin cay va mot so hanh dong trong he thong.

## 5. Flow nghiep vu chinh

### 5.1 Dang ky, dang nhap

1. User dang ky bang email/password.
2. Password duoc bam bang bcrypt.
3. User dang nhap bang email/password hoac Google OAuth.
4. Backend cap JWT.
5. Frontend luu JWT vao cookie va goi `/auth/me` de lay thong tin hien tai.

### 5.2 Owner tao du an

1. Owner vao trang tao du an.
2. Nhap thong tin co ban: ten, mo ta, category, dia chi, muc tieu von, lai suat, thoi han, muc dau tu toi thieu, rui ro.
3. Upload media qua Cloudinary.
4. Tao milestones, tong `percentage` bat buoc bang 100%.
5. Project ban dau co status `pending`.
6. Admin duyet project.
7. Neu duyet thanh cong, status chuyen sang `funding`.
8. Neu tu choi, status chuyen sang `failed`.

### 5.3 Investor dau tu

1. Investor nap tien vao vi.
2. Investor chon project dang `funding`.
3. He thong kiem tra:
   - Project con han goi von.
   - Project dang o trang thai `funding`.
   - So tien >= `minInvestment`.
   - Vi investor du tien.
   - Neu `allowOverfunding=false` thi khong duoc vuot `goalAmount`.
4. He thong lock user va project de tranh race condition.
5. Tru tien vi investor.
6. Cong `project.currentAmount`.
7. Tao investment.
8. Tao transaction type `invest`.
9. Neu du an dat muc tieu va khong cho overfunding, status chuyen sang `pending_admin_review`.

### 5.4 Ket thuc goi von va phi san mot lan

Khi du an dat muc tieu:

1. Project chuyen sang `pending_admin_review`.
2. He thong tinh `totalDebt`.
3. He thong tinh phi san tren tong von huy dong.
4. Phi san duoc cong vao vi admin/platform.
5. Tao transaction `system_fee`.
6. Milestone 1 chuyen sang `admin_review`.

Cong thuc:

```text
Upfront Fee = Total Raised * Commission Rate
Net Pool = Total Raised - Upfront Fee
```

### 5.5 Admin kich hoat du an va giai ngan milestone 1

1. Admin xem project dang `pending_admin_review`.
2. Admin approve disbursement.
3. Project chuyen sang `active`.
4. He thong tao payment schedules cho moi investment.
5. Milestone 1 duoc giai ngan.
6. Owner nhan tien vao vi.
7. Transaction `disbursement` duoc tao.

Milestone 1 bat buoc di qua flow kich hoat project de dam bao lich tra no duoc tao truoc khi giai ngan.

### 5.6 Owner upload bang chung milestone

Sau milestone truoc duoc giai ngan:

1. Milestone tiep theo chuyen sang `uploading_proof` neu khong co interval.
2. Owner upload bang chung hoan thanh.
3. Milestone chuyen sang `admin_review`.
4. Admin co the:
   - Gui feedback.
   - Reject de owner upload lai.
   - Finalize de mo voting.

### 5.7 Voting milestone

Voting duoc thiet ke theo von dau tu, khong phai moi user 1 phieu bang nhau.

1. Khi voting bat dau, he thong tao snapshot von cua tung investor.
2. Snapshot gom `userId`, `milestoneId`, `capitalSnapshot`.
3. Voting mo trong 3 ngay, tuong duong 72 gio.
4. Investor cua project moi duoc vote.
5. Moi investor chi vote 1 lan.
6. Trong vote co:
   - `isApprove`
   - comment
   - `investorCapital`

Cong thuc xet ket qua:

```text
Yes Weight = tong investorCapital cua cac phieu dong y
Neu Yes Weight >= Total Raised * 50% => milestone duoc giai ngan
Neu Yes Weight < Total Raised * 50% => milestone bi disputed
```

### 5.8 Giai ngan milestone

He thong khong giai ngan tren tong von gross ma tren net pool sau phi san mot lan.

Cong thuc:

```text
Milestone Payout = Net Pool * (Milestone Percentage / 100)
```

Voi milestone cuoi, he thong tinh phan con lai de tranh sai lech lam tron:

```text
Remaining = Net Pool - Already Disbursed
Final Milestone Payout = Remaining
```

Sau khi giai ngan:

- Owner duoc cong tien vao vi.
- Transaction `disbursement` duoc tao.
- Milestone status thanh `disbursed`.
- Milestone tiep theo duoc mo.
- Neu khong con milestone tiep theo, project chuyen sang `completed`.

### 5.9 Tranh chap va huy du an

Khi milestone khong du so phieu dong y, milestone chuyen sang `disputed`.

Admin co the terminate project:

1. Tinh ty le milestone da giai ngan.
2. Tinh ty le von con lai chua giai ngan.
3. Phan bo tien hoan lai cho investor theo ty le von gop.
4. Tao transaction `refund`.
5. Investment chuyen sang `withdrawn`.
6. Project chuyen sang `failed`.

Cong thuc hoan tien khi huy du an:

```text
Disbursed Percentage = tong percentage cua milestone da disbursed/completed
Remaining Percentage = 100% - Disbursed Percentage
Remaining Balance To Refund = Total Raised * Remaining Percentage
Investor Refund = Investor Initial Amount / Total Raised * Remaining Balance To Refund
```

## 6. Dong tien trong he thong

### 6.1 Nap tien

Dong tien:

```text
Nguoi dung -> VNPay/MoMo -> Vi InvestPro
```

Quy trinh:

1. User yeu cau nap tien.
2. Backend tao payment URL VNPay/MoMo.
3. Tao transaction `deposit` status `pending`.
4. Cong thanh toan callback/IPN ve backend.
5. Backend verify signature.
6. Neu thanh cong:
   - Cong `user.balance`.
   - Doi transaction sang `success`.
7. Neu that bai:
   - Doi transaction sang `failed`.

Voi VNPay:

- So tien gui qua VNPay la `amount * 100`.
- Signature dung HMAC SHA512.
- Callback gom return handler va IPN handler.

Voi MoMo:

- Dung endpoint sandbox `https://test-payment.momo.vn/v2/gateway/api/create`.
- Signature dung HMAC SHA256.
- IPN xac minh `signature` truoc khi cong tien.

### 6.2 Dau tu

Dong tien:

```text
Vi Investor -> Project Current Amount
```

He thong khong cong truc tiep vao vi owner khi investor dau tu. Tien nam trong pool cua project cho den khi duoc giai ngan theo milestone.

Buoc xu ly:

- Tru balance investor.
- Cong currentAmount cua project.
- Tao investment.
- Tao transaction `invest`.

### 6.3 Phi san khi ket thuc huy dong

Dong tien:

```text
Project Raised Amount -> Vi Admin/Platform
```

Phi nay thu mot lan khi du an ket thuc goi von thanh cong.

Cong thuc:

```text
Platform Fee = Total Raised * Commission Rate
Net Pool = Total Raised - Platform Fee
```

`Net Pool` la tong tien dung de giai ngan cho owner theo milestone.

### 6.4 Giai ngan

Dong tien:

```text
Net Pool cua project -> Vi Owner
```

Cong thuc:

```text
Milestone Payout = Net Pool * Milestone Percentage / 100
```

Neu la milestone cuoi:

```text
Milestone Payout = Net Pool - tong da giai ngan truoc do
```

### 6.5 Tra lai va tra goc theo lich

Dong tien:

```text
Vi Owner -> Investor va Admin/Platform
```

He thong tao `payment_schedules` khi project duoc kich hoat.

Voi moi investment:

```text
Principal = so tien investor dau tu
Annual Interest Rate = project.interestRate / 100
Duration = project.durationMonths
Fee Rate = commissionRate

Total Interest = Principal * Annual Interest Rate * (Duration / 12)
Total Fee = Total Interest * Fee Rate
Total Interest And Fee = Total Interest + Total Fee
Monthly Interest Plus Fee = Total Interest And Fee / Duration
```

Moi thang:

```text
Schedule Amount = round(Monthly Interest Plus Fee)
```

Thang cuoi:

```text
Final Schedule Amount = Principal + rounding adjustment cua phan lai/phi
```

Khi owner thanh toan 1 ky:

```text
Interest Share = (Schedule Gross - Principal Share) / (1 + Fee Rate)
Fee Amount = Schedule Gross - Principal Share - Interest Share
Owner Charge = Principal Share + Interest Share + Fee Amount
Investor Payout = Principal Share + Interest Share
```

Ket qua:

- Owner bi tru `Owner Charge`.
- Investor duoc cong `Investor Payout`.
- Admin/platform nhan `Fee Amount`.
- Schedule chuyen sang `paid`.
- Project `totalDebt` giam theo so tien owner da thanh toan.

### 6.6 Tra no tong hop

Ngoai tra tung ky, owner co the tra no cho ca project qua `repayProjectDebt`.

He thong:

1. Lay `project.totalDebt`.
2. Xac dinh phan debt cua investor va phan fee con lai.
3. Tru balance owner.
4. Chia tien cho investor theo ty le von goc.
5. Cong phi cho admin/platform.
6. Giam `project.totalDebt`.
7. Tao transaction cha/con de truy vet.

Cong thuc chia cho investor:

```text
Investor Share = Investment Amount / Total Principal
Investor Payout = Investor Payout Pool * Investor Share
```

Investor cuoi cung nhan phan con lai de tranh lech do lam tron.

### 6.7 Hoan tien khi du an that bai huy dong

Neu du an het han ma chua dat muc tieu:

1. Project status chuyen sang `failed`.
2. Moi investment active duoc hoan tien.
3. Balance investor duoc cong lai bang so tien da dau tu.
4. Investment chuyen sang `withdrawn`.
5. Tao transaction `refund`.
6. `project.currentAmount` ve 0.

Dong tien:

```text
Project Pool -> Vi Investor
```

### 6.8 Rut tien

Dong tien:

```text
Vi InvestPro -> Tai khoan ngan hang nguoi dung
```

Quy trinh:

1. User tao yeu cau rut tien.
2. He thong kiem tra balance.
3. Neu user la owner co project `overdue`, chan rut tien.
4. Tru balance ngay khi tao request.
5. Tao transaction `withdrawal` status `pending`.
6. Admin duyet:
   - Neu approve: transaction sang `success`.
   - Neu reject: hoan balance va transaction sang `failed`.

## 7. Cac cong thuc tai chinh quan trong

File trung tam cong thuc: `server/src/common/utils/financial-calculator.ts`

### 7.1 Lam tron tien

```text
round(amount) = Math.round(amount)
```

He thong dang lam tron ve don vi VND, khong giu 2 chu so thap phan trong thuc te.

### 7.2 Chuyen commission rate

He thong chap nhan 2 dinh dang:

```text
5    -> 0.05
0.05 -> 0.05
```

Cong thuc:

```text
Neu rate > 1 thi rate / 100
Neu rate <= 1 thi giu nguyen
Neu rate rong hoac <= 0 thi 0
```

### 7.3 Phi hoa hong

```text
Commission = round(Amount * Commission Fraction)
```

### 7.4 Tong no du an

Trong implementation hien tai:

```text
P = Principal
R = InterestRatePercent / 100
T = DurationMonths / 12
FeeRate = CommissionRate

Total Interest = P * R * T
Platform Fee On Interest = Total Interest * FeeRate
Total Debt = round(P + Total Interest + Platform Fee On Interest)
```

Vi du trong test:

```text
P = 100,000
Interest Rate = 12%/nam
Duration = 12 thang
Commission = 10%

Interest = 100,000 * 12% * 12/12 = 12,000
Fee on Interest = 12,000 * 10% = 1,200
Total Debt = 100,000 + 12,000 + 1,200 = 113,200
```

Neu khong co commission:

```text
Total Debt = P + Interest
```

### 7.5 Tien thuc nhan sau phi

```text
Net After Fee = Gross - Commission
```

### 7.6 Tien giai ngan theo milestone

```text
Upfront Fee = Total Raised * Commission Rate
Net Pool = Total Raised - Upfront Fee
Milestone Payout = Net Pool * Milestone Percentage / 100
```

### 7.7 Loi nhuan investor

AI assistant va logic schedule dung cong thuc:

```text
Profit = Investment Amount * (Interest Rate / 100) * (Duration Months / 12)
```

### 7.8 Ty trong voting

```text
Capital Snapshot Of Investor = tong amount investor da dau tu vao project
Yes Weight = tong Capital Snapshot cua vote dong y
Approve neu Yes Weight >= Total Raised * 0.5
```

## 8. API chinh

Base URL backend: `/api`

### 8.1 Auth

- `POST /auth/register`: dang ky.
- `POST /auth/login`: dang nhap.
- `GET /auth/me`: lay user hien tai.
- `GET /auth/google`: bat dau Google OAuth.
- `GET /auth/google/callback`: callback Google OAuth.

### 8.2 Users va KYC

- `GET /users/profile`: xem profile.
- `PATCH /users/profile`: cap nhat profile.
- `PATCH /users/avatar`: cap nhat avatar.
- `PATCH /users/change-password`: doi mat khau.
- `GET /users/:id/public`: xem public profile.
- `POST /users/kyc`: gui KYC.
- `GET /users/kyc/status`: xem trang thai KYC.
- `GET /users/kyc/pending`: admin xem KYC pending.
- `PATCH /users/kyc/:id/approve`: admin approve.
- `PATCH /users/kyc/:id/reject`: admin reject.

### 8.3 Projects

- `GET /projects`: danh sach project dang funding.
- `GET /projects/suggestions`: goi y tim kiem.
- `GET /projects/stats/homepage`: so lieu trang chu.
- `GET /projects/slug/:slug`: chi tiet project.
- `POST /projects`: owner tao project.
- `PUT /projects/:id`: owner cap nhat project.
- `DELETE /projects/:id`: owner xoa project.
- `PUT /projects/:id/stop-funding`: owner dung huy dong.
- `POST /projects/:id/disputes`: investor tao tranh chap.
- `PATCH /projects/:id/milestones/:mId/proof`: owner upload bang chung.
- `POST /projects/milestones/:mId/start-voting`: owner mo voting.
- `POST /projects/milestones/:mId/vote`: investor vote.
- `GET /projects/milestones/:mId/votes`: xem vote.

### 8.4 Admin projects

- `GET /admin/projects/pending`: du an cho duyet.
- `GET /admin/projects/funding-review`: du an cho duyet giai ngan.
- `PATCH /admin/projects/:id/approve`: duyet project.
- `PATCH /admin/projects/:id/reject`: tu choi project.
- `PATCH /admin/projects/:id/approve-disbursement`: duyet giai ngan milestone 1.
- `POST /admin/projects/:id/milestones/:mId/finalize`: finalize milestone.
- `PATCH /admin/projects/:id/milestones/:mId/reject`: reject bang chung.
- `POST /admin/projects/:id/terminate`: huy du an va hoan tien.

### 8.5 Investments

- `GET /investments/my-investments`: danh muc cua investor.
- `GET /investments/analytics`: phan tich danh muc.
- `POST /investments`: dau tu.
- `POST /investments/handle-project-timeout`: xu ly project het han.

### 8.6 Wallets

- `POST /wallets/deposit`: tao yeu cau nap tien thu cong.
- `POST /wallets/withdraw`: tao yeu cau rut tien.
- `GET /wallets/history`: lich su vi.
- `GET /wallets/repayments/schedules`: owner xem lich tra no.
- `POST /wallets/repay`: tra no project.
- `POST /wallets/repay-milestone-interest`: tra ky han.
- `GET /wallets/admin/pending-transactions`: admin xem giao dich pending.
- `POST /wallets/admin/approve-transaction/:id`: admin approve.
- `POST /wallets/admin/reject-transaction/:id`: admin reject.

### 8.7 Payments

- `POST /payment/create-url`: tao URL VNPay.
- `GET /payment/vnpay-return`: VNPay return.
- `GET /payment/vnpay-ipn`: VNPay IPN.
- `POST /payment/create-momo-url`: tao URL MoMo.
- `POST /payment/momo-ipn`: MoMo IPN.

### 8.8 AI Assistant

- `GET /ai-chat/history`: lay lich su chat.
- `POST /ai-chat/message`: gui cau hoi cho AI.
- `DELETE /ai-chat/history`: xoa lich su.

### 8.9 Media, Notifications, Blogs

- `POST /media/upload`: upload file len Cloudinary.
- `GET /media`: danh sach media user.
- `DELETE /media/:id`: xoa media.
- `GET /notifications`: danh sach thong bao.
- `PATCH /notifications/:id/read`: danh dau da doc.
- `PATCH /notifications/read-all`: doc tat ca.
- `GET /blogs`: danh sach blog public.
- `GET /blogs/:slug`: chi tiet blog.
- Admin blog CRUD trong `/admin/blogs`.

## 9. AI Assistant

AI assistant nam trong module `AiChatModule`, service chinh la `AiChatService`.

Cong nghe:

- Google Gemini API.
- Model mac dinh: `gemini-2.5-flash`.
- Prompt dieu khien co system instruction rieng.
- Chat history luu vao database.

Du lieu dua vao AI:

- Tin nhan hien tai cua user.
- 10 tin nhan gan nhat.
- `projectContext` neu user dang hoi trong trang du an.
- Du lieu tai chinh ca nhan:
  - user id
  - ho ten
  - balance
  - danh sach investment
- Du lieu project tu `server/src/data/projects-data.json`.

Nguyen tac tu van trong prompt:

- Lay lai suat tiet kiem ngan hang 6%/nam lam moc so sanh.
- Khi tinh loi nhuan phai trinh bay cong thuc:

```text
Loi nhuan = So tien * (Lai suat / 100) * (So thang / 12)
```

- Rui ro `high` phai khuyen nghi than trong va da dang hoa danh muc.
- Chi ket luan dua tren du lieu duoc cung cap, khong suy doan thong tin nhay cam.

## 10. Thong bao realtime

Backend dung `NotificationsGateway` voi Socket.io.

Quy trinh ket noi:

1. Client ket noi WebSocket.
2. Client gui JWT trong header authorization hoac handshake auth.
3. Gateway verify JWT.
4. Socket join room rieng `user_<userId>`.
5. Khi co event, server emit vao room cua user.

Cac su kien noi bat:

- Dau tu moi.
- Du an dat muc tieu.
- Du an duoc duyet/tu choi.
- Giai ngan thanh cong.
- Milestone disputed.
- Hoan tien.
- Payment success.

## 11. Dashboard va analytics

### 11.1 Dashboard investor

Investor co the xem:

- Tong so du vi.
- Danh muc dau tu.
- Lich su giao dich.
- Lich nhan lai/goc.
- Bieu do phan bo danh muc.
- Hoat dong gan day.
- AI chatbox ho tro phan tich du an.

### 11.2 Dashboard owner

Owner co the:

- Xem cac du an da tao.
- Sua du an.
- Theo doi tien do goi von.
- Upload bang chung milestone.
- Xem lich tra no.
- Thanh toan no/lai.
- Theo doi trang thai giai ngan.

### 11.3 Admin dashboard

Admin co the:

- Xem tong quan he thong.
- Quan ly user.
- Duyet KYC.
- Duyet project.
- Quan ly project categories.
- Duyet giai ngan.
- Quan ly tranh chap.
- Duyet giao dich nap/rut.
- Quan ly blog.

## 12. Quan ly media

Media duoc xu ly boi `MediaModule` va Cloudinary.

Chuc nang:

- Upload anh du an.
- Upload bang chung milestone.
- Upload avatar/KYC.
- Luu URL vao database thay vi luu binary file.

Loi ich:

- Backend nhe hon.
- Anh co URL cong khai/de hien thi.
- De quan ly thumbnail, gallery, evidence.

## 13. Xu ly dong bo du lieu project JSON

He thong co file `server/src/data/projects-data.json`.

File nay duoc dung de:

- Cung cap du lieu project cho AI assistant.
- Lam nguon du lieu cache/phu tro cho mot so man hinh.

Mot so service co ham sync lai file nay tu database, gom:

- Thong tin project.
- Category.
- Owner.
- Media.
- Milestones.
- Disputes.
- Funding progress.

## 14. Cac bien moi truong quan trong

Backend:

- `DATABASE_URL` hoac bo `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`
- `DB_SYNCHRONIZE`
- `JWT_SECRET`
- `ADMIN_PLATFORM_ID`
- `CLIENT_URL`
- `API_URL`
- `VNP_URL`
- `VNP_TMN_CODE`
- `VNP_HASH_SECRET`
- `VNP_RETURN_URL`
- `MOMO_PARTNER_CODE`
- `MOMO_ACCESS_KEY`
- `MOMO_SECRET_KEY`
- `MOMO_RETURN_URL`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `PROJECTS_DATA_PATH`
- Cloudinary config

Frontend:

- `NEXT_PUBLIC_API_URL`

## 15. Diem ky thuat dang chu y

### 15.1 Database transaction

Nhung thao tac lien quan tien duoc boc trong `dataSource.transaction`.

Vi du:

- Dau tu.
- Rut tien.
- Duyet nap/rut.
- Tra no.
- Tra lai milestone.
- Giai ngan.
- Hoan tien.
- Huy du an.

### 15.2 Pessimistic locking

He thong dung lock `pessimistic_write` o cac entity nhay cam:

- User balance.
- Project current amount / total debt.
- Milestone status.
- Transaction pending.
- Investment schedule.

Muc tieu:

- Tranh 2 request cung tru/cong tien sai.
- Tranh vuot muc tieu goi von khi nhieu investor dau tu dong thoi.
- Tranh giai ngan/tran tien 2 lan.

### 15.3 Transaction cha/con

`parentTransactionId` giup gan cac giao dich con voi mot giao dich cha.

Vi du owner tra no:

- Giao dich cha: owner tra tien.
- Giao dich con:
  - Investor A nhan tien.
  - Investor B nhan tien.
  - Admin nhan phi san.

Loi ich:

- Truy vet day du dong tien.
- De hien thi lich su minh bach.
- De audit khi co tranh chap.

### 15.4 Chong double fee / double disbursement

He thong co check:

- Neu da co `SYSTEM_FEE` cho project thi khong thu lai phi upfront.
- Neu da co `DISBURSEMENT` cho milestone thi khong giai ngan lai.
- VNPay/MoMo neu transaction da `success` thi callback lan 2 khong cong tien lan nua.

### 15.5 Lam tron o lan cuoi

Khi chia tien theo ty le, he thong cho item cuoi nhan phan con lai.

Muc tieu:

- Tong tien distributed khop voi pool.
- Khong bi lech do `Math.round`.

## 16. Trang thai quan trong

### 16.1 Project status

```text
pending -> funding -> pending_admin_review -> active -> completed
```

Nhanh that bai:

```text
pending -> failed
funding het han khong dat muc tieu -> failed
active/disputed bi admin terminate -> failed
```

### 16.2 Milestone status

```text
pending -> uploading_proof -> admin_review -> voting -> disbursed
```

Nhanh khac:

```text
admin_review -> uploading_proof neu admin reject
voting -> disputed neu khong du 50% yes weight
disputed -> rejected neu admin terminate/refund
```

### 16.3 Transaction status

```text
pending -> success
pending -> failed
```

## 17. Kiem thu

Backend co Jest config trong `server/package.json`.

Lenh test:

```bash
cd server
npm test
```

Test hien co dang tap trung vao `FinancialCalculator`, dac biet:

- Tinh tong no gom goc + lai + phi tren lai.
- Ho tro commission rate dang percent va fraction.
- Tuong thich khi thieu commission rate.

Vi du test:

```text
100,000 goc
12%/nam
12 thang
10% phi
=> total debt = 113,200
```

## 18. Diem manh cua du an de thuyet trinh

1. **Kien truc module ro rang:** frontend Next.js, backend NestJS, moi nghiep vu nam trong module rieng.
2. **Dong tien minh bach:** moi bien dong tien deu co transaction ledger.
3. **Bao ve nha dau tu:** owner khong nhan toan bo tien ngay, ma nhan theo milestone.
4. **Voting theo von:** nguoi dau tu nhieu co trong so bieu quyet cao hon, phu hop mo hinh tai chinh.
5. **Admin co vai tro kiem soat rui ro:** duyet project, duyet giai ngan, xu ly tranh chap, terminate/refund.
6. **Thanh toan thuc te:** tich hop VNPay va MoMo.
7. **Realtime:** Socket.io giup user nhan thong bao ngay khi co bien dong.
8. **AI co context:** Gemini khong tra loi chung chung ma doc du lieu project, balance va investment cua user.
9. **Co co che tranh race condition:** database transaction va pessimistic lock.
10. **Co kha nang mo rong:** them category, blog, media, dashboard analytics, profile public.

## 19. Goi y kich ban thuyet trinh

### Mo dau

"Du an cua em la InvestPro, mot nen tang goi von cong dong va dau tu vi mo. Van de em giai quyet la trong cac mo hinh crowdfunding thong thuong, nha dau tu rat kho kiem soat tien sau khi da chuyen cho chu du an. Vi vay em xay dung mot he thong co vi noi bo, giai ngan theo milestone, voting cua nha dau tu, ledger giao dich va AI assistant de tang tinh minh bach."

### Trinh bay kien truc

"He thong gom frontend Next.js va backend NestJS. Backend su dung TypeORM voi MySQL, JWT cho xac thuc, Socket.io cho thong bao realtime, Cloudinary cho media, VNPay/MoMo cho nap tien va Gemini cho AI assistant. Code backend duoc chia theo module nhu Auth, Users, Projects, Investments, Wallets, Payments, Notifications va AI Chat."

### Trinh bay flow dau tu

"Investor nap tien vao vi qua VNPay hoac MoMo. Khi dau tu, tien bi tru khoi vi investor va cong vao pool cua project, chua vao vi owner. Khi project dat muc tieu, he thong thu phi san mot lan, phan con lai tao net pool. Admin kich hoat du an va giai ngan theo milestone. Cac milestone sau can owner upload bang chung, admin review va investor vote. Neu tong von dong y dat tu 50% tro len thi milestone duoc giai ngan."

### Trinh bay cong thuc

"Tong no cua owner duoc tinh bang goc cong lai va phi tren lai. Cong thuc la Principal + Principal * InterestRate * Duration/12 + PlatformFeeOnInterest. Phi san khi ket thuc huy dong la TotalRaised * CommissionRate. Tien giai ngan tung milestone la NetPool * MilestonePercentage."

### Trinh bay diem an toan

"Nhung thao tac tien deu nam trong database transaction va dung pessimistic lock de tranh race condition. Ngoai ra, he thong co ledger transactions, parent-child transaction, check callback thanh toan trung, check giai ngan trung va co co che refund khi project that bai."

### Ket luan

"Diem khac biet cua InvestPro la khong chi cho phep goi von, ma con tap trung vao minh bach va quan tri rui ro. Nha dau tu co cong cu theo doi, co quyen bieu quyet, co AI ho tro ra quyet dinh, con admin co day du cong cu kiem soat va xu ly tranh chap."

## 20. Tom tat ngan de dua vao slide

- InvestPro la nen tang Fintech goi von cong dong va dau tu vi mo.
- 3 role: Investor, Owner, Admin.
- Stack: Next.js, React, NestJS, TypeORM, MySQL, Socket.io, Cloudinary, VNPay, MoMo, Gemini AI.
- Dong tien chinh: nap tien -> dau tu -> project pool -> phi san -> giai ngan milestone -> tra lai/goc -> rut tien.
- Cong thuc chinh:

```text
Interest = Principal * InterestRate * DurationMonths / 12
TotalDebt = Principal + Interest + Interest * CommissionRate
PlatformFee = TotalRaised * CommissionRate
NetPool = TotalRaised - PlatformFee
MilestonePayout = NetPool * MilestonePercentage / 100
VotePass = YesCapital >= TotalRaised * 50%
```

- Bao ve investor bang milestone, admin review, voting, dispute va refund.
- Minh bach tai chinh bang transaction ledger.
- AI assistant phan tich du an dua tren du lieu that cua he thong.

