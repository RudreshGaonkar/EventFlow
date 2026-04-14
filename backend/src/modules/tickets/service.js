const { uploadFile, uploadPDFBuffer } = require('../../config/cloudinary');
const { getTicketsByBooking, getTicketById, updateTicketPDF } = require('./queries');
const { generateTicketPDF } = require('./pdfGenerator');

// Generate and upload PDFs for all tickets in a booking
// Called by booking consumer after confirm_booking SP succeeds
const generateAndUploadTickets = async (booking_id) => {
  try {
    const tickets = await getTicketsByBooking(booking_id);

    if (!tickets || tickets.length === 0) {
      throw new Error('No tickets found for booking ' + booking_id);
    }

    for (const ticket of tickets) {
      // Generate PDF buffer for this ticket
      const pdfBuffer = await generateTicketPDF(ticket);

      // Stream directly to Cloudinary as a raw PDF — no base64 conversion
      const uploaded = await uploadPDFBuffer(pdfBuffer, 'tickets');

      // Store PDF url and public_id on the ticket row
      await updateTicketPDF(ticket.ticket_id, uploaded.secure_url, uploaded.public_id);
    }

    console.log('[Tickets] Generated ' + tickets.length + ' tickets for booking ' + booking_id);
    return tickets.length;
  } catch (err) {
    throw new Error('Ticket generation failed: ' + err.message);
  }
};

// HTTP handler — attendee downloads their ticket
const getMyTickets = async (req, res) => {
  try {
    const { booking_id } = req.params;

    // Get full ticket detail to check ownership
    const tickets = await getTicketsByBooking(booking_id);

    if (!tickets || tickets.length === 0) {
      return res.status(404).json({ success: false, message: 'No tickets found for this booking' });
    }

    // Ownership check using first ticket's booking user_id
    const ticket = await getTicketById(tickets[0].ticket_id);
    if (ticket.user_id !== req.user.user_id) {
      return res.status(403).json({ success: false, message: 'Not your booking' });
    }

    return res.status(200).json({ success: true, data: tickets });
  } catch (err) {
    console.error('[Tickets] getMyTickets error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch tickets' });
  }
};

// HTTP handler — attendee gets single ticket detail
const getTicketDetail = async (req, res) => {
  try {
    const { ticket_id } = req.params;

    const ticket = await getTicketById(ticket_id);

    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found' });
    }

    if (ticket.user_id !== req.user.user_id) {
      return res.status(403).json({ success: false, message: 'Not your ticket' });
    }

    return res.status(200).json({ success: true, data: ticket });
  } catch (err) {
    console.error('[Tickets] getTicketDetail error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch ticket' });
  }
};

module.exports = {
  generateAndUploadTickets,
  getMyTickets,
  getTicketDetail
};
