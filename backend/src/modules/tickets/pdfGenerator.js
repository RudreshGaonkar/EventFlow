const PDFDocument = require('pdfkit');

// Generates a ticket PDF as a buffer — no file written to disk
const generateTicketPDF = (ticket) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A5', margin: 40 });
      const buffers = [];

      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Header
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('EventFlow', { align: 'center' });

      doc
        .fontSize(10)
        .font('Helvetica')
        .text('Your official event ticket', { align: 'center' });

      doc.moveDown(1);

      // Divider
      doc
        .moveTo(40, doc.y)
        .lineTo(doc.page.width - 40, doc.y)
        .stroke();

      doc.moveDown(1);

      // Event details
      doc.fontSize(16).font('Helvetica-Bold').text(ticket.event_title);
      doc.moveDown(0.3);

      doc.fontSize(11).font('Helvetica');
      doc.text('Venue    : ' + ticket.venue_name);
      doc.text('City     : ' + ticket.city_name);
      doc.text('Date     : ' + new Date(ticket.show_date).toDateString());
      doc.text('Time     : ' + ticket.show_time);

      doc.moveDown(0.5);

      doc.fontSize(11).font('Helvetica-Bold').text('Seat Details');
      doc.font('Helvetica');
      doc.text('Seat     : ' + ticket.seat_label);
      doc.text('Tier     : ' + ticket.tier_name);
      doc.text('Price    : Rs. ' + ticket.price_paid);

      doc.moveDown(0.5);

      doc.fontSize(11).font('Helvetica-Bold').text('Ticket Info');
      doc.font('Helvetica');
      doc.text('Ticket ID: ' + ticket.ticket_id);
      doc.text('UUID     : ' + ticket.ticket_uuid);

      doc.moveDown(1);

      // Footer divider
      doc
        .moveTo(40, doc.y)
        .lineTo(doc.page.width - 40, doc.y)
        .stroke();

      doc.moveDown(0.5);

      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('grey')
        .text('This is an auto-generated ticket. Please carry a printed or digital copy.', {
          align: 'center'
        });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = { generateTicketPDF };
