const { getRazorpay } = require('../../config/razorpay');
const { uploadFile, uploadPDFBuffer } = require('../../config/cloudinary');
const { generateReceiptPDF } = require('./receiptGenerator');
const {
  callRegisterProc,
  confirmPaidRegistration,
  saveRazorpayOrder,
  getRegistrationById,
  getRegistrationsByUser,
  getRegistrationsByEvent,
  getEventRegistrationConfig,
  cancelRegistration,
  saveReceiptPDF,
} = require('./queries');

// ── Generate receipt PDF and upload to Cloudinary ────────────────────────────
const generateAndUploadReceipt = async (registration_id) => {
  try {
    const reg = await getRegistrationById(registration_id);
    if (!reg) throw new Error('Registration not found: ' + registration_id);

    const pdfBuffer = await generateReceiptPDF(reg);
    const uploaded  = await uploadPDFBuffer(pdfBuffer, 'receipts');

    await saveReceiptPDF(registration_id, uploaded.secure_url, uploaded.public_id);
    console.log('[Registration] Receipt generated for registration', registration_id);
  } catch (err) {
    // Non-fatal — log and continue so the user still gets their confirmation
    console.error('[Registration] Receipt generation failed:', err.message);
  }
};

// ── POST /api/registration/:event_id ─────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { event_id } = req.params;
    const {
      session_id,
      participant_type,
      college_name,
      team_name,
      team_size,
    } = req.body;

    if (!participant_type) {
      return res.status(400).json({ success: false, message: 'participant_type is required' });
    }
    if (participant_type === 'student' && !college_name) {
      return res.status(400).json({ success: false, message: 'college_name is required for student participants' });
    }

    const config = await getEventRegistrationConfig(event_id);
    if (!config) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    if (config.registration_mode === 'booking') {
      return res.status(400).json({ success: false, message: 'This event uses seat booking, not registration' });
    }

    if (config.participation_type === 'team' && !team_name) {
      return res.status(400).json({ success: false, message: 'team_name is required for team events' });
    }
    if (config.participation_type === 'team' && !team_size) {
      return res.status(400).json({ success: false, message: 'team_size is required for team events' });
    }

    const out = await callRegisterProc({
      user_id: req.user.user_id,
      event_id: Number(event_id),
      session_id: session_id ? Number(session_id) : null,
      participant_type,
      college_name,
      team_name,
      team_size,
    });

    if (out.result_code !== 0) {
      const statusMap = { 1: 400, 2: 409, 3: 400, 4: 409, 5: 500 };
      return res.status(statusMap[out.result_code] || 400).json({ success: false, message: out.result_msg });
    }

    const registration_id = out.registration_id;

    // Free registration — generate receipt then respond
    if (config.registration_mode === 'free_registration') {
      const registration = await getRegistrationById(registration_id);
      // Fire-and-forget receipt generation (non-blocking)
      generateAndUploadReceipt(registration_id);
      return res.status(201).json({ success: true, message: 'Registration confirmed', data: { registration } });
    }

    // Paid registration — create Razorpay order
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
      amount:   Math.round(Number(config.registration_fee) * 100), // paise
      currency: 'INR',
      receipt:  `reg_${registration_id}`,
      notes: {
        type:            'registration',
        registration_id: String(registration_id),
        event_id:        String(event_id),
        user_id:         String(req.user.user_id),
      },
    });

    await saveRazorpayOrder(registration_id, order.id);

    return res.status(201).json({
      success: true,
      message: 'Registration created — proceed to payment',
      data: {
        registration_id,
        razorpay_order_id: order.id,
        razorpay_key:      process.env.RAZORPAY_TEST_KEY,
        amount:            Math.round(Number(config.registration_fee) * 100),
        event_title:       config.title,
      },
    });

  } catch (err) {
    console.error('[Registration] register error:', err.message);
    return res.status(500).json({ success: false, message: 'Registration failed' });
  }
};


// ── GET /api/registration/my ──────────────────────────────────────────────────
const getMyRegistrations = async (req, res) => {
  try {
    const registrations = await getRegistrationsByUser(req.user.user_id);
    return res.status(200).json({ success: true, data: registrations });
  } catch (err) {
    console.error('[Registration] getMyRegistrations error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch registrations' });
  }
};


// ── GET /api/registration/:registration_id ────────────────────────────────────
const getRegistration = async (req, res) => {
  try {
    const reg = await getRegistrationById(req.params.registration_id);
    if (!reg) return res.status(404).json({ success: false, message: 'Registration not found' });
    if (reg.user_id && reg.user_id !== req.user.user_id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    return res.status(200).json({ success: true, data: reg });
  } catch (err) {
    console.error('[Registration] getRegistration error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch registration' });
  }
};


// ── GET /api/registration/event/:event_id  (organizer only) ──────────────────
const getEventRegistrations = async (req, res) => {
  try {
    const registrations = await getRegistrationsByEvent(req.params.event_id);
    return res.status(200).json({ success: true, data: registrations });
  } catch (err) {
    console.error('[Registration] getEventRegistrations error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not fetch registrations' });
  }
};


// ── DELETE /api/registration/:registration_id ─────────────────────────────────
const cancelReg = async (req, res) => {
  try {
    const affected = await cancelRegistration(req.params.registration_id, req.user.user_id);
    if (!affected) {
      return res.status(404).json({ success: false, message: 'Registration not found or already cancelled' });
    }
    return res.status(200).json({ success: true, message: 'Registration cancelled' });
  } catch (err) {
    console.error('[Registration] cancelReg error:', err.message);
    return res.status(500).json({ success: false, message: 'Could not cancel registration' });
  }
};


module.exports = {
  generateAndUploadReceipt,
  register,
  getMyRegistrations,
  getRegistration,
  getEventRegistrations,
  cancelReg,
};