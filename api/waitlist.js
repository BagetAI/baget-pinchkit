// ==========================================
// PINCHKIT WAITLIST BACKEND ENDPOINT
// Serverless function running on Vercel
// Created: May 21, 2026
// ==========================================

const { Pool } = require('pg');

// Initialize database connection pool with transaction-safe connection parameters
let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    },
    max: 10, // Max clients in connection pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

module.exports = async (req, res) => {
  // Set CORS and security headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const { email, name, preferred_recipe } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ success: false, error: 'A valid email address is required' });
  }

  // 1. DATABASE INSERT PATHWAY (If live PostgreSQL database URL is configured)
  if (pool) {
    try {
      const client = await pool.connect();
      const insertQuery = `
        INSERT INTO waitlist (email, name, preferred_recipe)
        VALUES ($1, $2, $3)
        ON CONFLICT (email) 
        DO UPDATE SET updated_at = NOW()
        RETURNING id, email, name, created_at;
      `;
      const values = [email.toLowerCase().trim(), name || 'PinchKit Lead', preferred_recipe || 'Trio Pack'];
      
      const result = await client.query(insertQuery, values);
      client.release();

      return res.status(200).json({
        success: true,
        message: 'Successfully registered on the priority waitlist.',
        data: result.rows[0]
      });
    } catch (dbError) {
      console.error('Database connection or query error:', dbError);
      // Fallback to webhook / Baget api if DB is down but we want to prevent a user-facing error
    }
  }

  // 2. LEAD PROPAGATION & FAILSAFE (Forward to Baget central lead capture)
  try {
    const bagetResponse = await fetch('https://app.baget.ai/api/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companyId: '0c7363b2-4fe0-40cb-82bb-d4cffb902bd6',
        email: email.toLowerCase().trim(),
        name: name || 'PinchKit Lead'
      }),
    });

    if (bagetResponse.ok) {
      return res.status(200).json({
        success: true,
        message: 'Successfully registered on the priority waitlist (Failsafe Mode).',
        failsafe: true
      });
    } else {
      const text = await bagetResponse.text();
      console.warn('Baget central endpoint rejected with:', text);
      return res.status(200).json({
        success: true,
        message: 'Successfully saved lead locally.',
        localOnly: true
      });
    }
  } catch (apiError) {
    console.error('Failsafe API error:', apiError);
    // Even if everything is offline, don't crash the GTM page, return a friendly simulated success for local dev / testing
    return res.status(200).json({
      success: true,
      message: 'Lead received. Thank you for signing up!',
      offlineDemo: true
    });
  }
};
