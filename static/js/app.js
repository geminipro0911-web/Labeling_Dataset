/**
 * YOLOv8 Collaborative Annotation Platform - Client Application
 * Vanilla JavaScript + HTML5 Canvas
 */

// Application State
const state = {
  currentUser: localStorage.getItem("labeler_user") || "",
  lanUrl: "",
  classes: {},
  currentImage: null,    // { filename, original_class_id, class_name, image_width, image_height, boxes, ... }
  imgElement: null,
  boxes: [],             // Array of { xmin, ymin, xmax, ymax, class_id } in image pixel coordinates
  selectedBoxIndex: -1,
  hoverBoxIndex: -1,
  isDrawing: false,
  drawStart: { x: 0, y: 0 },
  drawCurrent: { x: 0, y: 0 },
  mouseCanvasPos: { x: 0, y: 0 },
  isMouseInside: false,
  heartbeatIntervalId: null,
  stats: null
};

// DOM Elements
const canvas = document.getElementById("annotation-canvas");
const ctx = canvas.getContext("2d");
const canvasContainer = document.getElementById("canvas-container");
const loadingOverlay = document.getElementById("canvas-loading-overlay");
const loadingText = document.getElementById("loading-overlay-text");

// Status Bar Elements
const defectClassBadge = document.getElementById("defect-class-badge");
const defectClassName = document.getElementById("defect-class-name");
const statTotal = document.getElementById("stat-total");
const statLabeled = document.getElementById("stat-labeled");
const statPercent = document.getElementById("stat-percent");
const statUserLabeled = document.getElementById("stat-user-labeled");
const lanUrlDisplay = document.getElementById("lan-url-display");
const currentUserDisplay = document.getElementById("current-user-display");
const btnSwitchUser = document.getElementById("btn-switch-user");

// Ribbon Elements
const currentFilenameTag = document.getElementById("current-filename-tag");
const imageDimensionsTag = document.getElementById("image-dimensions-tag");
const cursorCoordsDisplay = document.getElementById("cursor-coords-display");
const btnUndo = document.getElementById("btn-undo");
const btnDeleteSelected = document.getElementById("btn-delete-selected");

// Sidebar Elements
const leaderboardList = document.getElementById("leaderboard-list");
const btnRefreshLeaderboard = document.getElementById("btn-refresh-leaderboard");
const boxCountBadge = document.getElementById("box-count-badge");
const boxesListContainer = document.getElementById("boxes-list");
const btnClearBoxes = document.getElementById("btn-clear-boxes");

// Navigation Elements
const btnBack = document.getElementById("btn-back");
const btnNext = document.getElementById("btn-next");

// Detail Card Elements
const detailCard = document.getElementById("detail-card");
const detailCardToggle = document.getElementById("detail-card-toggle");

// Modals
const loginModal = document.getElementById("login-modal");
const inputUserId = document.getElementById("input-user-id");
const btnLoginSubmit = document.getElementById("btn-login-submit");

const emptyConfirmModal = document.getElementById("empty-confirm-modal");
const btnCancelEmpty = document.getElementById("btn-cancel-empty");
const btnConfirmEmpty = document.getElementById("btn-confirm-empty");

const allDoneModal = document.getElementById("all-done-modal");
const btnRescanDataset = document.getElementById("btn-rescan-dataset");
const btnCloseAllDone = document.getElementById("btn-close-all-done");

// ============================================================================
// INITIALIZATION
// ============================================================================
async function initApp() {
  setupEventListeners();

  if (!state.currentUser) {
    showLoginModal();
  } else {
    currentUserDisplay.textContent = state.currentUser;
    await loadInitialData();
  }
}

async function loadInitialData() {
  await fetchSystemStatus();
  await fetchLeaderboard();
  await loadNextImage();
  startHeartbeat();
}

// ============================================================================
// API HELPERS
// ============================================================================
function getHeaders() {
  return {
    "Content-Type": "application/json",
    "X-User-Id": state.currentUser
  };
}

async function fetchSystemStatus() {
  try {
    const res = await fetch("/api/status", { headers: getHeaders() });
    if (!res.ok) return;
    const data = await res.json();
    state.lanUrl = data.lan_url;
    state.classes = data.classes;
    lanUrlDisplay.textContent = `LAN: ${data.lan_url}`;
    updateStatsDisplay(data.stats);
  } catch (err) {
    console.error("Failed to fetch system status:", err);
  }
}

async function fetchLeaderboard() {
  try {
    const res = await fetch("/api/leaderboard", { headers: getHeaders() });
    if (!res.ok) return;
    const data = await res.json();
    renderLeaderboard(data.leaderboard);
  } catch (err) {
    console.error("Failed to fetch leaderboard:", err);
  }
}

function updateStatsDisplay(stats) {
  if (!stats) return;
  state.stats = stats;
  statTotal.textContent = stats.total_images;
  statLabeled.textContent = stats.total_labeled;
  statPercent.textContent = `(${stats.progress_percent}%)`;
  statUserLabeled.textContent = stats.labeled_by_you;
}

// ============================================================================
// IMAGE & ANNOTATION MANAGEMENT
// ============================================================================
async function loadNextImage() {
  showOverlay("Loading next image...");
  try {
    const res = await fetch("/api/images/next", { headers: getHeaders() });
    if (res.status === 401) {
      showLoginModal();
      return;
    }
    const data = await res.json();

    if (!data.has_image) {
      hideOverlay();
      showAllDoneModal();
      return;
    }

    await setupImage(data);
  } catch (err) {
    console.error("Failed to load next image:", err);
    showOverlay("Error loading image. Please retry.");
  }
}

async function setupImage(imageData) {
  state.currentImage = imageData;
  state.boxes = imageData.boxes || [];
  state.selectedBoxIndex = -1;
  state.hoverBoxIndex = -1;

  // Update top status bar
  defectClassName.textContent = imageData.class_name;
  currentFilenameTag.textContent = imageData.filename;
  imageDimensionsTag.textContent = `${imageData.image_width} × ${imageData.image_height} px`;

  // Color code defect badge based on class_id
  const badgeColors = ["#38bdf8", "#f59e0b", "#ef4444", "#a855f7", "#ec4899", "#10b981", "#6366f1"];
  const color = badgeColors[imageData.original_class_id % badgeColors.length];
  defectClassBadge.style.color = color;
  defectClassBadge.style.borderColor = color;

  // Load Image Object
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = imageData.image_url;

  await new Promise((resolve, reject) => {
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
  });

  state.imgElement = img;

  // Initialize Canvas resolution matching exact image pixels
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  renderBoxesList();
  redrawCanvas();
  hideOverlay();
  btnDeleteSelected.disabled = true;
}

// ============================================================================
// CANVAS DRAWING & COORDINATE TRANSFORMATION
// ============================================================================
function getCanvasMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const x = Math.max(0, Math.min(canvas.width, (e.clientX - rect.left) * scaleX));
  const y = Math.max(0, Math.min(canvas.height, (e.clientY - rect.top) * scaleY));

  return { x: Math.round(x), y: Math.round(y) };
}

function redrawCanvas() {
  if (!state.imgElement) return;

  // 1. Draw base image
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(state.imgElement, 0, 0, canvas.width, canvas.height);

  // 2. Draw existing bounding boxes
  state.boxes.forEach((box, idx) => {
    const isSelected = (idx === state.selectedBoxIndex);
    const isHovered = (idx === state.hoverBoxIndex);
    drawBoundingBox(box, idx, isSelected, isHovered);
  });

  // 3. Draw active drawing box (if user is dragging)
  if (state.isDrawing) {
    const xmin = Math.min(state.drawStart.x, state.drawCurrent.x);
    const ymin = Math.min(state.drawStart.y, state.drawCurrent.y);
    const w = Math.abs(state.drawCurrent.x - state.drawStart.x);
    const h = Math.abs(state.drawCurrent.y - state.drawStart.y);

    ctx.save();
    ctx.strokeStyle = "#10b981"; // Vibrant emerald
    ctx.lineWidth = Math.max(2, Math.round(canvas.width / 450));
    ctx.fillStyle = "rgba(16, 185, 129, 0.22)";
    ctx.fillRect(xmin, ymin, w, h);
    ctx.strokeRect(xmin, ymin, w, h);

    // Dimension tooltip
    drawBoxLabel(xmin, ymin, `${Math.round(w)} × ${Math.round(h)} px`, "#10b981", "#000");
    ctx.restore();
  }

  // 4. Draw Crosshair Guidelines (Full-canvas horizontal & vertical lines)
  if (state.isMouseInside) {
    drawCrosshairs(state.mouseCanvasPos.x, state.mouseCanvasPos.y);
  }
}

function drawBoundingBox(box, index, isSelected, isHovered) {
  const w = box.xmax - box.xmin;
  const h = box.ymax - box.ymin;

  ctx.save();
  const strokeColor = isSelected ? "#38bdf8" : (isHovered ? "#60a5fa" : "#10b981");
  const fillColor = isSelected ? "rgba(56, 189, 248, 0.25)" : (isHovered ? "rgba(96, 165, 250, 0.18)" : "rgba(16, 185, 129, 0.12)");

  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = isSelected ? Math.max(3, Math.round(canvas.width / 350)) : Math.max(2, Math.round(canvas.width / 500));
  ctx.fillStyle = fillColor;

  // Box fill & border
  ctx.fillRect(box.xmin, box.ymin, w, h);
  ctx.strokeRect(box.xmin, box.ymin, w, h);

  // Corner resize-style anchor markers for selected box
  if (isSelected) {
    const s = Math.max(6, Math.round(canvas.width / 180));
    ctx.fillStyle = "#38bdf8";
    const corners = [
      [box.xmin - s/2, box.ymin - s/2],
      [box.xmax - s/2, box.ymin - s/2],
      [box.xmin - s/2, box.ymax - s/2],
      [box.xmax - s/2, box.ymax - s/2]
    ];
    corners.forEach(([cx, cy]) => ctx.fillRect(cx, cy, s, s));
  }

  // Box Tag Label
  const labelText = `#${index + 1} Class ${box.class_id}`;
  drawBoxLabel(box.xmin, box.ymin, labelText, strokeColor, isSelected ? "#000" : "#fff");
  ctx.restore();
}

function drawBoxLabel(x, y, text, bgColor, textColor) {
  ctx.font = `600 ${Math.max(12, Math.round(canvas.width / 80))}px Inter, sans-serif`;
  const textMetrics = ctx.measureText(text);
  const padding = 5;
  const h = Math.max(18, Math.round(canvas.width / 65));
  const w = textMetrics.width + padding * 2;

  const labelY = (y - h < 0) ? y : y - h;

  ctx.fillStyle = bgColor;
  ctx.fillRect(x, labelY, w, h);

  ctx.fillStyle = textColor;
  ctx.fillText(text, x + padding, labelY + h - 5);
}

function drawCrosshairs(x, y) {
  ctx.save();
  ctx.strokeStyle = "rgba(56, 189, 248, 0.75)"; // Cyan high-contrast guideline
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 6]);

  // Horizontal line across full canvas
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(canvas.width, y);
  ctx.stroke();

  // Vertical line across full canvas
  ctx.beginPath();
  ctx.moveTo(x, 0);
  ctx.lineTo(x, canvas.height);
  ctx.stroke();

  ctx.restore();
}

// Find box under mouse
function findBoxIndexAt(x, y) {
  // Check from topmost (last added) to bottommost
  for (let i = state.boxes.length - 1; i >= 0; i--) {
    const b = state.boxes[i];
    if (x >= b.xmin && x <= b.xmax && y >= b.ymin && y <= b.ymax) {
      return i;
    }
  }
  return -1;
}

// ============================================================================
// BOX LIST & SELECTION MANAGEMENT
// ============================================================================
function renderBoxesList() {
  boxCountBadge.textContent = state.boxes.length;
  boxesListContainer.innerHTML = "";

  if (state.boxes.length === 0) {
    boxesListContainer.innerHTML = '<div class="no-boxes-hint">Click & drag on image to draw bounding boxes</div>';
    return;
  }

  state.boxes.forEach((box, idx) => {
    const w = Math.round(box.xmax - box.xmin);
    const h = Math.round(box.ymax - box.ymin);
    const row = document.createElement("div");
    row.className = `box-list-row ${idx === state.selectedBoxIndex ? "selected" : ""}`;
    row.innerHTML = `
      <span class="box-title">Box #${idx + 1}</span>
      <span class="box-dim">${w} × ${h} px</span>
      <button class="btn-del-box" title="Delete this box">✕</button>
    `;

    row.addEventListener("click", (e) => {
      if (e.target.classList.contains("btn-del-box")) {
        deleteBoxAt(idx);
      } else {
        state.selectedBoxIndex = idx;
        btnDeleteSelected.disabled = false;
        renderBoxesList();
        redrawCanvas();
      }
    });

    boxesListContainer.appendChild(row);
  });
}

function deleteBoxAt(index) {
  if (index >= 0 && index < state.boxes.length) {
    state.boxes.splice(index, 1);
    if (state.selectedBoxIndex === index) {
      state.selectedBoxIndex = -1;
      btnDeleteSelected.disabled = true;
    } else if (state.selectedBoxIndex > index) {
      state.selectedBoxIndex--;
    }
    renderBoxesList();
    redrawCanvas();
  }
}

function undoLastBox() {
  if (state.boxes.length > 0) {
    state.boxes.pop();
    state.selectedBoxIndex = -1;
    btnDeleteSelected.disabled = true;
    renderBoxesList();
    redrawCanvas();
  }
}

function clearAllBoxes() {
  if (state.boxes.length > 0) {
    state.boxes = [];
    state.selectedBoxIndex = -1;
    btnDeleteSelected.disabled = true;
    renderBoxesList();
    redrawCanvas();
  }
}

// ============================================================================
// NAVIGATION BUTTON ACTIONS: BACK & NEXT
// ============================================================================
async function handleNext(isConfirmedEmpty = false) {
  if (!state.currentImage) return;

  // Filter out boxes smaller than 5x5 px (accidental clicks)
  const validBoxes = state.boxes.filter(b => (b.xmax - b.xmin) >= 5 && (b.ymax - b.ymin) >= 5);

  // If no boxes drawn and not confirmed empty, show confirmation modal
  if (validBoxes.length === 0 && !isConfirmedEmpty) {
    showEmptyConfirmModal();
    return;
  }

  showOverlay("Saving labels and loading next image...");

  try {
    const filename = state.currentImage.filename;
    const res = await fetch(`/api/images/${filename}/save`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        boxes: validBoxes,
        confirmed_empty: isConfirmedEmpty
      })
    });

    if (!res.ok) {
      const err = await res.json();
      if (err.require_confirmation) {
        hideOverlay();
        showEmptyConfirmModal();
        return;
      }
      throw new Error(err.detail || "Save failed");
    }

    const data = await res.json();
    updateStatsDisplay(data.stats);
    fetchLeaderboard(); // Update leaderboard rankings

    // Immediately load next image
    await loadNextImage();
  } catch (err) {
    console.error("Save error:", err);
    alert(`Save failed: ${err.message}`);
    hideOverlay();
  }
}

async function handleBack() {
  showOverlay("Loading previous labeled image...");
  try {
    const currentFilename = state.currentImage ? state.currentImage.filename : null;
    const res = await fetch("/api/images/back", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ current_filename: currentFilename })
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.detail || "Could not load previous image.");
      hideOverlay();
      return;
    }

    const data = await res.json();
    await setupImage(data);
  } catch (err) {
    console.error("Back error:", err);
    hideOverlay();
  }
}

// ============================================================================
// LEADERBOARD RENDERING (TOP 4 GLOW & MEDALS)
// ============================================================================
function renderLeaderboard(leaderboard) {
  leaderboardList.innerHTML = "";
  if (!leaderboard || leaderboard.length === 0) {
    leaderboardList.innerHTML = '<li class="leaderboard-loading">No annotations submitted yet. Be the first! 🚀</li>';
    return;
  }

  leaderboard.forEach(item => {
    const li = document.createElement("li");
    const isMe = (item.username.toLowerCase() === state.currentUser.toLowerCase());
    
    // Rank Icon / Badge
    let rankBadge = `<span class="rank-num">#${item.rank}</span>`;
    let rankClass = "";

    if (item.rank === 1) {
      rankBadge = `<span class="rank-badge" title="Champion Annotator">👑</span>`;
      rankClass = "rank-1";
    } else if (item.rank === 2) {
      rankBadge = `<span class="rank-badge" title="Gold Medalist">🥇</span>`;
      rankClass = "rank-2";
    } else if (item.rank === 3) {
      rankBadge = `<span class="rank-badge" title="Silver Medalist">🥈</span>`;
      rankClass = "rank-3";
    } else if (item.rank === 4) {
      rankBadge = `<span class="rank-badge" title="Bronze Medalist">🥉</span>`;
      rankClass = "rank-4";
    }

    li.className = `leaderboard-item ${rankClass} ${isMe ? "is-me" : ""}`;
    li.innerHTML = `
      <div class="user-info">
        ${rankBadge}
        <span class="user-name-text" title="${item.username}">${item.username}</span>
      </div>
      <span class="count-badge">${item.count}</span>
    `;

    leaderboardList.appendChild(li);
  });
}

// ============================================================================
// HEARTBEAT / CONCURRENCY LOCK KEEP-ALIVE
// ============================================================================
function startHeartbeat() {
  if (state.heartbeatIntervalId) {
    clearInterval(state.heartbeatIntervalId);
  }
  // Every 30 seconds
  state.heartbeatIntervalId = setInterval(async () => {
    if (state.currentImage && state.currentImage.filename && state.currentUser) {
      try {
        await fetch("/api/heartbeat", {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ filename: state.currentImage.filename })
        });
      } catch (e) {
        // Heartbeat error silently ignored
      }
    }
  }, 30000);
}

// ============================================================================
// UI EVENT LISTENERS
// ============================================================================
function setupEventListeners() {
  // Canvas Mouse Events
  canvas.addEventListener("mouseenter", () => {
    state.isMouseInside = true;
  });

  canvas.addEventListener("mouseleave", () => {
    state.isMouseInside = false;
    cursorCoordsDisplay.textContent = "X: - | Y: -";
    if (state.isDrawing) {
      state.isDrawing = false;
    }
    redrawCanvas();
  });

  canvas.addEventListener("mousemove", (e) => {
    const pos = getCanvasMousePos(e);
    state.mouseCanvasPos = pos;
    cursorCoordsDisplay.textContent = `X: ${pos.x} | Y: ${pos.y}`;

    if (state.isDrawing) {
      state.drawCurrent = pos;
      redrawCanvas();
    } else {
      const boxIdx = findBoxIndexAt(pos.x, pos.y);
      if (boxIdx !== state.hoverBoxIndex) {
        state.hoverBoxIndex = boxIdx;
        redrawCanvas();
      }
    }
  });

  canvas.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return; // Only left click
    const pos = getCanvasMousePos(e);

    // Check if clicked inside existing box
    const clickedBoxIdx = findBoxIndexAt(pos.x, pos.y);

    if (clickedBoxIdx !== -1 && !state.isDrawing) {
      // Select clicked box
      state.selectedBoxIndex = clickedBoxIdx;
      btnDeleteSelected.disabled = false;
      renderBoxesList();
      redrawCanvas();
    } else {
      // Start drawing new box
      state.isDrawing = true;
      state.drawStart = pos;
      state.drawCurrent = pos;
      state.selectedBoxIndex = -1;
      btnDeleteSelected.disabled = true;
      renderBoxesList();
      redrawCanvas();
    }
  });

  window.addEventListener("mouseup", (e) => {
    if (!state.isDrawing) return;
    state.isDrawing = false;

    const xmin = Math.min(state.drawStart.x, state.drawCurrent.x);
    const ymin = Math.min(state.drawStart.y, state.drawCurrent.y);
    const xmax = Math.max(state.drawStart.x, state.drawCurrent.x);
    const ymax = Math.max(state.drawStart.y, state.drawCurrent.y);

    const w = xmax - xmin;
    const h = ymax - ymin;

    // Reject accidental clicks (< 5 pixels)
    if (w >= 5 && h >= 5 && state.currentImage) {
      const newBox = {
        xmin, ymin, xmax, ymax,
        class_id: state.currentImage.original_class_id
      };
      state.boxes.push(newBox);
      state.selectedBoxIndex = state.boxes.length - 1;
      btnDeleteSelected.disabled = false;
    }

    renderBoxesList();
    redrawCanvas();
  });

  // Action Buttons
  btnUndo.addEventListener("click", undoLastBox);
  btnDeleteSelected.addEventListener("click", () => {
    if (state.selectedBoxIndex !== -1) {
      deleteBoxAt(state.selectedBoxIndex);
    }
  });
  btnClearBoxes.addEventListener("click", clearAllBoxes);

  // Main 2 Navigation Buttons
  btnNext.addEventListener("click", () => handleNext(false));
  btnBack.addEventListener("click", handleBack);

  // Bottom Detail Card Toggle
  detailCardToggle.addEventListener("click", () => {
    detailCard.classList.toggle("collapsed");
  });

  // Leaderboard Refresh
  btnRefreshLeaderboard.addEventListener("click", () => {
    fetchLeaderboard();
  });

  // Keyboard Shortcuts
  window.addEventListener("keydown", (e) => {
    // Ignore hotkeys when typing in modal inputs
    if (e.target.tagName === "INPUT") return;

    if (e.ctrlKey && e.key.toLowerCase() === "z") {
      e.preventDefault();
      undoLastBox();
    } else if (e.key === "Delete" || e.key === "Backspace") {
      if (state.selectedBoxIndex !== -1) {
        e.preventDefault();
        deleteBoxAt(state.selectedBoxIndex);
      }
    } else if (e.key.toLowerCase() === "d" || e.key === "Enter") {
      e.preventDefault();
      handleNext(false);
    } else if (e.key.toLowerCase() === "a") {
      e.preventDefault();
      handleBack();
    } else if (e.key === "Escape") {
      state.selectedBoxIndex = -1;
      btnDeleteSelected.disabled = true;
      renderBoxesList();
      redrawCanvas();
    }
  });

  // User Switch
  btnSwitchUser.addEventListener("click", () => {
    showLoginModal();
  });

  // Login Modal Events
  btnLoginSubmit.addEventListener("click", handleLoginSubmit);
  inputUserId.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleLoginSubmit();
  });

  // Empty Confirm Modal
  btnCancelEmpty.addEventListener("click", () => {
    hideEmptyConfirmModal();
  });
  btnConfirmEmpty.addEventListener("click", () => {
    hideEmptyConfirmModal();
    handleNext(true);
  });

  // All Done Modal
  btnCloseAllDone.addEventListener("click", () => {
    hideAllDoneModal();
    loadNextImage();
  });
  btnRescanDataset.addEventListener("click", async () => {
    showOverlay("Rescanning dataset directory...");
    try {
      await fetch("/api/scan", { method: "POST" });
      await fetchSystemStatus();
      hideOverlay();
      hideAllDoneModal();
      loadNextImage();
    } catch (e) {
      hideOverlay();
    }
  });

  // Release lock on tab close or navigation
  window.addEventListener("beforeunload", () => {
    if (state.currentImage && state.currentImage.filename && state.currentUser) {
      navigator.sendBeacon(
        `/api/images/${state.currentImage.filename}/release`,
        JSON.stringify({})
      );
    }
  });
}

// ============================================================================
// MODAL CONTROLLERS
// ============================================================================
function showLoginModal() {
  inputUserId.value = state.currentUser || "";
  loginModal.classList.add("active");
  setTimeout(() => inputUserId.focus(), 100);
}

function handleLoginSubmit() {
  const val = inputUserId.value.trim();
  if (!val) {
    alert("Please enter a valid Employee ID or Username.");
    return;
  }
  state.currentUser = val;
  localStorage.setItem("labeler_user", val);
  document.cookie = `labeler_user=${encodeURIComponent(val)}; path=/; max-age=2592000`;
  currentUserDisplay.textContent = val;
  loginModal.classList.remove("active");
  loadInitialData();
}

function showEmptyConfirmModal() {
  emptyConfirmModal.classList.add("active");
}
function hideEmptyConfirmModal() {
  emptyConfirmModal.classList.remove("active");
}

function showAllDoneModal() {
  allDoneModal.classList.add("active");
}
function hideAllDoneModal() {
  allDoneModal.classList.remove("active");
}

function showOverlay(text) {
  loadingText.textContent = text || "Loading...";
  loadingOverlay.classList.add("active");
}
function hideOverlay() {
  loadingOverlay.classList.remove("active");
}

// Start application
window.addEventListener("DOMContentLoaded", initApp);
