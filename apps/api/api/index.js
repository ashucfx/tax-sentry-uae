// Vercel serverless entry — re-exports the compiled Express handler.
// Do not import directly from src/; always point to the compiled dist/.
// Build command runs `nest build` first which produces dist/main.vercel.js.
module.exports = require('../dist/main.vercel').default;
