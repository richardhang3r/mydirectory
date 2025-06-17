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
    // Log which Stripe account & mode this key is hitting
    const acct = await stripe.accounts.retrieve();
    console.log('Stripe account id:', acct.id);
    const query = `metadata['access_token']:'${token}'`;
    console.log('Search query:', query);
    console.log('Verifying token:', token);
    const search = await stripe.paymentIntents.search({
      query: `metadata['access_token']:'${token}' AND status:'succeeded'`,
    });

    console.log('Search returned', search.data.length, 'items');
    if (search.data.length === 0) {
      return { statusCode: 404, body: 'invalid' };
    }

    const pi = search.data[0];
    console.log('Matching PaymentIntent:', {id: pi.id, status: pi.status, redeemed: pi.metadata.redeemed});
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
