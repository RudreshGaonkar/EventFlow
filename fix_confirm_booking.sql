-- =============================================================================
-- Patch: confirm_booking — TEXT signature + GET DIAGNOSTICS error surfacing
-- =============================================================================

USE eventFlowDB;

DELIMITER $$

DROP PROCEDURE IF EXISTS confirm_booking$$

CREATE PROCEDURE confirm_booking(
  IN  p_booking_id               INT UNSIGNED,
  IN  p_stripe_payment_intent_id VARCHAR(100),
  IN  p_stripe_signature         TEXT,           -- widened from VARCHAR(255)
  IN  p_amount                   DECIMAL(10,2),
  OUT p_result_code TINYINT,
  OUT p_result_msg  VARCHAR(500)
)
BEGIN
  -- Surface the actual MySQL error instead of a generic string
  DECLARE v_errno  INT    DEFAULT 0;
  DECLARE v_errmsg TEXT   DEFAULT '';

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    GET DIAGNOSTICS CONDITION 1
      v_errno  = MYSQL_ERRNO,
      v_errmsg = MESSAGE_TEXT;
    ROLLBACK;
    SET p_result_code = 1;
    SET p_result_msg  = CONCAT('DB Error ', v_errno, ': ', LEFT(v_errmsg, 400));
  END;

  START TRANSACTION;

  INSERT INTO payments
    (booking_id, amount, stripe_payment_intent_id, stripe_signature, payment_status, paid_at)
  VALUES
    (p_booking_id, p_amount, p_stripe_payment_intent_id, p_stripe_signature, 'Success', NOW());

  UPDATE bookings
     SET booking_status = 'Confirmed'
   WHERE booking_id = p_booking_id;

  UPDATE session_seats ss
    JOIN booking_seats bs ON ss.session_seat_id = bs.session_seat_id
     SET ss.status = 'Booked'
   WHERE bs.booking_id = p_booking_id;

  UPDATE event_sessions es
    JOIN bookings b ON b.session_id = es.session_id
     SET es.booked_seats = es.booked_seats + b.num_seats
   WHERE b.booking_id = p_booking_id;

  INSERT INTO tickets (booking_id, session_seat_id, ticket_uuid, entry_status)
    SELECT p_booking_id, bs.session_seat_id, UUID(), 'Valid'
      FROM booking_seats bs
     WHERE bs.booking_id = p_booking_id;

  COMMIT;
  SET p_result_code = 0;
  SET p_result_msg  = 'Confirmed — tickets generated';
END$$

DELIMITER ;

SELECT 'confirm_booking procedure updated successfully' AS status;
