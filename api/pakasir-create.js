const QRCode = require('qrcode');

const PAKASIR_PROJECT = process.env.PAKASIR_PROJECT || 'ym-place-payment-gateway';
const PAKASIR_API_KEY = process.env.PAKASIR_API_KEY || 'aPI66GCwn24ehkK0vJdMGkDqlgBhln7U';
const PAKASIR_BASE = 'https://app.pakasir.com/api';

function generateOrderId() {
  const chars = '0123456789';
  let id = 'YM';
  for (let i = 0; i < 10; i++) id += chars.charAt(Math.floor(Math.random() * chars.length));
  return id;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    let body = req.body;
    if (!body || typeof body !== 'object') {
      try { body = JSON.parse(body || '{}'); } catch (e) { body = {}; }
    }

    const amount = Number(body.amount);
    const orderId = (body.order_id && String(body.order_id).trim()) || generateOrderId();

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'amount tidak valid' });
    }

    const payload = {
      project: PAKASIR_PROJECT,
      order_id: orderId,
      amount: amount,
      api_key: PAKASIR_API_KEY
    };

    const pakasirRes = await fetch(`${PAKASIR_BASE}/transactioncreate/qris`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await pakasirRes.json();

    if (!pakasirRes.ok || !data || !data.payment || !data.payment.payment_number) {
      console.error('[PAKASIR CREATE ERROR]', data);
      return res.status(502).json({ error: 'Gagal membuat transaksi di Pakasir', detail: data });
    }

    const payment = data.payment;

    // Generate clean QR image from the raw EMV QRIS string — no Pakasir page,
    // no branding, just the pure QR code.
    const qrBuffer = await QRCode.toBuffer(payment.payment_number, {
      errorCorrectionLevel: 'M',
      width: 512,
      margin: 1
    });
    const qrDataUrl = `data:image/png;base64,${qrBuffer.toString('base64')}`;

    return res.status(200).json({
      order_id: payment.order_id,
      amount: payment.amount,
      fee: payment.fee,
      total_payment: payment.total_payment,
      expired_at: payment.expired_at,
      qr_image: qrDataUrl
    });
  } catch (err) {
    console.error('[PAKASIR CREATE EXCEPTION]', err);
    return res.status(500).json({ error: 'Internal error', detail: String(err) });
  }
};
