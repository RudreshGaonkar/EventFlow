const { validateTicket, getTicketPreview } = require('./queries');

const scanTicket = async (req, res) => {
  const { ticket_uuid } = req.body;

  // Check ticket exists and get details before validating
  const ticket = await getTicketPreview(ticket_uuid);

  if (!ticket) {
    return res.status(404).json({
      success: false,
      message: 'Ticket not found',
      result_code: 2
    });
  }

  // Call stored procedure to validate and mark as Checked-In
  const result = await validateTicket(ticket_uuid, req.user.userid);

  // result_code: 0 = approved, 1 = already used, 2 = not found, 3 = cancelled
  if (result.result_code === 0) {
    return res.status(200).json({
      success: true,
      message: 'Entry approved',
      result_code: 0,
      ticket: {
        attendee_name: ticket.attendee_name,
        event_title:   ticket.event_title,
        venue_name:    ticket.venue_name,
        show_date:     ticket.show_date,
        show_time:     ticket.show_time,
        tier_name:     ticket.tier_name,
        seat_label:    ticket.seat_label
      }
    });
  }

  if (result.result_code === 1) {
    return res.status(409).json({
      success: false,
      message: 'Ticket already used',
      result_code: 1,
      ticket: {
        attendee_name: ticket.attendee_name,
        event_title:   ticket.event_title,
        seat_label:    ticket.seat_label
      }
    });
  }

  if (result.result_code === 3) {
    return res.status(403).json({
      success: false,
      message: 'Ticket is cancelled',
      result_code: 3
    });
  }

  return res.status(400).json({
    success: false,
    message: result.result_msg || 'Validation failed',
    result_code: result.result_code
  });
};

module.exports = { scanTicket };
