
/**
 * create-checkout-session.js  –  EXTREME VERBOSE MODE
 * Logs Stripe SDK version, Node version, incoming headers, and all key steps.
 */

const stripe    = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { v4 }    = require('uuid');
const STRIPE_VER = stripe.VERSION;   // built-in string like "14.27.0"

exports.handler = async (event) => {
  // ── Global diagnostic banner ─────────────────────────
  console.log('▶ create-checkout-session called');
  console.log('  Stripe-SDK version :', STRIPE_VER);
  console.log('  Node version       :', process.version);
  console.log('  Headers.origin     :', event.headers.origin);
  console.log('  HTTP method        :', event.httpMethod);

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' });
  }

  // ── 1. Generate the token ────────────────────────────
  const token = v4().replace(/-/g, '').slice(0, 12);
  console.log('  Generated access_token:', token);

  try {
    const origin  = event.headers.origin || 'https://chimindfitness.com';

    //price_1RapP7QxOOsucwCGq439s9AL
    //price_1Rb1nWBxfZUNbDtC0Bf7okO5
    // price for sandbox $10 pushup
    //  price_1Rap9oQxOOsucwCGTpNIsuqb
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      //line_items: [{ price: 'price_1Rap9oQxOOsucwCGTpNIsuqb', quantity: 1 }], // TODO: replace with real Price ID
      line_items: [{ price_data: { currency: 'usd', product_data: { name: 'Challenge Entry' }, unit_amount: 10 }, quantity: 1 }],
      //line_items: [{ price: 'price_1Rb1nWBxfZUNbDtC0Bf7okO5', quantity: 1 }], // TODO: replace with real Price ID
      metadata: { access_token: token },
      payment_intent_data: { metadata: { access_token: token } },
      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/cancel.html`
    });

    console.log('  Session created  →', session.id);

    return json(200, { url: session.url });
  } catch (err) {
    console.error('✖ Stripe error creating session:', err);
    return json(500, { error: 'Stripe error' });
  }
};

function json(status, obj) {
  console.log('  Returning', status, obj);
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj)
  };
}


/*
const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { v4 }  = require('uuid');

      // FREE line-item; replace with price: 'price_123' if needed.
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'Challenge Entry' },
          unit_amount: 10
        },
        quantity: 1
      }],
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' });
  }

  // 1 Generate 12-character token
  const token = v4().replace(/-/g, '').slice(0, 12);

  try {
    const origin = event.headers.origin || 'https://chimindfitness.com';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],

      line_items: [{ price: 'price_1Ram06BxfZUNbDtCbVbnzbI4', quantity: 1 }], // TODO: replace with real Price ID
      line_items: [{ price: 'price_1RabJOBxfZUNbDtCNDW517ic', quantity: 1 }], // TODO: replace with real Price ID

      // Store token on the Session itself
      metadata: { access_token: token },

      success_url: `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${origin}/cancel.html`
    });

    return json(200, { url: session.url });
  } catch (err) {
    console.error('Stripe create-session error ➜', err);
    return json(500, { error: 'Stripe error' });
  }
};

// ───────────────────────────────────────────────────────────────
function json(status, obj) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj)
  };
}


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

*/