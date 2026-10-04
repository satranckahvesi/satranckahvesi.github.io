// Device checks shared by the install button and the notification button.

export const isAndroidUa = (userAgent) => /android/i.test(userAgent);

// iPadOS 13+ reports itself as a Mac with a touch screen.
export const isIosDevice = (userAgent, platform, touchPoints) =>
  /iphone|ipad|ipod/i.test(userAgent) || (platform === 'MacIntel' && touchPoints > 1);

export const isAndroid = () => isAndroidUa(navigator.userAgent);
export const isIos = () => isIosDevice(navigator.userAgent, navigator.platform, navigator.maxTouchPoints);

export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone === true;
