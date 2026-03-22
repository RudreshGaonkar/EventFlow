const Razorpay = require('razorpay');

let instance = null;

const createInstance = () => {
  try {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing in .env');
    }

    instance = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    console.log('[Razorpay] Instance created');
    return instance;
  } catch (err) {
    console.error('[Razorpay] Failed to create instance:', err.message);
    process.exit(1);
  }
};

const getRazorpay = () => {
  if (!instance) {
    return createInstance();
  }
  return instance;
};

module.exports = { getRazorpay };
