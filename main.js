// Modules to control application life and create native browser window
const {app, BrowserWindow, ipcMain, Tray, Menu, clipboard, dialog, globalShortcut} = require('electron')
const path = require('path')

const faceRecognition = require('./faceRecognition')
const faceExtractor = require('./faceExtractor')

if (!app.requestSingleInstanceLock()) {
    app.quit()
}

async function start() {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
        width: 1400,
        height: 800,
        //frame: false,
        //resizable: false,
        //movable: false,
        //minimizable: false,
        //maximizable: false,
        //closable: true,
        show: true,
        title: 'search-face',
        //icon: path.join(__dirname, 'icons/16x16.png'),
        webPreferences: {
            //preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true
        }
    })

    mainWindow.setMenuBarVisibility(false)

    // and load the index.html of the app.
    mainWindow.loadFile('index.html')

    // Open the DevTools.
    mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(start)

// Quit when all windows are closed.
app.on('window-all-closed', () => {
    // On macOS it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) start()
})

ipcMain.on('app-exit', () => {
    app.exit()
})

ipcMain.on('faceRecognition', async (event, params) => {
    //console.log(params)
    event.reply('faceRecognition', await faceRecognition(params.file, params.dir))
})

ipcMain.on('faceExtractor', async (event, params) => {
    //console.log(params)
    event.reply('faceExtractor', await faceExtractor(params.sourceDir, params.targetDir))
})