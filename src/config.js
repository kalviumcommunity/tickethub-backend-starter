// GIVEN — do not modify. Test-only secrets (no real services are used).
module.exports = {
  ACCESS_SECRET: process.env.ACCESS_SECRET || 'tickethub-test-secret-change-me-32chars',
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || 'whsec_tickethub_test',
};
