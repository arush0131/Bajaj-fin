require('dotenv').config();
const express = require('express');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3000;

// Replace with your Chitkara University email
const OFFICIAL_EMAIL = process.env.OFFICIAL_EMAIL || 'your.email@chitkara.edu.in';

// Initialize Gemini AI (optional - will gracefully handle if key not set)
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
  return arr.filter((n) => Number.isInteger(n) && n > 0 && isPrime(n));
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
  const nums = arr.filter((n) => Number.isInteger(n) && n > 0);
  if (nums.length === 0) return 0;
  let result = nums[0];
  for (let i = 1; i < nums.length; i++) {
    result = (result * nums[i]) / gcd(result, nums[i]);
  }
  return result;
}

function hcfOfArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  const nums = arr.filter((n) => Number.isInteger(n) && n > 0);
  if (nums.length === 0) return 0;
  let result = nums[0];
  for (let i = 1; i < nums.length; i++) {
    result = gcd(result, nums[i]);
  }
  return result;
}

async function getAIResponse(question) {
  if (!genAI || !question || typeof question !== 'string') return null;
  try {
    const response = await genAI.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `${question}\n\nRespond with only a single word answer. No explanation, no punctuation.`,
    });
    const text = response?.text?.trim();
    if (text) return text.split(/\s+/)[0];
    return null;
  } catch (err) {
    console.error('AI API error:', err.message);
    return null;
  }
}

// ==================== MIDDLEWARE ====================

app.use(express.json({ limit: '10kb' }));

// Basic security: reject non-JSON / invalid content-type for POST
app.use('/bfhl', (req, res, next) => {
  if (req.method === 'POST' && req.headers['content-type'] && !req.headers['content-type'].includes('application/json')) {
    return res.status(400).json({
      is_success: false,
      official_email: OFFICIAL_EMAIL,
      error: 'Content-Type must be application/json',
    });
  }
  next();
});

// ==================== ROUTES ====================

app.get('/health', (req, res) => {
  res.status(200).json({
    is_success: true,
    official_email: OFFICIAL_EMAIL,
  });
});

app.post('/bfhl', async (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({
        is_success: false,
        official_email: OFFICIAL_EMAIL,
        error: 'Invalid request body',
      });
    }

    const keys = Object.keys(body);
    const validKeys = ['fibonacci', 'prime', 'lcm', 'hcf', 'AI', 'ai'];

    const providedKey = keys.find((k) => validKeys.includes(k));
    if (!providedKey || keys.length > 1) {
      return res.status(400).json({
        is_success: false,
        official_email: OFFICIAL_EMAIL,
        error: 'Request must contain exactly one of: fibonacci, prime, lcm, hcf, AI',
      });
    }

    const key = providedKey.toLowerCase() === 'ai' ? 'AI' : providedKey;
    let data = null;

    switch (key) {
      case 'fibonacci': {
        const val = body[key];
        if (typeof val !== 'number' || !Number.isInteger(val) || val < 0 || val > 1000) {
          return res.status(400).json({
            is_success: false,
            official_email: OFFICIAL_EMAIL,
            error: 'fibonacci must be a non-negative integer (0-1000)',
          });
        }
        data = fibonacci(val);
        break;
      }

      case 'prime': {
        const arr = body[key];
        if (!Array.isArray(arr)) {
          return res.status(400).json({
            is_success: false,
            official_email: OFFICIAL_EMAIL,
            error: 'prime must be an array of integers',
          });
        }
        const nums = arr.filter((n) => Number.isInteger(n) && n >= 0);
        if (nums.length !== arr.length) {
          return res.status(400).json({
            is_success: false,
            official_email: OFFICIAL_EMAIL,
            error: 'prime array must contain only integers',
          });
        }
        if (arr.length > 100) {
          return res.status(400).json({
            is_success: false,
            official_email: OFFICIAL_EMAIL,
            error: 'prime array too large',
          });
        }
        data = filterPrimes(arr);
        break;
      }

      case 'lcm': {
        const arr = body[key];
        if (!Array.isArray(arr)) {
          return res.status(400).json({
            is_success: false,
            official_email: OFFICIAL_EMAIL,
            error: 'lcm must be an array of integers',
          });
        }
        const nums = arr.filter((n) => Number.isInteger(n) && n > 0);
        if (nums.length !== arr.length) {
          return res.status(400).json({
            is_success: false,
            official_email: OFFICIAL_EMAIL,
            error: 'lcm array must contain only positive integers',
          });
        }
        if (arr.length > 20) {
          return res.status(400).json({
            is_success: false,
            official_email: OFFICIAL_EMAIL,
            error: 'lcm array too large',
          });
        }
        data = lcmOfArray(arr);
        break;
      }

      case 'hcf': {
        const arr = body[key];
        if (!Array.isArray(arr)) {
          return res.status(400).json({
            is_success: false,
            official_email: OFFICIAL_EMAIL,
            error: 'hcf must be an array of integers',
          });
        }
        const nums = arr.filter((n) => Number.isInteger(n) && n > 0);
        if (nums.length !== arr.length) {
          return res.status(400).json({
            is_success: false,
            official_email: OFFICIAL_EMAIL,
            error: 'hcf array must contain only positive integers',
          });
        }
        if (arr.length > 20) {
          return res.status(400).json({
            is_success: false,
            official_email: OFFICIAL_EMAIL,
            error: 'hcf array too large',
          });
        }
        data = hcfOfArray(arr);
        break;
      }

      case 'AI': {
        const question = body[key] ?? body.ai;
        if (typeof question !== 'string' || question.trim().length === 0) {
          return res.status(400).json({
            is_success: false,
            official_email: OFFICIAL_EMAIL,
            error: 'AI must receive a non-empty string question',
          });
        }
        if (question.length > 500) {
          return res.status(400).json({
            is_success: false,
            official_email: OFFICIAL_EMAIL,
            error: 'Question too long',
          });
        }
        const answer = await getAIResponse(question.trim());
        if (answer === null) {
          return res.status(503).json({
            is_success: false,
            official_email: OFFICIAL_EMAIL,
            error: 'AI service unavailable. Set GEMINI_API_KEY environment variable.',
          });
        }
        data = answer;
        break;
      }

      default:
        return res.status(400).json({
          is_success: false,
          official_email: OFFICIAL_EMAIL,
          error: 'Invalid key',
        });
    }

    return res.status(200).json({
      is_success: true,
      official_email: OFFICIAL_EMAIL,
      data,
    });
  } catch (err) {
    console.error('POST /bfhl error:', err);
    res.status(500).json({
      is_success: false,
      official_email: OFFICIAL_EMAIL,
      error: 'Internal server error',
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    is_success: false,
    official_email: OFFICIAL_EMAIL,
    error: 'Not Found',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    is_success: false,
    official_email: OFFICIAL_EMAIL,
    error: 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (!process.env.GEMINI_API_KEY) {
    console.log('Warning: GEMINI_API_KEY not set. AI endpoint will return 503.');
  }
});
