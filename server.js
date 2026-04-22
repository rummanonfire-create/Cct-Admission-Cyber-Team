/* 
    SERVER SIDE LOGIC - NODE.JS
    SECURE VERSION
*/
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// --- CONFIGURATION (SECRET - CLIENT CANNOT SEE THIS) ---
const CONFIG = {
    botToken: "8661715983:AAE9fWQ31BRl-416XAhA3zFH1WMjHUEzSN4",
    chatId: "8475718817"
};

// Serve static files (HTML, CSS, Client JS)
app.use(express.static('public'));
app.use(express.json());

// Storage setup for Multer (Temporary file storage)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = './uploads';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// API Endpoint to handle form submission
app.post('/api/recruit', upload.fields([{ name: 'profile' }, { name: 'docFront' }, { name: 'docBack' }, { name: 'docSingle' }]), async (req, res) => {
    
    try {
        const data = req.body;
        const files = req.files;

        console.log(">> NEW RECRUIT DETECTED:", data.name);

        // 1. Prepare Caption
        const caption = `
⚠️ <b>CLASSIFIED INTELLIGENCE REPORT</b> ⚠️
👤 <b>Subject:</b> ${data.name}
🆔 <b>Doc Type:</b> ${data.docType === 'nid' ? 'NATIONAL ID' : 'BIRTH CERT'}
📞 <b>Comms:</b> ${data.phone}
🌐 <b>Social:</b> ${data.fb}
📧 <b>Mail:</b> ${data.email}
🕸 <b>History:</b> ${data.prevTeam || 'NONE'}

📝 <b>Statement:</b>
<i>${data.reason}</i>

<i>Sent via CyberCorps Portal v4.0 [NODE.JS SECURE]</i>
        `;

        // 2. Send Profile Photo with Caption
        const profilePath = files.profile ? files.profile[0].path : null;
        
        if (!profilePath) {
            return res.status(400).json({ status: 'error', message: 'MISSING BIOMETRIC DATA' });
        }

        const photoForm = new FormData();
        photoForm.append('chat_id', CONFIG.chatId);
        photoForm.append('photo', fs.createReadStream(profilePath));
        photoForm.append('caption', caption);
        photoForm.append('parse_mode', 'HTML');

        // Using axios with FormData requires specific headers handling usually, 
        // but for simple file sending we can use the direct URL approach or a helper.
        // Here we will use the Telegram API directly via POST request with form-data package logic manually or just standard fetch if available.
        // Since Node 18+, fetch is global. For older, use axios. Let's stick to axios logic adapted for form-data.
        
        // Note: To send multipart/form-data with Axios, it's often easier to use the 'form-data' library, 
        // but to keep dependencies low as per your previous code, let's use the native 'fetch' if available or simple logic.
        // Assuming modern Node.js environment.

        const formDataPhoto = new FormData();
        formDataPhoto.append('chat_id', CONFIG.chatId);
        formDataPhoto.append('photo', fs.createReadStream(profilePath));
        formDataPhoto.append('caption', caption);
        formDataPhoto.append('parse_mode', 'HTML');

        await axios.post(`https://api.telegram.org/bot${CONFIG.botToken}/sendPhoto`, formDataPhoto, {
            headers: formDataPhoto.getHeaders()
        });

        console.log(">> BIOMETRICS UPLOADED");

        // 3. Send Documents
        if (data.docType === 'nid') {            if (files.docFront) await sendDocument(files.docFront[0].path, "NID FRONT SIDE");
            if (files.docBack) await sendDocument(files.docBack[0].path, "NID BACK SIDE");
        } else {
            if (files.docSingle) await sendDocument(files.docSingle[0].path, "BIRTH CERTIFICATE");
        }

        // Cleanup files after sending
        cleanupFiles(files);

        res.json({ status: 'success', message: 'ACCESS GRANTED' });

    } catch (error) {
        console.error(">> UPLOAD ERROR:", error.message);
        // Cleanup on error too
        if(req.files) cleanupFiles(req.files);
        res.status(500).json({ status: 'error', message: 'UPLINK FAILED' });
    }
});

async function sendDocument(filePath, title) {
    const formData = new FormData();
    formData.append('chat_id', CONFIG.chatId);
    formData.append('document', fs.createReadStream(filePath));
    formData.append('caption', `<b>FILE:</b> ${title}`);
    formData.append('parse_mode', 'HTML');

    await axios.post(`https://api.telegram.org/bot${CONFIG.botToken}/sendDocument`, formData, {
        headers: formData.getHeaders()
    });
    console.log(`>> DOC UPLOADED: ${title}`);
}

function cleanupFiles(files) {
    Object.keys(files).forEach(key => {
        files[key].forEach(file => {
            if(fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
    });
}

app.listen(PORT, () => {
    console.log(`CYBER CORPS SYSTEM ONLINE AT http://localhost:${PORT}`);
});
