// TASK 1a — Role gate (part of Task 1, 5 marks)
//
// requireRole('admin')            -> only admins pass
// requireRole('admin', 'staff')   -> admins and staff pass
//
// Return a middleware (req, res, next) that:
//   1. if req.user is missing           -> 401  { error: { code: 'UNAUTHENTICATED', message: '...' } }
//   2. if req.user.role not in allowed  -> 403  { error: { code: 'FORBIDDEN',       message: '...' } }
//   3. otherwise                        -> next()
//
// Read the role ONLY from req.user.role (never from req.body or the query string).

function requireRole(...allowedRoles) {
  // TODO: replace this pass-through with the real check
  return (req, res, next) => next();
}

module.exports = requireRole;
