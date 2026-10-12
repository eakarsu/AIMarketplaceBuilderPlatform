'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createDemoLoginHandler } = require('./demoAuth.cjs');

function responseFixture() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('demo login returns a token for the existing demo account', async () => {
  const queries = [];
  const user = { id: 7, email: 'admin@aimarket.com', name: 'Admin User' };
  const handler = createDemoLoginHandler({
    pool: { query: async (...args) => { queries.push(args); return { rows: [user] }; } },
    signToken: (account) => `fixture-token-for-${account.id}`,
  });
  const res = responseFixture();
  await handler({}, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { token: 'fixture-token-for-7', user });
  assert.deepEqual(queries[0][1], ['admin@aimarket.com']);
});

test('demo login does not create or substitute a missing account', async () => {
  const handler = createDemoLoginHandler({
    pool: { query: async () => ({ rows: [] }) },
    signToken: () => { throw new Error('must not sign'); },
  });
  const res = responseFixture();
  await handler({}, res);
  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: 'Demo account is not available' });
});
