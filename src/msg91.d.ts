declare global {
  interface Window {
    initSendOTP: (config: any) => void;
    sendOtp: (...args: any[]) => void;
    verifyOtp: (...args: any[]) => void;
  }
}

export {};