import { contextBridge, ipcRenderer } from 'electron';
import type { ApiHealthResponse } from '@sistema/contracts';

const desktopApi = {
  checkApiHealth: (): Promise<ApiHealthResponse> => ipcRenderer.invoke('api:health'),
};

contextBridge.exposeInMainWorld('desktopApi', desktopApi);

export type DesktopApi = typeof desktopApi;
