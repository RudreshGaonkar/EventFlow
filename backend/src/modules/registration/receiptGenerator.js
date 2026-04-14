const PDFDocument = require('pdfkit');

/**
 * Generates a registration receipt PDF as a buffer — no file written to disk.
 * @param {object} reg - Registration object from getRegistrationById
 * @returns {Promise<Buffer>}
 */
const generateReceiptPDF = (reg) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A5', margin: 40 });
      const buffers = [];

      doc.on('data',  (chunk) => buffers.push(chunk));
      doc.on('end',   ()      => resolve(Buffer.concat(buffers)));
      doc.on('error', (err)   => reject(err));

      const drawLine = () =>
        doc
          .moveTo(40, doc.y)
          .lineTo(doc.page.width - 40, doc.y)
          .stroke()
          .moveDown(0.8);

      // ── Header ─────────────────────────────────────────────────────────────
      doc
        .fontSize(22)
        .font('Helvetica-Bold')
        .text('EventFlow', { align: 'center' });

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('grey')
        .text('Official Registration Receipt', { align: 'center' })
        .fillColor('black')
        .moveDown(0.8);

      drawLine();

      // ── Event ──────────────────────────────────────────────────────────────
      doc
        .fontSize(15)
        .font('Helvetica-Bold')
        .text(reg.event_title || reg.title || 'Event');

      doc.moveDown(0.3);

      if (reg.show_date) {
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`Date     : ${new Date(reg.show_date).toDateString()}`);
      }
      if (reg.show_time) {
        doc.text(`Time     : ${reg.show_time}`);
      }
      if (reg.venue_name) {
        doc.text(`Venue    : ${reg.venue_name}${reg.city_name ? ', ' + reg.city_name : ''}`);
      }

      doc.moveDown(0.8);
      drawLine();

      // ── Participant ────────────────────────────────────────────────────────
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Participant Details')
        .moveDown(0.3);

      doc.fontSize(10).font('Helvetica');
      doc.text(`Type     : ${reg.participant_type || '—'}`);
      if (reg.college_name) doc.text(`College  : ${reg.college_name}`);
      if (reg.team_name)    doc.text(`Team     : ${reg.team_name}`);
      if (reg.team_size)    doc.text(`Size     : ${reg.team_size} members`);

      doc.moveDown(0.8);
      drawLine();

      // ── Payment ────────────────────────────────────────────────────────────
      doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Payment Summary')
        .moveDown(0.3);

      doc.fontSize(10).font('Helvetica');
      const amount = Number(reg.amount_paid);
      doc.text(`Amount Paid : Rs. ${amount > 0 ? amount.toFixed(2) : '0.00 (Free)'}`);
      doc.text(`Status      : ${reg.status || 'Confirmed'}`);

      doc.moveDown(0.8);
      drawLine();

      // ── Registration ID ────────────────────────────────────────────────────
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Registration ID', { continued: true })
        .font('Helvetica')
        .text(` : #${reg.registration_id}`);

      if (reg.registered_at) {
        doc.text(
          `Registered At : ${new Date(reg.registered_at).toLocaleString('en-IN')}`
        );
      }

      doc.moveDown(1);
      drawLine();

      // ── Footer ─────────────────────────────────────────────────────────────
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('grey')
        .text(
          'This is an auto-generated receipt. Please carry a printed or digital copy to the event.',
          { align: 'center' }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateReceiptPDF };
