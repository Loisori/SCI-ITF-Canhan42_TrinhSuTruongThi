# AI Service (Gemini)

Dịch vụ này nhận request chat từ `server`, đọc trực tiếp file `server/src/data/projects-data.json` mỗi lần người dùng gửi tin nhắn, sau đó gọi Gemini API với context InvestPro.

## Environment

Sao chép file `.env.example` thành `.env` và điền:

- `GEMINI_API_KEY`
- `GEMINI_MODEL` (mặc định `gemini-2.0-flash`)
- `PROJECTS_DATA_PATH` (mặc định `../../server/src/data/projects-data.json`)

## Run

```bash
npm install
npm run dev
```

Health check: `GET http://localhost:3010/health`
