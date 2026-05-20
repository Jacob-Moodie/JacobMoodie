import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      ".vscode/**",
      // Ignore the nested copy of this project that lives inside this directory.
      "Portfolio Project Sub/**"
    ]
  },

  js.configs.recommended,

  {
    // Service worker runs in its own global scope (ServiceWorkerGlobalScope), not a browser window.
    // It uses script (not module) syntax and has globals like self, caches, and clients.
    files: ["sw.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "script",
      globals: {
        ...globals.serviceworker
      }
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-var": "error",
      "no-console": "off",
      "no-debugger": "warn",
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      semi: ["error", "always"],
      quotes: ["error", "double", { avoidEscape: true }],
      "comma-dangle": ["error", "never"],
      "arrow-parens": ["error", "always"],
      "prefer-const": "error"
    }
  },

  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",

      globals: {
        ...globals.browser,  
        ...globals.es2024
      }
    },

    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-var": "error",
      "no-console": "off",
      "no-debugger": "warn",
      "no-duplicate-imports": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "dot-notation": "error",
      "no-implied-eval": "error",
      "no-return-await": "error",
      semi: ["error", "always"],
      quotes: ["error", "double", { avoidEscape: true }],
      "comma-dangle": ["error", "never"],
      "arrow-parens": ["error", "always"],
      "object-shorthand": ["error", "always"],
      "no-alert": "warn"
    }
  }
];