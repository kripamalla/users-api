
import { can } from '../auth/policies.js';
import { forbidden } from '../utils/http-error.js';

// RBAC: allow only specified roles.
export const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.role)) {
    return next(forbidden(`Requires role: ${roles.join(' or ')}`));
  }

  next();
};

// ABAC: check the actor against the requested resource.
export const requirePermission =
  (action, getResource = (req) => ({ id: req.params.id })) =>
  (req, res, next) => {
    if (!can(req.user, action, getResource(req))) {
      return next(forbidden());
    }

    next();
  };
