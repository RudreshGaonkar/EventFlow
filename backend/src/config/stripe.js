const Stripe = require('stripe');

let _stripe = null;

const initStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
  }
  _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
  });
  console.log('[Stripe] Initialized');
};

const getStripe = () => {
  if (!_stripe) {
    throw new Error('Stripe not initialized — call initStripe() first');
  }
  return _stripe;
};

module.exports = { initStripe, getStripe };