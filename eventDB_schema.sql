-- =============================================================================
-- EventFlow: Schema v6 — Clean Rebuild
-- All columns consolidated (no post-hoc ALTERs)
-- Includes: registration system, event scope, brochure, Tech Fest / Workshop
-- =============================================================================

CREATE DATABASE IF NOT EXISTS eventFlowDB;
USE eventFlowDB;

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

DROP TABLE IF EXISTS event_registrations;
DROP TABLE IF EXISTS booking_history;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS booking_seats;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS session_seats;
DROP TABLE IF EXISTS seats;
DROP TABLE IF EXISTS seat_tiers;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS event_sessions;
DROP TABLE IF EXISTS event_people;
DROP TABLE IF EXISTS people;
DROP TABLE IF EXISTS parent_events;
DROP TABLE IF EXISTS user_venues;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS venues;
DROP TABLE IF EXISTS cities;
DROP TABLE IF EXISTS states;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS roles;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- 1. ROLES
-- =============================================================================
CREATE TABLE roles (
  role_id     TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  role_name   VARCHAR(50)      NOT NULL,
  description VARCHAR(255)     NULL,

  PRIMARY KEY (role_id),
  UNIQUE KEY uq_role_name (role_name)
) ENGINE=InnoDB;

-- =============================================================================
-- 2. USERS
-- =============================================================================
CREATE TABLE users (
  user_id        INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  role_id        TINYINT UNSIGNED NOT NULL,
  requested_role ENUM('Attendee','Event Organizer','Venue Owner') NOT NULL DEFAULT 'Attendee',
  full_name      VARCHAR(100)  NOT NULL,
  email          VARCHAR(150)  NOT NULL,
  password_hash  VARCHAR(255)  NOT NULL,
  phone          VARCHAR(15)   NULL,
  home_state_id  SMALLINT UNSIGNED NULL,
  is_active      BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (user_id),
  UNIQUE KEY uq_user_email (email),
  KEY idx_user_role (role_id)
) ENGINE=InnoDB;

-- =============================================================================
-- 3. STATES
-- =============================================================================
CREATE TABLE states (
  state_id   SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  state_name VARCHAR(100)      NOT NULL,
  state_code CHAR(3)           NOT NULL,

  PRIMARY KEY (state_id),
  UNIQUE KEY uq_state_code (state_code)
) ENGINE=InnoDB;

-- =============================================================================
-- 4. CITIES
-- =============================================================================
CREATE TABLE cities (
  city_id         SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  state_id        SMALLINT UNSIGNED NOT NULL,
  city_name       VARCHAR(100)      NOT NULL,
  city_multiplier DECIMAL(4,2)      NOT NULL DEFAULT 1.00,

  PRIMARY KEY (city_id),
  KEY idx_city_state (state_id),
  CONSTRAINT fk_city_state FOREIGN KEY (state_id) REFERENCES states (state_id) ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =============================================================================
-- 5. VENUES
-- =============================================================================
CREATE TABLE venues (
  venue_id       SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  city_id        SMALLINT UNSIGNED NOT NULL,
  owner_id       INT UNSIGNED      NULL,
  venue_name     VARCHAR(150)      NOT NULL,
  address        VARCHAR(300)      NULL,
  total_capacity SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  is_active      BOOLEAN           NOT NULL DEFAULT TRUE,
  status         ENUM('Pending','Active','Inactive') NOT NULL DEFAULT 'Active',

  PRIMARY KEY (venue_id),
  KEY idx_venue_city (city_id),
  CONSTRAINT fk_venue_city  FOREIGN KEY (city_id)  REFERENCES cities (city_id)  ON UPDATE CASCADE,
  CONSTRAINT fk_venue_owner FOREIGN KEY (owner_id) REFERENCES users  (user_id)
) ENGINE=InnoDB;

-- Deferred FK: users → states, users → roles
ALTER TABLE users
  ADD CONSTRAINT fk_user_state FOREIGN KEY (home_state_id) REFERENCES states (state_id) ON UPDATE CASCADE ON DELETE SET NULL,
  ADD CONSTRAINT fk_user_role  FOREIGN KEY (role_id)       REFERENCES roles  (role_id);

-- =============================================================================
-- 6. PARENT EVENTS
-- =============================================================================
CREATE TABLE parent_events (
  event_id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  organizer_id       INT UNSIGNED  NOT NULL,

  -- Core
  event_type         ENUM('Movie','Concert','Play','Sport','Other','Tech Fest','Workshop') NOT NULL DEFAULT 'Movie',
  title              VARCHAR(200)  NOT NULL,
  description        TEXT          NULL,
  rating             ENUM('G','UA','A','S') NULL,
  duration_mins      SMALLINT UNSIGNED NULL,
  age_limit          TINYINT UNSIGNED  NULL,
  language           VARCHAR(50)   NULL,
  genre              VARCHAR(100)  NULL,
  poster_url         VARCHAR(500)  NULL,
  poster_public_id   VARCHAR(255)  NULL,
  trailer_url        VARCHAR(500)  NULL,
  brochure_url       VARCHAR(500)  NULL,

  -- Registration & scope
  registration_mode  ENUM('booking','free_registration','paid_registration') NOT NULL DEFAULT 'booking',
  event_scope        ENUM('state','national') NOT NULL DEFAULT 'national',
  listing_days_ahead SMALLINT UNSIGNED       NOT NULL DEFAULT 5,
  registration_fee   DECIMAL(8,2)            NOT NULL DEFAULT 0.00,

  -- Participation (for registration-type events)
  participation_type ENUM('solo','team','both') NOT NULL DEFAULT 'solo',
  max_participants   SMALLINT UNSIGNED NULL,      -- NULL = unlimited
  min_team_size      TINYINT UNSIGNED  NULL DEFAULT 2,
  max_team_size      TINYINT UNSIGNED  NULL DEFAULT 5,

  is_active          BOOLEAN   NOT NULL DEFAULT TRUE,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (event_id),
  KEY idx_event_organizer    (organizer_id),
  KEY idx_event_type_active  (event_type, is_active),
  CONSTRAINT fk_event_organizer FOREIGN KEY (organizer_id) REFERENCES users (user_id)
) ENGINE=InnoDB;

-- =============================================================================
-- 7. PEOPLE
-- =============================================================================
CREATE TABLE people (
  person_id      INT UNSIGNED NOT NULL AUTO_INCREMENT,
  real_name      VARCHAR(150) NOT NULL,
  photo_url      VARCHAR(500) NULL,
  photo_public_id VARCHAR(255) NULL,
  bio            TEXT         NULL,

  PRIMARY KEY (person_id),
  KEY idx_person_name (real_name)
) ENGINE=InnoDB;

CREATE TABLE event_people (
  event_person_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  event_id        INT UNSIGNED NOT NULL,
  person_id       INT UNSIGNED NOT NULL,
  role_type       ENUM('Cast','Director','Producer','Writer','Crew') NOT NULL,
  character_name  VARCHAR(150) NULL,
  designation     VARCHAR(100) NULL,
  billing_order   TINYINT UNSIGNED NULL,

  PRIMARY KEY (event_person_id),
  UNIQUE KEY uq_event_person_role (event_id, person_id, role_type),
  KEY idx_ep_event  (event_id),
  KEY idx_ep_person (person_id),
  CONSTRAINT fk_ep_event  FOREIGN KEY (event_id)  REFERENCES parent_events (event_id) ON DELETE CASCADE,
  CONSTRAINT fk_ep_person FOREIGN KEY (person_id) REFERENCES people        (person_id)
) ENGINE=InnoDB;

-- =============================================================================
-- 8. EVENT SESSIONS
-- =============================================================================
CREATE TABLE event_sessions (
  session_id               INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  event_id                 INT UNSIGNED     NOT NULL,
  venue_id                 SMALLINT UNSIGNED NOT NULL,
  show_date                DATE             NOT NULL,
  show_time                TIME             NOT NULL,
  demand_multiplier        DECIMAL(4,2)     NOT NULL DEFAULT 1.00,
  total_seats              SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  booked_seats             SMALLINT UNSIGNED NOT NULL DEFAULT 0,
  status                   ENUM('Scheduled','Ongoing','Cancelled','Completed') NOT NULL DEFAULT 'Scheduled',

  -- Registration fields (used when registration_mode != booking)
  requires_registration    TINYINT(1)        NOT NULL DEFAULT 0,
  session_max_participants SMALLINT UNSIGNED NULL,   -- NULL = use parent limit
  session_registered       SMALLINT UNSIGNED NOT NULL DEFAULT 0,

  created_at               TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (session_id),
  UNIQUE KEY uq_session_venue_datetime (venue_id, show_date, show_time),
  KEY idx_session_event (event_id),
  KEY idx_session_date  (show_date),
  CONSTRAINT fk_session_event FOREIGN KEY (event_id) REFERENCES parent_events  (event_id),
  CONSTRAINT fk_session_venue FOREIGN KEY (venue_id) REFERENCES venues          (venue_id),
  CONSTRAINT chk_session_demand CHECK (demand_multiplier > 0)
) ENGINE=InnoDB;

-- =============================================================================
-- 9. REVIEWS
-- =============================================================================
CREATE TABLE reviews (
  review_id   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NOT NULL,
  event_id    INT UNSIGNED NULL,
  session_id  INT UNSIGNED NULL,
  rating      TINYINT UNSIGNED NOT NULL,
  review_text TEXT NULL,
  edit_count  TINYINT UNSIGNED NOT NULL DEFAULT 0,        -- ← NEW
  updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,  -- ← NEW
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (review_id),
  UNIQUE KEY uq_user_event_review   (user_id, event_id),
  UNIQUE KEY uq_user_session_review (user_id, session_id),
  KEY idx_review_event   (event_id),
  KEY idx_review_session (session_id),
  CONSTRAINT chk_review_target CHECK (
    (event_id IS NOT NULL AND session_id IS NULL) OR
    (event_id IS NULL     AND session_id IS NOT NULL)
  ),
  CONSTRAINT chk_review_rating  CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT fk_review_user     FOREIGN KEY (user_id)    REFERENCES users          (user_id),
  CONSTRAINT fk_review_event    FOREIGN KEY (event_id)   REFERENCES parent_events  (event_id)    ON DELETE CASCADE,
  CONSTRAINT fk_review_session  FOREIGN KEY (session_id) REFERENCES event_sessions (session_id)  ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================================================
-- 10. SEAT TIERS  (generic names — not cinema-specific)
-- =============================================================================
CREATE TABLE seat_tiers (
  tier_id     TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  tier_name   ENUM('Tier 1','Tier 2','Tier 3') NOT NULL,
  base_price  DECIMAL(8,2)     NOT NULL,
  description VARCHAR(255)     NULL,

  PRIMARY KEY (tier_id),
  UNIQUE KEY uq_tier_name (tier_name)
) ENGINE=InnoDB;

-- =============================================================================
-- 11. SEATS
-- =============================================================================
CREATE TABLE seats (
  seat_id     INT UNSIGNED      NOT NULL AUTO_INCREMENT,
  venue_id    SMALLINT UNSIGNED NOT NULL,
  tier_id     TINYINT UNSIGNED  NOT NULL,
  seat_row    CHAR(2)           NOT NULL,
  seat_number TINYINT UNSIGNED  NOT NULL,
  seat_label  VARCHAR(10)       NOT NULL,
  is_active   BOOLEAN           NOT NULL DEFAULT TRUE,

  PRIMARY KEY (seat_id),
  UNIQUE KEY uq_seat_venue_label (venue_id, seat_label),
  KEY idx_seat_tier (tier_id),
  CONSTRAINT fk_seat_venue FOREIGN KEY (venue_id) REFERENCES venues     (venue_id),
  CONSTRAINT fk_seat_tier  FOREIGN KEY (tier_id)  REFERENCES seat_tiers (tier_id)
) ENGINE=InnoDB;

-- =============================================================================
-- 12. SESSION SEATS
-- =============================================================================
CREATE TABLE session_seats (
  session_seat_id INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  session_id      INT UNSIGNED     NOT NULL,
  seat_id         INT UNSIGNED     NOT NULL,
  status          ENUM('Available','Locked','Booked') NOT NULL DEFAULT 'Available',
  locked_until    DATETIME         NULL,

  PRIMARY KEY (session_seat_id),
  UNIQUE KEY uq_session_seat (session_id, seat_id),
  KEY idx_ss_session (session_id),
  KEY idx_ss_status  (status),
  CONSTRAINT fk_ss_session FOREIGN KEY (session_id) REFERENCES event_sessions (session_id) ON DELETE CASCADE,
  CONSTRAINT fk_ss_seat    FOREIGN KEY (seat_id)    REFERENCES seats           (seat_id)
) ENGINE=InnoDB;

-- =============================================================================
-- 13. BOOKINGS
-- =============================================================================
CREATE TABLE bookings (
  booking_id       INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id          INT UNSIGNED  NOT NULL,
  session_id       INT UNSIGNED  NOT NULL,
  num_seats        TINYINT UNSIGNED NOT NULL,
  subtotal_amount  DECIMAL(10,2) NOT NULL,
  tax_amount       DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_amount     DECIMAL(10,2) NOT NULL,
  booking_status    ENUM('Pending','Confirmed','Cancelled','Refunded') NOT NULL DEFAULT 'Pending',
  razorpay_order_id VARCHAR(100) NULL,
  booked_at         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (booking_id),
  KEY idx_booking_user    (user_id),
  KEY idx_booking_session (session_id),
  KEY idx_booking_status  (booking_status),
  CONSTRAINT fk_booking_user    FOREIGN KEY (user_id)    REFERENCES users          (user_id),
  CONSTRAINT fk_booking_session FOREIGN KEY (session_id) REFERENCES event_sessions (session_id),
  CONSTRAINT chk_booking_seats  CHECK (num_seats BETWEEN 1 AND 10)
) ENGINE=InnoDB;

-- =============================================================================
-- 14. BOOKING SEATS
-- =============================================================================
CREATE TABLE booking_seats (
  booking_seat_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id      INT UNSIGNED NOT NULL,
  session_seat_id INT UNSIGNED NOT NULL,

  PRIMARY KEY (booking_seat_id),
  UNIQUE KEY uq_bs_booking_seat (booking_id, session_seat_id),
  KEY idx_bs_session_seat (session_seat_id),
  CONSTRAINT fk_bs_booking FOREIGN KEY (booking_id)      REFERENCES bookings      (booking_id)      ON DELETE CASCADE,
  CONSTRAINT fk_bs_seat    FOREIGN KEY (session_seat_id) REFERENCES session_seats (session_seat_id)
) ENGINE=InnoDB;

-- =============================================================================
-- 15. BOOKING HISTORY
-- =============================================================================
CREATE TABLE booking_history (
  history_id  INT UNSIGNED NOT NULL AUTO_INCREMENT,
  booking_id  INT UNSIGNED NOT NULL,
  changed_by  INT UNSIGNED NOT NULL,
  old_status  ENUM('Pending','Confirmed','Cancelled','Refunded') NOT NULL,
  new_status  ENUM('Pending','Confirmed','Cancelled','Refunded') NOT NULL,
  reason      VARCHAR(300) NULL,
  changed_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (history_id),
  KEY idx_bh_booking    (booking_id),
  KEY idx_bh_changed_by (changed_by),
  KEY idx_bh_changed_at (changed_at),
  CONSTRAINT fk_bh_booking    FOREIGN KEY (booking_id) REFERENCES bookings (booking_id),
  CONSTRAINT fk_bh_changed_by FOREIGN KEY (changed_by) REFERENCES users    (user_id)
) ENGINE=InnoDB;

-- =============================================================================
-- 16. PAYMENTS
-- =============================================================================
CREATE TABLE payments (
  payment_id               INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  booking_id               INT UNSIGNED  NOT NULL,
  amount                   DECIMAL(10,2) NOT NULL,
  currency                 CHAR(3)       NOT NULL DEFAULT 'INR',
  payment_method            VARCHAR(50)   NULL,
  razorpay_payment_id       VARCHAR(100)  NULL,
  razorpay_signature        VARCHAR(512)  NULL,
  payment_status           ENUM('Initiated','Success','Failed','Refunded') NOT NULL DEFAULT 'Initiated',
  paid_at                  TIMESTAMP     NULL,
  created_at               TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (payment_id),
  UNIQUE KEY uq_payment_booking (booking_id),
  KEY idx_payment_status (payment_status),
  CONSTRAINT fk_payment_booking FOREIGN KEY (booking_id) REFERENCES bookings (booking_id)
) ENGINE=InnoDB;

-- =============================================================================
-- 17. TICKETS
-- =============================================================================
CREATE TABLE tickets (
  ticket_id       INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  booking_id      INT UNSIGNED  NOT NULL,
  session_seat_id INT UNSIGNED  NOT NULL,
  ticket_uuid     CHAR(36)      NOT NULL,
  ticket_pdf_url  VARCHAR(500)  NULL,
  pdf_public_id   VARCHAR(255)  NULL,
  entry_status    ENUM('Valid','Checked-In','Cancelled') NOT NULL DEFAULT 'Valid',
  checked_in_by   INT UNSIGNED  NULL,
  checked_in_at   TIMESTAMP     NULL,
  email_sent      BOOLEAN       NOT NULL DEFAULT FALSE,
  issued_at       TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (ticket_id),
  UNIQUE KEY uq_ticket_uuid         (ticket_uuid),
  UNIQUE KEY uq_ticket_session_seat (session_seat_id),
  KEY idx_ticket_booking (booking_id),
  KEY idx_ticket_status  (entry_status),
  CONSTRAINT fk_ticket_booking      FOREIGN KEY (booking_id)      REFERENCES bookings      (booking_id),
  CONSTRAINT fk_ticket_session_seat FOREIGN KEY (session_seat_id) REFERENCES session_seats (session_seat_id),
  CONSTRAINT fk_ticket_staff        FOREIGN KEY (checked_in_by)   REFERENCES users         (user_id)
) ENGINE=InnoDB;

-- =============================================================================
-- 18. EVENT REGISTRATIONS  (for free_registration / paid_registration events)
-- =============================================================================
CREATE TABLE event_registrations (
  registration_id  INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  event_id         INT UNSIGNED     NOT NULL,
  session_id       INT UNSIGNED     NULL,       -- NULL = whole-event pass
  user_id          INT UNSIGNED     NOT NULL,
  status           ENUM('Pending','Confirmed','Cancelled') NOT NULL DEFAULT 'Confirmed',

  -- Participant info
  participant_type ENUM('student','independent') NOT NULL DEFAULT 'independent',
  college_name     VARCHAR(200)  NULL,           -- only if student

  -- Team info (only when participation_type = team / both)
  team_name        VARCHAR(100)  NULL,
  team_size        TINYINT UNSIGNED NULL,

  -- Payment (only for paid_registration)
  razorpay_order_id VARCHAR(100) NULL,
  amount_paid       DECIMAL(10,2) NOT NULL DEFAULT 0.00,

  -- Receipt / PDF (generated after paid_registration confirmation)
  receipt_pdf_url   VARCHAR(500) NULL,
  receipt_public_id VARCHAR(255) NULL,

  registered_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (registration_id),
  UNIQUE KEY uq_user_event_reg (user_id, event_id, session_id),
  KEY idx_reg_event      (event_id),
  KEY idx_reg_session    (session_id),
  KEY idx_reg_user       (user_id),
  KEY idx_reg_status     (status),
  KEY idx_reg_razorpay   (razorpay_order_id),
  CONSTRAINT fk_reg_event   FOREIGN KEY (event_id)   REFERENCES parent_events  (event_id)   ON DELETE CASCADE,
  CONSTRAINT fk_reg_session FOREIGN KEY (session_id) REFERENCES event_sessions (session_id) ON DELETE CASCADE,
  CONSTRAINT fk_reg_user    FOREIGN KEY (user_id)    REFERENCES users           (user_id)
) ENGINE=InnoDB;

-- =============================================================================
-- 19. USER VENUES
-- =============================================================================
CREATE TABLE user_venues (
  user_venue_id INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED     NOT NULL,
  venue_id      SMALLINT UNSIGNED NOT NULL,
  assigned_at   TIMESTAMP        NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (user_venue_id),
  UNIQUE KEY uq_user_venue (user_id, venue_id),
  CONSTRAINT fk_uv_user  FOREIGN KEY (user_id)  REFERENCES users  (user_id)  ON DELETE CASCADE,
  CONSTRAINT fk_uv_venue FOREIGN KEY (venue_id) REFERENCES venues (venue_id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- =============================================================================
-- 20. USER ROLES
-- =============================================================================
CREATE TABLE user_roles (
  user_role_id     INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  user_id          INT UNSIGNED     NOT NULL,
  role_id          TINYINT UNSIGNED NOT NULL,
  status           ENUM('Pending','Active','Revoked') NOT NULL DEFAULT 'Pending',
  id_proof_url     VARCHAR(500)     NULL,
  id_proof_public_id VARCHAR(255)   NULL,
  photo_url        VARCHAR(500)     NULL,
  photo_public_id  VARCHAR(255)     NULL,
  rejection_reason VARCHAR(300)     NULL,
  requested_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_at      TIMESTAMP NULL,
  approved_by      INT UNSIGNED NULL,

  PRIMARY KEY (user_role_id),
  UNIQUE KEY uq_user_role (user_id, role_id),
  CONSTRAINT fk_ur_user     FOREIGN KEY (user_id)     REFERENCES users (user_id) ON DELETE CASCADE,
  CONSTRAINT fk_ur_role     FOREIGN KEY (role_id)     REFERENCES roles (role_id),
  CONSTRAINT fk_ur_approver FOREIGN KEY (approved_by) REFERENCES users (user_id)
) ENGINE=InnoDB;

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX idx_sessions_window ON event_sessions  (show_date, status);
CREATE INDEX idx_ss_locked        ON session_seats   (status, locked_until);
CREATE INDEX idx_tickets_uuid     ON tickets         (ticket_uuid);
CREATE INDEX idx_bookings_razorpay ON bookings        (razorpay_order_id);
CREATE INDEX idx_reviews_event    ON reviews         (event_id, rating);
CREATE INDEX idx_reviews_session  ON reviews         (session_id, rating);
CREATE INDEX idx_bh_booking_time  ON booking_history (booking_id, changed_at);

-- =============================================================================
-- TRIGGER: auto-log booking status changes
-- =============================================================================
DELIMITER $$

CREATE TRIGGER trg_booking_status_change
AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
  IF OLD.booking_status != NEW.booking_status THEN
    INSERT INTO booking_history (booking_id, changed_by, old_status, new_status)
    VALUES (NEW.booking_id, NEW.user_id, OLD.booking_status, NEW.booking_status);
  END IF;
END$$

DELIMITER ;

-- =============================================================================
-- STORED PROCEDURE: book_seats
-- =============================================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS book_seats$$

CREATE PROCEDURE book_seats(
  IN  p_user_id    INT UNSIGNED,
  IN  p_session_id INT UNSIGNED,
  IN  p_seat_ids   JSON,
  OUT p_booking_id INT UNSIGNED,
  OUT p_result_code TINYINT,
  OUT p_result_msg  VARCHAR(255)
)
book_seats: BEGIN
  DECLARE v_seat_count  INT          DEFAULT 0;
  DECLARE v_total       DECIMAL(10,2) DEFAULT 0.00;
  DECLARE v_show_date   DATE;
  DECLARE v_today       DATE         DEFAULT CURDATE();
  DECLARE v_demand_mult DECIMAL(4,2);
  DECLARE v_locked      INT          DEFAULT 0;
  DECLARE v_days_ahead  SMALLINT     DEFAULT 5;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SET p_result_code = 3;
    SET p_result_msg  = 'Transaction error — rolled back';
  END;

  START TRANSACTION;

  SELECT es.show_date, es.demand_multiplier, pe.listing_days_ahead
    INTO v_show_date, v_demand_mult, v_days_ahead
    FROM event_sessions es
    JOIN parent_events pe ON pe.event_id = es.event_id
   WHERE es.session_id = p_session_id;

  IF v_show_date < v_today OR v_show_date > DATE_ADD(v_today, INTERVAL (v_days_ahead - 1) DAY) THEN
    ROLLBACK;
    SET p_result_code = 2;
    SET p_result_msg  = CONCAT('Outside ', v_days_ahead, '-day booking window');
    LEAVE book_seats;
  END IF;

  SELECT COUNT(*) INTO v_locked
    FROM session_seats
   WHERE session_id = p_session_id
     AND JSON_CONTAINS(p_seat_ids, CAST(seat_id AS JSON))
     AND status != 'Available'
   FOR UPDATE;

  IF v_locked > 0 THEN
    ROLLBACK;
    SET p_result_code = 1;
    SET p_result_msg  = 'One or more seats no longer available';
    LEAVE book_seats;
  END IF;

  SELECT SUM(st.base_price * c.city_multiplier * v_demand_mult)
    INTO v_total
    FROM session_seats ss
    JOIN seats     s  ON ss.seat_id   = s.seat_id
    JOIN seat_tiers st ON s.tier_id   = st.tier_id
    JOIN venues    v  ON s.venue_id   = v.venue_id
    JOIN cities    c  ON v.city_id    = c.city_id
   WHERE ss.session_id = p_session_id
     AND JSON_CONTAINS(p_seat_ids, CAST(ss.seat_id AS JSON));

  SET v_seat_count = JSON_LENGTH(p_seat_ids);

  INSERT INTO bookings
    (user_id, session_id, num_seats, subtotal_amount, tax_amount, total_amount, booking_status)
  VALUES
    (p_user_id, p_session_id, v_seat_count, v_total,
     ROUND(v_total * 0.18, 2), ROUND(v_total * 1.18, 2), 'Pending');

  SET p_booking_id = LAST_INSERT_ID();

  INSERT INTO booking_seats (booking_id, session_seat_id)
    SELECT p_booking_id, session_seat_id
      FROM session_seats
     WHERE session_id = p_session_id
       AND JSON_CONTAINS(p_seat_ids, CAST(seat_id AS JSON));

  UPDATE session_seats
     SET status       = 'Locked',
         locked_until = DATE_ADD(NOW(), INTERVAL 15 MINUTE)
   WHERE session_id = p_session_id
     AND JSON_CONTAINS(p_seat_ids, CAST(seat_id AS JSON));

  COMMIT;
  SET p_result_code = 0;
  SET p_result_msg  = 'Booking created — proceed to payment';
END$$

DELIMITER ;

-- =============================================================================
-- STORED PROCEDURE: confirm_booking
-- =============================================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS confirm_booking$$

CREATE PROCEDURE confirm_booking(
  IN  p_booking_id          INT UNSIGNED,
  IN  p_razorpay_payment_id VARCHAR(100),
  IN  p_razorpay_signature  VARCHAR(512),
  IN  p_amount              DECIMAL(10,2),
  OUT p_result_code TINYINT,
  OUT p_result_msg  VARCHAR(255)
)
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SET p_result_code = 1;
    SET p_result_msg  = 'Error confirming booking';
  END;

  START TRANSACTION;

  INSERT INTO payments
    (booking_id, amount, razorpay_payment_id, razorpay_signature, payment_status, paid_at)
  VALUES
    (p_booking_id, p_amount, p_razorpay_payment_id, p_razorpay_signature, 'Success', NOW());

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

-- =============================================================================
-- STORED PROCEDURE: validate_ticket
-- =============================================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS validate_ticket$$

CREATE PROCEDURE validate_ticket(
  IN  p_ticket_uuid CHAR(36),
  IN  p_staff_id    INT UNSIGNED,
  OUT p_result_code TINYINT,
  OUT p_result_msg  VARCHAR(255)
)
BEGIN
  DECLARE v_status    VARCHAR(20);
  DECLARE v_ticket_id INT UNSIGNED;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SET p_result_code = 4;
    SET p_result_msg  = 'Transaction error during validation';
  END;

  START TRANSACTION;

  SELECT ticket_id, entry_status
    INTO v_ticket_id, v_status
    FROM tickets
   WHERE ticket_uuid = p_ticket_uuid
   FOR UPDATE;

  IF v_ticket_id IS NULL THEN
    SET p_result_code = 2;
    SET p_result_msg  = 'Ticket not found — invalid UUID';
  ELSEIF v_status = 'Checked-In' THEN
    SET p_result_code = 1;
    SET p_result_msg  = 'Already checked in — entry denied';
  ELSEIF v_status = 'Cancelled' THEN
    SET p_result_code = 3;
    SET p_result_msg  = 'Ticket has been cancelled';
  ELSE
    IF NOT EXISTS (
      SELECT 1
        FROM user_venues   uv
        JOIN event_sessions es ON es.venue_id        = uv.venue_id
        JOIN session_seats  ss ON ss.session_id       = es.session_id
        JOIN tickets        t  ON t.session_seat_id   = ss.session_seat_id
       WHERE uv.user_id    = p_staff_id
         AND t.ticket_uuid = p_ticket_uuid
    ) THEN
      SET p_result_code = 5;
      SET p_result_msg  = 'Ticket is not for your venue';
    ELSE
      UPDATE tickets
         SET entry_status  = 'Checked-In',
             checked_in_by = p_staff_id,
             checked_in_at = NOW()
       WHERE ticket_id = v_ticket_id;
      SET p_result_code = 0;
      SET p_result_msg  = 'Entry approved';
    END IF;
  END IF;

  COMMIT;
END$$

DELIMITER ;

-- =============================================================================
-- STORED PROCEDURE: register_for_event
-- =============================================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS register_for_event$$

CREATE PROCEDURE register_for_event(
  IN  p_user_id          INT UNSIGNED,
  IN  p_event_id         INT UNSIGNED,
  IN  p_session_id       INT UNSIGNED,   -- NULL for whole-event pass
  IN  p_participant_type VARCHAR(20),
  IN  p_college_name     VARCHAR(200),
  IN  p_team_name        VARCHAR(100),
  IN  p_team_size        TINYINT UNSIGNED,
  OUT p_registration_id  INT UNSIGNED,
  OUT p_result_code      TINYINT,
  OUT p_result_msg       VARCHAR(255)
)
reg_proc: BEGIN
  DECLARE v_reg_mode        VARCHAR(30);
  DECLARE v_part_type       VARCHAR(10);
  DECLARE v_max_part        SMALLINT UNSIGNED;
  DECLARE v_min_team        TINYINT UNSIGNED;
  DECLARE v_max_team        TINYINT UNSIGNED;
  DECLARE v_current_count   SMALLINT UNSIGNED;
  DECLARE v_sess_max        SMALLINT UNSIGNED;
  DECLARE v_sess_registered SMALLINT UNSIGNED;

  DECLARE EXIT HANDLER FOR SQLEXCEPTION
  BEGIN
    ROLLBACK;
    SET p_result_code = 5;
    SET p_result_msg  = 'Transaction error — rolled back';
  END;

  START TRANSACTION;

  SELECT registration_mode, participation_type,
         max_participants, min_team_size, max_team_size
    INTO v_reg_mode, v_part_type, v_max_part, v_min_team, v_max_team
    FROM parent_events
   WHERE event_id = p_event_id;

  IF v_reg_mode = 'booking' THEN
    ROLLBACK;
    SET p_result_code = 1;
    SET p_result_msg  = 'This event uses seat booking, not registration';
    LEAVE reg_proc;
  END IF;

  IF EXISTS (
    SELECT 1 FROM event_registrations
     WHERE user_id   = p_user_id
       AND event_id  = p_event_id
       AND (session_id = p_session_id OR (session_id IS NULL AND p_session_id IS NULL))
  ) THEN
    ROLLBACK;
    SET p_result_code = 2;
    SET p_result_msg  = 'You are already registered for this event';
    LEAVE reg_proc;
  END IF;

  IF v_part_type IN ('team','both') AND p_team_name IS NOT NULL THEN
    IF p_team_size < v_min_team OR p_team_size > v_max_team THEN
      ROLLBACK;
      SET p_result_code = 3;
      SET p_result_msg  = CONCAT('Team size must be between ', v_min_team, ' and ', v_max_team);
      LEAVE reg_proc;
    END IF;
  END IF;

  IF v_max_part IS NOT NULL THEN
    SELECT COUNT(*) INTO v_current_count
      FROM event_registrations
     WHERE event_id = p_event_id AND status != 'Cancelled';

    IF v_current_count >= v_max_part THEN
      ROLLBACK;
      SET p_result_code = 4;
      SET p_result_msg  = 'Event is full — registrations closed';
      LEAVE reg_proc;
    END IF;
  END IF;

  IF p_session_id IS NOT NULL THEN
    SELECT session_max_participants, session_registered
      INTO v_sess_max, v_sess_registered
      FROM event_sessions
     WHERE session_id = p_session_id;

    IF v_sess_max IS NOT NULL AND v_sess_registered >= v_sess_max THEN
      ROLLBACK;
      SET p_result_code = 4;
      SET p_result_msg  = 'This session is full';
      LEAVE reg_proc;
    END IF;

    UPDATE event_sessions
       SET session_registered = session_registered + 1
     WHERE session_id = p_session_id;
  END IF;

  INSERT INTO event_registrations
    (event_id, session_id, user_id, status,
     participant_type, college_name,
     team_name, team_size, amount_paid)
  VALUES
    (p_event_id, p_session_id, p_user_id,
     IF(v_reg_mode = 'paid_registration', 'Pending', 'Confirmed'),
     p_participant_type, p_college_name,
     p_team_name, p_team_size, 0.00);

  SET p_registration_id = LAST_INSERT_ID();

  COMMIT;
  SET p_result_code = 0;
  SET p_result_msg  = IF(v_reg_mode = 'paid_registration',
                         'Registration created — proceed to payment',
                         'Registration confirmed');
END$$

DELIMITER ;

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Session availability (respects listing_days_ahead & event_scope)
CREATE OR REPLACE VIEW vw_session_availability AS
SELECT
  es.session_id,
  pe.event_id,
  pe.title              AS event_title,
  pe.event_type,
  pe.registration_mode,
  pe.participation_type,
  pe.max_participants,
  pe.min_team_size,
  pe.max_team_size,
  pe.registration_fee,
  pe.event_scope,
  pe.listing_days_ahead,
  pe.rating,
  pe.language,
  pe.poster_url,
  s.state_id,
  s.state_name,
  c.city_id,
  c.city_name,
  v.venue_id,
  v.venue_name,
  es.show_date,
  es.show_time,
  es.total_seats,
  es.booked_seats,
  (es.total_seats - es.booked_seats) AS available_seats,
  es.demand_multiplier,
  es.requires_registration,
  es.session_max_participants,
  es.session_registered,
  es.status AS session_status
FROM event_sessions es
JOIN parent_events pe ON pe.event_id  = es.event_id
JOIN venues        v  ON v.venue_id   = es.venue_id
JOIN cities        c  ON c.city_id    = v.city_id
JOIN states        s  ON s.state_id   = c.state_id
WHERE es.show_date >= CURDATE()
  AND es.status   = 'Scheduled'
  AND pe.is_active = TRUE;

-- Ticket details (for PDF generation and staff check-in)
CREATE OR REPLACE VIEW vw_ticket_details AS
SELECT
  t.ticket_id,
  t.ticket_uuid,
  t.entry_status,
  t.ticket_pdf_url,
  t.email_sent,
  t.issued_at,
  t.checked_in_at,
  b.booking_id,
  u.full_name   AS attendee_name,
  u.email       AS attendee_email,
  pe.title      AS event_title,
  pe.event_type,
  v.venue_name,
  c.city_name,
  s.state_name,
  es.show_date,
  es.show_time,
  st.tier_name,
  se.seat_label
FROM tickets    t
JOIN session_seats ss ON ss.session_seat_id = t.session_seat_id
JOIN seats         se ON se.seat_id= ss.seat_id
JOIN seat_tiers    st ON st.tier_id= se.tier_id
JOIN event_sessions es ON es.session_id= ss.session_id
JOIN parent_events pe  ON pe.event_id= es.event_id
JOIN venues   v   ON v.venue_id= es.venue_id
JOIN cities   c   ON c.city_id  = v.city_id
JOIN states   s   ON s.state_id    = c.state_id
JOIN bookings  b   ON b.booking_id   = t.booking_id
JOIN users  u   ON u.user_id= b.user_id;

-- Review scores per event and per session
CREATE OR REPLACE VIEW vw_review_scores AS
SELECT 'parent_event' AS level,
       event_id       AS target_id,
       COUNT(*)       AS total_reviews,
       ROUND(AVG(rating), 1) AS avg_rating
  FROM reviews WHERE event_id IS NOT NULL
  GROUP BY event_id
UNION ALL
SELECT 'session'AS level,
       session_id AS target_id,
       COUNT(*) AS total_reviews,
       ROUND(AVG(rating), 1) AS avg_rating
  FROM reviews WHERE session_id IS NOT NULL
  GROUP BY session_id;

-- Booking audit trail
CREATE OR REPLACE VIEW vw_booking_audit AS
SELECT
  bh.history_id,
  bh.booking_id,
  u.full_name  AS changed_by_name,
  r.role_name  AS changed_by_role,
  bh.old_status,
  bh.new_status,
  bh.reason,
  bh.changed_at
FROM booking_history bh
JOIN users u ON u.user_id  = bh.changed_by
JOIN roles r ON r.role_id  = u.role_id
ORDER BY bh.changed_at DESC;

-- Registration summary per event
CREATE OR REPLACE VIEW vw_registration_summary AS
SELECT
  pe.event_id,
  pe.title,
  pe.registration_mode,
  pe.participation_type,
  pe.max_participants,
  COUNT(er.registration_id)AS total_registered,
  SUM(er.status = 'Confirmed')AS confirmed,
  SUM(er.status = 'Pending')AS pending,
  pe.max_participants - COUNT(er.registration_id) AS spots_left
FROM parent_events pe
LEFT JOIN event_registrations er
       ON er.event_id = pe.event_id AND er.status != 'Cancelled'
WHERE pe.registration_mode != 'booking'
GROUP BY pe.event_id;

-- =============================================================================
-- END OF SCHEMA v6
-- =============================================================================
