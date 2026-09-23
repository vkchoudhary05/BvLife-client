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
  widgetId: import.meta.env.VITE_MSG91_WIDGET_ID || "",
  tokenAuth: import.meta.env.VITE_MSG91_TOKEN_AUTH || import.meta.env.VITE_MSG91_WIDGET_TOKEN || "",
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

let widgetConfigPromise: Promise<void> | null = null;
let widgetScriptPromise: Promise<void> | null = null;
let widgetReadyPromise: Promise<boolean> | null = null;
// One widget instance is shared by the app. Coalesce simultaneous requests for
// the same recipient so a double click or duplicate browser event cannot send
// two SMS messages.
const otpDispatchesInFlight = new Map<string, Promise<OTPResponse>>();

/**
 * Loads the public widget configuration at runtime when it was not embedded
 * in the frontend build. This keeps OTP working for deployments where the
 * backend environment is configured but Vite variables are not available.
 */
async function ensureWidgetConfig(): Promise<void> {
  if (typeof window === 'undefined') return;

  if (!window.configuration) {
    window.configuration = { ...DEFAULT_MSG91_CONFIG };
  }

  if (window.configuration.widgetId && window.configuration.tokenAuth) {
    return;
  }

  if (!widgetConfigPromise) {
    widgetConfigPromise = fetch('/api/auth/msg91-config')
      .then(async (response) => {
        if (!response.ok) throw new Error(`Configuration request failed (${response.status})`);
        return response.json();
      })
      .then((config) => {
        if (!config?.widgetId || !config?.tokenAuth) {
          throw new Error('MSG91 widget configuration is incomplete.');
        }
        window.configuration = {
          ...window.configuration,
          ...config,
          exposeMethods: true,
          exposedMethods: true,
          captchaRenderId: 'msg91-captcha-container'
        };
      })
      .catch((error) => {
        // Permit a later Send OTP attempt to retry a transient API failure.
        widgetConfigPromise = null;
        throw error;
      });
  }

  await widgetConfigPromise;
}

function loadWidgetScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Browser environment is unavailable.'));
  if (typeof window.initSendOTP === 'function') return Promise.resolve();
  if (widgetScriptPromise) return widgetScriptPromise;

  const sources = [
    'https://verify.msg91.com/otp-provider.js',
    'https://verify.phone91.com/otp-provider.js'
  ];

  widgetScriptPromise = new Promise<void>((resolve, reject) => {
    let sourceIndex = 0;
    const loadNext = () => {
      const source = sources[sourceIndex++];
      if (!source) {
        reject(new Error('Unable to load the MSG91 OTP widget.'));
        return;
      }

      const script = document.createElement('script');
      script.src = source;
      script.async = true;
      script.onload = () => typeof window.initSendOTP === 'function'
        ? resolve()
        : loadNext();
      script.onerror = () => {
        script.remove();
        loadNext();
      };
      (document.body || document.head).appendChild(script);
    };
    loadNext();
  }).catch((error) => {
    // Do not leave the application permanently stuck after a failed load.
    widgetScriptPromise = null;
    throw error;
  });

  return widgetScriptPromise;
}

/**
 * Ensures MSG91 Widget is fully initialized and window.sendOtp & window.verifyOtp exist.
 * Waits dynamically for Angular component to boot and expose methods.
 */
export function waitForMSG91Ready(maxTimeoutMs = 12000): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);

  // If already exposed and ready, return immediately
  if (typeof window.sendOtp === 'function' && typeof window.verifyOtp === 'function') {
    return Promise.resolve(true);
  }

  // Multiple components can request an OTP at nearly the same time. The MSG91
  // SDK must be initialised once only; each additional init creates another
  // widget instance and results in a duplicate provider request.
  if (!widgetReadyPromise) {
    widgetReadyPromise = prepareMSG91Widget(maxTimeoutMs).then((ready) => {
      if (!ready) widgetReadyPromise = null;
      return ready;
    });
  }
  return widgetReadyPromise;
}

async function prepareMSG91Widget(maxTimeoutMs: number): Promise<boolean> {

  try {
    await ensureWidgetConfig();
  } catch (error) {
    console.warn('[MSG91] Widget configuration could not be loaded:', error);
    return false;
  }

  window.configuration.exposeMethods = true;
  window.configuration.exposedMethods = true;

  // If window.initSendOTP exists, invoke it once if not already invoked
  if (typeof window.initSendOTP === 'function' && !(window as any).__msg91_init_invoked) {
    (window as any).__msg91_init_invoked = true;
    try {
      window.initSendOTP(window.configuration);
    } catch (e) {
      console.warn('[MSG91] initSendOTP invocation error:', e);
    }
  }

  if (typeof window.initSendOTP !== 'function') {
    try {
      await loadWidgetScript();
      // Read it again after the asynchronous script load. TypeScript retains
      // the earlier negative narrowing otherwise, even though the script has
      // added this method to window.
      const initSendOTP: ((config: any) => void) | undefined = (window as any).initSendOTP;
      if (typeof initSendOTP === 'function' && !(window as any).__msg91_init_invoked) {
        (window as any).__msg91_init_invoked = true;
        initSendOTP(window.configuration);
      }
    } catch (error) {
      console.warn('[MSG91] OTP widget script could not be loaded:', error);
      return false;
    }
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
export function sendMSG91Otp(identifier: string): Promise<OTPResponse> {
  const formattedId = formatMSG91Identifier(identifier);
  const existingDispatch = otpDispatchesInFlight.get(formattedId);
  if (existingDispatch) {
    return existingDispatch;
  }

  const dispatch = dispatchMSG91Otp(formattedId).finally(() => {
    // Do not remove a newer request if one was started after this one settled.
    if (otpDispatchesInFlight.get(formattedId) === dispatch) {
      otpDispatchesInFlight.delete(formattedId);
    }
  });
  otpDispatchesInFlight.set(formattedId, dispatch);
  return dispatch;
}

async function dispatchMSG91Otp(formattedId: string): Promise<OTPResponse> {

  if (typeof window !== 'undefined') {
    if (!window.configuration) window.configuration = { ...DEFAULT_MSG91_CONFIG };
    // Do not include an identifier in initSendOTP configuration. MSG91 treats
    // it as an automatic dispatch; the explicit sendOtp call below is the one
    // and only request that should send an SMS.
    delete window.configuration.identifier;
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
          // Some widget versions put the current request ID only in their
          // state object, not in the send callback.
          const widgetData = typeof window.getWidgetData === 'function' ? window.getWidgetData() : null;
          const reqId = extractReqIdFromData(data) || extractReqIdFromData(widgetData);
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
            console.warn('[MSG91 Widget] Client IPBlocked (408). Informing user without secondary OTP dispatch.');
            resolve({
              success: false,
              error: 'MSG91 Service Notice: Your IP address is temporarily rate-limited (Error 408: IPBlocked). Please wait 2 minutes, switch to Wi-Fi/mobile data, or try again.',
              data: error
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
  const args = [String(arg1 || '').trim(), String(arg2 || '').trim(), String(arg3 || '').trim()].filter(Boolean);

  let cleanOtp = '';
  let targetId = '';
  let reqId = '';

  for (const a of args) {
    const digitsOnly = a.replace(/\D/g, '');
    if (!cleanOtp && digitsOnly.length === 4 && a.length === 4) {
      cleanOtp = digitsOnly;
    } else if (!targetId && (a.includes('@') || digitsOnly.length === 10 || (digitsOnly.length === 12 && digitsOnly.startsWith('91')))) {
      targetId = a;
    } else if (!reqId && a.length >= 6) {
      reqId = a;
    }
  }

  // If cleanOtp was not identified strictly, grab any 4-digit sequence
  if (!cleanOtp) {
    for (const a of args) {
      const d = a.replace(/\D/g, '');
      if (d.length === 4) {
        cleanOtp = d;
        break;
      }
    }
  }

  if (!cleanOtp || cleanOtp.length !== 4) {
    return {
      success: false,
      error: 'Please enter a valid 4-digit OTP passcode.'
    };
  }

  // Fallback to globally cached reqId if caller did not supply one
  const resolvedReqId = (reqId && reqId.trim()) ? reqId.trim() : getLastDispatchedReqId();

  const isReady = await waitForMSG91Ready(6000);
  if (!isReady || typeof window.verifyOtp !== 'function') {
    return {
      success: false,
      error: 'MSG91 OTP Verification service is still loading. Please check your network and tap Verify again.'
    };
  }

  return new Promise((resolve) => {
    try {
      console.log(`[MSG91 Widget] Verifying OTP via window.verifyOtp (code: ${cleanOtp}, reqId: ${resolvedReqId || 'none'})...`);

      const handleError = (error: any) => {
        console.warn('[MSG91 Widget] verifyOtp failure callback:', error);
        let errMessage = 'Invalid OTP code. Please enter the correct 4-digit code sent to your mobile.';
        if (typeof error === 'string' && error.trim()) {
          errMessage = error.trim();
        } else if (typeof error?.message === 'string' && error.message.trim()) {
          errMessage = error.message.trim();
        } else if (typeof error?.error === 'string' && error.error.trim()) {
          errMessage = error.error.trim();
        }

        const lower = errMessage.toLowerCase();
        if (lower.includes('not match') || lower.includes('incorrect') || lower.includes('wrong') || lower.includes('invalid')) {
          errMessage = 'Invalid OTP code. Please enter the correct 4-digit code sent to your mobile.';
        } else if (lower.includes('expired')) {
          errMessage = 'OTP code has expired. Please tap Resend to request a fresh code.';
        }

        resolve({
          success: false,
          error: errMessage,
          data: error
        });
      };

      const handleSuccess = (data: any) => {
        console.log('[MSG91 Widget] verifyOtp response received:', data);

        const rawMsg = (typeof data?.message === 'string' ? data.message : typeof data === 'string' ? data : '').toLowerCase();

        // Detect all error conditions passed to success callback by MSG91 widget
        const isErrorResponse = Boolean(
          !data ||
          data.type === 'error' ||
          data.status === 'error' ||
          data.status === 'fail' ||
          data.hasError === true ||
          data.code === 705 ||
          data.code === 400 ||
          data.code === 401 ||
          data.code === 408 ||
          data.code === '408' ||
          rawMsg.includes('not match') ||
          rawMsg.includes('otp not match') ||
          rawMsg.includes('invalid') ||
          rawMsg.includes('incorrect') ||
          rawMsg.includes('expired') ||
          rawMsg.includes('wrong') ||
          rawMsg.includes('required') ||
          rawMsg.includes('fail') ||
          rawMsg.includes('ipblocked')
        );

        if (isErrorResponse) {
          console.warn('[MSG91 Widget] Detected error condition in verifyOtp response:', data);
          let errText = 'Invalid OTP code. Please enter the correct 4-digit code sent to your mobile.';
          if (rawMsg.includes('not match') || rawMsg.includes('incorrect') || rawMsg.includes('wrong') || rawMsg.includes('invalid')) {
            errText = 'Invalid OTP code. Please enter the correct 4-digit code sent to your mobile.';
          } else if (rawMsg.includes('expired')) {
            errText = 'OTP code has expired. Please tap Resend to request a fresh code.';
          } else if (typeof data?.message === 'string' && data.message.trim()) {
            errText = data.message.trim();
          } else if (typeof data === 'string' && data.trim()) {
            errText = data.trim();
          }

          resolve({
            success: false,
            error: errText,
            data
          });
          return;
        }

        // Extract the access-token (JWT) from MSG91 response
        let extractedToken = '';
        if (typeof data === 'string' && (data.startsWith('eyJ') || data.split('.').length === 3)) {
          extractedToken = data.trim();
        } else if (data?.['access-token'] && typeof data['access-token'] === 'string') {
          extractedToken = data['access-token'];
        } else if (data?.accessToken && typeof data.accessToken === 'string') {
          extractedToken = data.accessToken;
        } else if (data?.token && typeof data.token === 'string') {
          extractedToken = data.token;
        } else if (data?.jwt && typeof data.jwt === 'string') {
          extractedToken = data.jwt;
        } else if (data?.data?.['access-token']) {
          extractedToken = data.data['access-token'];
        } else if (data?.data?.token) {
          extractedToken = data.data.token;
        } else if (data?.data?.accessToken) {
          extractedToken = data.data.accessToken;
        } else if (data?.message && typeof data.message === 'string' && (data.message.startsWith('eyJ') || data.message.split('.').length === 3)) {
          extractedToken = data.message.trim();
        }

        // Check widget state if not directly in callback data
        if (!extractedToken && typeof window !== 'undefined' && typeof window.getWidgetData === 'function') {
          const wd = window.getWidgetData();
          if (wd?.['access-token']) extractedToken = wd['access-token'];
          else if (wd?.token) extractedToken = wd.token;
          else if (wd?.jwt) extractedToken = wd.jwt;
        }

        // If MSG91 responded with success object or success string, but token is in a slightly different key
        if (!extractedToken && (data?.type === 'success' || data?.status === 'success' || rawMsg.includes('success') || rawMsg.includes('verified'))) {
          if (typeof data?.message === 'string' && data.message.length > 20) {
            extractedToken = data.message.trim();
          } else if (data?.data && typeof data.data === 'string' && data.data.length > 20) {
            extractedToken = data.data.trim();
          }
        }

        // Under NO circumstances do we invent a fake token!
        if (!extractedToken) {
          console.warn('[MSG91 Widget] No valid verified token found in response:', data);
          resolve({
            success: false,
            error: 'OTP verification could not be confirmed by MSG91. Please check the code and try again.',
            data
          });
          return;
        }

        console.log('[MSG91 Widget] OTP verified! Token received from MSG91.');
        resolve({
          success: true,
          message: 'OTP verified successfully by MSG91 Widget.',
          accessToken: extractedToken,
          reqId: resolvedReqId,
          data
        });
      };

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
}): Promise<{ success: boolean; user?: any; token?: string; error?: string; isNewUser?: boolean; message?: string }> {
  try {
    const payload: any = { ...params };
    // SINGLE OTP FLOW: When accessToken is provided (verified on frontend by MSG91),
    // omit code & reqId so backend strictly hits verify token API and avoids double OTP!
    if (payload.accessToken) {
      delete payload.code;
      delete payload.reqId;
    }

    const res = await fetch('/api/auth/otp-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok && data.user) {
      return { success: true, user: data.user, token: data.token, isNewUser: false, message: data.message };
    }
    if (res.ok && data.isNewUser) {
      return { success: true, isNewUser: true, message: data.message };
    }
    return { success: false, error: data.error || data.message || 'OTP verification failed.' };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error during OTP Login.' };
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
