const { validateTicket, getTicketPreview } = require('./queries');

// POST /api/scanner/validate
// Body: { ticket_uuid, session_id }
// - session_id is REQUIRED for strict session enforcement.
//   A 5 PM ticket cannot enter an 8 PM session even at the same venue.
const scanTicket = async (req, res) => {
  try {
    const { ticket_uuid, session_id } = req.body;

    // ── Step 1: Fetch ticket metadata ──────────────────────────────────────
    const ticket = await getTicketPreview(ticket_uuid);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        result_code: 2,
        message: 'Ticket not found — invalid UUID',
      });
    }

    // ── Step 2: STRICT session enforcement ─────────────────────────────────
    // The ticket's session must exactly match the session staff selected.
    if (session_id && Number(ticket.session_id) !== Number(session_id)) {
      return res.status(403).json({
        success: false,
        result_code: 6,
        message: `Wrong session — this ticket is for a different show`,
        ticket: {
          attendee_name: ticket.attendee_name,
          event_title:   ticket.event_title,
          show_date:     ticket.show_date,
          show_time:     ticket.show_time,
        },
      });
    }

    // ── Step 3: Call stored procedure (handles Already-Used / Cancelled) ───
    const result = await validateTicket(ticket_uuid, req.user.user_id);

    // result_code: 0 = approved, 1 = already checked-in, 2 = not found,
    //              3 = cancelled, 4 = tx error, 5 = wrong venue
    if (result.result_code === 0) {
      return res.status(200).json({
        success: true,
        result_code: 0,
        message: 'Entry approved',
        ticket: {
          attendee_name: ticket.attendee_name,
          event_title:   ticket.event_title,
          venue_name:    ticket.venue_name,
          show_date:     ticket.show_date,
          show_time:     ticket.show_time,
          tier_name:     ticket.tier_name,
          seat_label:    ticket.seat_label,
        },
      });
    }

    if (result.result_code === 1) {
      return res.status(409).json({
        success: false,
        result_code: 1,
        message: 'Already checked-in — entry denied',
        ticket: {
          attendee_name: ticket.attendee_name,
          event_title:   ticket.event_title,
          seat_label:    ticket.seat_label,
        },
      });
    }

    if (result.result_code === 3) {
      return res.status(403).json({
        success: false,
        result_code: 3,
        message: 'Ticket is cancelled',
      });
    }

    if (result.result_code === 5) {
      return res.status(403).json({
        success: false,
        result_code: 5,
        message: 'Ticket is not for your venue',
      });
    }

    return res.status(400).json({
      success: false,
      result_code: result.result_code,
      message: result.result_msg || 'Validation failed',
    });

  } catch (err) {
    console.error('[Scanner] scanTicket error:', err.message);
    return res.status(500).json({ success: false, message: 'Scan failed — server error' });
  }
};

module.exports = { scanTicket };
