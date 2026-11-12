import type { DesktopApi } from '../electron/preload.js';

declare global {
  interface Window {
    desktopApi: DesktopApi;
  }
}

export {};
