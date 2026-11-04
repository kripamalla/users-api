
 // ABAC (Attribute-Based Access Control): rules consider the actor,
 // resource, and action rather than relying on role alone.

export const policies = {
  // Admins can read anyone; customers can read themselves.
  'users:read': ({ actor, resource }) =>
    actor.role === 'admin' || actor.id === resource.id,

  // Admins can edit anyone; customers can edit themselves.
  'users:update': ({ actor, resource }) =>
    actor.role === 'admin' || actor.id === resource.id,

  // Admins can delete other users, but never themselves.
  'users:delete': ({ actor, resource }) =>
    actor.role === 'admin' && actor.id !== resource.id,
};

export function can(actor, action, resource) {
  const policy = policies[action];

  if (!policy) {
    throw new Error(`Unknown action "${action}"`);
  }

  return Boolean(actor) && policy({ actor, resource });
}
