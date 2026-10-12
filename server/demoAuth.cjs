'use strict';

function createDemoLoginHandler({ pool, signToken, demoEmail = 'admin@aimarket.com' }) {
  if (!pool || typeof pool.query !== 'function') throw new Error('A database pool is required');
  if (typeof signToken !== 'function') throw new Error('A token signer is required');

  return async function demoLogin(_req, res) {
    try {
      const result = await pool.query(
        'SELECT id, email, name FROM users WHERE email = $1 LIMIT 1',
        [demoEmail]
      );
      if (!result.rows.length) return res.status(404).json({ error: 'Demo account is not available' });
      const user = result.rows[0];
      const token = signToken(user);
      return res.json({ token, user });
    } catch (_) {
      return res.status(503).json({ error: 'Demo login is temporarily unavailable' });
    }
  };
}

module.exports = { createDemoLoginHandler };
