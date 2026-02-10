# Chitkara Qualifier 1 - BFHL REST APIs

Node.js implementation of the Chitkara University qualifier APIs.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/bfhl` | Process fibonacci, prime, lcm, hcf, or AI requests |

## Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   - Copy `.env.example` to `.env`
   - Set `OFFICIAL_EMAIL` to your Chitkara email
   - Set `GEMINI_API_KEY` for AI support (get free key from [Google AI Studio](https://aistudio.google.com))

3. **Run locally**
   ```bash
   npm start
   ```

## POST /bfhl Request Examples

**Fibonacci** (first n terms):
```json
{ "fibonacci": 7 }
```
→ `{ "is_success": true, "official_email": "...", "data": [0,1,1,2,3,5,8] }`

**Prime** (filter primes from array):
```json
{ "prime": [2,4,7,9,11] }
```
→ `{ "is_success": true, "official_email": "...", "data": [2,7,11] }`

**LCM**:
```json
{ "lcm": [12,18,24] }
```
→ `{ "is_success": true, "official_email": "...", "data": 72 }`

**HCF**:
```json
{ "hcf": [24,36,60] }
```
→ `{ "is_success": true, "official_email": "...", "data": 12 }`

**AI** (single-word answer via Gemini):
```json
{ "AI": "What is the capital city of Maharashtra?" }
```
→ `{ "is_success": true, "official_email": "...", "data": "Mumbai" }`

## Deployment

- **Vercel**: Import repo → Configure runtime → Deploy
- **Railway**: New Project → Deploy from GitHub
- **Render**: New Web Service → Select repo → Deploy

Set `GEMINI_API_KEY` and `OFFICIAL_EMAIL` in your deployment environment variables.
