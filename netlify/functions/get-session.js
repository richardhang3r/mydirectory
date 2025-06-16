const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { id } = JSON.parse(event.body || '{}');
  if (!id) {
    return { statusCode: 400, body: 'Missing session id' };
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(id);
    const token = session.metadata?.access_token || '';
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Stripe error' };
  }
};
