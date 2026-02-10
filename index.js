require('dotenv').config();
const express = require('express');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3000;

// Replace with your Chitkara University email
const OFFICIAL_EMAIL =
  process.env.OFFICIAL_EMAIL || 'your.email@chitkara.edu.in';

// ==================== GEMINI INIT ====================

// Initialize Gemini AI (optional)
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

// ==================== HELPER FUNCTIONS ====================

function fibonacci(n) {
  if (n <= 0) return [];
  if (n === 1) return [0];
  const series = [0, 1];
  for (let i = 2; i < n; i++) {
    series.push(series[i - 1] + series[i - 2]);
  }
  return series;
}

function isPrime(num) {
  if (num < 2) return false;
  if (num === 2) return true;
  if (num % 2 === 0) return false;
  for (let i = 3; i * i <= num; i += 2) {
    if (num % i === 0) return false;
  }
  return true;
}

function filterPrimes(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.filter(
    (n) => Number.isInteger(n) && n > 0 && isPrime(n)
  );
}

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b !== 0) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function lcmOfArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  let result = arr[0];
  for (let i = 1; i < arr.length; i++) {
    result = (result * arr[i]) / gcd(result, arr[i]);
  }
  return result;
}

function hcfOfArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  let result = arr[0];
  for (let i = 1; i < arr.length; i++) {
    result = gcd(result, arr[i]);
  }
  return result;
}

async function getAIResponse(question) {
  if (!genAI || !question || typeof question !== 'string') return null;
  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `${question}
Respond with only ONE WORD. No punctuation.`
    });
    const text = response?.text?.trim();
    return text ? text.split(/\s+/)[0] : null;
  } catch (err) {
    console.error('AI error:', err.message);
    return null;
  }
}

// ==================== MIDDLEWARE ====================

app.use(express.json({ limit: '10kb' }));

app.use('/bfhl', (req, res, next) => {
  if (
    req.method === 'POST' &&
    req.headers['content-type'] &&
    !req.headers['content-type'].includes('application/json')
  ) {
    return res.status(400).json({
      is_success: false,
      official_email: OFFICIAL_EMAIL,
      error: 'Content-Type must be application/json'
    });
  }
  next();
});

// ==================== ROUTES ====================

// Root
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'BFHL API is running',
    official_email: OFFICIAL_EMAIL
  });
});

// Health
app.get('/health', (req, res) => {
  res.status(200).json({
    is_success: true,
    official_email: OFFICIAL_EMAIL
  });
});

// GET /bfhl (IMPORTANT)
app.get('/bfhl', (req, res) => {
  res.status(200).json({
    is_success: true,
    official_email: OFFICIAL_EMAIL
  });
});

// POST /bfhl
app.post('/bfhl', async (req, res) => {
  try {
    const body = req.body;
    const keys = Object.keys(body || {});
    const validKeys = ['fibonacci', 'prime', 'lcm', 'hcf', 'AI', 'ai'];

    const providedKey = keys.find((k) => validKeys.includes(k));
    if (!providedKey || keys.length !== 1) {
      return res.status(400).json({
        is_success: false,
        official_email: OFFICIAL_EMAIL,
        error:
          'Request must contain exactly one of: fibonacci, prime, lcm, hcf, AI'
      });
    }

    const key = providedKey.toLowerCase() === 'ai' ? 'AI' : providedKey;
    let data;

    switch (key) {
      case 'fibonacci':
        if (!Number.isInteger(body[key]) || body[key] < 0 || body[key] > 1000)
          throw new Error('Invalid fibonacci input');
        data = fibonacci(body[key]);
        break;

      case 'prime':
        if (!Array.isArray(body[key]))
          throw new Error('Prime must be array');
        data = filterPrimes(body[key]);
        break;

      case 'lcm':
        data = lcmOfArray(body[key]);
        break;

      case 'hcf':
        data = hcfOfArray(body[key]);
        break;

      case 'AI':
        const answer = await getAIResponse(body[key]);
        if (!answer)
          return res.status(503).json({
            is_success: false,
            official_email: OFFICIAL_EMAIL,
            error: 'AI service unavailable'
          });
        data = answer;
        break;
    }

    res.status(200).json({
      is_success: true,
      official_email: OFFICIAL_EMAIL,
      data
    });
  } catch (err) {
    res.status(400).json({
      is_success: false,
      official_email: OFFICIAL_EMAIL,
      error: err.message
    });
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({
    is_success: false,
    official_email: OFFICIAL_EMAIL,
    error: 'Not Found'
  });
});

// ==================== START ====================

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (!process.env.GEMINI_API_KEY) {
    console.log(
      'Warning: GEMINI_API_KEY not set. AI endpoint will return 503.'
    );
  }
});
