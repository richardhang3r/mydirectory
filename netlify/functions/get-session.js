
/**
 * get-session.js  –  EXTREME VERBOSE MODE
 * Retrieves Checkout Session, prints every field, flips redeemed flag.
 */

const stripePkg = require('stripe/package.json');
const stripe    = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  console.log('▶ get-session called');
  console.log('  Stripe-SDK version :', stripePkg.version);
  console.log('  Node version       :', process.version);
  console.log('  HTTP method        :', event.httpMethod);

  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' });
  }

  // ── Parse body safely ────────────────────────────────
  let sessionId = '';
  try {
    const body = JSON.parse(event.body || '{}');
    sessionId  = body.id || '';
    console.log('  Payload session_id :', sessionId);
  } catch (parseErr) {
    console.error('✖ JSON parse error:', parseErr);
  }

  if (!sessionId) {
    return json(400, { error: 'Missing session id' });
  }

  try {
    console.log('  Retrieving session', sessionId);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    console.log('  Session status     :', session.status);
    console.log('  Amount total       :', session.amount_total);
    console.log('  Metadata           :', session.metadata);

    // Double-spend guard
    if (session.metadata?.redeemed === 'true') {
      console.warn('  Token already redeemed');
      return json(409, { error: 'already-used' });
    }

    // Mark redeemed (requires Stripe-node ≥ 14.6.0)
    console.log('  Marking session as redeemed…');
    await stripe.checkout.sessions.update(session.id, {
      metadata: { ...session.metadata, redeemed: 'true' }
    });
    console.log('  Update completed');

    return json(200, { token: session.metadata?.access_token || '' });
  } catch (err) {
    console.error('✖ Stripe retrieve/update error:', err);
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
