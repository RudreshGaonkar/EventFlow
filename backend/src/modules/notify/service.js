const { getTransporter } = require('./adapter');
const { bookingConfirmedTemplate, bookingCancelledTemplate } = require('./templates');

const sendBookingConfirmed = async (toEmail, data, pdfBuffers) => {
  try {
    const transporter = getTransporter();
    const { subject, html } = bookingConfirmedTemplate(data);

    // Build attachments array — one PDF per ticket
    const attachments = pdfBuffers.map((buf, i) => ({
      filename: 'ticket-' + (i + 1) + '.pdf',
      content: buf,
      contentType: 'application/pdf'
    }));

    await transporter.sendMail({
      from: process.env.MAIL_FROM || 'EventFlow <noreply@eventflow.com>',
      to: toEmail,
      subject,
      html,
      attachments
    });

    console.log('[Notify] Booking confirmed email sent to ' + toEmail);
  } catch (err) {
    // Email failure must never crash the booking flow
    console.error('[Notify] sendBookingConfirmed error:', err.message);
  }
};

const sendBookingCancelled = async (toEmail, data) => {
  try {
    const transporter = getTransporter();
    const { subject, html } = bookingCancelledTemplate(data);

    await transporter.sendMail({
      from: process.env.MAIL_FROM || 'EventFlow <noreply@eventflow.com>',
      to: toEmail,
      subject,
      html
    });

    console.log('[Notify] Booking cancelled email sent to ' + toEmail);
  } catch (err) {
    console.error('[Notify] sendBookingCancelled error:', err.message);
  }
};

module.exports = { sendBookingConfirmed, sendBookingCancelled };
