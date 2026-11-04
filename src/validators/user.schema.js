
import {
  email,
  lowercase,
  optionalString,
  password,
  pastDate,
  phone,
  string,
} from './rules.js';

export const createUserSchema = {
  firstName: {
    required: true,
    check: string({ min: 1, max: 80 }),
    transform: (value) => value.trim(),
  },

  lastName: {
    required: true,
    check: string({ min: 1, max: 80 }),
    transform: (value) => value.trim(),
  },

  email: {
    required: true,
    check: email(),
    transform: lowercase,
  },

  password: {
    required: true,
    check: password(),
  },

  phone: {
    check: optionalString({ max: 30 }),
    transform: (value) =>
      value === undefined || value === null || value === ''
        ? null
        : value.trim(),
  },

  dateOfBirth: {
    check: (value) =>
      value === undefined || value === null || value === ''
        ? null
        : pastDate()(value),
    transform: (value) =>
      value === undefined || value === null || value === ''
        ? null
        : value,
  },

  address: {
    check: optionalString({ max: 200 }),
    transform: (value) =>
      value === undefined || value === null || value === ''
        ? null
        : value.trim(),
  },
};

export const updateUserSchema = {
  firstName: {
    check: string({ min: 1, max: 80 }),
    transform: (value) => value.trim(),
  },

  lastName: {
    check: string({ min: 1, max: 80 }),
    transform: (value) => value.trim(),
  },

  email: {
    check: email(),
    transform: lowercase,
  },

  phone: {
    check: optionalString({ max: 30 }),
    transform: (value) =>
      value === undefined || value === null || value === ''
        ? null
        : value.trim(),
  },

  dateOfBirth: {
    check: (value) =>
      value === undefined || value === null || value === ''
        ? null
        : pastDate()(value),
    transform: (value) =>
      value === undefined || value === null || value === ''
        ? null
        : value,
  },

  address: {
    check: optionalString({ max: 200 }),
    transform: (value) =>
      value === undefined || value === null || value === ''
        ? null
        : value.trim(),
  },
};
