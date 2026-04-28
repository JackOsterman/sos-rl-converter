import path from "path";
import { app, BrowserWindow, Menu, Tray, Event } from "electron";
import { Bridge } from "./bridge";

let mainWindow: BrowserWindow | undefined;
let bridge: Bridge | undefined;
let tray: Tray | undefined;
let isQuitting = false;

function createWindow(): void {
  const iconPath = path.join(app.getAppPath(), "assets/icon.ico");
  mainWindow = new BrowserWindow({
    width: 900,
    height: 620,
    minWidth: 720,
    minHeight: 480,
    title: "RL to SOS Converter",
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(app.getAppPath(), "src/renderer/index.html"));

  mainWindow.on("minimize" as any, (event: Event) => {
    event.preventDefault();
    mainWindow?.hide();
  });

  bridge = new Bridge();
  bridge.attachWindow(mainWindow);
  bridge.start();
}

function createTray(): void {
  tray = new Tray(path.join(app.getAppPath(), "assets/icon.ico"));
  tray.setToolTip("RL to SOS Converter");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      {
        label: "Show",
        click: () => {
          mainWindow?.show();
          mainWindow?.focus();
        }
      },
      {
        label: "Quit",
        click: () => {
          isQuitting = true;
          app.quit();
        }
      }
    ])
  );
  tray.on("click", () => {
    mainWindow?.show();
    mainWindow?.focus();
  });
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createTray();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("before-quit", () => {
  isQuitting = true;
  bridge?.stop();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
