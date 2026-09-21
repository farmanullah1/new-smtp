const crypto = require('crypto');
const { Otp } = require('../models');
const { OTP_EXPIRY_MINUTES, MAX_OTP_ATTEMPTS } = require('../config/constants');

const hashOtp = (code, salt = process.env.JWT_SECRET || 'otp_default_salt') => {
  return crypto.createHmac('sha256', salt).update(String(code)).digest('hex');
};

/**
 * Generate a 6-digit cryptographic OTP and persist record
 */
const generateOtp = async ({ email, purpose, userId = null, metadata = null, expiryMinutes = OTP_EXPIRY_MINUTES }) => {
  const normalizedEmail = email.toLowerCase().trim();

  // Invalidate previous active OTPs for this email and purpose
  await Otp.update(
    { isUsed: true },
    {
      where: {
        email: normalizedEmail,
        purpose,
        isUsed: false
      }
    }
  );

  // Generate 6-digit random number: 100000 to 999999
  const rawCode = crypto.randomInt(100000, 1000000).toString();
  const codeHash = hashOtp(rawCode);
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  const otpRecord = await Otp.create({
    userId,
    email: normalizedEmail,
    codeHash,
    purpose,
    metadata,
    attempts: 0,
    isUsed: false,
    expiresAt
  });

  return {
    rawCode,
    otpRecord,
    expiryMinutes,
    expiresAt
  };
};

/**
 * Validate submitted OTP code against active record
 */
const verifyOtp = async ({ email, purpose, code }) => {
  const normalizedEmail = email.toLowerCase().trim();
  const stringCode = String(code).trim();

  const otpRecord = await Otp.findOne({
    where: {
      email: normalizedEmail,
      purpose,
      isUsed: false
    },
    order: [['createdAt', 'DESC']]
  });

  if (!otpRecord) {
    return {
      isValid: false,
      reason: 'No active OTP request found or code has already been used'
    };
  }

  // Check expiration
  if (new Date() > new Date(otpRecord.expiresAt)) {
    await otpRecord.update({ isUsed: true });
    return {
      isValid: false,
      reason: 'OTP code has expired. Please request a new one'
    };
  }

  // Check attempt limit
  if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
    await otpRecord.update({ isUsed: true });
    return {
      isValid: false,
      reason: 'Maximum verification attempts exceeded. Code has been invalidated'
    };
  }

  // Verify hash
  const expectedHash = hashOtp(stringCode);
  const isMatch = crypto.timingSafeEqual(
    Buffer.from(expectedHash, 'hex'),
    Buffer.from(otpRecord.codeHash, 'hex')
  );

  if (!isMatch) {
    await otpRecord.increment('attempts', { by: 1 });
    const remainingAttempts = MAX_OTP_ATTEMPTS - (otpRecord.attempts + 1);
    return {
      isValid: false,
      reason: `Invalid OTP code. ${Math.max(0, remainingAttempts)} attempts remaining.`
    };
  }

  // Success: mark as used
  await otpRecord.update({ isUsed: true });

  return {
    isValid: true,
    otpRecord,
    metadata: otpRecord.metadata
  };
};

module.exports = {
  generateOtp,
  verifyOtp,
  hashOtp
};
