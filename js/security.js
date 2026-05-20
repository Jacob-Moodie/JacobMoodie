// ./js/security.js

// Limits how often each form can be submitted.
export const MAX_SUBMISSIONS = 3;
export const RATE_LIMIT_WINDOW_MS = 60000;

// Keys used to save token data in sessionStorage.
export const ACTIVE_TOKEN_KEY = "activeCSRFToken";
export const USED_TOKENS_KEY = "usedCSRFTokens";

// Cleans text input to reduce unsafe characters.
export const sanitizeInput = function (value) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .trim();
};

// Cleans each item in a list and drops blank values.
export const sanitizeArray = function (values) {
  return values.map((value) => sanitizeInput(value)).filter(Boolean);
};

// Throws an error if a required field is empty.
export const validateRequired = function (value, fieldName) {
  if (!value || !value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }
};

// Checks email format after cleaning the value.
export const validateEmail = function (email) {
  const cleanEmail = sanitizeInput(email);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (!emailRegex.test(cleanEmail)) {
    throw new Error("Please enter a valid email address.");
  }

  return cleanEmail;
};

// Checks that links are valid HTTP/HTTPS URLs.
export const validateUrl = function (url) {
  if (!url || !url.trim()) {
    return "";
  }

  const cleanUrl = sanitizeInput(url);

  try {
    const parsedUrl = new URL(cleanUrl);

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      throw new Error("Invalid URL protocol.");
    }

    return parsedUrl.href;
  } catch (error) {
    throw new Error("Please enter a valid project URL.", { cause: error });
  }
};

// One place to log and show user-facing errors.
export const handleError = function (message, error = null) {
  console.error(message, error);
  alert(message);
};

// Creates a random token for form submission checks.
export const generateCSRFToken = function () {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
};

// Gets tokens that were already used.
export const getUsedTokens = function () {
  const stored = sessionStorage.getItem(USED_TOKENS_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Saves a token after a successful submit.
export const saveUsedToken = function (token) {
  const usedTokens = getUsedTokens();
  usedTokens.push(token);
  sessionStorage.setItem(USED_TOKENS_KEY, JSON.stringify(usedTokens));
};

// Creates a new token and places it into hidden csrfToken inputs.
export const issueNewCSRFToken = function () {
  const token = generateCSRFToken();
  sessionStorage.setItem(ACTIVE_TOKEN_KEY, token);

  document.querySelectorAll('input[name="csrfToken"]').forEach((field) => {
    field.value = token;
  });

  return token;
};

// Makes sure the token exists, matches, and was not reused.
export const validateCSRFToken = function (submittedToken) {
  const activeToken = sessionStorage.getItem(ACTIVE_TOKEN_KEY);
  const usedTokens = getUsedTokens();

  if (!submittedToken) {
    throw new Error("Missing CSRF token.");
  }

  if (!activeToken) {
    throw new Error("No active CSRF token found in session.");
  }

  if (submittedToken !== activeToken) {
    throw new Error("Invalid CSRF token.");
  }

  if (usedTokens.includes(submittedToken)) {
    throw new Error("This CSRF token has already been used.");
  }

  return true;
};

// Applies per-form rate limiting in a rolling time window.
export const canSubmit = function (formKey) {
  const now = Date.now();
  const storedTimes = sessionStorage.getItem(`rateLimit_${formKey}`);
  const submissionHistory = storedTimes ? JSON.parse(storedTimes) : [];

  const recentSubmissions = submissionHistory.filter(
    (time) => now - time < RATE_LIMIT_WINDOW_MS
  );

  if (recentSubmissions.length >= MAX_SUBMISSIONS) {
    return false;
  }

  recentSubmissions.push(now);
  sessionStorage.setItem(`rateLimit_${formKey}`, JSON.stringify(recentSubmissions));

  return true;
};