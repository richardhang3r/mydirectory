const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { v4: uuidv4 } = require('uuid');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const token = uuidv4().replace(/-/g, '').slice(0, 12); // 12-char unique code

  try {
    const origin = event.headers.origin || 'https://chimindfitness.com';
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{ price: 'price_1Ram06BxfZUNbDtCbVbnzbI4', quantity: 1 }], // TODO: replace with real Price ID
      metadata: { access_token: token },
      payment_intent_data: { metadata: { access_token: token } },
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cancel.html`,
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url }),
    };
  } catch (err) {
    console.error('Stripe create session error:', err);
    return { statusCode: 500, body: 'Stripe error' };
  }
};
