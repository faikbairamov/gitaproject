# ProductAI — MVP Backend

Simple SaaS API that takes **product model numbers** + **custom data schemas** and returns **formatted product specifications** using **Google Gemini**.

---

## Features

- 🔐 Company auth (JWT)
- 🔁 Credit-based usage (1 credit per generation)
- 🧠 Gemini-powered extraction & formatting
- 🗂️ Job tracking (`pending/completed/failed`)
- 🧱 MongoDB storage with Mongoose
- 🛡️ Basic rate limiting middleware

---

## Tech Stack

- **API:** Node.js + Express
- **DB:** MongoDB + Mongoose
- **AI:** Google Gemini (`@google/generative-ai`)
- **Auth:** JWT (`jsonwebtoken` + `bcryptjs`)
- **HTTP:** Axios
- **Misc:** CORS, dotenv

---

## Project Structure

```
src/
├── app.js
├── config/
│   └── db.js
├── controllers/
│   ├── auth.js
│   └── generate.js
├── middleware/
│   ├── auth.js
│   └── rateLimit.js
├── models/
│   ├── Job.js
│   └── User.js
├── routes/
│   ├── auth.js
│   └── generate.js
└── services/
    └── gemini.js
```

---

## Data Models

### User (Company)

```javascript
{
  email:       { type: String, required: true, unique: true },
  password:    { type: String, required: true }, // hashed
  companyName: { type: String, required: true },
  creditsUsed: { type: Number, default: 0 },
  creditsLimit:{ type: Number, default: 10 },
  createdAt:   { type: Date, default: Date.now }
}
```

### Job

```javascript
{
  userId:       { type: ObjectId, ref: 'User', required: true },
  productModel: { type: String, required: true },
  customSchema: { type: Object, required: true },
  result:       { type: Object, default: null },
  status:       { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  error:        { type: String, default: null },
  createdAt:    { type: Date, default: Date.now }
}
```

---

## API

Base URL: `http://localhost:5000`

### Auth

#### `POST /auth/register` — Company signup

**Body**

```json
{
  "email": "admin@acme.com",
  "password": "StrongPassword123!",
  "companyName": "Acme Inc"
}
```

**201 Response**

```json
{
  "message": "Registered",
  "token": "JWT_TOKEN",
  "user": {
    "email": "admin@acme.com",
    "companyName": "Acme Inc",
    "creditsUsed": 0,
    "creditsLimit": 10
  }
}
```

#### `POST /auth/login` — Company login

**Body**

```json
{ "email": "admin@acme.com", "password": "StrongPassword123!" }
```

**200 Response**

```json
{
  "message": "Logged in",
  "token": "JWT_TOKEN"
}
```

> Use the token in `Authorization: Bearer <token>` for protected routes.

---

### Generation

#### `POST /generate` — Generate product data _(protected)_

**Headers**

```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body**

```json
{
  "productModel": "iPhone 15 Pro 256GB",
  "customSchema": {
    "name": "Product name under 60 chars",
    "brand": "Manufacturer name",
    "specs": {
      "storage": "Storage capacity",
      "display": "Screen size"
    },
    "description": "Product description 100-150 words",
    "features": "Array of 5 key features"
  }
}
```

**200 Response (synchronous MVP)**

```json
{
  "jobId": "64f8a1b2c3d4e5f6",
  "status": "completed",
  "data": {
    "name": "Apple iPhone 15 Pro 256GB Premium",
    "brand": "Apple",
    "specs": {
      "storage": "256GB",
      "display": "6.1 inch Super Retina XDR"
    },
    "description": "The iPhone 15 Pro delivers...",
    "features": [
      "A17 Pro chip",
      "Pro camera system",
      "USB-C",
      "Titanium design",
      "ProMotion display"
    ]
  },
  "credits": { "used": 1, "remaining": 9 }
}
```

> **Note:** For MVP this endpoint responds synchronously. If you later move to async processing, return `{ jobId, status: "pending" }` and complete via a worker.

---

### Jobs

#### `GET /jobs/:id` — Check job status _(protected)_

**200 Response**

```json
{
  "jobId": "64f8a1b2c3d4e5f6",
  "status": "completed",
  "result": {
    /* same structure as in /generate 'data' */
  },
  "error": null
}
```

---

## Quick Start

### Prerequisites

- Node.js **>= 18**
- MongoDB running locally or in the cloud

### Install

```bash
git clone <your-repo-url>
cd productai-backend
npm install
```

### Environment

Create `.env` at project root:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/productai
GEMINI_API_KEY=your_api_key
JWT_SECRET=your_jwt_secret
```

### Run

```bash
# Dev
npm run dev

# Prod
npm start
```

> Add scripts to `package.json`:

```json
{
  "scripts": {
    "dev": "nodemon src/app.js",
    "start": "node src/app.js"
  }
}
```

---

## Example cURL

```bash
# Register
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.com","password":"StrongPassword123!","companyName":"Acme Inc"}'

# Login
TOKEN=$(curl -s -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@acme.com","password":"StrongPassword123!"}' | jq -r .token)

# Generate
curl -X POST http://localhost:5000/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productModel": "iPhone 15 Pro 256GB",
    "customSchema": {
      "name":"Product name under 60 chars",
      "brand":"Manufacturer name",
      "specs":{"storage":"Storage capacity","display":"Screen size"},
      "description":"Product description 100-150 words",
      "features":"Array of 5 key features"
    }
  }'
```

---

## Gemini Service (MVP Behavior)

`src/services/gemini.js` should:

1. Accept `productModel` + `customSchema`.
2. Use Gemini to **search/aggregate official product info** and **conform output to the schema** (validate keys & formats).
3. Return a **strictly structured** JSON object matching the provided schema (no extra fields).

> Recommended: enforce schema shape server-side and have Gemini only fill **values**. If a field is missing/uncertain, return `null` and add a `confidence` map.

---

## Rate Limiting & Credits

- **Rate limiting:** basic middleware to protect `/generate` (e.g., N requests / minute / IP).
- **Credits:** increment `creditsUsed` on **successful** generation; block when `creditsUsed >= creditsLimit`.
- Default limit: **10 credits** per account (configurable).

---

## Security Notes

- Hash passwords with **bcryptjs**.
- Use short-lived JWTs (e.g., 1h) and refresh on login.
- Never log secrets or full prompts/responses with PII.
- Validate inputs (lengths, object shapes) before sending to Gemini.

---

## Errors

Common responses:

```json
// 400
{ "error": "ValidationError", "message": "productModel is required" }

// 401
{ "error": "Unauthorized", "message": "Missing or invalid token" }

// 402
{ "error": "InsufficientCredits", "message": "Credit limit reached" }

// 429
{ "error": "RateLimited", "message": "Too many requests" }

// 500
{ "error": "GenerationFailed", "message": "Gemini request failed" }
```

---

## Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/productai
GEMINI_API_KEY=your_api_key
JWT_SECRET=your_jwt_secret
```

---

## Dependencies

```json
{
  "dependencies": {
    "@google/generative-ai": "^0.1.3",
    "axios": "^1.5.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.2",
    "mongoose": "^7.5.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```

---

## Roadmap

- [ ] Async job queue (BullMQ) + worker
- [ ] Webhook for job completion
- [ ] Admin dashboard (usage/credits)
- [ ] TypeScript typings & validation (Zod)
- [ ] Confidence scores + source traces
- [ ] Multi-tenant billing integration (Stripe)

---

## License

MIT (or your preferred license)
