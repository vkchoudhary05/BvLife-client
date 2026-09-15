/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// MSG91 Headless OTP Service for Direct Widget Integration

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
  exposedMethods?: boolean;
  captchaRenderId?: string;
  captchaVerified?: (isVerified: boolean) => void;
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
  otp?: string;
}

export const DEFAULT_MSG91_CONFIG: MSG91Config = {
  widgetId: "366745687850303433373438",
  tokenAuth: "555226TgzLN8cZ6a698ec8P1",
  exposeMethods: true,
  exposedMethods: true,
  captchaRenderId: "msg91-captcha-container",
  captchaVerified: (isVerified: boolean) => {
    console.log('[MSG91 Widget] Captcha verification state changed:', isVerified);
    if (typeof window !== 'undefined') {
      try {
        window.dispatchEvent(new CustomEvent('msg91-captcha-status', { detail: { verified: !!isVerified } }));
      } catch (e) {}
    }
  },
  success: (data: any) => {
    console.log('[MSG91 Widget] Global success response:', data);
  },
  failure: (error: any) => {
    console.warn('[MSG91 Widget] Global failure response:', error);
  }
};

let isInitializingScript = false;

/**
 * Ensures MSG91 Widget is fully initialized and window.sendOtp & window.verifyOtp exist.
 * Waits dynamically for Angular component to boot and expose methods.
 */
export async function waitForMSG91Ready(maxTimeoutMs = 12000): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // If already exposed and ready, return immediately
  if (typeof window.sendOtp === 'function' && typeof window.verifyOtp === 'function') {
    return true;
  }

  // Ensure window.configuration is present
  if (!window.configuration) {
    window.configuration = { ...DEFAULT_MSG91_CONFIG };
  } else {
    window.configuration.exposeMethods = true;
  }

  // If window.initSendOTP exists, invoke it once if not already invoked
  if (typeof window.initSendOTP === 'function' && !(window as any).__msg91_init_invoked) {
    (window as any).__msg91_init_invoked = true;
    try {
      window.initSendOTP(window.configuration);
    } catch (e) {
      console.warn('[MSG91] initSendOTP invocation error:', e);
    }
  }

  // If script not yet injected, inject it into document.body
  if (typeof window.initSendOTP !== 'function' && !isInitializingScript) {
    isInitializingScript = true;
    const urls = [
      'https://verify.msg91.com/otp-provider.js',
      'https://verify.phone91.com/otp-provider.js'
    ];
    let i = 0;
    function attemptLoad() {
      const s = document.createElement('script');
      s.src = urls[i];
      s.async = true;
      s.onload = () => {
        if (typeof window.initSendOTP === 'function') {
          try {
            (window as any).__msg91_init_invoked = true;
            window.initSendOTP(window.configuration);
          } catch (e) {
            console.warn('[MSG91] initSendOTP exception on script load:', e);
          }
        }
      };
      s.onerror = () => {
        i++;
        if (i < urls.length) {
          attemptLoad();
        }
      };
      if (document.body) {
        document.body.appendChild(s);
      } else {
        document.head.appendChild(s);
      }
    }
    attemptLoad();
  }

  // Poll until window.sendOtp and window.verifyOtp are defined (or timeout)
  const startTime = Date.now();
  while (Date.now() - startTime < maxTimeoutMs) {
    if (typeof window.sendOtp === 'function' && typeof window.verifyOtp === 'function') {
      return true;
    }

    // If initSendOTP became available during polling, invoke it
    if (typeof window.initSendOTP === 'function' && !(window as any).__msg91_init_invoked) {
      (window as any).__msg91_init_invoked = true;
      try {
        window.initSendOTP(window.configuration);
      } catch (e) {
        console.warn('[MSG91] initSendOTP invocation in poll:', e);
      }
    }

    await new Promise((r) => setTimeout(r, 120));
  }

  return typeof window.sendOtp === 'function' && typeof window.verifyOtp === 'function';
}

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

  window.configuration = { ...(window.configuration || {}), ...config };
  return waitForMSG91Ready();
}

// Cache last successful reqId globally so verifyOtp never lacks it
let lastDispatchedReqId = '';

export function getLastDispatchedReqId(): string {
  if (lastDispatchedReqId && lastDispatchedReqId.trim()) {
    return lastDispatchedReqId.trim();
  }
  if (typeof window !== 'undefined' && (window as any).__msg91_last_req_id) {
    return String((window as any).__msg91_last_req_id).trim();
  }
  return '';
}

export function setLastDispatchedReqId(reqId: string): void {
  if (!reqId || typeof reqId !== 'string') return;
  const clean = reqId.trim();
  if (!clean) return;
  lastDispatchedReqId = clean;
  if (typeof window !== 'undefined') {
    (window as any).__msg91_last_req_id = clean;
  }
}

/**
 * Carefully extracts the requestId / reqId from MSG91's response.
 * In MSG91's generateOtp / sendOtp API:
 * Response is: { type: "success", message: "36696e6d5575426978746b4d" }
 * Here `message` is the alphanumeric reqId (length ~24)!
 */
export function extractReqIdFromData(data: any): string {
  if (!data) return '';
  if (typeof data === 'string') {
    const trimmed = data.trim();
    if (trimmed.length >= 8 && !trimmed.includes(' ')) {
      return trimmed;
    }
    try {
      const parsed = JSON.parse(trimmed);
      return extractReqIdFromData(parsed);
    } catch {
      return '';
    }
  }
  if (typeof data === 'object') {
    if (typeof data.reqId === 'string' && data.reqId.trim()) {
      return data.reqId.trim();
    }
    if (typeof data.requestId === 'string' && data.requestId.trim()) {
      return data.requestId.trim();
    }
    if (typeof data.request_id === 'string' && data.request_id.trim()) {
      return data.request_id.trim();
    }
    // In MSG91 generateOtp response, `message` is the unique requestId if success
    if (typeof data.message === 'string') {
      const msg = data.message.trim();
      if (msg.length >= 8 && !msg.includes(' ') && /^[a-zA-Z0-9_-]+$/.test(msg)) {
        return msg;
      }
    }
    if (data.data) {
      const nested = extractReqIdFromData(data.data);
      if (nested) return nested;
    }
    if (data.response) {
      const nested = extractReqIdFromData(data.response);
      if (nested) return nested;
    }
  }
  return '';
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
 * Headless Send OTP using MSG91 Widget window.sendOtp()
 */
export async function sendMSG91Otp(identifier: string): Promise<OTPResponse> {
  const formattedId = formatMSG91Identifier(identifier);

  if (typeof window !== 'undefined') {
    if (!window.configuration) window.configuration = { ...DEFAULT_MSG91_CONFIG };
    window.configuration.identifier = formattedId;
    window.configuration.exposeMethods = true;
    window.configuration.exposedMethods = true;
    window.configuration.captchaRenderId = 'msg91-captcha-container';
  }

  // Wait for MSG91 widget methods to be ready
  const isReady = await waitForMSG91Ready(12000);
  if (!isReady || typeof window.sendOtp !== 'function') {
    return {
      success: false,
      error: 'MSG91 OTP service is taking longer than usual to connect. Please check your connection and tap Send OTP again.'
    };
  }

  // Check if widget has captcha enabled and if it's not yet completed
  if (typeof window !== 'undefined') {
    const widgetData = typeof window.getWidgetData === 'function' ? window.getWidgetData() : null;
    const hasCaptchaRequirement = widgetData?.captchaValidations === 1 || widgetData?.captchaValidations === true;
    
    if (hasCaptchaRequirement && typeof window.isCaptchaVerified === 'function') {
      const isVerified = window.isCaptchaVerified();
      if (!isVerified) {
        return {
          success: false,
          error: 'Please verify the "I am human" security checkbox to request your SMS OTP.'
        };
      }
    }
  }

  return new Promise((resolve) => {
    try {
      console.log(`[MSG91 Widget] Dispatching OTP via window.sendOtp to ${formattedId}...`);
      window.sendOtp!(
        formattedId,
        (data: any) => {
          console.log('[MSG91 Widget] sendOtp success response:', data);
          const reqId = extractReqIdFromData(data);
          if (reqId) {
            setLastDispatchedReqId(reqId);
          }

          resolve({
            success: true,
            message: typeof data === 'string' ? data : (data?.message || 'OTP verification code dispatched via SMS.'),
            data,
            reqId: reqId || undefined
          });
        },
        (error: any) => {
          console.warn('[MSG91 Widget] sendOtp failure response:', error);
          let rawError = typeof error === 'string' ? error : (error?.message || error?.error || 'Failed to send OTP via MSG91 Widget.');

          const isIpBlocked = Boolean(
            error?.code === 408 || error?.code === '408' ||
            (typeof rawError === 'string' && (
              rawError.toLowerCase().includes('ipblocked') ||
              rawError.toLowerCase().includes('ip blocked')
            ))
          );

          if (isIpBlocked) {
            console.warn('[MSG91 Widget] Client IPBlocked (408). Attempting server backup OTP dispatch...');
            fetch('/api/auth/otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ identifier: formattedId, purpose: 'Login', channel: 'SMS' })
            }).then(async (res) => {
              const resData = await res.json().catch(() => null);
              if (res.ok && resData?.success) {
                if (resData.reqId) setLastDispatchedReqId(resData.reqId);
                resolve({
                  success: true,
                  message: resData.message || 'OTP verification code dispatched via server backup.',
                  reqId: resData.reqId,
                  data: resData
                });
              } else {
                resolve({
                  success: false,
                  error: 'MSG91 Service Notice: Your IP address is temporarily rate-limited (Error 408: IPBlocked). Please wait 5 minutes, switch to Wi-Fi/mobile data, or sign in using your password.',
                  data: error
                });
              }
            }).catch(() => {
              resolve({
                success: false,
                error: 'MSG91 Service Notice: Your IP address is temporarily rate-limited (Error 408: IPBlocked). Please wait 5 minutes, switch network, or sign in using your password.',
                data: error
              });
            });
            return;
          }
          
          if (typeof rawError === 'string' && rawError.toLowerCase().includes('captcha')) {
            rawError = 'Security verification failed or expired. Please complete the "I am human" verification box above and try again.';
          }

          resolve({
            success: false,
            error: rawError,
            data: error
          });
        }
      );
    } catch (err: any) {
      console.error('[MSG91 Widget] Exception in sendOtp:', err);
      resolve({
        success: false,
        error: err.message || 'Error executing MSG91 sendOtp.'
      });
    }
  });
}

/**
 * Headless Retry OTP using MSG91 Widget window.retryOtp()
 */
export async function retryMSG91Otp(
  channel: '11' | '4' | '3' | '12' | null = null,
  reqId?: string,
  _identifier?: string
): Promise<OTPResponse> {
  const isReady = await waitForMSG91Ready(10000);
  if (!isReady || typeof window.retryOtp !== 'function') {
    return {
      success: false,
      error: 'MSG91 OTP Widget retry method not ready. Please try again in a moment.'
    };
  }

  const resolvedReqId = (reqId && reqId.trim()) ? reqId.trim() : getLastDispatchedReqId();

  return new Promise((resolve) => {
    try {
      console.log(`[MSG91 Widget] Resending OTP via window.retryOtp (reqId: ${resolvedReqId || 'store'})...`);
      const handleSuccess = (data: any) => {
        console.log('[MSG91 Widget] retryOtp success response:', data);
        const newReqId = extractReqIdFromData(data) || resolvedReqId;
        if (newReqId) {
          setLastDispatchedReqId(newReqId);
        }

        resolve({
          success: true,
          message: typeof data === 'string' ? data : (data?.message || 'OTP resent successfully via SMS.'),
          data,
          reqId: newReqId || undefined
        });
      };

      const handleError = (error: any) => {
        console.warn('[MSG91 Widget] retryOtp failure response:', error);
        resolve({
          success: false,
          error: typeof error === 'string' ? error : (error?.message || 'Failed to resend OTP via MSG91 Widget.')
        });
      };

      if (resolvedReqId) {
        window.retryOtp!(channel, handleSuccess, handleError, resolvedReqId);
      } else {
        window.retryOtp!(channel, handleSuccess, handleError);
      }
    } catch (err: any) {
      resolve({
        success: false,
        error: err.message || 'Error executing MSG91 retryOtp.'
      });
    }
  });
}

/**
 * Headless Verify OTP using MSG91 Widget window.verifyOtp()
 * Returns verified access-token from MSG91 for backend verification.
 */
export async function verifyMSG91Otp(
  arg1: string | number,
  arg2?: string,
  arg3?: string
): Promise<OTPResponse> {
  let cleanOtp = '';
  let targetId = '';
  let reqId = '';

  const str1 = String(arg1 || '').trim();
  const str2 = String(arg2 || '').trim();
  const str3 = String(arg3 || '').trim();

  if ((str1.includes('@') || str1.length >= 10 || str1.startsWith('+')) && /^\d{4,8}$/.test(str2)) {
    targetId = str1;
    cleanOtp = str2;
    reqId = str3;
  } else if (/^\d{4,8}$/.test(str1)) {
    cleanOtp = str1;
    reqId = str2;
    targetId = str3;
  } else {
    cleanOtp = str2 || str1;
    targetId = str1.length >= 10 ? str1 : str3;
    reqId = str3;
  }

  // Fallback to globally cached reqId if caller did not supply one
  const resolvedReqId = (reqId && reqId.trim()) ? reqId.trim() : getLastDispatchedReqId();

  if (targetId && typeof window !== 'undefined' && window.configuration) {
    window.configuration.identifier = formatMSG91Identifier(targetId);
  }

  const isReady = await waitForMSG91Ready(10000);
  if (!isReady || typeof window.verifyOtp !== 'function') {
    return {
      success: false,
      error: 'MSG91 OTP Widget verification method is not ready. Please refresh the page and try again.'
    };
  }

  return new Promise((resolve) => {
    try {
      console.log(`[MSG91 Widget] Verifying OTP via window.verifyOtp (code: ${cleanOtp}, reqId: ${resolvedReqId || 'store'})...`);

      const fallbackServerVerify = async (originalErr: any) => {
        try {
          if (cleanOtp && (targetId || resolvedReqId)) {
            console.log(`[MSG91 Widget] Verification issue detected. Attempting server fallback verification for ${targetId}...`);
            const fallbackRes = await fetch('/api/auth/verify-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                identifier: targetId,
                code: cleanOtp,
                reqId: resolvedReqId
              })
            });
            const fbData = await fallbackRes.json().catch(() => null);
            if (fallbackRes.ok && (fbData?.success || fbData?.verified)) {
              console.log('[MSG91 Widget] Server fallback verification succeeded!');
              resolve({
                success: true,
                message: fbData.message || 'OTP passcode verified successfully.',
                accessToken: 'server_verified_otp_session',
                reqId: resolvedReqId,
                data: fbData
              });
              return;
            }
          }
        } catch (serverErr) {
          console.warn('[MSG91 Widget] Fallback server verification exception:', serverErr);
        }

        const isIpBlocked = Boolean(
          originalErr?.code === 408 || originalErr?.code === '408' ||
          (typeof originalErr?.message === 'string' && originalErr.message.toLowerCase().includes('ipblocked')) ||
          (typeof originalErr?.error === 'string' && originalErr.error.toLowerCase().includes('ipblocked')) ||
          (typeof originalErr === 'string' && originalErr.toLowerCase().includes('ipblocked'))
        );

        let errText = typeof originalErr === 'string' ? originalErr : (originalErr?.message || originalErr?.error || 'Invalid or expired OTP code.');
        if (isIpBlocked) {
          errText = 'MSG91 Service Notice: Your IP address is temporarily rate-limited (Error 408: IPBlocked). Please wait 5 minutes, switch to Wi-Fi/mobile data, or sign in using your password.';
        } else if (typeof errText === 'string' && errText.toLowerCase().includes('reqid is required')) {
          errText = 'Verification session expired. Please tap Resend OTP to request a fresh passcode.';
        }

        resolve({
          success: false,
          error: errText,
          data: originalErr
        });
      };

      const handleSuccess = (data: any) => {
        console.log('[MSG91 Widget] verifyOtp success response:', data);

        // Check if response contains an error status or failure
        const isErrorResponse = Boolean(
          !data ||
          data.type === 'error' ||
          data.status === 'error' ||
          data.status === 'fail' ||
          data.hasError === true ||
          data.code === 705 ||
          data.code === 401 ||
          data.code === 400 ||
          data.code === 408 ||
          data.code === '408' ||
          (typeof data.message === 'string' && (
            data.message.toLowerCase().includes('invalid') ||
            data.message.toLowerCase().includes('expired') ||
            data.message.toLowerCase().includes('required') ||
            data.message.toLowerCase().includes('ipblocked')
          ))
        );

        if (isErrorResponse) {
          fallbackServerVerify(data);
          return;
        }

        // Extract the access-token (JWT) from MSG91 response
        let extractedToken = '';
        if (typeof data === 'string') {
          extractedToken = data;
        } else if (data?.token) {
          extractedToken = data.token;
        } else if (data?.['access-token']) {
          extractedToken = data['access-token'];
        } else if (data?.accessToken) {
          extractedToken = data.accessToken;
        } else if (data?.jwt) {
          extractedToken = data.jwt;
        } else if (data?.data?.token) {
          extractedToken = data.data.token;
        } else if (data?.data?.['access-token']) {
          extractedToken = data.data['access-token'];
        } else if (data?.message && typeof data.message === 'string' && data.message.length > 30) {
          extractedToken = data.message;
        }

        resolve({
          success: true,
          message: 'OTP verified successfully by MSG91 Widget.',
          accessToken: extractedToken || JSON.stringify(data),
          reqId: resolvedReqId,
          data
        });
      };

      const handleError = (error: any) => {
        console.warn('[MSG91 Widget] verifyOtp failure response:', error);
        fallbackServerVerify(error);
      };

      // CRITICAL: Only pass reqId as 4th param if non-empty string!
      // Passing empty string "" causes MSG91 to send reqId: "" which causes "reqId is required."
      if (resolvedReqId) {
        window.verifyOtp!(cleanOtp, handleSuccess, handleError, resolvedReqId);
      } else {
        window.verifyOtp!(cleanOtp, handleSuccess, handleError);
      }
    } catch (err: any) {
      console.error('[MSG91 Widget] Exception in verifyOtp:', err);
      resolve({
        success: false,
        error: err.message || 'Failed to verify OTP with MSG91 Widget.'
      });
    }
  });
}

/**
 * Direct OTP Login sending MSG91 verified accessToken to /api/auth/otp-login
 */
export async function performOtpLogin(params: {
  identifier: string;
  code?: string;
  reqId?: string;
  accessToken?: string;
  fullName?: string;
  email?: string;
  autoCreate?: boolean;
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
    return { success: false, error: data.error || data.message || 'OTP Login failed' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error during OTP Login' };
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
 * Checks if Captcha is verified
 */
export function isMSG91CaptchaVerified(): boolean {
  if (typeof window !== 'undefined' && typeof window.isCaptchaVerified === 'function') {
    return window.isCaptchaVerified();
  }
  return false;
}
