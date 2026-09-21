/**
 * Comprehensive Automated End-to-End Integration Test Runner
 * Tests: Database Sync, SMTP Transporter, Auth Lifecycle, OTP, Profile, CRUD, Password Reset, Email Change, Email Templating
 */
process.env.NODE_ENV = 'development';
require('dotenv').config();

const assert = require('assert');
const { initDatabase, getActiveDialect } = require('../src/config/database');
const { verifyEmailTransporter, getSmtpStatus } = require('../src/config/email');
const emailService = require('../src/services/email.service');
const authService = require('../src/services/auth.service');
const itemService = require('../src/services/item.service');
const { User, Otp, Item } = require('../src/models');

const testRunId = Date.now();
const testUser = {
  name: 'Farmanullah Automated Tester',
  email: `test.user.${testRunId}@gmail.com`,
  password: 'TestPassword2026!',
  newEmail: `test.updated.${testRunId}@gmail.com`,
  newPassword: 'UpdatedPassword2026!'
};

const runAllTests = async () => {
  console.log('====================================================');
  console.log('🧪 Starting Full Integration & Verification Test Suite');
  console.log('====================================================\n');

  try {
    // 1. Database Initialization
    console.log('[Test 1] Testing Database Initialization & Sync...');
    await initDatabase();
    console.log(`[PASS] Database initialized with dialect: ${getActiveDialect()}`);

    // 2. Transporter Verification
    console.log('\n[Test 2] Testing SMTP Configuration & Transporter...');
    await verifyEmailTransporter();
    const smtp = getSmtpStatus();
    console.log(`[PASS] Transporter verified. Status: ${smtp.connected ? 'Connected' : 'Standby'}`);

    // 3. Email Template Rendering Verification (All 10 templates)
    console.log('\n[Test 3] Testing Dynamic Handlebars Email Layout & Templates...');
    const templatesToTest = [
      'signup-verification',
      'welcome',
      'login-alert',
      'otp-verification',
      'password-reset',
      'password-changed',
      'email-change-request',
      'email-changed-notice',
      'account-deleted',
      'test-email'
    ];

    for (const tName of templatesToTest) {
      const { html } = emailService.renderEmailHtml(tName, {
        name: 'Test User',
        recipientEmail: 'test@example.com',
        otpCode: '654321',
        expiryMinutes: 10,
        formattedDate: new Date().toUTCString(),
        ipAddress: '127.0.0.1',
        userAgent: 'Integration Test Runner',
        newEmail: 'new@example.com',
        currentEmail: 'old@example.com',
        role: 'user',
        subject: `Preview of ${tName}`
      }, 'main');

      assert(html.includes('Farmanullah Ansari Company'), `Template ${tName} missing brand name`);
      assert(html.includes('<!DOCTYPE html>'), `Template ${tName} missing HTML DOCTYPE`);
      assert(html.includes('{{{body}}}') === false, `Template ${tName} has unrendered {{{body}}}`);
      console.log(`  - Compiled & Rendered: ${tName}.handlebars (OK)`);
    }
    console.log('[PASS] All 10 Handlebars email templates compiled and injected into main.handlebars successfully.');

    // 4. Signup Flow
    console.log('\n[Test 4] Testing User Signup & OTP Generation...');
    const signupResult = await authService.signup({
      name: testUser.name,
      email: testUser.email,
      password: testUser.password
    });
    assert.strictEqual(signupResult.isVerified, false, 'User must initially be unverified');
    assert.strictEqual(signupResult.debugOtp, undefined, 'Debug OTP must NEVER be exposed in production/client response');
    
    // Retrieve OTP for testing from the Otp service / database
    const signupOtpRecord = await Otp.findOne({
      where: { email: testUser.email.toLowerCase(), isUsed: false },
      order: [['createdAt', 'DESC']]
    });
    assert(signupOtpRecord, 'Active OTP record must exist in DB');
    console.log(`[PASS] User created with ID: ${signupResult.user.id}. OTP successfully dispatched and hidden from API.`);

    // 5. Email Verification with OTP
    console.log('\n[Test 5] Testing Email Verification with OTP...');
    // We test verifyOtp helper
    const testCode = '123456';
    // Update hash so we can verify with known code deterministically
    const testHash = require('../src/services/otp.service').hashOtp(testCode);
    await signupOtpRecord.update({ codeHash: testHash });

    const verifyResult = await authService.verifyEmail({
      email: testUser.email,
      code: testCode
    });
    assert.strictEqual(verifyResult.user.isVerified, true, 'User should now be verified');
    assert(verifyResult.tokens.accessToken, 'Access token must be returned');
    assert(verifyResult.tokens.refreshToken, 'Refresh token must be returned');
    let currentAccessToken = verifyResult.tokens.accessToken;
    let currentRefreshToken = verifyResult.tokens.refreshToken;
    console.log('[PASS] Email verified successfully; JWT access and refresh tokens issued.');

    // 6. Login Flow
    console.log('\n[Test 6] Testing Login Flow...');
    const loginResult = await authService.login({
      email: testUser.email,
      password: testUser.password,
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent'
    });
    assert(loginResult.tokens.accessToken, 'Access token must be returned on login');
    currentAccessToken = loginResult.tokens.accessToken;
    console.log('[PASS] User authenticated and fresh tokens issued.');

    // 7. CRUD Resource Operations (Items)
    console.log('\n[Test 7] Testing CRUD Operations (Item Model)...');
    const createdItem = await itemService.createItem({
      userId: verifyResult.user.id,
      data: {
        title: 'Production Email Integration',
        description: 'Testing CRUD operations for Node.js SMTP suite',
        category: 'testing',
        tags: ['smtp', 'nodejs', 'jest'],
        status: 'active',
        priority: 'high'
      }
    });
    assert(createdItem.id, 'Item ID should exist');
    console.log(`  - Created Item ID: ${createdItem.id}`);

    // Read list
    const itemsList = await itemService.getItems({
      userId: verifyResult.user.id,
      page: 1,
      limit: 10
    });
    assert(itemsList.items.length >= 1, 'Should find at least 1 item');
    console.log(`  - Listed Items: ${itemsList.items.length} items found (OK)`);

    // Update item
    const updatedItem = await itemService.updateItem({
      id: createdItem.id,
      userId: verifyResult.user.id,
      role: 'user',
      data: { title: 'Production Email Integration (Updated)' }
    });
    assert.strictEqual(updatedItem.title, 'Production Email Integration (Updated)');
    console.log(`  - Updated Item title to: '${updatedItem.title}' (OK)`);

    // Get item stats
    const stats = await itemService.getItemStats({
      userId: verifyResult.user.id,
      role: 'user'
    });
    assert(stats.total >= 1, 'Item stats total should be >= 1');
    console.log(`  - Item Stats: Total=${stats.total}, Active=${stats.active} (OK)`);

    // Delete item
    const deleteResult = await itemService.deleteItem({
      id: createdItem.id,
      userId: verifyResult.user.id,
      role: 'user'
    });
    assert.strictEqual(deleteResult.id, createdItem.id);
    console.log(`  - Deleted Item: ${deleteResult.id} (OK)`);
    console.log('[PASS] All CRUD operations (Create, Read, Update, Delete, Stats) passed.');

    // 8. Password Reset Flow
    console.log('\n[Test 8] Testing Password Reset Flow (Forgot -> Verify OTP -> Reset)...');
    const forgotResult = await authService.forgotPassword({
      email: testUser.email,
      ipAddress: '127.0.0.1'
    });
    assert.strictEqual(forgotResult.debugOtp, undefined, 'Reset OTP must NOT be exposed in response');

    const resetOtpRecord = await Otp.findOne({
      where: { email: testUser.email.toLowerCase(), purpose: 'password_reset', isUsed: false },
      order: [['createdAt', 'DESC']]
    });
    assert(resetOtpRecord, 'Reset OTP record must exist in DB');
    const resetTestCode = '654321';
    await resetOtpRecord.update({ codeHash: require('../src/services/otp.service').hashOtp(resetTestCode) });

    const verifyReset = await authService.verifyResetOtp({
      email: testUser.email,
      code: resetTestCode
    });
    assert(verifyReset.resetToken, 'Reset token should be issued');

    const resetResult = await authService.resetPassword({
      email: testUser.email,
      resetToken: verifyReset.resetToken,
      newPassword: testUser.newPassword,
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent'
    });
    assert(resetResult.message.includes('successfully'));

    // Verify login works with NEW password
    const newLoginResult = await authService.login({
      email: testUser.email,
      password: testUser.newPassword,
      ipAddress: '127.0.0.1',
      userAgent: 'Test Agent'
    });
    assert(newLoginResult.tokens.accessToken, 'Login with new password must succeed');
    console.log('[PASS] Password successfully reset and authenticated with new password.');

    // 9. Email Change Flow
    console.log('\n[Test 9] Testing Email Change Flow (Request -> OTP -> Verify)...');
    const dbUser = await User.findByPk(verifyResult.user.id);
    const emailChangeReq = await authService.requestEmailChange({
      user: dbUser,
      newEmail: testUser.newEmail,
      currentPassword: testUser.newPassword,
      ipAddress: '127.0.0.1'
    });
    assert.strictEqual(emailChangeReq.debugOtp, undefined, 'Email change OTP must NOT be exposed');

    const emailChangeOtpRecord = await Otp.findOne({
      where: { email: testUser.newEmail.toLowerCase(), purpose: 'email_change', isUsed: false },
      order: [['createdAt', 'DESC']]
    });
    assert(emailChangeOtpRecord, 'Email change OTP record must exist');
    const emailChangeCode = '888999';
    await emailChangeOtpRecord.update({ codeHash: require('../src/services/otp.service').hashOtp(emailChangeCode) });

    const emailChangeVerify = await authService.verifyEmailChange({
      user: dbUser,
      code: emailChangeCode,
      ipAddress: '127.0.0.1'
    });
    assert.strictEqual(emailChangeVerify.user.email, testUser.newEmail.toLowerCase());
    console.log(`[PASS] Email address successfully transitioned to: ${emailChangeVerify.user.email}`);

    // 10. Refresh Token Flow
    console.log('\n[Test 10] Testing Refresh Token Rotation...');
    const rotatedTokens = await authService.refreshAccessToken(currentRefreshToken);
    assert(rotatedTokens.accessToken, 'Rotated access token should exist');
    console.log('[PASS] Token rotation verified.');

    // Clean up test user
    console.log('\n[Clean Up] Cleaning up test records...');
    await User.destroy({ where: { id: dbUser.id } });
    console.log('[PASS] Test database cleaned up.');

    console.log('\n====================================================');
    console.log('🎉 ALL 10 INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
    console.log('====================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ [TEST FAILURE]:', err);
    process.exit(1);
  }
};

runAllTests();
