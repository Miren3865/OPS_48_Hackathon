const express = require('express');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { sendVerificationEmail } = require('../utils/mailer');

const router = express.Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });

/** Returns a raw token (sent in email) and its SHA-256 hash (stored in DB). */
const generateVerificationToken = () => {
  const raw = crypto.randomBytes(32).toString('hex');
  const hashed = crypto.createHash('sha256').update(raw).digest('hex');
  return { raw, hashed };
};

// ─── Rate Limiters ────────────────────────────────────────────────────────────

const verifyEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { message: 'Too many verification attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const resendLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { message: 'Too many resend requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Register ─────────────────────────────────────────────────────────────────
// @route  POST /api/auth/register
// @access Public
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, email, password } = req.body;

      const existingUser = await User.findOne({ email });

      // If the email exists but is already verified, reject
      if (existingUser && existingUser.isVerified) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const { raw, hashed } = generateVerificationToken();
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      let user;
      if (existingUser && !existingUser.isVerified) {
        // Update the existing unverified account with a fresh token
        existingUser.verificationToken = hashed;
        existingUser.verificationTokenExpiry = expiry;
        user = await existingUser.save();
      } else {
        user = await User.create({
          name,
          email,
          password,
          isVerified: false,
          verificationToken: hashed,
          verificationTokenExpiry: expiry,
        });
      }

      console.log('─── REGISTER ───────────────────────────────────');
      console.log('EMAIL  :', email);
      console.log('RAW    :', raw);
      console.log('HASHED :', hashed);
      console.log('EXPIRY :', expiry);
      console.log('DB _id :', user._id.toString());
      console.log('────────────────────────────────────────────────');

      try {
        await sendVerificationEmail(email, name, raw);
      } catch (emailErr) {
        console.error('Verification email failed to send:', emailErr.message);
      }

      res.status(201).json({
        message: 'Account created! Please check your inbox and verify your email before logging in.',
        email,
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({ message: 'Server error during registration' });
    }
  }
);

// ─── Login ────────────────────────────────────────────────────────────────────
// @route  POST /api/auth/login
// @access Public
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email }).select('+password');
      if (!user || !(await user.matchPassword(password))) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      if (!user.isVerified) {
        return res.status(403).json({
          message: 'Please verify your email before logging in.',
          unverified: true,
          email: user.email,
        });
      }

      res.json({
        token: generateToken(user._id),
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          teams: user.teams,
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error during login' });
    }
  }
);

// ─── Verify Email ─────────────────────────────────────────────────────────────
// @route  GET /api/auth/verify-email?token=XYZ
// @access Public
router.get('/verify-email', verifyEmailLimiter, async (req, res) => {
  const rawToken = req.query.token;

  if (!rawToken || typeof rawToken !== 'string') {
    return res.status(400).json({ message: 'Verification token is required.' });
  }

  try {
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    console.log('─── VERIFY ─────────────────────────────────────');
    console.log('RAW TOKEN   :', rawToken);
    console.log('HASHED TOKEN:', hashedToken);

    // Step 1: find by token hash only (ignore expiry first)
    const user = await User.findOne({ verificationToken: hashedToken });

    // Idempotency: if token is gone, check whether this user is already verified
    if (!user) {
      // Try to find by email is not possible without email in query.
      // Instead, treat a missing token as "already verified or truly invalid".
      // Look for any user whose token matches — if none, check if there's a
      // recently-verified user (covers StrictMode double-invoke race).
      console.log('DB USER FOUND: null — checking if already verified...');
      console.log('────────────────────────────────────────────────');
      return res.status(400).json({
        message: 'Invalid verification link. Please request a new one.',
        expired: true,
      });
    }

    console.log('DB USER FOUND:', `${user.email} | expiry: ${user.verificationTokenExpiry} | isVerified: ${user.isVerified}`);
    console.log('────────────────────────────────────────────────');

    // Idempotency: already verified (e.g. StrictMode second call)
    if (user.isVerified) {
      return res.json({ message: 'Email verified successfully! You can now log in.' });
    }

    // Step 2: check expiry
    if (new Date(user.verificationTokenExpiry).getTime() < Date.now()) {
      return res.status(400).json({
        message: 'Verification link has expired. Please request a new one.',
        expired: true,
      });
    }

    // Step 3: mark verified and clear token fields atomically
    await User.updateOne(
      { _id: user._id },
      {
        $set: { isVerified: true },
        $unset: { verificationToken: '', verificationTokenExpiry: '' },
      }
    );

    res.json({ message: 'Email verified successfully! You can now log in.' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
});

// ─── Resend Verification ──────────────────────────────────────────────────────
// @route  POST /api/auth/resend-verification
// @access Public
router.post(
  '/resend-verification',
  resendLimiter,
  [body('email').isEmail().withMessage('Valid email required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email } = req.body;
      const user = await User.findOne({ email });

      // Always return the same message to prevent email enumeration
      if (!user || user.isVerified) {
        return res.json({
          message:
            'If that email exists and is unverified, a new verification email has been sent.',
        });
      }

      const { raw, hashed } = generateVerificationToken();
      const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Send email FIRST — only persist the new token if delivery succeeds.
      try {
        await sendVerificationEmail(user.email, user.name, raw);
        // Email delivered — atomically update the token in DB
        await User.updateOne(
          { _id: user._id },
          { $set: { verificationToken: hashed, verificationTokenExpiry: expiry } }
        );
        console.log('Resend OK — new token saved for', user.email);
      } catch (emailErr) {
        console.error('Resend email failed:', emailErr.message);
        // DB token unchanged — existing link (if any) still valid
      }

      res.json({
        message:
          'If that email exists and is unverified, a new verification email has been sent.',
      });
    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({ message: 'Server error during resend' });
    }
  }
);

// ─── Get Me ───────────────────────────────────────────────────────────────────
// @route  GET /api/auth/me
// @access Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('teams', 'name inviteCode');
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      teams: user.teams,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
