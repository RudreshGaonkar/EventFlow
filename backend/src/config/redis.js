const Redis = require('ioredis');

let client = null;

const createClient = () => {
  try {
    client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest:    3,
      enableReadyCheck:        true,
      reconnectOnError:        (err) => {
        console.error('[Redis] Connection error — retrying:', err.message);
        return true;
      },
    });

    client.on('connect', () => {
      console.log('[Redis] Client connected');
    });

    client.on('ready', () => {
      console.log('[Redis] Client ready');
    });

    client.on('error', (err) => {
      console.error('[Redis] Client error:', err.message);
    });

    client.on('close', () => {
      console.warn('[Redis] Connection closed');
    });

    return client;
  } catch (err) {
    console.error('[Redis] Failed to create client:', err.message);
    process.exit(1);
  }
};

const getClient = () => {
  if (!client) {
    return createClient();
  }
  return client;
};

const disconnectClient = async () => {
  try {
    if (client) {
      await client.quit();
      client = null;
      console.log('[Redis] Client disconnected gracefully');
    }
  } catch (err) {
    console.error('[Redis] Failed to disconnect:', err.message);
  }
};

module.exports = { getClient, disconnectClient };
