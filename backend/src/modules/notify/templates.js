const bookingConfirmedTemplate = (data) => {
  return {
    subject: 'Booking Confirmed — ' + data.event_title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #6c63ff;">EventFlow</h2>
        <p>Hi <strong>${data.full_name}</strong>,</p>
        <p>Your booking is confirmed!</p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Event</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${data.event_title}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Venue</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${data.venue_name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Date</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${data.show_date}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Time</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${data.show_time}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Seats</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${data.seat_labels}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>Amount Paid</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">Rs. ${data.total_amount}</td>
          </tr>
        </table>
        <p style="margin-top: 20px;">Your tickets are attached to this email.</p>
        <p style="color: grey; font-size: 12px;">This is an auto-generated email. Please do not reply.</p>
      </div>
    `
  };
};

const bookingCancelledTemplate = (data) => {
  return {
    subject: 'Booking Cancelled — ' + data.event_title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #6c63ff;">EventFlow</h2>
        <p>Hi <strong>${data.full_name}</strong>,</p>
        <p>Your booking for <strong>${data.event_title}</strong> on <strong>${data.show_date}</strong> has been cancelled.</p>
        <p>Booking ID: <strong>${data.booking_id}</strong></p>
        <p style="color: grey; font-size: 12px;">This is an auto-generated email. Please do not reply.</p>
      </div>
    `
  };
};

module.exports = { bookingConfirmedTemplate, bookingCancelledTemplate };
