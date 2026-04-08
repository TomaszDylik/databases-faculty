class BadRequestError extends Error {
  constructor(message) { super(message); this.name = 'BadRequestError'; }
}
class NotFoundError extends Error {
  constructor(message) { super(message); this.name = 'NotFoundError'; }
}
class ConflictError extends Error {
  constructor(message) { super(message); this.name = 'ConflictError'; }
}
class ForbiddenError extends Error {
  constructor(message) { super(message); this.name = 'ForbiddenError'; }
}
class ValidationError extends Error {
  constructor(message) { super(message); this.name = 'ValidationError'; }
}

module.exports = { BadRequestError, NotFoundError, ConflictError, ForbiddenError, ValidationError };
