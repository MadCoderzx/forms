function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isBoolean(value) {
  return typeof value === 'boolean';
}

function isInteger(value) {
  return Number.isInteger(value);
}

function isValidPosition(value) {
  return isInteger(value) && value >= 0;
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function isValidOptions(options) {
  return (
    Array.isArray(options) &&
    options.length > 0 &&
    options.every(
      (option) => option && typeof option === 'object' && isNonEmptyString(option.label)
    )
  );
}

module.exports = {
  isNonEmptyString,
  isValidEmail,
  isBoolean,
  isInteger,
  isValidPosition,
  normalizeString,
  isValidOptions,
};
