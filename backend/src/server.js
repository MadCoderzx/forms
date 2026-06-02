require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/db');

const port = process.env.PORT || 4000;
const maxRetries = parseInt(process.env.DB_RETRY_MAX, 10) || 10;
const retryDelayMs = parseInt(process.env.DB_RETRY_DELAY_MS, 10) || 3000;

async function waitForDatabase() {
  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    const connected = await testConnection();
    if (connected) {
      return;
    }

    console.log(`Waiting for database to become ready (${attempt}/${maxRetries})...`);
    await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
  }

  throw new Error('Unable to connect to the database after multiple retries.');
}

waitForDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Backend listening on port ${port}`);
    });
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
