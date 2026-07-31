// Secure LiveKit token generator.
// The LiveKit API secret NEVER goes to the browser — it stays here as an
// environment variable on Netlify's server and is only used to sign tokens.

const { AccessToken } = require('livekit-server-sdk');

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const params = event.queryStringParameters || {};
    const room = (params.room || '').trim();
    const identity = (params.identity || '').trim();
    const role = params.role === 'host' ? 'host' : 'viewer';
    const adminSecret = params.adminSecret || '';

    if (!room || !identity) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'room and identity are required' }),
      };
    }

    // Only someone who knows ADMIN_STREAM_SECRET can get a "host" token
    // (i.e. permission to publish/broadcast camera+mic into the room).
    // Everyone else can only get a "viewer" token (watch only).
    if (role === 'host') {
      if (!process.env.ADMIN_STREAM_SECRET || adminSecret !== process.env.ADMIN_STREAM_SECRET) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Not authorized to broadcast' }),
        };
      }
    }

    if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET || !process.env.LIVEKIT_URL) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'Server is missing LiveKit environment variables' }),
      };
    }

    const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
      identity,
      ttl: '6h',
    });

    at.addGrant({
      room,
      roomJoin: true,
      canPublish: role === 'host',
      canPublishData: role === 'host',
      canSubscribe: true,
    });

    const token = await at.toJwt();

    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, url: process.env.LIVEKIT_URL }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message || 'Unknown error' }),
    };
  }
};
