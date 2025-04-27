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
  const BACKEND = "http://localhost:5001/predict";
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
  
  // 1) CAPTURE VISIBLE TAB
  screenshotBtn.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" }, dataUrl => {
      const blob = dataURLtoBlob(dataUrl);
      handleImage(blob);
    });
  });
  
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
  
  // SEND to backend & RENDER
  async function handleImage(file) {
    console.log("[DeFakeIt] handleImage() got file:", file);
  
    // Show preview
    previewImg.hidden = false;
    previewImg.src    = URL.createObjectURL(file);
  
    // Build form-data
    const form = new FormData();
    form.append("image", file);
    console.log("[DeFakeIt] POSTing to:", BACKEND, "with form file:", form.get("image"));
  
    try {
      const resp = await fetch(BACKEND, { method: "POST", body: form });
      console.log("[DeFakeIt] fetch returned status:", resp.status);
  
      if (!resp.ok) {
        const body = await resp.text();
        console.error("[DeFakeIt] server error:", resp.status, body);
        alert(`Server error ${resp.status}, see console for details`);
        return;
      }
  
      const json = await resp.json();
      console.log("[DeFakeIt] server JSON:", json);
  
      // Convert the model's score to a percent, and display the label as reason
      const pct = Math.round(json.score * 100);
      showResult(pct, [ json.label ]);
  
    } catch (err) {
      console.error("[DeFakeIt] fetch() error:", err);
      alert("Error contacting server.");
    }
  }
  
  function showResult(pct, reasons) {
    resultArea.hidden = false;
    percentLabel.textContent = pct + "%";
  
    // DRAW the semi-gauge
    const r    = 80;
    const circ = Math.PI * r;
    const offset = circ * (1 - pct/100);
    gaugeSvg.innerHTML = `
      <path d="M20,100 A80,80 0 0,1 180,100" 
            fill="none" stroke="#eee" stroke-width="20"/>
      <path d="M20,100 A80,80 0 0,1 180,100"
            fill="none" stroke="#FF4D4F" stroke-width="20"
            stroke-dasharray="${circ} ${circ}"
            stroke-dashoffset="${offset}"/>`;
  
    // Friendly, descriptive reason text
    reasonP.textContent = reasons.length
      ? "Likely deepfake content detected: " + reasons.join(", ") + "."
      : "";
  }
  