/**
 * YOLOv8 Collaborative Annotation Platform - Client Application
 * Vanilla JavaScript + HTML5 Canvas
 * Multi-Language (VI / EN) & Theme (Dark / Light) Support
 */

// Internationalization (i18n) Translations
const i18n = {
  vi: {
    brandName: "Gán Nhãn YOLOv8",
    targetDefect: "LOẠI LỖI MỤC TIÊU:",
    totalImages: "Tổng Số Ảnh:",
    totalLabeled: "Đã Gán Nhãn:",
    labeledByYou: "Bạn Đã Gán:",
    lanPrefix: "LAN:",
    lanConnecting: "Đang kết nối...",
    guestUser: "Khách",
    switchUser: "Đổi User",
    topAnnotators: "Bảng Xếp Hạng",
    drawnBoxes: "Hộp Đã Vẽ",
    clearAll: "Xóa Hết",
    noBoxesHint: "Nhấn và kéo chuột trên ảnh để vẽ bounding box",
    boxTitlePrefix: "Hộp",
    deleteBoxTitle: "Xóa hộp này",
    noImageLoaded: "Chưa tải ảnh",
    undoBtn: "↩ Hoàn tác",
    undoTitle: "Hoàn tác hộp vừa vẽ (Ctrl+Z)",
    deleteSelectedBtn: "🗑 Xóa Đã Chọn",
    deleteSelectedTitle: "Xóa hộp đang chọn (Del)",
    loadingOverlayText: "Đang tải ảnh tiếp theo...",
    backTitle: "Quay lại",
    backHint: "Xem ảnh trước (A)",
    nextTitle: "Tiếp theo",
    nextHint: "Lưu & Tiếp (D / Enter)",
    guidelineHeader: "Quy Tắc Gán Nhãn & Hình Ảnh Minh Họa",
    guidelineBadge: "Chuẩn YOLOv8",
    toggleViewText: "Bấm để xem hướng dẫn chi tiết",
    rulesHeader: "🎯 Quy Tắc Vẽ Bounding Box:",
    ruleTight: "<strong>Khung Ôm Sát:</strong> Vẽ hộp chữ nhật bao sát viền biên của khuyết tật, hạn chế tối đa phần nền thừa.",
    ruleInstances: "<strong>Tách Riêng Từng Lỗi:</strong> Nếu có nhiều điểm khuyết tật riêng biệt, hãy vẽ từng hộp cho mỗi điểm.",
    ruleNoClip: "<strong>Không Cắt Cụt Lỗi:</strong> Đảm bảo toàn bộ các mép của khuyết tật nằm trọn vẹn bên trong khung.",
    ruleClassInherit: "<strong>Kế Thừa Mã Lỗi:</strong> Tất cả các hộp vẽ trên cùng một ảnh sẽ tự động kế thừa loại lỗi của ảnh đó.",
    ruleAccidentalClicks: "<strong>Bỏ Qua Cú Click Lỗi:</strong> Các hộp có kích thước nhỏ hơn 5&times;5 pixels sẽ tự động bị bỏ qua.",
    ruleShortcuts: "<strong>Phím Tắt Tiện Lợi:</strong> <code>Ctrl+Z</code> Hoàn tác | <code>Delete</code> Xóa hộp | <code>A</code> Quay lại | <code>D</code> / <code>Enter</code> Lưu & Tiếp.",
    correctHeader: "GÁN NHÃN ĐÚNG",
    correctDesc: "Khung bounding box ôm khít viền khuyết tật, lượng nền thừa tối thiểu.",
    incorrectHeader: "GÁN NHÃN SAI",
    incorrectDesc: "Khung quá rộng (lãng phí dung lượng học) hoặc cắt đứt một phần khuyết tật.",
    loginTitle: "Đăng Nhập Cộng Tác Mạng LAN",
    loginDesc: "Nhập Mã Nhân Viên hoặc Tên của bạn để bắt đầu gán nhãn. Mã này dùng để theo dõi khóa ảnh và xếp hạng trên bảng thành tích.",
    loginInputLabel: "Mã Nhân Viên / Tên Người Dùng:",
    loginInputPlaceholder: "ví dụ: NV-1042 hoặc NguyenVanA",
    loginSsoNotice: "ℹ Cổng Chờ SSO Doanh Nghiệp: Sẵn sàng kết nối token SAML / OAuth2.",
    loginBtn: "Bắt Đầu Gán Nhãn",
    emptyConfirmTitle: "Chưa Vẽ Hộp Bounding Box",
    emptyConfirmP1: "Bạn chưa vẽ bất kỳ khung bounding box nào trên bức ảnh này.",
    emptyConfirmP2: "Bạn có muốn lưu ảnh này dưới dạng Mẫu Âm Tính (Negative Sample - Sản phẩm bình thường không lỗi) hay quay lại tiếp tục vẽ?",
    emptyCancelBtn: "Quay Lại Vẽ Tiếp",
    emptyConfirmBtn: "Lưu Mẫu Âm Tính",
    allDoneTitle: "Đã Hoàn Thành Toàn Bộ!",
    allDoneP1: "Tuyệt vời! Tất cả hình ảnh trong bộ dữ liệu đã được gán nhãn hoặc đang được đồng nghiệp xử lý.",
    allDoneP2: "Kiểm tra bảng xếp hạng hoặc bấm Quét Lại để cập nhật nếu có ảnh mới được thêm vào.",
    rescanBtn: "Quét Lại Dataset",
    checkAgainBtn: "Kiểm Tra Lại",
    leaderboardLoading: "Đang tải bảng xếp hạng...",
    leaderboardEmpty: "Chưa có lượt gán nhãn nào. Hãy là người đầu tiên! 🚀",
    savingOverlayText: "Đang lưu nhãn và tải ảnh tiếp theo...",
    rescanningOverlayText: "Đang quét lại thư mục dữ liệu...",
    saveFailed: "Lưu nhãn thất bại: ",
    noPrevImage: "Không tìm thấy ảnh đã gán nhãn trước đó của bạn.",
    enterValidIdAlert: "Vui lòng nhập Mã Nhân Viên hoặc Tên Người Dùng hợp lệ.",
    itsYouTag: "BẠN",
    themeToggleDark: "Tối",
    themeToggleLight: "Sáng"
  },
  en: {
    brandName: "YOLOv8 Annotator",
    targetDefect: "TARGET DEFECT:",
    totalImages: "Total Images:",
    totalLabeled: "Total Labeled:",
    labeledByYou: "Labeled by You:",
    lanPrefix: "LAN:",
    lanConnecting: "Connecting...",
    guestUser: "Guest",
    switchUser: "Switch",
    topAnnotators: "Top Annotators",
    drawnBoxes: "Drawn Boxes",
    clearAll: "Clear All",
    noBoxesHint: "Click & drag on image to draw bounding boxes",
    boxTitlePrefix: "Box",
    deleteBoxTitle: "Delete this box",
    noImageLoaded: "No image loaded",
    undoBtn: "↩ Undo",
    undoTitle: "Undo last box (Ctrl+Z)",
    deleteSelectedBtn: "🗑 Delete Selected",
    deleteSelectedTitle: "Delete selected box (Del)",
    loadingOverlayText: "Loading next image...",
    backTitle: "Back",
    backHint: "Review previous (A)",
    nextTitle: "Next",
    nextHint: "Save & Advance (D / Enter)",
    guidelineHeader: "Annotation Guidelines & Visual Examples",
    guidelineBadge: "YOLOv8 Standard",
    toggleViewText: "Click to view instructions",
    rulesHeader: "🎯 Bounding Box Rules:",
    ruleTight: "<strong>Tight Boundaries:</strong> Draw the rectangular box snugly around the defect without leaving excessive background margins.",
    ruleInstances: "<strong>Separate Instances:</strong> If there are multiple defect spots, draw a separate box around each defect.",
    ruleNoClip: "<strong>Do Not Clip:</strong> Ensure all defect edges are completely enclosed inside the box.",
    ruleClassInherit: "<strong>Single Defect Class:</strong> All boxes inherit the target defect class assigned to this image.",
    ruleAccidentalClicks: "<strong>Accidental Clicks:</strong> Boxes smaller than 5×5 pixels are automatically ignored.",
    ruleShortcuts: "<strong>Keyboard Shortcuts:</strong> <code>Ctrl+Z</code> Undo | <code>Delete</code> Delete selected | <code>A</code> Back | <code>D</code> / <code>Enter</code> Next.",
    correctHeader: "CORRECT LABELING",
    correctDesc: "Tight bounding box fits precisely around defect edges with minimal background.",
    incorrectHeader: "INCORRECT LABELING",
    incorrectDesc: "Too loose (wastes training capacity) or partially truncates the defect.",
    loginTitle: "LAN Collaborator Sign-In",
    loginDesc: "Enter your Employee ID or Name to start labeling. Your ID will track locks and rank you on the team leaderboard.",
    loginInputLabel: "Employee ID / Username:",
    loginInputPlaceholder: "e.g. EMP-1042 or Sarah",
    loginSsoNotice: "ℹ Enterprise SSO Placeholder: Ready for SAML/OAuth2 token injection.",
    loginBtn: "Start Labeling",
    emptyConfirmTitle: "No Bounding Box Drawn",
    emptyConfirmP1: "You haven't drawn any defect bounding boxes on this image.",
    emptyConfirmP2: "Do you want to save this image as a Negative Sample (Defect-Free / Normal Image), or go back and draw boxes?",
    emptyCancelBtn: "Go Back & Draw",
    emptyConfirmBtn: "Save as Negative Sample",
    allDoneTitle: "All Images Labeled!",
    allDoneP1: "Awesome work! All images in the dataset are currently labeled or being processed by your colleagues on the LAN.",
    allDoneP2: "Check the leaderboard or hit Refresh to see if new images were added.",
    rescanBtn: "Rescan Dataset",
    checkAgainBtn: "Check Again",
    leaderboardLoading: "Loading rankings...",
    leaderboardEmpty: "No annotations submitted yet. Be the first! 🚀",
    savingOverlayText: "Saving labels and loading next image...",
    rescanningOverlayText: "Rescanning dataset directory...",
    saveFailed: "Save failed: ",
    noPrevImage: "No previous labeled image found in your labeling history.",
    enterValidIdAlert: "Please enter a valid Employee ID or Username.",
    itsYouTag: "YOU",
    themeToggleDark: "Dark",
    themeToggleLight: "Light"
  }
};

// Application State
const state = {
  currentUser: localStorage.getItem("labeler_user") || "",
  lang: localStorage.getItem("labeler_lang") || "vi",
  theme: localStorage.getItem("labeler_theme") || "dark",
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
  stats: null,
  leaderboardData: []
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

// Theme & Language Switcher Elements
const btnLangToggle = document.getElementById("btn-lang-toggle");
const langFlag = document.getElementById("lang-flag");
const langLabel = document.getElementById("lang-label");
const btnThemeToggle = document.getElementById("btn-theme-toggle");
const themeIcon = document.getElementById("theme-icon");
const themeLabel = document.getElementById("theme-label");

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
const btnBackTitle = document.getElementById("btn-back-title");
const btnBackHint = document.getElementById("btn-back-hint");
const btnNext = document.getElementById("btn-next");
const btnNextTitle = document.getElementById("btn-next-title");
const btnNextHint = document.getElementById("btn-next-hint");

// Detail Card Elements
const detailCard = document.getElementById("detail-card");
const detailCardToggle = document.getElementById("detail-card-toggle");

// Rules List Items
const ruleTight = document.getElementById("rule-tight");
const ruleInstances = document.getElementById("rule-instances");
const ruleNoClip = document.getElementById("rule-noclip");
const ruleClass = document.getElementById("rule-class");
const ruleClicks = document.getElementById("rule-clicks");
const ruleHotkeys = document.getElementById("rule-hotkeys");

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
// THEME & LANGUAGE MANAGEMENT
// ============================================================================
function applyTheme(theme) {
  state.theme = theme;
  localStorage.setItem("labeler_theme", theme);

  if (theme === "light") {
    document.body.classList.remove("dark-theme");
    document.body.classList.add("light-theme");
    themeIcon.textContent = "☀️";
    themeLabel.textContent = i18n[state.lang].themeToggleLight;
  } else {
    document.body.classList.remove("light-theme");
    document.body.classList.add("dark-theme");
    themeIcon.textContent = "🌙";
    themeLabel.textContent = i18n[state.lang].themeToggleDark;
  }

  redrawCanvas();
}

function toggleTheme() {
  const newTheme = (state.theme === "dark") ? "light" : "dark";
  applyTheme(newTheme);
}

function applyLanguage(lang) {
  state.lang = lang;
  localStorage.setItem("labeler_lang", lang);
  document.documentElement.lang = lang;

  const t = i18n[lang];

  // Update switcher button
  if (lang === "vi") {
    langFlag.textContent = "🇻🇳";
    langLabel.textContent = "VI";
  } else {
    langFlag.textContent = "🇬🇧";
    langLabel.textContent = "EN";
  }

  // Update elements with data-i18n
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (t[key]) {
      el.textContent = t[key];
    }
  });

  // Update Rules HTML
  if (ruleTight) ruleTight.innerHTML = t.ruleTight;
  if (ruleInstances) ruleInstances.innerHTML = t.ruleInstances;
  if (ruleNoClip) ruleNoClip.innerHTML = t.ruleNoClip;
  if (ruleClass) ruleClass.innerHTML = t.ruleClassInherit;
  if (ruleClicks) ruleClicks.innerHTML = t.ruleAccidentalClicks;
  if (ruleHotkeys) ruleHotkeys.innerHTML = t.ruleShortcuts;

  // Update placeholders and titles
  if (inputUserId) inputUserId.placeholder = t.loginInputPlaceholder;
  if (btnUndo) btnUndo.title = t.undoTitle;
  if (btnDeleteSelected) btnDeleteSelected.title = t.deleteSelectedTitle;

  // Update theme button text according to language
  themeLabel.textContent = (state.theme === "light") ? t.themeToggleLight : t.themeToggleDark;

  // Update defect class name on badge
  if (state.currentImage) {
    defectClassName.textContent = formatDefectName(state.currentImage.original_class_id, state.currentImage.raw_class_name || state.currentImage.class_name);
  }

  // Re-render boxes list & leaderboard
  renderBoxesList();
  if (state.leaderboardData && state.leaderboardData.length > 0) {
    renderLeaderboard(state.leaderboardData);
  }
}

function toggleLanguage() {
  const newLang = (state.lang === "vi") ? "en" : "vi";
  applyLanguage(newLang);
}

function formatDefectName(classId, rawName) {
  if (!rawName) return `Class ${classId}`;
  if (rawName.includes("/")) {
    const parts = rawName.split("/").map(s => s.trim());
    const enName = parts[0];
    const viName = parts[1] || parts[0];
    const target = (state.lang === "vi") ? viName : enName;
    return `Class ${classId}: ${target}`;
  }
  return `Class ${classId}: ${rawName}`;
}

// ============================================================================
// INITIALIZATION
// ============================================================================
async function initApp() {
  setupEventListeners();

  // Apply saved theme and language
  applyTheme(state.theme);
  applyLanguage(state.lang);

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
    lanUrlDisplay.textContent = `${i18n[state.lang].lanPrefix} ${data.lan_url}`;
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
    state.leaderboardData = data.leaderboard || [];
    renderLeaderboard(state.leaderboardData);
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
  showOverlay(i18n[state.lang].loadingOverlayText);
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
    showOverlay(i18n[state.lang].saveFailed + err.message);
  }
}

async function setupImage(imageData) {
  state.currentImage = imageData;
  state.currentImage.raw_class_name = imageData.class_name;
  state.boxes = imageData.boxes || [];
  state.selectedBoxIndex = -1;
  state.hoverBoxIndex = -1;

  // Update top status bar
  defectClassName.textContent = formatDefectName(imageData.original_class_id, imageData.class_name);
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
  const prefix = i18n[state.lang].boxTitlePrefix || "Box";
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

function findBoxIndexAt(x, y) {
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
    boxesListContainer.innerHTML = `<div class="no-boxes-hint">${i18n[state.lang].noBoxesHint}</div>`;
    return;
  }

  const t = i18n[state.lang];

  state.boxes.forEach((box, idx) => {
    const w = Math.round(box.xmax - box.xmin);
    const h = Math.round(box.ymax - box.ymin);
    const row = document.createElement("div");
    row.className = `box-list-row ${idx === state.selectedBoxIndex ? "selected" : ""}`;
    row.innerHTML = `
      <span class="box-title">${t.boxTitlePrefix} #${idx + 1}</span>
      <span class="box-dim">${w} × ${h} px</span>
      <button class="btn-del-box" title="${t.deleteBoxTitle}">✕</button>
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

  const validBoxes = state.boxes.filter(b => (b.xmax - b.xmin) >= 5 && (b.ymax - b.ymin) >= 5);

  if (validBoxes.length === 0 && !isConfirmedEmpty) {
    showEmptyConfirmModal();
    return;
  }

  showOverlay(i18n[state.lang].savingOverlayText);

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
    fetchLeaderboard();

    await loadNextImage();
  } catch (err) {
    console.error("Save error:", err);
    alert(`${i18n[state.lang].saveFailed}${err.message}`);
    hideOverlay();
  }
}

async function handleBack() {
  showOverlay(i18n[state.lang].loadingOverlayText);
  try {
    const currentFilename = state.currentImage ? state.currentImage.filename : null;
    const res = await fetch("/api/images/back", {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ current_filename: currentFilename })
    });

    if (!res.ok) {
      const err = await res.json();
      alert(err.detail || i18n[state.lang].noPrevImage);
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
  state.leaderboardData = leaderboard || [];

  if (!leaderboard || leaderboard.length === 0) {
    leaderboardList.innerHTML = `<li class="leaderboard-loading">${i18n[state.lang].leaderboardEmpty}</li>`;
    return;
  }

  const t = i18n[state.lang];

  leaderboard.forEach(item => {
    const li = document.createElement("li");
    const isMe = (item.username.toLowerCase() === state.currentUser.toLowerCase());
    
    let rankBadge = `<span class="rank-num">#${item.rank}</span>`;
    let rankClass = "";

    if (item.rank === 1) {
      rankBadge = `<span class="rank-badge" title="Top 1">👑</span>`;
      rankClass = "rank-1";
    } else if (item.rank === 2) {
      rankBadge = `<span class="rank-badge" title="Top 2">🥇</span>`;
      rankClass = "rank-2";
    } else if (item.rank === 3) {
      rankBadge = `<span class="rank-badge" title="Top 3">🥈</span>`;
      rankClass = "rank-3";
    } else if (item.rank === 4) {
      rankBadge = `<span class="rank-badge" title="Top 4">🥉</span>`;
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
  state.heartbeatIntervalId = setInterval(async () => {
    if (state.currentImage && state.currentImage.filename && state.currentUser) {
      try {
        await fetch("/api/heartbeat", {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ filename: state.currentImage.filename })
        });
      } catch (e) {
        // Silently ignore
      }
    }
  }, 30000);
}

// ============================================================================
// UI EVENT LISTENERS
// ============================================================================
function setupEventListeners() {
  // Theme & Language Switchers
  btnThemeToggle.addEventListener("click", toggleTheme);
  btnLangToggle.addEventListener("click", toggleLanguage);

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

    const clickedBoxIdx = findBoxIndexAt(pos.x, pos.y);

    if (clickedBoxIdx !== -1 && !state.isDrawing) {
      state.selectedBoxIndex = clickedBoxIdx;
      btnDeleteSelected.disabled = false;
      renderBoxesList();
      redrawCanvas();
    } else {
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
    showOverlay(i18n[state.lang].rescanningOverlayText);
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
    alert(i18n[state.lang].enterValidIdAlert);
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
  loadingText.textContent = text || i18n[state.lang].loadingOverlayText;
  loadingOverlay.classList.add("active");
}
function hideOverlay() {
  loadingOverlay.classList.remove("active");
}

// Start application
window.addEventListener("DOMContentLoaded", initApp);
