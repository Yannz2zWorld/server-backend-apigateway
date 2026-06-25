const PAKASIR_PROJECT = process.env.PAKASIR_PROJECT || 'ym-place-payment-gateway';
const PAKASIR_API_KEY = process.env.PAKASIR_API_KEY || 'aPI66GCwn24ehkK0vJdMGkDqlgBhln7U';
const PAKASIR_BASE = 'https://app.pakasir.com/api';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { order_id, amount } = req.query;
    if (!order_id || !amount) {
      return res.status(400).json({ error: 'order_id dan amount wajib diisi' });
    }

    const url = `${PAKASIR_BASE}/transactiondetail?project=${encodeURIComponent(PAKASIR_PROJECT)}&amount=${encodeURIComponent(amount)}&order_id=${encodeURIComponent(order_id)}&api_key=${encodeURIComponent(PAKASIR_API_KEY)}`;
    const pakasirRes = await fetch(url);

    if (!pakasirRes.ok) {
      // Transaksi belum ada / belum dibayar — anggap masih pending, jangan error keras
      return res.status(200).json({ status: 'pending' });
    }

    const data = await pakasirRes.json();
    const status = (data && data.transaction && data.transaction.status) || 'pending';
    return res.status(200).json({ status });
  } catch (err) {
    console.error('[PAKASIR STATUS EXCEPTION]', err);
    return res.status(200).json({ status: 'pending' });
  }
};
