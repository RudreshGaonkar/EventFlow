const Razorpay = require('razorpay');

let instance = null;

const getRazorpay = () => {
  if (!instance) {
    instance = new Razorpay({
      key_id:     process.env.RAZORPAY_TEST_KEY,
      key_secret: process.env.RAZORPAY_SECRET_KEY,
    });
  }
  return instance;
};

module.exports = { getRazorpay };
