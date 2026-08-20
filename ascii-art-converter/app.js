// ===== CHAR SETS =====
const CHAR_SETS = {
    standard: ' .,:;i1tfLCG08@',
    blocks: ' ░▒▓█',
    dots: ' .·•●',
    minimal: ' .-+*#@',
    detailed: ' .\'`^",:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$'
};

// ===== DOM ELEMENTS =====
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const controls = document.getElementById('controls');
const widthSlider = document.getElementById('widthSlider');
const widthValue = document.getElementById('widthValue');
const charSetSelect = document.getElementById('charSet');
const invertCheck = document.getElementById('invertCheck');
const convertBtn = document.getElementById('convertBtn');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const asciiOutput = document.getElementById('asciiOutput');
const previewContainer = document.getElementById('previewContainer');
const originalPreview = document.getElementById('originalPreview');
const originalImage = document.getElementById('originalImage');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const charCountEl = document.getElementById('charCount');
const lineCountEl = document.getElementById('lineCount');

let currentImageData = null;

// ===== FILE HANDLING =====
dropZone.addEventListener('click', () => fileInput.click());
uploadBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
});

dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        loadImage(file);
    }
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) loadImage(file);
});

function loadImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            currentImageData = img;
            originalImage.src = e.target.result;
            originalPreview.style.display = 'block';
            controls.style.display = 'flex';
            convertImage();
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// ===== CONTROLS =====
widthSlider.addEventListener('input', () => {
    widthValue.textContent = widthSlider.value;
});

convertBtn.addEventListener('click', convertImage);
copyBtn.addEventListener('click', copyAscii);
downloadBtn.addEventListener('click', downloadAscii);

// ===== CONVERSION =====
function convertImage() {
    if (!currentImageData) return;

    const targetWidth = parseInt(widthSlider.value);
    const charset = CHAR_SETS[charSetSelect.value];
    const invert = invertCheck.checked;

    const ratio = currentImageData.height / currentImageData.width;
    const charHeight = 0.55;
    const targetHeight = Math.round(targetWidth * ratio * charHeight);

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    ctx.drawImage(currentImageData, 0, 0, targetWidth, targetHeight);

    const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const pixels = imageData.data;

    let ascii = '';
    for (let y = 0; y < targetHeight; y++) {
        for (let x = 0; x < targetWidth; x++) {
            const idx = (y * targetWidth + x) * 4;
            const r = pixels[idx];
            const g = pixels[idx + 1];
            const b = pixels[idx + 2];
            const brightness = (r * 0.299 + g * 0.587 + b * 0.114) / 255;

            let adjustedBrightness = invert ? 1 - brightness : brightness;
            const charIdx = Math.floor(adjustedBrightness * (charset.length - 1));
            ascii += charset[Math.min(charIdx, charset.length - 1)];
        }
        ascii += '\n';
    }

    asciiOutput.textContent = ascii;
    previewContainer.style.display = 'block';

    const lines = ascii.split('\n').filter(l => l.length > 0);
    charCountEl.textContent = `${targetWidth} × ${targetHeight} Zeichen`;
    lineCountEl.textContent = `${lines.length} Zeilen`;
}

// ===== COPY =====
function copyAscii() {
    const text = asciiOutput.textContent;
    navigator.clipboard.writeText(text).then(() => {
        copyBtn.textContent = '✓ Kopiert!';
        setTimeout(() => { copyBtn.textContent = 'Kopieren'; }, 1500);
    });
}

// ===== DOWNLOAD =====
function downloadAscii() {
    const text = asciiOutput.textContent;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ascii-art.txt';
    a.click();
    URL.revokeObjectURL(url);
}

