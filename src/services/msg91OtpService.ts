/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// MSG91 Headless OTP Service for Custom UI Integration

declare global {
  interface Window {
    initSendOTP?: (config: any) => void;
    configuration?: any;
    msg91Configuration?: any;
    sendOtp?: (identifier: string, success?: (data: any) => void, failure?: (error: any) => void) => void;
    retryOtp?: (channel: string | null, success?: (data: any) => void, failure?: (error: any) => void, reqId?: string) => void;
    verifyOtp?: (otp: string | number, success?: (data: any) => void, failure?: (error: any) => void, reqId?: string) => void;
    getWidgetData?: () => any;
    isCaptchaVerified?: () => boolean;
  }
}

export interface MSG91Config {
  widgetId: string;
  tokenAuth: string;
  identifier?: string;
  exposeMethods: boolean;
  captchaRenderId?: string;
  success?: (data: any) => void;
  failure?: (error: any) => void;
}

export interface OTPResponse {
  success: boolean;
  message?: string;
  data?: any;
  accessToken?: string;
  error?: string;
  reqId?: string;
}

export const DEFAULT_MSG91_CONFIG: MSG91Config = {
  widgetId: "366745687850303433373438",
  tokenAuth: "555226TgzLN8cZ6a698ec8P1",
  exposeMethods: true,
  captchaRenderId: '',
  success: (data: any) => {
    console.log('[MSG91 Headless] Global Success response:', data);
  },
  failure: (error: any) => {
    console.warn('[MSG91 Headless] Global Failure response:', error);
  }
};

/**
 * Initializes the MSG91 Headless script & exposed methods
 */
export async function initializeMSG91(customConfig?: Partial<MSG91Config>): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const config: MSG91Config = {
    ...DEFAULT_MSG91_CONFIG,
    ...customConfig,
    exposeMethods: true
  };

  window.configuration = config;
  window.msg91Configuration = config;

  if (typeof window.sendOtp === 'function' && typeof window.verifyOtp === 'function') {
    return true;
  }

  // Check if initSendOTP is already available
  if (typeof window.initSendOTP === 'function') {
    try {
      window.initSendOTP(config);
      return true;
    } catch (e) {
      console.warn('[MSG91] Error calling initSendOTP:', e);
    }
  }

  // Load the script dynamically if not already loaded
  return new Promise((resolve) => {
    const existingScript = document.querySelector('script[src="https://verify.msg91.com/otp-provider.js"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://verify.msg91.com/otp-provider.js';
      script.async = true;
      script.onload = () => {
        if (typeof window.initSendOTP === 'function') {
          try {
            window.initSendOTP(config);
          } catch (err) {
            console.error('[MSG91] Error in initSendOTP after load:', err);
          }
        }
        resolve(true);
      };
      script.onerror = (err) => {
        console.error('[MSG91] Failed to load MSG91 otp-provider.js script:', err);
        resolve(false);
      };
      document.body.appendChild(script);
    } else {
      if (typeof window.initSendOTP === 'function') {
        window.initSendOTP(config);
      }
      resolve(true);
    }
  });
}

/**
 * Formats a phone number or email for MSG91 Identifier.
 * For mobile numbers: country code + 10 digits without '+' (e.g. 919425011088).
 */
export function formatMSG91Identifier(identifier: string): string {
  const trimmed = identifier.trim();
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  return digits;
}

/**
 * Headless Send OTP using window.sendOtp with server sync
 */
export async function sendMSG91Otp(identifier: string): Promise<OTPResponse> {
  await initializeMSG91();

  const formattedId = formatMSG91Identifier(identifier);

  // Sync window configuration with the new target identifier
  if (typeof window !== 'undefined') {
    if (window.configuration) {
      window.configuration.identifier = formattedId;
    }
    if (typeof window.initSendOTP === 'function') {
      try {
        window.initSendOTP(window.configuration || { ...DEFAULT_MSG91_CONFIG, identifier: formattedId });
      } catch (e) {
        console.warn('[MSG91] initSendOTP update notice:', e);
      }
    }
  }

  // Dual dispatch: Ensure backend activeOtpStore is also primed
  const serverDispatchPromise = fetch('/api/auth/otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: identifier, email: identifier, identifier })
  }).then(r => r.json()).catch(err => ({ success: false, error: err.message }));

  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && typeof window.sendOtp === 'function') {
      try {
        console.log(`[MSG91 Headless] Sending OTP to ${formattedId}...`);
        window.sendOtp(
          formattedId,
          async (data: any) => {
            console.log('[MSG91 Headless] OTP sent successfully:', data);
            const serverData = await serverDispatchPromise;
            const finalReqId = data?.reqId || data?.requestId || serverData?.reqId;
            resolve({
              success: true,
              message: typeof data === 'string' ? data : (data?.message || 'OTP verification code sent via SMS.'),
              data,
              reqId: finalReqId
            });
          },
          async (error: any) => {
            console.warn('[MSG91 Headless] Error from window.sendOtp, checking server dispatch:', error);
            const serverData = await serverDispatchPromise;
            if (serverData && serverData.success) {
              resolve({
                success: true,
                message: serverData.message || 'OTP verification code dispatched via SMS.',
                data: serverData,
                reqId: serverData.reqId
              });
            } else {
              resolve({
                success: false,
                error: typeof error === 'string' ? error : (error?.message || error?.error || serverData?.error || 'Failed to dispatch OTP passcode via SMS.'),
                data: error
              });
            }
          }
        );
      } catch (err: any) {
        console.error('[MSG91 Headless] Exception calling window.sendOtp:', err);
        serverDispatchPromise.then(serverData => {
          if (serverData && serverData.success) {
            resolve({
              success: true,
              message: serverData.message || 'OTP verification code dispatched via SMS.',
              data: serverData,
              reqId: serverData.reqId
            });
          } else {
            resolve({
              success: false,
              error: err.message || 'Failed to trigger MSG91 sendOtp.'
            });
          }
        });
      }
    } else {
      console.warn('[MSG91 Headless] window.sendOtp not available, using backend API dispatch');
      serverDispatchPromise
        .then(serverData => {
          if (serverData && serverData.success) {
            resolve({
              success: true,
              message: serverData.message || 'OTP sent successfully.',
              data: serverData,
              reqId: serverData.reqId
            });
          } else {
            resolve({
              success: false,
              error: serverData?.error || 'Failed to dispatch OTP.'
            });
          }
        })
        .catch(err => {
          resolve({
            success: false,
            error: err.message || 'Connection error while dispatching OTP.'
          });
        });
    }
  });
}

/**
 * Headless Retry OTP using window.retryOtp
 * Channel options:
 * - null : Default configuration
 * - '11' : SMS
 * - '4'  : Voice
 * - '3'  : Email
 * - '12' : WhatsApp
 */
export async function retryMSG91Otp(
  channel: '11' | '4' | '3' | '12' | null = null,
  reqId?: string,
  identifier?: string
): Promise<OTPResponse> {
  await initializeMSG91();

  // Sync server store on retry
  const target = identifier || (typeof window !== 'undefined' ? window.configuration?.identifier : '');
  const serverRetryPromise = target ? fetch('/api/auth/otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone: target, email: target, identifier: target })
  }).then(r => r.json()).catch(() => null) : Promise.resolve(null);

  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && typeof window.retryOtp === 'function') {
      try {
        console.log(`[MSG91 Headless] Retrying OTP (Channel: ${channel || 'default'}, ReqId: ${reqId || 'none'})...`);
        window.retryOtp(
          channel,
          async (data: any) => {
            console.log('[MSG91 Headless] Resend OTP success data:', data);
            const sData = await serverRetryPromise;
            resolve({
              success: true,
              message: typeof data === 'string' ? data : (data?.message || 'New OTP passcode resent successfully via SMS.'),
              data,
              reqId: data?.reqId || data?.requestId || sData?.reqId || reqId
            });
          },
          async (error: any) => {
            console.warn('[MSG91 Headless] Resend OTP error, falling back to new dispatch:', error);
            const sData = await serverRetryPromise;
            if (sData && sData.success) {
              resolve({
                success: true,
                message: 'New OTP passcode resent successfully via SMS.',
                data: sData,
                reqId: sData.reqId || reqId
              });
            } else {
              resolve({
                success: false,
                error: typeof error === 'string' ? error : (error?.message || 'Failed to retry OTP delivery. Please wait a moment before requesting again.')
              });
            }
          },
          reqId
        );
      } catch (err: any) {
        console.error('[MSG91 Headless] Exception calling window.retryOtp:', err);
        serverRetryPromise.then(sData => {
          if (sData && sData.success) {
            resolve({
              success: true,
              message: 'New OTP passcode resent successfully via SMS.',
              data: sData,
              reqId: sData.reqId || reqId
            });
          } else {
            resolve({
              success: false,
              error: err.message || 'Failed to trigger MSG91 retryOtp.'
            });
          }
        });
      }
    } else {
      if (target) {
        serverRetryPromise.then(sData => {
          if (sData && sData.success) {
            resolve({
              success: true,
              message: 'New OTP passcode resent successfully via SMS.',
              data: sData,
              reqId: sData.reqId || reqId
            });
          } else {
            resolve({
              success: false,
              error: sData?.error || 'Failed to resend OTP.'
            });
          }
        });
      } else {
        resolve({
          success: false,
          error: 'MSG91 retryOtp method is not initialized.'
        });
      }
    }
  });
}

/**
 * Headless Verify OTP using window.verifyOtp with fallback to backend validation
 * Extracts the access token on success and returns it.
 */
export async function verifyMSG91Otp(
  otpValue: string | number,
  reqId?: string,
  identifier?: string
): Promise<OTPResponse> {
  await initializeMSG91();

  const cleanOtp = String(otpValue).trim();
  const targetId = identifier || (typeof window !== 'undefined' ? window.configuration?.identifier : '');

  // Helper for server-side verification fallback
  const verifyWithServer = async (): Promise<OTPResponse> => {
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: targetId,
          phone: targetId,
          code: cleanOtp,
          reqId
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        return {
          success: true,
          message: data.message || 'OTP verified successfully.',
          accessToken: data.accessToken || 'server_verified_otp_session',
          data
        };
      }
      return {
        success: false,
        error: data.error || 'Incorrect or expired verification code. Please check your SMS for the latest OTP.'
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Verification connection failure.'
      };
    }
  };

  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && typeof window.verifyOtp === 'function') {
      try {
        console.log(`[MSG91 Headless] Verifying OTP code: ${cleanOtp}...`);
        window.verifyOtp(
          cleanOtp,
          async (data: any) => {
            console.log('[MSG91 Headless] OTP verify callback response:', data);

            // Check if response contains an error status or expired message
            const isErrorResponse = data && (
              data.type === 'error' ||
              data.status === 'error' ||
              data.status === 'fail' ||
              (typeof data === 'string' && (data.toLowerCase().includes('expired') || data.toLowerCase().includes('invalid') || data.toLowerCase().includes('fail'))) ||
              (typeof data?.message === 'string' && (data.message.toLowerCase().includes('expired') || data.message.toLowerCase().includes('invalid') || data.message.toLowerCase().includes('fail')))
            );

            if (isErrorResponse) {
              console.warn('[MSG91 Headless] window.verifyOtp returned failure status, checking server-side validation...');
              const serverRes = await verifyWithServer();
              if (serverRes.success) {
                resolve(serverRes);
              } else {
                const errMsg = typeof data === 'string' ? data : (data?.message || serverRes.error || 'Incorrect or expired verification code.');
                resolve({
                  success: false,
                  error: errMsg,
                  data
                });
              }
              return;
            }

            // Extract the access token / JWT token from the response
            const token = typeof data === 'string' 
              ? (data.length > 15 ? data : '')
              : (data?.['access-token'] || data?.accessToken || data?.token || data?.jwt || (data?.message && typeof data.message === 'string' && data.message.includes('.') ? data.message : ''));

            resolve({
              success: true,
              message: 'OTP verified successfully.',
              accessToken: token || (typeof data === 'string' ? data : JSON.stringify(data)),
              data
            });
          },
          async (error: any) => {
            console.warn('[MSG91 Headless] OTP verification error from MSG91 widget, testing server fallback:', error);
            const serverRes = await verifyWithServer();
            if (serverRes.success) {
              resolve(serverRes);
            } else {
              const errMsg = typeof error === 'string' ? error : (error?.message || error?.error || serverRes.error || 'Incorrect or expired verification code. Please check your SMS for the latest OTP.');
              resolve({
                success: false,
                error: errMsg,
                data: error
              });
            }
          }
        );
      } catch (err: any) {
        console.error('[MSG91 Headless] Exception calling window.verifyOtp:', err);
        verifyWithServer().then(resolve);
      }
    } else {
      // Fallback verification to backend API
      verifyWithServer().then(resolve);
    }
  });
}

/**
 * Verifies the MSG91 access-token on our backend server
 */
export async function verifyServerAccessToken(accessToken: string): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    const res = await fetch('/api/auth/verify-msg91-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken })
    });
    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, data: data.data || data };
    }
    return { success: false, error: data.error || 'Access token verification failed on server.' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error verifying access token.' };
  }
}

/**
 * Returns current widget data
 */
export function getMSG91WidgetData(): any {
  if (typeof window !== 'undefined' && typeof window.getWidgetData === 'function') {
    return window.getWidgetData();
  }
  return null;
}

/**
 * Checks if Captcha is verified
 */
export function isMSG91CaptchaVerified(): boolean {
  if (typeof window !== 'undefined' && typeof window.isCaptchaVerified === 'function') {
    return window.isCaptchaVerified();
  }
  return false;
}

/**
 * Direct OTP Login using Identifier (Phone or Email) + Code/AccessToken
 */
export async function performOtpLogin(params: {
  identifier: string;
  code?: string;
  reqId?: string;
  accessToken?: string;
}): Promise<{ success: boolean; user?: any; token?: string; error?: string }> {
  try {
    const res = await fetch('/api/auth/otp-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (res.ok && data.user) {
      return { success: true, user: data.user, token: data.token };
    }
    return { success: false, error: data.error || 'OTP Login failed' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error during OTP Login' };
  }
}

/**
 * Change Mobile with OTP verification
 */
export async function performChangeMobile(params: {
  newPhone: string;
  code?: string;
  reqId?: string;
  token?: string;
}): Promise<{ success: boolean; user?: any; error?: string; message?: string }> {
  try {
    const token = params.token || localStorage.getItem('token') || localStorage.getItem('grams_auth_token');
    const res = await fetch('/api/auth/change-mobile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        newPhone: params.newPhone,
        code: params.code,
        reqId: params.reqId
      })
    });
    const data = await res.json();
    if (res.ok && data.user) {
      return { success: true, user: data.user, message: data.message };
    }
    return { success: false, error: data.error || 'Failed to update mobile number' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error updating mobile number' };
  }
}

/**
 * Change Email with OTP verification
 */
export async function performChangeEmail(params: {
  newEmail: string;
  code?: string;
  reqId?: string;
  token?: string;
}): Promise<{ success: boolean; user?: any; token?: string; error?: string; message?: string }> {
  try {
    const token = params.token || localStorage.getItem('token') || localStorage.getItem('grams_auth_token');
    const res = await fetch('/api/auth/change-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        newEmail: params.newEmail,
        code: params.code,
        reqId: params.reqId
      })
    });
    const data = await res.json();
    if (res.ok && data.user) {
      return { success: true, user: data.user, token: data.token, message: data.message };
    }
    return { success: false, error: data.error || 'Failed to update email address' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error updating email address' };
  }
}
