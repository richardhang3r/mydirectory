const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  // ── 1. Guard HTTP verb ────────────────────────────────
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' });
  }

  // ── 2. Parse body ─────────────────────────────────────
  let sessionId = '';
  try {
    const body = JSON.parse(event.body || '{}');
    sessionId = body.id || '';
  } catch (_) { /* fall through with empty id */ }

  if (!sessionId) {
    return json(400, { error: 'Missing session id' });
  }

  // ── 3. Retrieve & mark redeemed ───────────────────────
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // block double-spend
    if (session.metadata?.redeemed === 'true') {
      return json(409, { error: 'already-used' });
    }

    // flip the switch
    await stripe.checkout.sessions.update(session.id, {
      metadata: { ...session.metadata, redeemed: 'true' }
    });

    return json(200, { token: session.metadata?.access_token || '' });
  } catch (err) {
    console.error(err);
    return json(500, { error: 'Stripe error' });
  }
};

// tiny helper so every exit is JSON
function json(code, obj) {
  return {
    statusCode: code,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj)
  };
}

/*
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { session_id } = JSON.parse(event.body || '{}');
  if (!session_id) return { statusCode: 400, body: 'Missing session_id' };

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // ➊ Basic authenticity: make sure Stripe says the checkout finished.
    if (session.amount_total > 0 && session.payment_status !== 'paid') {
      return { statusCode: 402, body: 'payment-incomplete' };
    }

    // ➋ Extract and consume the token
    const token = session.metadata?.access_token;
    if (!token) return { statusCode: 404, body: 'no-token' };

    if (session.metadata.redeemed === 'true') {
      return { statusCode: 409, body: 'already-used' };
    }

    await stripe.checkout.sessions.update(session.id, {
      metadata: { ...session.metadata, redeemed: 'true' }
    });

    return { statusCode: 200, body: 'ok' };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: 'Stripe error' };
  }
};
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



    (async () => {
      const params = new URLSearchParams(window.location.search);
      const sessionId = params.get('session_id');
      if (!sessionId) { document.getElementById('token').textContent = 'missing'; return; }
      const res = await fetch('/.netlify/functions/get-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sessionId })
      });
      const data = await res.json();
      document.getElementById('token').textContent = data.token || 'error';
    })();
  </script>
*/
