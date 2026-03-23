const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  try {
    transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: parseInt(process.env.MAIL_PORT) || 587,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    });

    console.log('[Notify] Mail transporter created');
    return transporter;
  } catch (err) {
    console.error('[Notify] Failed to create transporter:', err.message);
    throw new Error('Mail transporter failed: ' + err.message);
  }
};

module.exports = { getTransporter };
