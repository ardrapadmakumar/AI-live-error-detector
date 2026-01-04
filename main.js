const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

let mainWindow;

app.whenReady().then(() => {
    mainWindow = new BrowserWindow({
        width: 600,
        height: 610,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('index.html');
});

ipcMain.handle('upload-file', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [{ name: 'Code Files', extensions: ['js', 'py', 'html', 'css', 'cpp'] }]
    });

    if (!result.canceled && result.filePaths.length > 0) {
        const filePath = result.filePaths[0];
        const fileName = path.basename(filePath);
        const fileContent = fs.readFileSync(filePath, 'utf8');

        // Send code to Hugging Face for error correction
        const correctedCode = await sendToHuggingFace(fileContent);

        return { fileName, fileContent, correctedCode };
    }

    return null;
});

// Send Code to Hugging Face AI for Correction
async function sendToHuggingFace(code) {
    const API_URL = "https://api-inference.huggingface.co/models/bigcode/starcoder";
    const headers = { "Authorization": "Bearer api_key" };

    const data = {
        inputs: `Fix the following code errors and return only the corrected code:\n\n${code}`,
        parameters: { max_new_tokens: 200 }
    };

    try {
        const response = await axios.post(API_URL, data, { headers });
        return response.data?.[0]?.generated_text || "No correction available.";
    } catch (error) {
        return `Error: ${error.message}`;
    }
}
