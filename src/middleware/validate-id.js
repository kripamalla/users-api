
import { validate as isValidUUID } from 'uuid';
import { badRequest } from '../utils/http-error.js';

export function validateIdParam(req, res, next) {
  if (!isValidUUID(req.params.id)) {
    return next(badRequest('Invalid user ID'));
  }

  next();
}
