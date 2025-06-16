const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { token } = JSON.parse(event.body || '{}');
  if (!token) {
    return { statusCode: 400, body: 'Missing token' };
  }

  try {
    const search = await stripe.paymentIntents.search({
      query: `metadata['access_token']:'${token}' AND status:'succeeded'`,
    });

    if (search.data.length === 0) {
      return { statusCode: 404, body: 'invalid' };
    }

    const pi = search.data[0];
    if (pi.metadata.redeemed === 'true') {
      return { statusCode: 409, body: 'already-used' };
    }

    await stripe.paymentIntents.update(pi.id, {
      metadata: { redeemed: 'true' },
    });

    return { statusCode: 200, body: 'ok' };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Stripe error' };
  }
};
