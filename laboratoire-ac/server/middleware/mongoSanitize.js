'use strict';

const TEST_REGEX = /^\$|\./;
const TEST_REGEX_WITHOUT_DOT = /^\$/;
const REPLACE_REGEX = /^\$|\./g;

function isPlainObject(obj) {
  return typeof obj === 'object' && obj !== null && !Array.isArray(obj);
}

function getTestRegex(allowDots) {
  return allowDots ? TEST_REGEX_WITHOUT_DOT : TEST_REGEX;
}

function withEach(target, cb) {
  (function act(obj) {
    if (Array.isArray(obj)) {
      obj.forEach(act);
    } else if (isPlainObject(obj)) {
      Object.keys(obj).forEach(function (key) {
        const val = obj[key];
        const resp = cb(obj, val, key);
        if (resp.shouldRecurse) {
          act(obj[resp.key || key]);
        }
      });
    }
  })(target);
}

function _sanitize(target, options) {
  const regex = getTestRegex(options.allowDots);
  let isSanitized = false;
  let replaceWith = null;
  const dryRun = Boolean(options.dryRun);

  if (!regex.test(options.replaceWith) && options.replaceWith !== '.') {
    replaceWith = options.replaceWith;
  }

  withEach(target, function (obj, val, key) {
    let shouldRecurse = true;

    if (regex.test(key)) {
      isSanitized = true;
      if (dryRun) {
        return { shouldRecurse, key };
      }
      delete obj[key];
      if (replaceWith) {
        const newKey = key.replace(REPLACE_REGEX, replaceWith);
        if (newKey !== '__proto__' && newKey !== 'constructor' && newKey !== 'prototype') {
          obj[newKey] = val;
        }
      } else {
        shouldRecurse = false;
      }
    }

    return { shouldRecurse, key };
  });

  return { isSanitized, target };
}

function sanitize(target, options = {}) {
  return _sanitize(target, options).target;
}

/**
 * Custom mongo-sanitize middleware that modifies req properties in-place
 * instead of replacing them (avoids read-only property issues in Express 5).
 */
function middleware(options = {}) {
  const hasOnSanitize = typeof options.onSanitize === 'function';
  return function (req, res, next) {
    ['body', 'params', 'headers', 'query'].forEach(function (key) {
      if (req[key] && typeof req[key] === 'object' && req[key] !== null) {
        const { isSanitized } = _sanitize(req[key], options);
        if (isSanitized && hasOnSanitize) {
          options.onSanitize({ req, key });
        }
      }
    });
    next();
  };
}

module.exports = middleware;
module.exports.sanitize = sanitize;
