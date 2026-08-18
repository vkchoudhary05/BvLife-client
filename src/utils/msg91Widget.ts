export const initMsg91Widget = () => {
  if (!window.initSendOTP) {
    console.error("MSG91 SDK not loaded");
    return;
  }

  window.initSendOTP({
    widgetId: import.meta.env.VITE_MSG91_WIDGET_ID,
    tokenAuth: import.meta.env.VITE_MSG91_WIDGET_TOKEN,
    exposeMethods: true,

    success: (data: any) => {
      console.log("OTP Verified", data);
    },

    failure: (error: any) => {
      console.error(error);
    },
  });
};