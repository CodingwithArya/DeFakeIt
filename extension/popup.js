// Converts a base64 dataURL to a Blob without violating CSP
function dataURLtoBlob(dataurl) {
    const [header, base64] = dataurl.split(',');
    const mime = header.match(/:(.*?);/)[1];
    const bin = atob(base64);
    const len = bin.length;
    const u8 = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      u8[i] = bin.charCodeAt(i);
    }
    return new Blob([u8], { type: mime });
  }
  
  // 1) Catch any image pasted into the popup
  document.addEventListener("paste", e => {
    for (let item of e.clipboardData.items) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        handleImage(item.getAsFile());
        break;
      }
    }
  });
  
  // 🔗 Your backend endpoint (now on 5001)
  const BACKEND = "https://deepfakeit-api-417007895747.us-central1.run.app/predict";
  console.log("[DeFakeIt] talking to:", BACKEND);
  
  const screenshotBtn = document.getElementById("screenshot-btn");
  const dropZone      = document.getElementById("drop-zone");
  const browseBtn     = document.getElementById("browse-btn");
  const fileInput     = document.getElementById("file-input");
  
  const previewImg    = document.getElementById("preview");
  const resultArea    = document.getElementById("result-area");
  const percentLabel  = document.getElementById("percent");
  const reasonP       = document.getElementById("reason");
  const gaugeSvg      = document.getElementById("gauge");
  const changeBtn     = document.getElementById("change-image-btn");
  
  // 1) CAPTURE VISIBLE TAB
  screenshotBtn.addEventListener("click", captureAndCrop);

  async function captureAndCrop() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" }, dataUrl => {
      showInlineCropper(dataUrl);
    });
  }

  function showCanvasCropper(dataUrl) {
    // hide inputs
    document.getElementById('input-area').hidden = true;
  
    const overlay = document.createElement('div');
    Object.assign(overlay.style, {
      position: 'fixed', top: 0, left: 0,
      width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      zIndex: 9999,
    });
    document.body.appendChild(overlay);
  
    const container = document.createElement('div');
    container.style.position = 'relative';
    overlay.appendChild(container);
  
    const cancel = document.createElement('button');
    cancel.textContent = 'Cancel';
    Object.assign(cancel.style, {
      position: 'absolute', top: '10px', right: '10px', zIndex: 10001,
      padding: '6px 12px', cursor: 'pointer'
    });
    container.appendChild(cancel);
    cancel.addEventListener('click', () => {
      overlay.remove();
      document.getElementById('input-area').hidden = false;
    });
  
    const canvas = document.createElement('canvas');
    canvas.style.cursor = 'crosshair';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');
  
    const img = new Image();
    img.onload = () => {
      const maxW = window.innerWidth * 0.9;
      const maxH = window.innerHeight * 0.9;
      const scale = Math.min(maxW / img.width, maxH / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
      let dragging = false, sx=0, sy=0, ex=0, ey=0;
  
      canvas.addEventListener('mousedown', e => {
        dragging = true;
        const r = canvas.getBoundingClientRect();
        sx = e.clientX - r.left;
        sy = e.clientY - r.top;
      });
  
      canvas.addEventListener('mousemove', e => {
        if (!dragging) return;
        const r = canvas.getBoundingClientRect();
        ex = e.clientX - r.left;
        ey = e.clientY - r.top;
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const x = Math.min(sx, ex), y = Math.min(sy, ey),
              w = Math.abs(ex - sx), h = Math.abs(ey - sy);
        ctx.strokeStyle = '#00FF00';
        ctx.lineWidth = 2;
        ctx.setLineDash([6]);
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = 'rgba(0,255,0,0.3)';
        ctx.fillRect(x, y, w, h);
      });
  
      canvas.addEventListener('mouseup', () => {
        if (!dragging) return;
        dragging = false;
        const x = Math.min(sx, ex), y = Math.min(sy, ey),
              w = Math.abs(ex - sx), h = Math.abs(ey - sy);
  
        if (w < 10 || h < 10) {
          alert('Selection too small – try again.');
          ctx.clearRect(0,0,canvas.width,canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          return;
        }
        if (!confirm('Upload this selection?')) {
          ctx.clearRect(0,0,canvas.width,canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          return;
        }
  
        const cropCanvas = document.createElement('canvas');
        cropCanvas.width  = w / scale;
        cropCanvas.height = h / scale;
        const cctx = cropCanvas.getContext('2d');
        cctx.drawImage(
          img,
          x / scale, y / scale,  w / scale,  h / scale,
          0, 0,              w / scale,  h / scale
        );
  
        cropCanvas.toBlob(blob => {
          overlay.remove();
          handleImage(blob);
        }, 'image/png');
      });
    };
    img.src = dataUrl;
  }
  

  
  // 2) BROWSE button → opens file picker
  browseBtn.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    if (fileInput.files[0]) handleImage(fileInput.files[0]);
  });
  
  // 3) DRAG & DROP
  dropZone.addEventListener("dragover", e => {
    e.preventDefault();
    dropZone.style.borderColor = "#007bff";
  });
  dropZone.addEventListener("dragleave", e => {
    e.preventDefault();
    dropZone.style.borderColor = "#ccc";
  });
  dropZone.addEventListener("drop", e => {
    e.preventDefault();
    dropZone.style.borderColor = "#ccc";
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith("image/")) handleImage(f);
  });
  
  // 4) PASTE into drop zone
  dropZone.addEventListener("paste", e => {
    for (let item of e.clipboardData.items) {
      if (item.kind === "file" && item.type.startsWith("image/")) {
        handleImage(item.getAsFile());
        break;
      }
    }
  });

  changeBtn.addEventListener("click", () => {
    console.log("am in image click")
    previewImg.hidden   = true;
    resultArea.hidden   = true;
    changeBtn.hidden    = true;
    previewImg.src      = "";
    document.getElementById('input-area').hidden = false;
  });
  
  // SEND to backend & RENDER
  async function handleImage(file) {
    console.log("[DeFakeIt] handleImage() got file:", file);
  
    // 1) hide the picker
    document.getElementById('input-area').hidden = true;
  
    // 2) show the preview
    previewImg.hidden = false;
    previewImg.src    = URL.createObjectURL(file);
  
    // 3) show the "Change Image" button so user can reset
    changeBtn.hidden  = false;
  
    // (rest unchanged)
    const form = new FormData();
    form.append("image", file);
    try {
      const resp = await fetch(BACKEND, { method: "POST", body: form });
      console.log(resp)
      if (!resp.ok) throw new Error(await resp.text());
      const json = await resp.json();
      const pct  = Math.round(json.score * 100);
      showResult(pct, [ json.label ]);
    } catch (err) {
      console.error(err);
      alert("Server error: " + err.message);
    }
  }
  

  
  function showResult(pct, reasons) {
    resultArea.hidden = false;
    percentLabel.textContent = pct + "%";
  
    // DRAW the semi-gauge
    const r = 80;
    const circ = Math.PI * r;
    const offset = circ * (1 - pct / 100);
    const green = "#1c3d30"; // dark green
    const lightGreen = "#88c999"; // lighter green
  
    gaugeSvg.innerHTML = `
      <path d="M20,100 A80,80 0 0,1 180,100" 
            fill="none" stroke="#eee" stroke-width="20"/>
      <path d="M20,100 A80,80 0 0,1 180,100"
            fill="none" stroke="url(#grad1)" stroke-width="20"
            stroke-dasharray="${circ} ${circ}"
            stroke-dashoffset="${offset}"/>
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:${lightGreen};stop-opacity:1" />
          <stop offset="100%" style="stop-color:${green};stop-opacity:1" />
        </linearGradient>
      </defs>
    `;
  
    reasonP.textContent = reasons.length
      ? "✅ Verdict: " + reasons.join(", ") + "."
      : "";
  }
  

  function showInlineCropper(dataUrl) {
  // 1) Hide the original inputs
  document.getElementById('input-area').hidden = true;

  // 2) Create a cropper container inside your .card
  const card = document.querySelector('.card');
  const cropperDiv = document.createElement('div');
  cropperDiv.id = 'cropper-container';
  Object.assign(cropperDiv.style, {
    position:    'relative',
    width:       '100%',
    marginTop:   '12px',
    background:  '#fff',
    padding:     '8px',
    borderRadius:'8px',
    boxShadow:   '0 2px 8px rgba(0,0,0,0.15)'
  });
  card.appendChild(cropperDiv);

  // 3) Add cancel button
  const cancel = document.createElement('button');
  cancel.textContent = 'Cancel';
  Object.assign(cancel.style, {
    position:    'absolute',
    top:         '8px',
    right:       '8px',
    background:  '#1c3b2b',
    color:       'white',
    border:      'none',
    padding:     '6px 10px',
    borderRadius:'4px',
    cursor:      'pointer',
    zIndex:      10
  });
  cropperDiv.appendChild(cancel);
  cancel.onclick = () => {
    cropperDiv.remove();
    document.getElementById('input-area').hidden = false;
  };

  // 4) Create the canvas at full card width
  const canvas = document.createElement('canvas');
  canvas.style.cursor = 'crosshair';
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  cropperDiv.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // 5) Load screenshot image
  const img = new Image();
  img.onload = () => {
    // scale canvas to card width
    const containerWidth = cropperDiv.clientWidth - 16; // account for padding
    const scale = containerWidth / img.width;
    canvas.width  = img.width  * scale;
    canvas.height = img.height * scale;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // variables for dragging
    let dragging = false, sx=0, sy=0, ex=0, ey=0;

    canvas.onmousedown = e => {
      dragging = true;
      const r = canvas.getBoundingClientRect();
      sx = e.clientX - r.left;
      sy = e.clientY - r.top;
    };

    canvas.onmousemove = e => {
      if (!dragging) return;
      const r = canvas.getBoundingClientRect();
      ex = e.clientX - r.left;
      ey = e.clientY - r.top;
      // redraw + selection box
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const x = Math.min(sx, ex), y = Math.min(sy, ey),
            w = Math.abs(ex - sx), h = Math.abs(ey - sy);
      ctx.strokeStyle = '#00FF00';
      ctx.lineWidth   = 2;
      ctx.setLineDash([6]);
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = 'rgba(0,255,0,0.2)';
      ctx.fillRect(x, y, w, h);
    };

    canvas.onmouseup = () => {
      if (!dragging) return;
      dragging = false;
      const x = Math.min(sx, ex), y = Math.min(sy, ey),
            w = Math.abs(ex - sx), h = Math.abs(ey - sy);
      if (w<10||h<10) {
        alert('Selection too small—try again.');
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.drawImage(img,0,0,canvas.width,canvas.height);
        return;
      }
      if (!confirm('Upload this selection?')) {
        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.drawImage(img,0,0,canvas.width,canvas.height);
        return;
      }

      // crop at full resolution
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width  = w / scale;
      cropCanvas.height = h / scale;
      const cctx = cropCanvas.getContext('2d');
      cctx.drawImage(
        img,
        x / scale, y / scale,
        w / scale, h / scale,
        0, 0,
        w / scale, h / scale
      );
      cropCanvas.toBlob(blob => {
        cropperDiv.remove();
        handleImage(blob);
      }, 'image/png');
    };
  };
  img.src = dataUrl;
}

  