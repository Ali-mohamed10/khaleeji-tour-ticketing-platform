const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { extractBearerToken, verifyCronSecret } = require('../middleware/auth');

function createMockRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

describe('extractBearerToken', () => {
  it('extracts token from valid Authorization header', () => {
    const req = { headers: { authorization: 'Bearer abc.def.ghi' } };
    assert.equal(extractBearerToken(req), 'abc.def.ghi');
  });

  it('returns null when Authorization header is missing or non-Bearer', () => {
    assert.equal(extractBearerToken({ headers: {} }), null);
    assert.equal(extractBearerToken({ headers: { authorization: 'Basic xyz' } }), null);
  });
});

describe('verifyCronSecret', () => {
  it('allows request when CRON_SECRET is not configured', () => {
    const prev = process.env.CRON_SECRET;
    delete process.env.CRON_SECRET;
    try {
      const res = createMockRes();
      const allowed = verifyCronSecret({ headers: {} }, res);
      assert.equal(allowed, true);
    } finally {
      if (prev !== undefined) process.env.CRON_SECRET = prev;
    }
  });

  it('rejects request with 401 when CRON_SECRET mismatches and allows when it matches', () => {
    const prev = process.env.CRON_SECRET;
    process.env.CRON_SECRET = 'test-cron-secret-123';
    try {
      const badRes = createMockRes();
      const badAllowed = verifyCronSecret({ headers: { authorization: 'Bearer wrong' } }, badRes);
      assert.equal(badAllowed, false);
      assert.equal(badRes.statusCode, 401);

      const okRes = createMockRes();
      const okAllowed = verifyCronSecret(
        { headers: { authorization: 'Bearer test-cron-secret-123' } },
        okRes
      );
      assert.equal(okAllowed, true);
    } finally {
      if (prev !== undefined) {
        process.env.CRON_SECRET = prev;
      } else {
        delete process.env.CRON_SECRET;
      }
    }
  });
});
