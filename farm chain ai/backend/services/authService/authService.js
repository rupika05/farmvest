/**
 * Subagent 2: Backend Authentication & Identity Verification Service
 * Handles OTP issuance, verification, and government persona sessions.
 */

class AuthService {
  constructor() {
    this.otpStore = new Map(); // identifier -> { otp, expiresAt, role }

    // Pre-configured official demo personas for instant testing
    this.demoAccounts = {
      farmer: {
        identifier: '9842100000',
        kisanId: 'PM-KISAN-TN-4921',
        name: 'முருகன் (M. Murugan)',
        nameEn: 'M. Murugan',
        role: 'farmer',
        roleTitle: 'Registered Farmer (உழவர்)',
        location: 'திண்டுக்கல், தமிழ்நாடு (Dindigul, TN)',
        mandi: 'Dindigul Regulated Market Yard',
        landArea: '4.5 Acres (செம்மண் நிலம்)',
        defaultOtp: '782419'
      },
      trader: {
        identifier: 'APMC-TN-8821',
        kisanId: 'TRADER-APMC-8821',
        name: 'கே. செல்வராஜ் (K. Selvaraj)',
        nameEn: 'K. Selvaraj',
        role: 'trader',
        roleTitle: 'Licensed Mandi Trader (மண்டி வர்த்தகர்)',
        location: 'கோயம்பேடு, சென்னை (Koyambedu, Chennai)',
        mandi: 'Koyambedu Wholesale Terminal Yard',
        licenseNo: 'TN-APMC-LIC-8821',
        defaultOtp: '782419'
      },
      admin: {
        identifier: 'agricofficer@nic.in',
        kisanId: 'GOVT-ADMIN-01',
        name: 'டாக்டர் ஆர். சுவாமிநாதன் (Dr. R. Swaminathan)',
        nameEn: 'Dr. R. Swaminathan',
        role: 'admin',
        roleTitle: 'Chief Agriculture Inspector & Forensic Auditor',
        location: 'சென்னை தலைமையகம் (State Secretariat, Chennai)',
        designation: 'Joint Director of Agriculture (e-Governance)',
        defaultOtp: '782419'
      }
    };
  }

  /**
   * Generates a 6-digit OTP for a farmer, trader, or official.
   */
  generateOtp(identifier, role = 'farmer') {
    const cleanId = (identifier || '').trim().toLowerCase();
    
    // Check if demo account
    const demo = Object.values(this.demoAccounts).find(
      a => a.identifier.toLowerCase() === cleanId || a.kisanId.toLowerCase() === cleanId
    );

    // Use high-entropy 6-digit OTP
    const otp = demo ? demo.defaultOtp : String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

    this.otpStore.set(cleanId, {
      otp,
      expiresAt,
      role: role || (demo ? demo.role : 'farmer'),
      accountData: demo || null
    });

    return {
      otp,
      expiresAt,
      isDemo: Boolean(demo)
    };
  }

  /**
   * Verifies the 6-digit OTP and returns the authenticated session user.
   */
  verifyOtp(identifier, otpInput, role = 'farmer') {
    const cleanId = (identifier || '').trim().toLowerCase();
    const cleanOtp = (otpInput || '').trim();

    // Check pre-configured demo shortcut (OTP 782419 is universal demo OTP)
    const demo = Object.values(this.demoAccounts).find(
      a => a.identifier.toLowerCase() === cleanId || a.kisanId.toLowerCase() === cleanId || a.role === role
    );

    if (cleanOtp === '782419' && demo) {
      return {
        valid: true,
        user: demo,
        token: `AUTH-TOKEN-${demo.role.toUpperCase()}-${Date.now()}`
      };
    }

    const record = this.otpStore.get(cleanId);
    if (!record) {
      // If no prior OTP requested, allow demo OTP 782419 for convenience
      if (cleanOtp === '782419') {
        const fallbackUser = demo || {
          identifier: cleanId,
          kisanId: `USER-${Date.now().toString().slice(-4)}`,
          name: cleanId.includes('@') ? 'Government Officer' : 'Verified Farmer',
          role: role || 'farmer',
          location: 'Tamil Nadu Agri Zone'
        };
        return {
          valid: true,
          user: fallbackUser,
          token: `AUTH-TOKEN-${fallbackUser.role.toUpperCase()}-${Date.now()}`
        };
      }

      return {
        valid: false,
        error: 'No active verification code found for this ID. Please request a new OTP.'
      };
    }

    if (Date.now() > record.expiresAt) {
      this.otpStore.delete(cleanId);
      return {
        valid: false,
        error: 'Verification code has expired. Please request a new OTP.'
      };
    }

    if (record.otp !== cleanOtp) {
      return {
        valid: false,
        error: 'Invalid verification code. Please check your SMS and try again.'
      };
    }

    // Success: consume OTP
    this.otpStore.delete(cleanId);

    const user = record.accountData || {
      identifier: cleanId,
      kisanId: `REG-${Date.now().toString().slice(-4)}`,
      name: role === 'admin' ? 'Authorized Government Inspector' : (role === 'trader' ? 'Authorized Mandi Trader' : 'Verified Kisan Member'),
      role: record.role,
      location: 'Tamil Nadu'
    };

    return {
      valid: true,
      user,
      token: `AUTH-TOKEN-${user.role.toUpperCase()}-${Date.now()}`
    };
  }

  getDemoAccounts() {
    return this.demoAccounts;
  }
}

export const authService = new AuthService();
