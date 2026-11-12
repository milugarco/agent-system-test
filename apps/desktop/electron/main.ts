import { app, BrowserWindow, ipcMain } from 'electron';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { ApiHealthResponseSchema } from '@sistema/contracts';

const apiBaseUrl = new URL(process.env.API_BASE_URL ?? 'http://127.0.0.1:3000');
if (!['http:', 'https:'].includes(apiBaseUrl.protocol)) {
  throw new Error('API_BASE_URL must use HTTP or HTTPS.');
}

const rendererUrl = process.env.ELECTRON_RENDERER_URL;
const packagedRendererPath = join(__dirname, '../renderer/index.html');
const packagedRendererUrl = pathToFileURL(packagedRendererPath).href;
let mainWindow: BrowserWindow | undefined;

function registerIpcHandlers(): void {
  ipcMain.handle('api:health', async (event) => {
    if (
      !mainWindow ||
      event.sender !== mainWindow.webContents ||
      event.senderFrame !== event.sender.mainFrame ||
      event.senderFrame.url !== (rendererUrl ?? packagedRendererUrl)
    ) {
      throw new Error('Request rejected.');
    }

    const response = await fetch(new URL('/health/live', apiBaseUrl), {
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      throw new Error('The API is unavailable.');
    }

    const body: unknown = await response.json();
    const result = ApiHealthResponseSchema.safeParse(body);
    if (!result.success) {
      throw new Error('The API returned an invalid response.');
    }
    return result.data;
  });
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  if (!rendererUrl) {
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow?.webContents.closeDevTools();
    });
  }
  mainWindow.webContents.on('will-navigate', (event, targetUrl) => {
    if (targetUrl !== (rendererUrl ?? packagedRendererUrl)) {
      event.preventDefault();
    }
  });

  if (rendererUrl) {
    void mainWindow.loadURL(rendererUrl);
  } else {
    void mainWindow.loadFile(packagedRendererPath);
  }
  mainWindow.on('closed', () => {
    mainWindow = undefined;
  });
}

app.whenReady().then(() => {
  registerIpcHandlers();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
