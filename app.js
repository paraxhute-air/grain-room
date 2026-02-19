/**
 * Grain Studio — Image Grain & Filter Tool
 * Canvas-based real-time grain effect engine with filters and presets.
 */

(function () {
  'use strict';

  // ===== DOM Elements =====
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const editor = document.getElementById('editor');
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const canvasWrapper = document.getElementById('canvasWrapper');
  const galleryResizer = document.getElementById('galleryResizer');
  const imageGallery = document.getElementById('imageGallery');

  const btnReset = document.getElementById('btnReset');
  const btnRotate = document.getElementById('btnRotate');
  const btnUndo = document.getElementById('btnUndo');
  const btnRedo = document.getElementById('btnRedo');
  const btnNewImage = document.getElementById('btnNewImage');
  const btnDownloadOpen = document.getElementById('btnDownloadOpen');
  const downloadModal = document.getElementById('downloadModal');
  const modalClose = document.getElementById('modalClose');
  const formatSelect = document.getElementById('formatSelect');
  const downloadQuality = document.getElementById('downloadQuality');
  const qualityGroup = document.getElementById('qualityGroup');
  const qualityVal = document.getElementById('qualityVal');
  const downloadResolution = document.getElementById('downloadResolution');
  const btnDownloadConfirm = document.getElementById('btnDownloadConfirm');
  const btnThemeToggle = document.getElementById('btnThemeToggle');

  // Crop elements
  const btnCrop = document.getElementById('btnCrop');
  const cropRatios = document.getElementById('cropRatios');
  const cropOverlay = document.getElementById('cropOverlay');
  const cropRect = cropOverlay.querySelector('.crop-rect');
  const btnCropCancel = document.getElementById('btnCropCancel');
  const btnCropApply = document.getElementById('btnCropApply');

  // Grain controls
  const grainIntensity = document.getElementById('grainIntensity');
  const grainSize = document.getElementById('grainSize');
  const blendModeGroup = document.getElementById('blendMode');

  // Filter controls
  const brightness = document.getElementById('brightness');
  const contrast = document.getElementById('contrast');
  const saturation = document.getElementById('saturation');
  const temperature = document.getElementById('temperature');

  // Effect controls
  const sepia = document.getElementById('sepia');
  const vignette = document.getElementById('vignette');
  const fade = document.getElementById('fade');

  // CMYK controls
  const cyan = document.getElementById('cyan');
  const magenta = document.getElementById('magenta');
  const yellow = document.getElementById('yellow');
  const key = document.getElementById('key');

  // Zoom controls
  const btnZoomIn = document.getElementById('btnZoomIn');
  const btnZoomOut = document.getElementById('btnZoomOut');
  const btnZoomReset = document.getElementById('btnZoomReset');

  // Value display elements
  const valueDisplays = {
    grainIntensity: document.getElementById('grainIntensityVal'),
    grainSize: document.getElementById('grainSizeVal'),
    brightness: document.getElementById('brightnessVal'),
    contrast: document.getElementById('contrastVal'),
    saturation: document.getElementById('saturationVal'),
    temperature: document.getElementById('temperatureVal'),
    sepia: document.getElementById('sepiaVal'),
    vignette: document.getElementById('vignetteVal'),
    fade: document.getElementById('fadeVal'),
    cyan: document.getElementById('cyanVal'),
    magenta: document.getElementById('magentaVal'),
    yellow: document.getElementById('yellowVal'),
    key: document.getElementById('keyVal'),
  };

  // ===== State =====
  let images = []; // Array of { id, originalImage, originalPixels, settings, ... }
  let currentIndex = -1;
  let currentBlendMode = 'overlay';
  let rafId = null;
  let currentZoom = 1.0;
  let isCropping = false;
  let cropStart = null;
  let cropRectData = { x: 0, y: 0, w: 0, h: 0 };
  let currentCropRatio = 'free';
  let isDraggingRect = false;
  let dragOffset = { x: 0, y: 0 };
  let isBypassMode = false;
  const MAX_HISTORY = 20;

  // Text overlay state
  let textOverlay = {
    date: '',
    datePos: 'bottom-right',
    dateDir: 'horizontal',
    dateColor: '#ffffff',
    dateStyle: 'normal',
    
    note: '',
    notePos: 'bottom-left',
    noteDir: 'horizontal',
    noteStyle: 'white',
    noteFont: 'Nanum Pen Script',
    
    // Interactive state
    noteX: null, // Normalized 0-1
    noteY: null, // Normalized 0-1
    noteScale: 1.0,
    showEditorUI: false,
    dateEnable: false
  };

  let noteInteraction = {
    type: null, // 'drag', 'resize'
    startX: 0,
    startY: 0,
    startNoteX: 0,
    startNoteY: 0,
    startScale: 1.0,
    boundingBox: null // {x, y, w, h} in canvas pixels
  };

  // Theme initialization
  if (localStorage.getItem('theme') === 'light') {
    document.body.classList.add('light-mode');
  }

  // Preload fonts for canvas rendering
  document.fonts.load("400 20px 'Digital-7 Mono'").catch(() => {});
  document.fonts.load("400 20px 'Nanum Pen Script'").catch(() => {});
  document.fonts.load("400 20px 'Nanum Myeongjo'").catch(() => {});
  document.fonts.load("400 20px 'Noto Sans KR'").catch(() => {});

  // Default settings for a new image
  const DEFAULT_SETTINGS = {
    grainIntensity: 0, grainSize: 1, blendMode: 'overlay',
    brightness: 0, contrast: 0, saturation: 0, temperature: 0,
    sepia: 0, vignette: 0, fade: 0,
    cyan: 0, magenta: 0, yellow: 0, key: 0,
    frame: 'none',
    frameEnable: false,
    frameMargin: 'small'
  };

  // ===== Presets =====
  const PRESETS = {
    film35mm: {
      grainIntensity: 35, grainSize: 1, blendMode: 'overlay',
      brightness: 5, contrast: 10, saturation: -10, temperature: 10,
      sepia: 8, vignette: 20, fade: 5,
    },
    vintage: {
      grainIntensity: 50, grainSize: 2, blendMode: 'multiply',
      brightness: 10, contrast: -5, saturation: -30, temperature: 25,
      sepia: 35, vignette: 30, fade: 15,
    },
    noir: {
      grainIntensity: 45, grainSize: 1, blendMode: 'overlay',
      brightness: -5, contrast: 30, saturation: -100, temperature: 0,
      sepia: 0, vignette: 40, fade: 0,
    },
    faded: {
      grainIntensity: 25, grainSize: 1, blendMode: 'screen',
      brightness: 15, contrast: -15, saturation: -20, temperature: 0,
      sepia: 5, vignette: 10, fade: 40,
    },
    cinematic: {
      grainIntensity: 20, grainSize: 1, blendMode: 'overlay',
      brightness: -5, contrast: 20, saturation: -15, temperature: -20,
      sepia: 0, vignette: 35, fade: 5,
    },
    lofi: {
      grainIntensity: 60, grainSize: 3, blendMode: 'overlay',
      brightness: 10, contrast: -10, saturation: -25, temperature: 15,
      sepia: 20, vignette: 25, fade: 25,
      cyan: 0, magenta: 0, yellow: 0, key: 0,
    },
    forest: {
      grainIntensity: 30, grainSize: 2, blendMode: 'multiply',
      brightness: -2, contrast: 2, saturation: 5, temperature: -5,
      sepia: 0, vignette: 20, fade: 5,
      cyan: 10, magenta: -5, yellow: 10, key: 5,
    },
    tokyo: {
      grainIntensity: 30, grainSize: 1, blendMode: 'overlay',
      brightness: 5, contrast: 25, saturation: 15, temperature: -20,
      sepia: 0, vignette: 20, fade: 5,
      cyan: 15, magenta: 5, yellow: -10, key: 0,
    },
    california: {
      grainIntensity: 20, grainSize: 1, blendMode: 'screen',
      brightness: 10, contrast: -5, saturation: 10, temperature: 15,
      sepia: 5, vignette: 10, fade: 15,
      cyan: -5, magenta: 5, yellow: 15, key: -2,
    },
  };

  // ===== Drag & Drop =====
  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZone.classList.remove('drag-over');
    const allFiles = Array.from(e.dataTransfer.files);
    const supported = ['image/png', 'image/jpeg', 'image/webp'];
    const valid = allFiles.filter(f => supported.includes(f.type));
    const invalid = allFiles.filter(f => !supported.includes(f.type));
    if (invalid.length > 0 && valid.length === 0) {
      showToast('지원되지 않는 형식입니다.\nPNG, JPG, WEBP 파일만 사용할 수 있습니다.');
      return;
    }
    if (invalid.length > 0) {
      showToast('일부 파일이 지원되지 않는 형식입니다.\n지원 형식: PNG, JPG, WEBP');
    }
    if (valid.length > 0) {
      loadImages(valid);
    }
  });

  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) loadImages(files);
  });

  // Also allow drop on the whole page
  document.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  document.addEventListener('drop', (e) => {
    e.preventDefault();
    // Allow drop anywhere, checks validity same as above
    const allFiles = Array.from(e.dataTransfer.files);
    // Ignore if not files (e.g. text selection drag)
    if (allFiles.length === 0) return;

    const supported = ['image/png', 'image/jpeg', 'image/webp'];
    const valid = allFiles.filter(f => supported.includes(f.type));
    const invalid = allFiles.filter(f => !supported.includes(f.type));
    if (invalid.length > 0 && valid.length === 0) {
      showToast('지원되지 않는 형식입니다.\nPNG, JPG, WEBP 파일만 사용할 수 있습니다.');
      return;
    }
    if (invalid.length > 0) {
      showToast('일부 파일이 지원되지 않는 형식입니다.\n지원 형식: PNG, JPG, WEBP');
    }
    if (valid.length > 0) {
      loadImages(valid);
    }
  });

  // ===== Load Images =====
  async function loadImages(files) {
    const newImages = [];

    for (const file of files) {
      const imgData = await processFile(file);
      if (imgData) newImages.push(imgData);
    }

    if (newImages.length === 0) return;

    // Add to state
    const firstNewIndex = images.length;
    images = [...images, ...newImages];

    // Show editor
    dropZone.classList.add('hidden');
    editor.classList.remove('hidden');
    document.getElementById('imageGallery').classList.remove('hidden');

    // Update Gallery UI
    renderGallery();

    // Auto-scroll to the end of the gallery
    setTimeout(() => {
      const gallery = document.getElementById('imageGallery');
      if (gallery) {
        gallery.scrollTo({ left: gallery.scrollWidth, behavior: 'smooth' });
      }
    }, 100);

    // Switch to the first newly added image if none selected, or stay on current
    if (currentIndex === -1) {
      switchImage(0);
    }
  }

  function processFile(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Cap image to max 4096px
          const MAX_SIZE = 4096;
          let w = img.width;
          let h = img.height;
          if (w > MAX_SIZE || h > MAX_SIZE) {
            const scale = MAX_SIZE / Math.max(w, h);
            w = Math.round(w * scale);
            h = Math.round(h * scale);
          }

          // Create an offscreen canvas to extract pixels
          const offCanvas = document.createElement('canvas');
          offCanvas.width = w;
          offCanvas.height = h;
          const octx = offCanvas.getContext('2d', { willReadFrequently: true });
          octx.drawImage(img, 0, 0, w, h);
          const pixels = octx.getImageData(0, 0, w, h);

          // 원본 비율 유지 썸네일 생성
          const thumbH = 120;
          const thumbW = Math.round((w / h) * thumbH);
          const thumbCanvas = document.createElement('canvas');
          thumbCanvas.width = thumbW;
          thumbCanvas.height = thumbH;
          const tctx = thumbCanvas.getContext('2d');
          tctx.drawImage(img, 0, 0, thumbW, thumbH);

          resolve({
            id: Date.now() + Math.random(),
            initialImage: img, // Store initial state for full reset
            originalImage: img,
            width: w,
            height: h,
            originalPixels: pixels, // Store pixels of the scaled original image
            thumbnail: thumbCanvas.toDataURL('image/jpeg', 0.7),
            
            // Settings
            settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
            
            // 원본 백업 (초기화 시 자르기 복원용)
            backupImage: img,
            backupWidth: w,
            backupHeight: h,
            backupPixels: pixels,
            // Undo 히스토리
            history: [],
            redoHistory: [],
            textOverlay: JSON.parse(JSON.stringify(textOverlay)) // Default to current text state
          });
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function renderGallery() {
    const gallery = document.getElementById('imageGallery');
    gallery.innerHTML = '';
    images.forEach((img, index) => {
      const item = document.createElement('div');
      item.className = 'thumb-item';
      item.innerHTML = `
        <div class="thumb-img-box ${index === currentIndex ? 'active' : ''}">
          <img src="${img.thumbnail}" alt="Image ${index + 1}">
          <button class="thumb-delete" onclick="event.stopPropagation(); window.deleteImage(${index});">×</button>
        </div>
        <span class="thumb-id">${index + 1}</span>
      `;
      item.onclick = () => switchImage(index);
      gallery.appendChild(item);
    });

    // Add "+" button at the end
    const addBtn = document.createElement('div');
    addBtn.className = 'thumb-item thumb-add';
    addBtn.innerHTML = `
      <div class="thumb-add-inner">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </div>
    `;
    addBtn.onclick = () => fileInput.click();
    gallery.appendChild(addBtn);
  }

  // 이미지 삭제 함수 (전역으로 노출)
  window.deleteImage = function(index) {
    if (images.length === 1) {
      // 마지막 이미지면 에디터 닫고 드롭존 표시
      images = [];
      currentIndex = -1;
      editor.classList.add('hidden');
      dropZone.classList.remove('hidden');
      // Reset global textOverlay state to default
      textOverlay = { 
          date: '', datePos: 'bottom-right', dateDir: 'horizontal', dateColor: '#ffffff', dateStyle: 'normal',
          note: '', notePos: 'bottom-left', noteDir: 'horizontal', noteStyle: 'white', noteFont: 'Nanum Pen Script',
          noteX: null, noteY: null, noteScale: 1.0, showEditorUI: false, dateEnable: false
      };
      return;
    }

    images.splice(index, 1);
    
    // Adjust index
    if (currentIndex === index) {
      currentIndex = Math.min(currentIndex, images.length - 1);
      // Determine if we should maintain zoom or reset? Reset is safer on delete
    } else if (currentIndex > index) {
      currentIndex--;
    }
    
    const imgData = images[currentIndex];
    canvas.width = imgData.width;
    canvas.height = imgData.height;
    
    // Load new image settings
    loadSettingsIntoUI(imgData.settings);
    
    // Load text overlay or reset
     if (imgData.textOverlay) {
        textOverlay = JSON.parse(JSON.stringify(imgData.textOverlay));
    } else {
         textOverlay = { 
          date: '', datePos: 'bottom-right', dateDir: 'horizontal', dateColor: '#ffffff', dateStyle: 'normal',
          note: '', notePos: 'bottom-left', noteDir: 'horizontal', noteStyle: 'white', noteFont: 'Nanum Pen Script',
          noteX: null, noteY: null, noteScale: 1.0, showEditorUI: false, dateEnable: false
        };
    }
    
    // Refresh UI
    textDate.value = textOverlay.date || '';
    textNote.value = textOverlay.note || '';
    if (dateEnable) dateEnable.checked = textOverlay.dateEnable !== false;
    syncSidebarUI();
    
    renderGallery();
    updateZoom();
    scheduleApply();
  };

  function switchImage(index) {
    if (index === currentIndex) return;
    
    // Save current settings to state before switching (though they are updated live)
    if (currentIndex !== -1) {
      saveCurrentSettings();
    }

    currentIndex = index;
    const imgData = images[currentIndex];

    // Update canvas size
    canvas.width = imgData.width;
    canvas.height = imgData.height;

    // Load sliders with this image's settings
    loadSettingsIntoUI(imgData.settings);

    // Update UI highlights
    renderGallery();
    
    // 줌 초기화 (90% 스케일)
    updateZoom();

    // Load text overlay state for this image
     if (imgData.textOverlay) {
      textOverlay = JSON.parse(JSON.stringify(imgData.textOverlay));
    } else {
        // Reset text overlay if none exists
        textOverlay = {
            date: '', datePos: 'bottom-right', dateDir: 'horizontal', dateColor: '#ffffff', dateStyle: 'normal',
            note: '', notePos: 'bottom-left', noteDir: 'horizontal', noteStyle: 'white', noteFont: 'Nanum Pen Script',
            noteX: null, noteY: null, noteScale: 1.0, showEditorUI: false, dateEnable: false
        };
    }
    // Sync UI inputs
    textDate.value = textOverlay.date || '';
    textNote.value = textOverlay.note || '';
    if (dateEnable) dateEnable.checked = textOverlay.dateEnable !== false;
    syncSidebarUI(); 

    // Stop cropping if active
    if (isCropping) {
        isCropping = false;
        btnCrop.classList.remove('active');
        cropOverlay.classList.add('hidden');
    }

    // Preview
    scheduleApply();
  }

  function saveCurrentSettings() {
    if (currentIndex === -1) return;
    images[currentIndex].settings = {
      ...images[currentIndex].settings, // Preserve existing settings
      grainIntensity: parseInt(grainIntensity.value),
      grainSize: parseInt(grainSize.value),
      blendMode: currentBlendMode,
      brightness: parseInt(brightness.value),
      contrast: parseInt(contrast.value),
      saturation: parseInt(saturation.value),
      temperature: parseInt(temperature.value),
      sepia: parseInt(sepia.value),
      vignette: parseInt(vignette.value),
      fade: parseInt(fade.value),
      cyan: parseInt(cyan.value),
      magenta: parseInt(magenta.value),
      yellow: parseInt(yellow.value),
      key: parseInt(key.value),
      frame: images[currentIndex].settings.frame || 'none',
      frameEnable: images[currentIndex].settings.frameEnable === true,
      frameMargin: images[currentIndex].settings.frameMargin || 'small'
    };
    // Save text state too
    images[currentIndex].textOverlay = JSON.parse(JSON.stringify(textOverlay));
  }

  function loadSettingsIntoUI(s) {
    grainIntensity.value = s.grainIntensity;
    grainSize.value = s.grainSize;
    brightness.value = s.brightness;
    contrast.value = s.contrast;
    saturation.value = s.saturation;
    temperature.value = s.temperature;
    sepia.value = s.sepia;
    vignette.value = s.vignette;
    fade.value = s.fade;
    cyan.value = s.cyan || 0;
    magenta.value = s.magenta || 0;
    yellow.value = s.yellow || 0;
    key.value = s.key || 0;

    currentBlendMode = s.blendMode;
    blendModeGroup.querySelectorAll('.btn-option').forEach((b) => {
      b.classList.toggle('active', b.dataset.value === currentBlendMode);
    });

    sliders.forEach(updateValueDisplay);
    document.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('active'));
  }

  // ===== Controls Event Listeners =====
  const sliders = [
    grainIntensity, grainSize, brightness, contrast, saturation, temperature, 
    sepia, vignette, fade, cyan, magenta, yellow, key
  ];

  sliders.forEach((slider) => {
    slider.addEventListener('input', () => {
      updateValueDisplay(slider);
      saveCurrentSettings(); // Save live
      scheduleApply();
    });
    // Add 'change' event to save snapshot on release
    slider.addEventListener('change', () => {
        saveSnapshot('light'); // Slider changes are light
    });
  });

  function updateValueDisplay(slider) {
    const display = valueDisplays[slider.id];
    if (display) display.textContent = slider.value;
  }

  // Blend mode buttons
  blendModeGroup.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-option');
    if (!btn) return;
    blendModeGroup.querySelectorAll('.btn-option').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentBlendMode = btn.dataset.value;
    saveCurrentSettings();
    scheduleApply();
  });

  // Presets
  document.getElementById('presets').addEventListener('click', (e) => {
    const btn = e.target.closest('.preset-btn');
    if (!btn) return;

    // Highlight active preset
    document.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    const preset = PRESETS[btn.dataset.preset];
    if (!preset) return;

    saveSnapshot('light'); // Preset change is light
    applyPreset(preset);
  });

  function applyPreset(preset) {
    const fullSettings = { ...DEFAULT_SETTINGS, ...preset };
    loadSettingsIntoUI(fullSettings);
    saveCurrentSettings();
    scheduleApply();
  }

  // ===== Undo 시스템 =====
  function saveSnapshot() {
    if (currentIndex === -1) return;
    const imgData = images[currentIndex];
    if (!imgData.history) imgData.history = [];
    imgData.history.push({
      width: imgData.width,
      height: imgData.height,
      originalImage: imgData.originalImage,
      originalPixels: imgData.originalPixels,
      thumbnail: imgData.thumbnail,
      settings: JSON.parse(JSON.stringify(imgData.settings)), // Deep copy
      textOverlay: JSON.parse(JSON.stringify(textOverlay)) // Also save text state
    });
    if (imgData.history.length > MAX_HISTORY) imgData.history.shift();
    
    // Clear redo history on new action
    imgData.redoHistory = [];
  }

  function undo() {
    if (currentIndex === -1) return;
    const imgData = images[currentIndex];
    if (!imgData.history || imgData.history.length === 0) return;
    
    // Save current state to redo
    if (!imgData.redoHistory) imgData.redoHistory = [];
    imgData.redoHistory.push({
      width: imgData.width,
      height: imgData.height,
      originalImage: imgData.originalImage,
      originalPixels: imgData.originalPixels,
      thumbnail: imgData.thumbnail,
      settings: JSON.parse(JSON.stringify(imgData.settings)),
      textOverlay: JSON.parse(JSON.stringify(textOverlay))
    });

    const prev = imgData.history.pop();
    applyStateSnapshot(prev);
  }

  function redo() {
    if (currentIndex === -1) return;
    const imgData = images[currentIndex];
    if (!imgData.redoHistory || imgData.redoHistory.length === 0) return;

    // Save current to undo
    imgData.history.push({
      width: imgData.width,
      height: imgData.height,
      originalImage: imgData.originalImage,
      originalPixels: imgData.originalPixels,
      thumbnail: imgData.thumbnail,
      settings: JSON.parse(JSON.stringify(imgData.settings)),
      textOverlay: JSON.parse(JSON.stringify(textOverlay))
    });

    const next = imgData.redoHistory.pop();
    applyStateSnapshot(next);
  }

  function applyStateSnapshot(snapshot) {
    if (currentIndex === -1) return;
    const imgData = images[currentIndex];
    
    imgData.width = snapshot.width;
    imgData.height = snapshot.height;
    imgData.originalImage = snapshot.originalImage;
    imgData.originalPixels = snapshot.originalPixels;
    imgData.thumbnail = snapshot.thumbnail;
    imgData.settings = snapshot.settings;
    if (snapshot.textOverlay) {
      textOverlay = JSON.parse(JSON.stringify(snapshot.textOverlay));
      // Sync UI inputs
      textDate.value = textOverlay.date || '';
      textNote.value = textOverlay.note || '';
      if (dateEnable) dateEnable.checked = textOverlay.dateEnable !== false;
    } else {
      // If no textOverlay in snapshot, clear current
      textOverlay.date = '';
      textOverlay.note = '';
      textDate.value = '';
      textNote.value = '';
    }

    canvas.width = imgData.width;
    canvas.height = imgData.height;
    loadSettingsIntoUI(imgData.settings);
    syncSidebarUI(); // Sync buttons
    renderGallery();
    updateZoom();
    scheduleApply();
  }

  btnUndo.addEventListener('click', undo);
  btnRedo.addEventListener('click', redo);

  btnRotate.addEventListener('click', () => {
    rotate90();
  });

  function rotate90() {
    if (currentIndex === -1) return;
    saveSnapshot('heavy'); // Rotation changes pixels

    const imgData = images[currentIndex];
    const oldW = imgData.width;
    const oldH = imgData.height;
    
    // 1. Create a new rotated canvas/buffer
    const rotatedCanvas = document.createElement('canvas');
    rotatedCanvas.width = oldH;
    rotatedCanvas.height = oldW;
    const rctx = rotatedCanvas.getContext('2d');
    
    // Rotate -90 degrees (Counter-Clockwise)
    rctx.translate(0, oldW);
    rctx.rotate(-Math.PI / 2);
    rctx.drawImage(imgData.originalImage, 0, 0);
    
    // 2. Update Image Data
    const newImg = new Image();
    newImg.src = rotatedCanvas.toDataURL();
    newImg.onload = () => {
      imgData.originalImage = newImg;
      imgData.width = oldH;
      imgData.height = oldW;
      
      // Update pixels
      const octx = rotatedCanvas.getContext('2d', { willReadFrequently: true });
      imgData.originalPixels = octx.getImageData(0, 0, oldH, oldW);
      
      // Update backup
      imgData.backupImage = newImg;
      imgData.backupWidth = oldH;
      imgData.backupHeight = oldW;
      imgData.backupPixels = imgData.originalPixels;

      // Update Thumbnail (re-generate)
      const thumbH = 120;
      const thumbW = Math.round((oldH / oldW) * thumbH);
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = thumbW;
      thumbCanvas.height = thumbH;
      const tctx = thumbCanvas.getContext('2d');
      tctx.drawImage(newImg, 0, 0, thumbW, thumbH);
      imgData.thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.7);

      canvas.width = oldH;
      canvas.height = oldW;
      
      renderGallery();
      updateZoom();
      scheduleApply();
      showToast('이미지가 반시계 방향으로 90도 회전되었습니다.');
    };
  }

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault();
      redo();
    }

    // Delete Note/Date with Delete/Backspace key
    if (e.key === 'Delete' || e.key === 'Backspace') {
      // Only if not typing in an input
      if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        if (textOverlay.showEditorUI && textOverlay.note) {
          saveSnapshot('light'); // Text removal is light
          textOverlay.note = '';
          textOverlay.showEditorUI = false;
          textNote.value = '';
          saveCurrentSettings();
          scheduleApply();
          showToast('노트가 삭제되었습니다.');
        } else if (textOverlay.date) {
            // If date is targetable (for now just general delete if no note UI)
            // Maybe just note for now as it has UI. 
        }
      }
    }
  });

  // 초기화 버튼 - 원본으로 완전 리셋 (자르기 포함)
  btnReset.addEventListener('click', () => {
    if (currentIndex === -1) return;
    
    // Undo를 위해 현재 상태 저장
    saveSnapshot('heavy');

    const imgData = images[currentIndex];

    // 원본 백업에서 복원 (initialImage가 있으면 그것을 사용하여 완전 초기화)
    if (imgData.initialImage) {
      imgData.originalImage = imgData.initialImage;
      imgData.width = imgData.initialImage.width;
      imgData.height = imgData.initialImage.height;
      
      // 픽셀 데이터 재생성
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = imgData.width;
      tempCanvas.height = imgData.height;
      const tctx = tempCanvas.getContext('2d');
      tctx.drawImage(imgData.initialImage, 0, 0);
      imgData.originalPixels = tctx.getImageData(0, 0, imgData.width, imgData.height);
      
      // 백업본도 초기화 상태로 동기화
      imgData.backupImage = imgData.initialImage;
      imgData.backupWidth = imgData.width;
      imgData.backupHeight = imgData.height;
      imgData.backupPixels = imgData.originalPixels;
    } else {
      // Fallback
      imgData.originalImage = imgData.backupImage;
      imgData.originalPixels = imgData.backupPixels;
      imgData.width = imgData.backupWidth;
      imgData.height = imgData.backupHeight;
    }
    
    // 완전 초기화 (그레인 0 포함)
    imgData.settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    imgData.settings.grainIntensity = 0; 
    
    // 텍스트 오버레이 초기화
    textOverlay.date = '';
    textOverlay.note = '';
    textOverlay.noteX = null;
    textOverlay.noteY = null;
    textOverlay.noteScale = 1.0;
    textOverlay.showEditorUI = false;
    
    textDate.value = '';
    textNote.value = '';

    // 썸네일 재생성
    const thumbH = 120;
    const thumbW = Math.round((imgData.width / imgData.height) * thumbH);
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = thumbW;
    thumbCanvas.height = thumbH;
    const tctx = thumbCanvas.getContext('2d');
    tctx.drawImage(imgData.backupImage, 0, 0, thumbW, thumbH);
    imgData.thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.7);

    canvas.width = imgData.width;
    canvas.height = imgData.height;
    
    loadSettingsIntoUI(imgData.settings);
    syncSidebarUI();
    currentZoom = 1.0;
    updateZoom();
    renderGallery();
    scheduleApply();
    
    showToast('이미지와 모든 효과가 초기화되었습니다.');
  });


  // Frame Texture Cache
  let frameTextures = {
    paper: null,
    paperImg: null
  };

  function loadFrameAssets() {
    const paperImg = new Image();
    paperImg.src = './paper_texture.png'; 
    paperImg.onload = () => {
      frameTextures.paper = ctx.createPattern(paperImg, 'repeat');
      frameTextures.paperImg = paperImg;
    };
  }
  loadFrameAssets();

  const dateEnable = document.getElementById('dateEnable');
  dateEnable.addEventListener('change', () => {
    saveSnapshot('light');
    textOverlay.dateEnable = dateEnable.checked;
    saveCurrentSettings();
    scheduleApply();
  });

  const frameEnable = document.getElementById('frameEnable');
  frameEnable.addEventListener('change', () => {
    if (currentIndex === -1) return;
    saveSnapshot('light');
    images[currentIndex].settings.frameEnable = frameEnable.checked;
    saveCurrentSettings();
    scheduleApply();
  });

  const frameStyle = document.getElementById('frameStyle');
  frameStyle.querySelectorAll('.btn-option').forEach(btn => {
    btn.addEventListener('click', () => {
      saveSnapshot('light');
      const val = btn.dataset.value;
      images[currentIndex].settings.frame = val;
      
      frameStyle.querySelectorAll('.btn-option').forEach(b => b.classList.toggle('active', b === btn));
      saveCurrentSettings();
      scheduleApply();
    });
  });

  const frameMargin = document.getElementById('frameMargin');
  frameMargin.querySelectorAll('.btn-option').forEach(btn => {
    btn.addEventListener('click', () => {
      if (currentIndex === -1) return;
      saveSnapshot('light');
      images[currentIndex].settings.frameMargin = btn.dataset.margin;
      frameMargin.querySelectorAll('.btn-option').forEach(b => b.classList.toggle('active', b === btn));
      saveCurrentSettings();
      scheduleApply();
    });
  });

  // ===== UI Specific Listeners =====
  
  // Theme toggle
  btnThemeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  });

  // Collapsible sections
  document.querySelectorAll('.section-title').forEach(title => {
    title.addEventListener('click', () => {
      const section = title.closest('.control-section');
      section.classList.toggle('collapsed');
    });
  });

  // 그레인 섹션만 펼쳐두고 나머지는 기본 접힘
  const allSections = document.querySelectorAll('.control-section');
  allSections.forEach((section, index) => {
    if (index > 0) section.classList.add('collapsed');
  });



  // Zoom controls
  // Zoom controls (Smart 10% Stepping)
  btnZoomIn.addEventListener('click', () => {
    let currentVal = Math.round(currentZoom * 100);
    let nextVal = Math.floor(currentVal / 10) * 10 + 10;
    currentZoom = Math.min(5.0, nextVal / 100); // Max 500% to match input max
    updateZoom();
  });

  btnZoomOut.addEventListener('click', () => {
    let currentVal = Math.round(currentZoom * 100);
    // Snap to lower 10 multiple
    // If 94 -> 90. If 100 -> 90.
    let nextVal = Math.ceil(currentVal / 10) * 10 - 10;
    currentZoom = Math.max(0.1, nextVal / 100); // Min 10% to match input min
    updateZoom();
  });

  btnZoomReset.addEventListener('click', () => {
    if (btnZoomReset.querySelector('input')) return; // Already editing

    const currentVal = Math.round(currentZoom * 100);
    btnZoomReset.textContent = '';
    
    const input = document.createElement('input');
    input.type = 'number';
    input.value = currentVal;
    
    // Inline styles for the input
    input.style.width = '36px';
    input.style.background = 'transparent';
    input.style.border = 'none';
    input.style.color = 'inherit';
    input.style.fontFamily = 'inherit';
    input.style.fontSize = 'inherit';
    input.style.fontWeight = '500';
    input.style.textAlign = 'center';
    input.style.outline = 'none';
    // Remove spinner
    // standard css handles this usually, or we add class? 
    // minimal style is fine.
    
    const finish = () => {
      let val = parseInt(input.value);
      if (isNaN(val)) val = currentVal;
      val = Math.max(10, Math.min(500, val)); // Clamp 10-500%
      currentZoom = val / 100;
      updateZoom();
    };

    input.addEventListener('blur', finish);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        input.blur(); 
      }
      e.stopPropagation(); // Prevent potentially triggering other keys
    });
    
    // Stop propagation of click on input to prevent immediate close or issues
    input.addEventListener('click', (e) => e.stopPropagation());

    btnZoomReset.appendChild(input);
    input.focus();
    input.select();
  });

  function updateZoom() {
    canvas.style.transform = `scale(${currentZoom})`;
    btnZoomReset.textContent = `${Math.round(currentZoom * 100)}%`;
  }

  // Crop logic
  btnCrop.addEventListener('click', () => {
    if (currentIndex === -1) return;
    isCropping = true;
    cropOverlay.classList.remove('hidden');
    cropRatios.classList.remove('hidden');
    btnCrop.classList.add('active');
    resetCropRect();
  });

  function resetCropRect() {
    cropRectData = { x: 0, y: 0, w: 0, h: 0 };
    updateCropRectUI();
  }

  function updateCropRectUI() {
    cropRect.style.left = `${cropRectData.x}px`;
    cropRect.style.top = `${cropRectData.y}px`;
    cropRect.style.width = `${cropRectData.w}px`;
    cropRect.style.height = `${cropRectData.h}px`;
    cropRect.classList.toggle('circle', currentCropRatio === 'circle');
    cropRect.classList.toggle('visible', cropRectData.w > 0 && cropRectData.h > 0);
  }

  cropRatios.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-option');
    if (!btn) return;
    cropRatios.querySelectorAll('.btn-option').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentCropRatio = btn.dataset.ratio;
    resetCropRect();
  });

  btnCropCancel.addEventListener('click', () => {
    stopCropping();
  });

  // 적용/취소 버튼 클릭 시 overlay의 mousedown이 발동되지 않도록 차단
  document.querySelector('.crop-actions').addEventListener('mousedown', (e) => {
    e.stopPropagation();
  });

  function stopCropping() {
    isCropping = false;
    cropOverlay.classList.add('hidden');
    cropRatios.classList.add('hidden');
    btnCrop.classList.remove('active');
    cropStart = null;
    isDraggingRect = false;
  }

  cropOverlay.addEventListener('mousedown', (e) => {
    if (!isCropping) return;
    const rect = cropOverlay.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if clicked inside existing crop rect to drag
    if (cropRectData.w > 0 && 
        mouseX >= cropRectData.x && mouseX <= cropRectData.x + cropRectData.w &&
        mouseY >= cropRectData.y && mouseY <= cropRectData.y + cropRectData.h) {
      isDraggingRect = true;
      dragOffset = { x: mouseX - cropRectData.x, y: mouseY - cropRectData.y };
    } else {
      // Start new selection
      isDraggingRect = false;
      cropStart = { x: mouseX, y: mouseY };
      cropRectData = { x: mouseX, y: mouseY, w: 0, h: 0 };
    }
  });

  cropOverlay.addEventListener('mousemove', (e) => {
    if (!isCropping) return;
    const rect = cropOverlay.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate Image Bounds relative to Overlay
    const canvasRect = canvas.getBoundingClientRect();
    const imgX = canvasRect.left - rect.left;
    const imgY = canvasRect.top - rect.top;
    const imgW = canvasRect.width;
    const imgH = canvasRect.height;
    
    // Bounds
    const minX = imgX;
    const minY = imgY;
    const maxX = imgX + imgW;
    const maxY = imgY + imgH;

    if (isDraggingRect) {
      cropRectData.x = mouseX - dragOffset.x;
      cropRectData.y = mouseY - dragOffset.y;
      
      // Clamp to Image Bounds
      cropRectData.x = Math.max(minX, Math.min(maxX - cropRectData.w, cropRectData.x));
      cropRectData.y = Math.max(minY, Math.min(maxY - cropRectData.h, cropRectData.y));
      
      updateCropRectUI();
    } else if (cropStart) {
      // Clamp start point first (in case it started outside? usually safe if mousedown inside)
      // But current mouse position should be clamped
      const currentX = Math.max(minX, Math.min(maxX, mouseX));
      const currentY = Math.max(minY, Math.min(maxY, mouseY));
      
      let w = currentX - cropStart.x;
      let h = currentY - cropStart.y;

      // Handle aspect ratios
      if (currentCropRatio === '1:1' || currentCropRatio === 'circle') {
        const side = Math.max(Math.abs(w), Math.abs(h));
        // We need to check if expanding square fits? 
        // Simple approach: Use calculated side but clamp result?
        // Better: standard logic then clamp?
        
        // Let's stick to standard logic then clamp box?
        // If we clamp box, aspect ratio might break.
        // For simplicity, let's just use the w, h as is, derived from clamped mouse. 
        // But if we force aspect ratio, the other dimension might exceed bound.
        
        w = w >= 0 ? side : -side;
        h = h >= 0 ? side : -side;
      } else if (currentCropRatio === '16:9') {
        const targetH = Math.abs(w) / (16/9);
        h = h >= 0 ? targetH : -targetH;
      }

      let newX = w >= 0 ? cropStart.x : cropStart.x + w;
      let newY = h >= 0 ? cropStart.y : cropStart.y + h;
      let newW = Math.abs(w);
      let newH = Math.abs(h);
      
      // Clamp the resulting box to image bounds (preserving size/ratio if possible? no, must contain)
      // If it goes out, we should probably limit the growth.
      // Complex constraint for fixed ratio. 
      // For now, let's just clamp the box and ignore ratio if it breaks? 
      // UX: User expects ratio to hold. So we must stop growing if hit edge.
      
      // Check bounds
      if (newX < minX) { newW -= (minX - newX); newX = minX; }
      if (newY < minY) { newH -= (minY - newY); newY = minY; }
      if (newX + newW > maxX) newW = maxX - newX;
      if (newY + newH > maxY) newH = maxY - newY;
      
      cropRectData.x = newX;
      cropRectData.y = newY;
      cropRectData.w = newW;
      cropRectData.h = newH;

      updateCropRectUI();
    }
  });

  cropOverlay.addEventListener('mouseup', () => {
    cropStart = null;
    isDraggingRect = false;
  });

  btnCropApply.addEventListener('click', () => {
    applyCrop();
  });

  function applyCrop() {
    if (cropRectData.w < 10 || cropRectData.h < 10) {
      showToast('영역을 먼저 선택해주세요.');
      return;
    }

    // 자르기 전 상태 저장 (Undo용)
    saveSnapshot('heavy');

    const imgData = images[currentIndex];
    const canvasRect = canvas.getBoundingClientRect();
    
    // Selection relative to canvas display size
    const relX = (cropRectData.x - (cropOverlay.offsetWidth - canvasRect.width) / 2) / currentZoom;
    const relY = (cropRectData.y - (cropOverlay.offsetHeight - canvasRect.height) / 2) / currentZoom;
    const relW = cropRectData.w / currentZoom;
    const relH = cropRectData.h / currentZoom;

    // Map to original pixels
    const displayW = canvasRect.width / currentZoom;
    const scale = imgData.width / displayW;
    
    const x = Math.round(relX * scale);
    const y = Math.round(relY * scale);
    const w = Math.round(relW * scale);
    const h = Math.round(relH * scale);

    const offCanvas = document.createElement('canvas');
    offCanvas.width = w;
    offCanvas.height = h;
    const octx = offCanvas.getContext('2d');

    if (currentCropRatio === 'circle') {
      octx.beginPath();
      octx.arc(w/2, h/2, w/2, 0, Math.PI * 2);
      octx.clip();
    }
    
    octx.drawImage(imgData.originalImage, x, y, w, h, 0, 0, w, h);
    
    updateImageWithCrop(imgData, offCanvas, w, h);
  }

  function updateImageWithCrop(imgData, offCanvas, w, h) {
    imgData.width = w;
    imgData.height = h;
    imgData.originalPixels = offCanvas.getContext('2d').getImageData(0, 0, w, h);
    
    const newImg = new Image();
    newImg.onload = () => {
      imgData.originalImage = newImg;
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = 160;
      thumbCanvas.height = 120;
      const tctx = thumbCanvas.getContext('2d');
      const ts = Math.max(160 / w, 120 / h);
      tctx.drawImage(newImg, (160 - w * ts) / 2, (120 - h * ts) / 2, w * ts, h * ts);
      imgData.thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.7);
      
      canvas.width = w;
      canvas.height = h;
      renderGallery();
      scheduleApply();
      stopCropping();
    };
    newImg.src = offCanvas.toDataURL();
  }
  // ===== Canvas Comparison & Note Interaction =====
  const startInteraction = (e) => {
    if (isCropping) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX || e.touches[0].clientX) - rect.left) * (canvas.width / rect.width);
    const y = ((e.clientY || e.touches[0].clientY) - rect.top) * (canvas.height / rect.height);

    // Hit Test for Note
    if (textOverlay.note && noteInteraction.boundingBox) {
      const box = noteInteraction.boundingBox;
      const scale = Math.max(canvas.width, canvas.height) / 1200;
      const hSize = 16 * scale; // Handle hit area
      
      // Check Resize Handle (Bottom Right)
      const handleX = box.x + box.w;
      const handleY = box.y + box.h;
      
      if (x > handleX - hSize && x < handleX + hSize && y > handleY - hSize && y < handleY + hSize) {
        noteInteraction.type = 'resize';
        noteInteraction.startX = x;
        noteInteraction.startScale = textOverlay.noteScale || 1.0;
        textOverlay.showEditorUI = true;
        canvas.style.cursor = 'nwse-resize';
        scheduleApply();
        e.stopPropagation();
        return;
      }
      
      // Check Drag (Inside Box)
      if (x > box.x && x < box.x + box.w && y > box.y && y < box.y + box.h) {
        noteInteraction.type = 'drag';
        noteInteraction.startX = x;
        noteInteraction.startY = y;
        noteInteraction.startNoteX = textOverlay.noteX !== null ? textOverlay.noteX : (box.x + box.w/2) / canvas.width;
        noteInteraction.startNoteY = textOverlay.noteY !== null ? textOverlay.noteY : (box.y + box.h/2) / canvas.height;
        textOverlay.noteX = noteInteraction.startNoteX;
        textOverlay.noteY = noteInteraction.startNoteY;
        textOverlay.showEditorUI = true;
        canvas.style.cursor = 'move';
        scheduleApply();
        e.stopPropagation();
        return;
      }
    }

    // Clicked elsewhere on canvas
    if (textOverlay.showEditorUI) {
      textOverlay.showEditorUI = false;
      scheduleApply();
    }

    // Default to Bypass Mode
    isBypassMode = true;
    scheduleApply();
    canvas.style.cursor = 'grabbing';
  };

  const doInteraction = (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX || (e.touches && e.touches[0].clientX)) - rect.left) * (canvas.width / rect.width);
    const y = ((e.clientY || (e.touches && e.touches[0].clientY)) - rect.top) * (canvas.height / rect.height);

    if (noteInteraction.type || isBypassMode) {
      if (noteInteraction.type === 'drag') {
        const dx = (x - noteInteraction.startX) / canvas.width;
        const dy = (y - noteInteraction.startY) / canvas.height;
        textOverlay.noteX = noteInteraction.startNoteX + dx;
        textOverlay.noteY = noteInteraction.startNoteY + dy;
        scheduleApply();
      } else if (noteInteraction.type === 'resize') {
        const dx = x - noteInteraction.startX;
        const scaleDelta = dx / 150; // Sensitivity
        textOverlay.noteScale = Math.max(0.2, Math.min(5.0, noteInteraction.startScale + scaleDelta));
        scheduleApply();
      }
      if (e.cancelable) e.preventDefault();
      return;
    }

    // Hover Cursor Logic
    if (!isCropping && textOverlay.note && noteInteraction.boundingBox) {
      const box = noteInteraction.boundingBox;
      const scale = Math.max(canvas.width, canvas.height) / 1200;
      const hSize = 12 * scale;
      const handleX = box.x + box.w;
      const handleY = box.y + box.h;

      if (x > handleX - hSize && x < handleX + hSize && y > handleY - hSize && y < handleY + hSize) {
        canvas.style.cursor = 'nwse-resize';
      } else if (x > box.x && x < box.x + box.w && y > box.y && y < box.y + box.h) {
        canvas.style.cursor = 'move';
      } else {
        canvas.style.cursor = isCropping ? 'crosshair' : 'default';
      }
    }
  };

  const stopInteraction = () => {
    noteInteraction.type = null;
    isBypassMode = false;
    scheduleApply();
    canvas.style.cursor = isCropping ? 'crosshair' : (currentIndex !== -1 ? 'default' : 'pointer');
  };

  canvas.addEventListener('mousedown', startInteraction);
  window.addEventListener('mousemove', doInteraction);
  window.addEventListener('mouseup', stopInteraction);
  
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      if (noteInteraction.boundingBox) { // Check if we should prevent default for note dragging
         // (Implementation simplified for now)
      }
      startInteraction(e);
    }
  }, { passive: false });
  window.addEventListener('touchmove', doInteraction, { passive: false });
  window.addEventListener('touchend', stopInteraction);
  window.addEventListener('touchcancel', stopInteraction);

  // ===== Action Buttons =====
  const btnApplyAll = document.getElementById('btnApplyAll');

  btnApplyAll.addEventListener('click', () => {
    if (currentIndex === -1) return;
    const currentSettings = { ...images[currentIndex].settings };
    images.forEach(img => {
      img.settings = JSON.parse(JSON.stringify(currentSettings));
      // Also apply note settings globally if it was requested (via Apply All button)
      if (images[currentIndex].textOverlay) {
        img.textOverlay = JSON.parse(JSON.stringify(images[currentIndex].textOverlay));
      }
    });
    showToast('현재 설정이 모든 이미지에 적용되었습니다.');
  });

  btnReset.addEventListener('click', () => {
    applyPreset(DEFAULT_SETTINGS);
  });

  btnNewImage.addEventListener('click', () => {
    fileInput.value = '';
    fileInput.click();
  });

  // ===== Download Modal =====
  let currentFormat = 'jpeg';

  btnDownloadOpen.addEventListener('click', () => {
    // Show resolution info
    downloadResolution.textContent = `${canvas.width} × ${canvas.height}px`;
    downloadModal.classList.remove('hidden');
  });

  modalClose.addEventListener('click', () => {
    downloadModal.classList.add('hidden');
  });

  downloadModal.addEventListener('click', (e) => {
    if (e.target === downloadModal) downloadModal.classList.add('hidden');
  });

  // Format selection
  formatSelect.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-option');
    if (!btn) return;
    formatSelect.querySelectorAll('.btn-option').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentFormat = btn.dataset.value;
    // Show/hide quality slider (only for JPEG)
    qualityGroup.style.display = currentFormat === 'jpeg' ? '' : 'none';
  });

  downloadQuality.addEventListener('input', () => {
    qualityVal.textContent = downloadQuality.value;
  });

  // Actual download using showSaveFilePicker (with fallback)
  btnDownloadConfirm.addEventListener('click', async () => {
    const mimeType = currentFormat === 'png' ? 'image/png' : 'image/jpeg';
    const ext = currentFormat === 'png' ? 'png' : 'jpg';
    const quality = currentFormat === 'jpeg' ? parseInt(downloadQuality.value) / 100 : undefined;

    // Use separate export canvas to avoid modifying main canvas state
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ectx = exportCanvas.getContext('2d');

    if (currentFormat === 'jpeg') {
      ectx.fillStyle = '#ffffff';
      ectx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    }
    
    // Render to export canvas
    if (currentIndex !== -1) {
        // Note: applyEffects reads usage from sliders, but for a separate download function 
        // we should conceptually pass settings. 
        // Our new renderImageToContext reads settings from sliders? 
        // Wait, renderImageToContext reads sliders inside the function: `const bri = parseInt(brightness.value);`
        // This is fine for Single Image download (current index).
        // But for Batch Download (Download All), we iterate images and must use THEIR settings.
        // My implementation of renderImageToContext currently reads DOM sliders! This is a BUG for Batch Download.
        // I need to update renderImageToContext to accept settings object.
        
        // Correct approach: Pass settings to renderImageToContext.
        // Since I'm editing renderImageToContext in chunk 1, I should fix it there.
        // But assuming chunk 1 is applied as is (reading sliders), I need to be careful.
        
        // Let's rely on renderImageToContext being updated to read from imgData.settings passed in.
        // But in chunk 1 I still read brightness.value etc. I need to fix chunk 1 first or now.
        // I will fix 'renderImageToContext' logic in chunk 1 to use 'imgData.settings' NOT DOM.
    }
    
    // As I cannot edit chunk 1 dynamically inside this thought process effectively if I already wrote it? 
    // I can just update chunk 1.
    // Let's assume renderImageToContext uses `s.brightness` etc.

    // Single export (current image)
    const exportOverlay = { ...textOverlay, showEditorUI: false };
    renderImageToContext(ectx, images[currentIndex], exportCanvas.width, exportCanvas.height, true, exportOverlay);

    const dataUrl = exportCanvas.toDataURL(mimeType, quality);
    const fileName = getExportFileName(currentIndex, ext);
    downloadURI(dataUrl, fileName);
    downloadModal.classList.add('hidden');
  });

  const btnDownloadAll = document.getElementById('btnDownloadAll');
  btnDownloadAll.addEventListener('click', async () => {
    if (images.length === 0) return;
    
    showToast(`${images.length}개의 이미지 다운로드를 시작합니다...`);
    // saveCurrentSettings(); // No need if we rely on stored settings

    for (let i = 0; i < images.length; i++) {
      await downloadImageAtIndex(i);
      await new Promise(r => setTimeout(r, 600)); 
    }
    
    showToast('모든 다운로드가 완료되었습니다.');
    downloadModal.classList.add('hidden');
  });

  const btnDownloadZip = document.getElementById('btnDownloadZip');
  btnDownloadZip.addEventListener('click', async () => {
    if (images.length === 0) return;
    
    showToast('ZIP 파일 생성을 시작합니다...');
    
    // JSZip instance
    const zip = new JSZip();
    const folder = zip.folder("grain_room_images");
    
    const mimeType = currentFormat === 'png' ? 'image/png' : 'image/jpeg';
    const ext = currentFormat === 'png' ? 'png' : 'jpg';
    const quality = currentFormat === 'jpeg' ? parseInt(downloadQuality.value) / 100 : undefined;
    
    try {
        for (let i = 0; i < images.length; i++) {
        const imgData = images[i];
        
        // Create export canvas
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = imgData.width;
        exportCanvas.height = imgData.height;
        const ectx = exportCanvas.getContext('2d');
        
        if (currentFormat === 'jpeg') {
            ectx.fillStyle = '#ffffff';
            ectx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
        }
        
        // Determine Settings & Text Overlay
        const tOverlay = currentIndex === i ? textOverlay : (imgData.textOverlay || {
                date: '', datePos: 'bottom-right', dateDir: 'horizontal', dateColor: '#ffffff',
                note: '', notePos: 'bottom-left', noteDir: 'horizontal', noteStyle: 'white', noteFont: 'Nanum Pen Script',
                noteX: null, noteY: null, noteScale: 1.0, showEditorUI: false, dateEnable: false
        });
        const exportOverlay = { ...tOverlay, showEditorUI: false };

        renderImageToContext(ectx, imgData, exportCanvas.width, exportCanvas.height, true, exportOverlay);
        
        // Convert to Blob
        const blob = await new Promise(resolve => exportCanvas.toBlob(resolve, mimeType, quality));
        const fileName = getExportFileName(i, ext);
        
        folder.file(fileName, blob);
        }
        
        showToast('ZIP 파일을 생성 중입니다...');
        const content = await zip.generateAsync({type:"blob"});
        const now = new Date();
        const timestamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}`;
        const zipName = `grain_room_batch_${timestamp}.zip`;
        
        // Trigger Download
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = zipName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
        
        showToast('ZIP 파일 다운로드가 시작되었습니다.');
        downloadModal.classList.add('hidden');

    } catch (e) {
        console.error(e);
        showToast('ZIP 생성 중 오류가 발생했습니다.');
    }
  });

  async function downloadImageAtIndex(index) {
    const imgData = images[index];
    const mimeType = currentFormat === 'png' ? 'image/png' : 'image/jpeg';
    const ext = currentFormat === 'png' ? 'png' : 'jpg';
    const quality = currentFormat === 'jpeg' ? parseInt(downloadQuality.value) / 100 : undefined;

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = imgData.width; // Use image native w/h
    exportCanvas.height = imgData.height;
    const ectx = exportCanvas.getContext('2d');
    
    if (currentFormat === 'jpeg') {
        ectx.fillStyle = '#ffffff';
        ectx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    }
    
    // We need to render THIS image using ITS settings.
    // If renderImageToContext reads DOM, we are doomed for non-current images.
    // I must ensure renderImageToContext uses provided settings.
    
    // We also need the textOverlay for this specific image if we want it to be correct
    // Current logic uses imgData.textOverlay if available, else fallback? 
    // Actually, when loading image, we load defaults.
    // If imgData.textOverlay is missing, we should use default or empty.
    const tOverlay = currentIndex === index ? textOverlay : (imgData.textOverlay || {
            date: '', datePos: 'bottom-right', dateDir: 'horizontal', dateColor: '#ffffff',
            note: '', notePos: 'bottom-left', noteDir: 'horizontal', noteStyle: 'white', noteFont: 'Nanum Pen Script',
            noteX: null, noteY: null, noteScale: 1.0, showEditorUI: false, dateEnable: false
    });
    
    // Force showEditorUI false for export
    const exportOverlay = { ...tOverlay, showEditorUI: false };

    renderImageToContext(ectx, imgData, exportCanvas.width, exportCanvas.height, true, exportOverlay);

    const dataUrl = exportCanvas.toDataURL(mimeType, quality);
    const fileName = getExportFileName(index, ext);
    downloadURI(dataUrl, fileName);
  }

  function getExportFileName(index, ext) {
    const now = new Date();
    const dateStr = now.getFullYear() + 
                    String(now.getMonth() + 1).padStart(2, '0') + 
                    String(now.getDate()).padStart(2, '0');
    const timeStr = String(now.getHours()).padStart(2, '0') + 
                    String(now.getMinutes()).padStart(2, '0') + 
                    String(now.getSeconds()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const seq = (index + 1).toString().padStart(2, '0');
    
    return `grain-room-output_${dateStr}_${timeStr}_${random}(${seq}).${ext}`;
  }

  function downloadURI(uri, name) {
    const link = document.createElement("a");
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }


  // ===== Rendering Engine =====
  // Reusable offscreen canvas for rendering
  let sharedOffscreen = document.createElement('canvas');
  let sharedCtx = sharedOffscreen.getContext('2d', { willReadFrequently: true });
  
  function getSharedOffscreen(w, h) {
    if (sharedOffscreen.width !== w || sharedOffscreen.height !== h) {
        sharedOffscreen.width = w;
        sharedOffscreen.height = h;
        // Context might need reset if state accumulates, but we usually overwrite
        sharedCtx = sharedOffscreen.getContext('2d', { willReadFrequently: true });
    }
    return { canvas: sharedOffscreen, ctx: sharedCtx };
  }

  function scheduleApply() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      applyEffects();
      rafId = null;
    });
  }

  function applyEffects() {
    if (currentIndex === -1 || !images[currentIndex]) return;
    const imgData = images[currentIndex];
    const w = canvas.width;
    const h = canvas.height;
    

    
    // Main canvas context using global textOverlay
    // IMPORTANT: Ensure global textOverlay matches current index logic if we just switched? 
    // Yes, switchImage updates textOverlay global variable.
    renderImageToContext(ctx, imgData, w, h, false, textOverlay);
  }

  function renderImageToContext(targetCtx, imgData, w, h, isExport = false, overlayData = null) {
    // 0. Bypass Mode (only for main canvas interaction, not export)
    if (isBypassMode && !isExport) {
      targetCtx.putImageData(imgData.originalPixels, 0, 0);
      return;
    }

    // 1. Prepare Source Data
    // We use a shared buffer to avoid creating new ImageData every frame if possible
    // But since we modify pixels, we need a fresh copy from originalPixels
    const srcData = imgData.originalPixels.data;
    const output = targetCtx.createImageData(w, h); // Use target context to create compatible ImageData
    const dst = output.data;

    // Read settings
    const s = imgData.settings || DEFAULT_SETTINGS;

    // If exporting, use stored settings strictly. If live editing, use DOM values (which reflect current slider state).
    let bri, con, sat, temp, sep, fad, gIntensity, gSize, vigAmount, adjC, adjM, adjY, adjK;

    if (isExport) {
        bri = parseInt(s.brightness); 
        con = parseInt(s.contrast);
        sat = parseInt(s.saturation);
        temp = parseInt(s.temperature);
        sep = parseInt(s.sepia) / 100;
        fad = parseInt(s.fade) / 100;
        gIntensity = parseInt(s.grainIntensity) / 100;
        gSize = parseInt(s.grainSize);
        vigAmount = parseInt(s.vignette);
        adjC = parseInt(s.cyan) / 100;
        adjM = parseInt(s.magenta) / 100;
        adjY = parseInt(s.yellow) / 100;
        adjK = parseInt(s.key) / 100;
    } else {
        bri = parseInt(brightness.value); 
        con = parseInt(contrast.value);
        sat = parseInt(saturation.value);
        temp = parseInt(temperature.value);
        sep = parseInt(sepia.value) / 100;
        fad = parseInt(fade.value) / 100;
        gIntensity = parseInt(grainIntensity.value) / 100;
        gSize = parseInt(grainSize.value);
        vigAmount = parseInt(vignette.value);
        adjC = parseInt(cyan.value) / 100;
        adjM = parseInt(magenta.value) / 100;
        adjY = parseInt(yellow.value) / 100;
        adjK = parseInt(key.value) / 100;
    }

    // Contrast factor
    const contrastFactor = (259 * (con + 255)) / (255 * (259 - con));

    for (let i = 0; i < srcData.length; i += 4) {
      let r = srcData[i];
      let g = srcData[i + 1];
      let b = srcData[i + 2];

      // 1. Brightness
      r += bri * 2.55;
      g += bri * 2.55;
      b += bri * 2.55;

      // 2. Contrast
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;

      // 3. Temperature
      if (temp !== 0) {
        const t = temp * 0.8;
        r += t;
        b -= t;
      }

      // 4. Saturation
      if (sat !== 0) {
        const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        const s = 1 + sat / 100;
        r = gray + s * (r - gray);
        g = gray + s * (g - gray);
        b = gray + s * (b - gray);
      }

      // 5. Sepia
      if (sep > 0) {
        const sr = r * 0.393 + g * 0.769 + b * 0.189;
        const sg = r * 0.349 + g * 0.686 + b * 0.168;
        const sb = r * 0.272 + g * 0.534 + b * 0.131;
        r = r + (sr - r) * sep;
        g = g + (sg - g) * sep;
        b = b + (sb - b) * sep;
      }

      // 6. Fade
      if (fad > 0) {
        const fadeAmount = fad * 60;
        r = r + (fadeAmount - r) * fad * 0.5;
        g = g + (fadeAmount - g) * fad * 0.5;
        b = b + (fadeAmount - b) * fad * 0.5;
      }

      // 6.5 CMYK
      if (adjC !== 0 || adjM !== 0 || adjY !== 0 || adjK !== 0) {
        let r0 = r / 255, g0 = g / 255, b0 = b / 255;
        let k = 1 - Math.max(r0, g0, b0);
        let c = (1 - r0 - k) / (1 - k) || 0;
        let m = (1 - g0 - k) / (1 - k) || 0;
        let y = (1 - b0 - k) / (1 - k) || 0;

        c = Math.min(1, Math.max(0, c + adjC));
        m = Math.min(1, Math.max(0, m + adjM));
        y = Math.min(1, Math.max(0, y + adjY));
        k = Math.min(1, Math.max(0, k + adjK));

        r = 255 * (1 - c) * (1 - k);
        g = 255 * (1 - m) * (1 - k);
        b = 255 * (1 - y) * (1 - k);
      }

      dst[i] = Math.min(255, Math.max(0, r));
      dst[i + 1] = Math.min(255, Math.max(0, g));
      dst[i + 2] = Math.min(255, Math.max(0, b));
      dst[i + 3] = 255;
    }

    // 7. Grain
    if (gIntensity > 0) {
      applyGrain(dst, w, h, gIntensity, gSize, currentBlendMode);
    }

    // Drawing to Context
    const frame = s.frame || 'none';
    const frameEnable = s.frameEnable !== false;

    if (!frameEnable || frame === 'none') {
      targetCtx.putImageData(output, 0, 0);
    } else {
        // Reuse shared offscreen canvas for buffering the image
        const { canvas: bufferCanvas, ctx: bufferCtx } = getSharedOffscreen(w, h);
        bufferCtx.putImageData(output, 0, 0);

        // Clear target and draw background
        targetCtx.clearRect(0, 0, w, h);
        
        if (frame === 'white') {
            targetCtx.fillStyle = '#ffffff';
            targetCtx.fillRect(0, 0, w, h);
        } else if (frame === 'black') {
            targetCtx.fillStyle = '#000000';
            targetCtx.fillRect(0, 0, w, h);
        } else if (frame === 'paper' && frameTextures.paperImg) {
            const texImg = frameTextures.paperImg;
            const scale = Math.max(w / texImg.width, h / texImg.height);
            const tw = texImg.width * scale;
            const th = texImg.height * scale;
            targetCtx.drawImage(texImg, (w - tw) / 2, (h - th) / 2, tw, th);
        } else {
            targetCtx.fillStyle = '#ffffff';
            targetCtx.fillRect(0, 0, w, h);
        }

        const marginType = s.frameMargin || 'small';
        let marginRatio = 0.05;
        if (marginType === 'medium') marginRatio = 0.10;
        else if (marginType === 'large') marginRatio = 0.15;

        const padding = Math.min(w, h) * marginRatio;
        const targetW = w - padding * 2;
        const targetH = h - padding * 2;
        
        if (vigAmount > 0) {
            applyVignette(bufferCtx, w, h, vigAmount / 100);
        }
        
        targetCtx.drawImage(bufferCanvas, padding, padding, targetW, targetH);
    }

    // 8. Vignette (if no frame)
    if ((!frameEnable || frame === 'none') && vigAmount > 0) {
      applyVignette(targetCtx, w, h, vigAmount / 100);
    }

    // 9. Text Overlay
    let finalPadding = 0;
    if (frameEnable && frame !== 'none') {
        const marginType = s.frameMargin || 'small';
        let marginRatio = 0.05;
        if (marginType === 'medium') marginRatio = 0.10;
        else if (marginType === 'large') marginRatio = 0.15;
        finalPadding = Math.min(w, h) * marginRatio;
    }
    
    // Use provided overlayData or fallback to global textOverlay (though passed should be preferred)
    // If overlayData is null, maybe we shouldn't draw? Or fallback?
    // In applyEffects we pass global textOverlay. In download we pass specific.
    const tOverlay = overlayData || textOverlay;
    drawTextOverlay(targetCtx, w, h, tOverlay, isExport, finalPadding);
  }

  // ===== Text Overlay Rendering =====
  function drawTextOverlay(ctx, w, h, overlayData, isForExport = false, padding = 0) {
    // Use overlayData instead of global textOverlay
    const dateText = overlayData.date;
    const noteText = overlayData.note;
    if ((!dateText || overlayData.dateEnable === false) && !noteText) return;

    ctx.save();
    const scale = Math.max(w, h) / 1200;
    const baseFontSize = Math.round(38 * scale); // Adjusted to 38
    const margin = Math.round(30 * scale);

    // 1. Draw Date
    if (dateText && overlayData.dateEnable !== false) {
      ctx.save();
      const pos = overlayData.datePos;
      const isVertical = overlayData.dateDir === 'vertical';
      
      let x, y, textAlign, textBaseline;
      if (pos === 'top-left') { x = margin + padding; y = margin + padding; textAlign = 'left'; textBaseline = 'top'; }
      else if (pos === 'top-right') { x = w - margin - padding; y = margin + padding; textAlign = 'right'; textBaseline = 'top'; }
      else if (pos === 'bottom-left') { x = margin + padding; y = h - margin - padding; textAlign = 'left'; textBaseline = 'bottom'; }
      else { x = w - margin - padding; y = h - margin - padding; textAlign = 'right'; textBaseline = 'bottom'; }

      ctx.translate(x, y);
      if (isVertical) {
        ctx.rotate(Math.PI / 2);
        // Adjust for rotation
        if (pos === 'top-left') { textAlign = 'left'; textBaseline = 'bottom'; }
        else if (pos === 'top-right') { textAlign = 'left'; textBaseline = 'top'; }
        else if (pos === 'bottom-left') { textAlign = 'right'; textBaseline = 'bottom'; }
        else { textAlign = 'right'; textBaseline = 'top'; }
      }

      ctx.textAlign = textAlign;
      ctx.textBaseline = textBaseline;

      if (overlayData.dateStyle === 'vintage') {
        // Retro Digital Style: Noto Sans KR + Dark brown outline + Tight spacing
        ctx.font = `400 ${baseFontSize}px 'Noto Sans KR', sans-serif`;
        if ('letterSpacing' in ctx) ctx.letterSpacing = `${-0.08}em`;
        
        ctx.strokeStyle = '#3e2723'; 
        ctx.lineWidth = Math.max(1, 3 * scale);
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeText(dateText, 0, 0);
        
        ctx.fillStyle = overlayData.dateColor; 
        ctx.globalAlpha = 1.0;
        ctx.fillText(dateText, 0, 0);
        if ('letterSpacing' in ctx) ctx.letterSpacing = '0px'; // Reset
      } else {
        // Retro Film Style: Digital-7 Mono (Original Look)
        ctx.font = `italic 400 ${baseFontSize}px 'Digital-7 Mono', monospace`;
        ctx.fillStyle = overlayData.dateColor;
        ctx.globalAlpha = 0.9;
        ctx.fillText(dateText, 0, 0);
      }
      ctx.restore();
    }

    // 2. Draw Note
    if (noteText) {
      ctx.save();
      const style = overlayData.noteStyle;
      const font = overlayData.noteFont;
      
      // Font-specific scaling factors to normalize visual size
      let fontFactor = 1.0;
      if (font === 'Nanum Myeongjo') fontFactor = 0.72;
      else if (font === 'Noto Sans KR') fontFactor = 0.75;
      
      const noteScale = (overlayData.noteScale || 1.0) * fontFactor;
      const fontSize = Math.round(baseFontSize * noteScale);
      
      let x, y, textAlign, textBaseline;
      
      if (overlayData.noteX !== null && overlayData.noteY !== null) {
        // Manual Positioning
        x = overlayData.noteX * w;
        y = overlayData.noteY * h;
        textAlign = 'center';
        textBaseline = 'middle';
      } else {
        // Preset Positioning
        const pos = overlayData.notePos;
        if (pos === 'top-left') { x = margin; y = margin; textAlign = 'left'; textBaseline = 'top'; }
        else if (pos === 'top-right') { x = w - margin; y = margin; textAlign = 'right'; textBaseline = 'top'; }
        else if (pos === 'bottom-left') { x = margin; y = h - margin; textAlign = 'left'; textBaseline = 'bottom'; }
        else { x = w - margin; y = h - margin; textAlign = 'right'; textBaseline = 'bottom'; }
      }

      ctx.translate(x, y);
      const isVertical = overlayData.noteDir === 'vertical';
      if (isVertical) {
        ctx.rotate(Math.PI / 2);
        // Recalculate alignment for vertical if needed, but for manual center/middle it's fine
      }

      ctx.font = `400 ${fontSize}px '${font}', sans-serif`;
      ctx.textAlign = textAlign;
      ctx.textBaseline = textBaseline;

      const metrics = ctx.measureText(noteText);
      const pad = Math.round(8 * scale);
      const noteW = metrics.width;
      const noteH = fontSize;
      
      // Calculate Bounding Box (for interaction)
      let bx = 0, by = 0;
      if (textAlign === 'right') bx = -noteW;
      else if (textAlign === 'center') bx = -noteW / 2;
      
      if (textBaseline === 'bottom') by = -noteH;
      else if (textBaseline === 'middle') by = -noteH / 2;

      const fullBox = {
        x: x + (isVertical ? 0 : bx) - pad,
        y: y + (isVertical ? bx : by) - pad,
        w: (isVertical ? noteH : noteW) + pad * 2,
        h: (isVertical ? noteW : noteH) + pad * 2
      };
      
      // Actually, it's easier to keep the bounding box in local translated coordinates for some parts
      // but we need absolute for mouse hit testing. Let's store absolute.
      noteInteraction.boundingBox = fullBox;

      // Draw Background/Label
      if (style === 'label') {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(bx - pad, by - pad/2, noteW + pad * 2, noteH + pad);
        ctx.fillStyle = '#ffffff';
      } else if (style === 'black') {
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
      } else {
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 4 * scale;
      }

      ctx.fillText(noteText, 0, 0);
      ctx.shadowBlur = 0; // Reset shadow

      // Draw Editor UI (only if not exporting)
      if (!isForExport && textOverlay.showEditorUI) {
        ctx.strokeStyle = '#ef4444';
        ctx.setLineDash([10, 5]);
        ctx.lineWidth = 3;
        ctx.strokeRect(bx - pad, by - pad/2, noteW + pad * 2, noteH + pad);
        ctx.setLineDash([]);
        
        // Resize Handle (Bottom Right)
        const hSize = 8 * scale;
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(bx + noteW + pad - hSize/2, by + noteH + pad/2 - hSize/2, hSize, hSize);
      }

      ctx.restore();
    }

    ctx.restore();
  }

  // ===== Grain Effect =====
  function applyGrain(pixels, w, h, intensity, grainSizeVal, blendMode) {
    const len = pixels.length;

    for (let y = 0; y < h; y += grainSizeVal) {
      for (let x = 0; x < w; x += grainSizeVal) {
        // Generate a single noise value for this grain block
        const noise = (Math.random() - 0.5) * 255 * intensity;

        // Apply to all pixels in this grain block
        for (let dy = 0; dy < grainSizeVal && (y + dy) < h; dy++) {
          for (let dx = 0; dx < grainSizeVal && (x + dx) < w; dx++) {
            const idx = ((y + dy) * w + (x + dx)) * 4;

            for (let c = 0; c < 3; c++) {
              const original = pixels[idx + c];
              let result;

              switch (blendMode) {
                case 'overlay': {
                  // Overlay blend: enhances contrast with noise
                  const n = (noise + 128) / 255; // normalize to 0-1
                  const o = original / 255;
                  if (o < 0.5) {
                    result = 2 * o * n * 255;
                  } else {
                    result = (1 - 2 * (1 - o) * (1 - n)) * 255;
                  }
                  result = original + (result - original) * intensity;
                  break;
                }
                case 'multiply': {
                  const n = Math.max(0, (noise + 128)) / 255;
                  result = original * n;
                  result = original + (result - original) * intensity;
                  break;
                }
                case 'screen': {
                  const n = Math.max(0, (noise + 128)) / 255;
                  result = 255 - (255 - original) * (1 - n * 0.5);
                  result = original + (result - original) * intensity;
                  break;
                }
                default:
                  result = original + noise;
              }

              pixels[idx + c] = Math.min(255, Math.max(0, result));
            }
          }
        }
      }
    }
  }

  // ===== Vignette Effect =====
  function applyVignette(ctx, w, h, amount) {
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.sqrt(cx * cx + cy * cy);

    const gradient = ctx.createRadialGradient(cx, cy, radius * 0.3, cx, cy, radius);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.7, `rgba(0, 0, 0, ${amount * 0.3})`);
    gradient.addColorStop(1, `rgba(0, 0, 0, ${amount * 0.8})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);
  }

  // ===== Text Overlay Event Listeners =====
  const textDate = document.getElementById('textDate');
  const textNote = document.getElementById('textNote');
  const datePosition = document.getElementById('datePosition');
  const dateDirection = document.getElementById('dateDirection');
  const dateStyle = document.getElementById('dateStyle');
  const notePosition = document.getElementById('notePosition');
  const noteDirection = document.getElementById('noteDirection');
  const textDateColor = document.getElementById('textDateColor');
  const textNoteStyle = document.getElementById('textNoteStyle');
  const textNoteFont = document.getElementById('textNoteFont');

  // ===== UI Synchronization =====
  function syncSidebarUI() {
    // Sync Date Settings
    syncButtonGroup(datePosition, textOverlay.datePos);
    syncButtonGroup(dateDirection, textOverlay.dateDir);
    syncButtonGroup(dateStyle, textOverlay.dateStyle);
    syncButtonGroup(textDateColor, textOverlay.dateColor);
    if (dateEnable) dateEnable.checked = textOverlay.dateEnable !== false;
    
    // Sync Note Settings
    syncButtonGroup(notePosition, textOverlay.notePos);
    syncButtonGroup(noteDirection, textOverlay.noteDir);
    syncButtonGroup(textNoteStyle, textOverlay.noteStyle);
    syncButtonGroup(textNoteFont, textOverlay.noteFont);

    // Sync Frame Settings
    const frameGroup = document.getElementById('frameStyle');
    const frameEnableToggle = document.getElementById('frameEnable');
    const frameMarginGroup = document.getElementById('frameMargin');
    
    if (currentIndex !== -1) {
      const settings = images[currentIndex].settings;
      if (frameGroup) syncButtonGroup(frameGroup, settings.frame || 'none');
      if (frameEnableToggle) frameEnableToggle.checked = settings.frameEnable !== false;
      if (frameMarginGroup) syncButtonGroup(frameMarginGroup, settings.frameMargin || 'small');
    }
  }

  function syncButtonGroup(parent, value) {
    if (!parent) return;
    parent.querySelectorAll('.btn-option').forEach(btn => {
      // Use dataset values (pos, dir, color, style, font, margin, value)
      const btnVal = btn.dataset.pos || btn.dataset.dir || btn.dataset.color || btn.dataset.style || btn.dataset.font || btn.dataset.margin || btn.dataset.value;
      if (btnVal === value) btn.classList.add('active');
      else btn.classList.remove('active');
    });
  }

  // Helper to apply date settings to all images
  function updateGlobalDateSetting(key, value) {
    textOverlay[key] = value;
    images.forEach(img => {
      if (img.textOverlay) {
        img.textOverlay[key] = value;
      }
    });
    scheduleApply();
  }

  textDate.addEventListener('input', () => {
    updateGlobalDateSetting('date', textDate.value);
  });

  textNote.addEventListener('input', () => {
    // Keep notes per-image by default but update current state
    if (!textOverlay.note && textNote.value && textOverlay.noteX === null) {
      textOverlay.noteX = 0.5;
      textOverlay.noteY = 0.5;
    }
    textOverlay.note = textNote.value;
    textOverlay.showEditorUI = !!textNote.value;
    saveCurrentSettings(); // Persist to current image state
    scheduleApply();
  });

  datePosition.querySelectorAll('.btn-option').forEach(btn => {
    btn.addEventListener('click', () => {
      updateGlobalDateSetting('datePos', btn.dataset.pos);
      syncSidebarUI();
    });
  });

  dateDirection.querySelectorAll('.btn-option').forEach(btn => {
    btn.addEventListener('click', () => {
      updateGlobalDateSetting('dateDir', btn.dataset.dir);
      syncSidebarUI();
    });
  });

  dateStyle.querySelectorAll('.btn-option').forEach(btn => {
    btn.addEventListener('click', () => {
      updateGlobalDateSetting('dateStyle', btn.dataset.style);
      syncSidebarUI();
    });
  });

  notePosition.querySelectorAll('.btn-option').forEach(btn => {
    btn.addEventListener('click', () => {
      textOverlay.notePos = btn.dataset.pos;
      textOverlay.noteX = null;
      textOverlay.noteY = null;
      textOverlay.noteScale = 1.0;
      saveCurrentSettings();
      syncSidebarUI();
      scheduleApply();
    });
  });

  noteDirection.querySelectorAll('.btn-option').forEach(btn => {
    btn.addEventListener('click', () => {
      textOverlay.noteDir = btn.dataset.dir;
      saveCurrentSettings();
      syncSidebarUI();
      scheduleApply();
    });
  });

  textDateColor.querySelectorAll('.btn-option').forEach(btn => {
    btn.addEventListener('click', () => {
      updateGlobalDateSetting('dateColor', btn.dataset.color);
      syncSidebarUI();
    });
  });

  textNoteStyle.querySelectorAll('.btn-option').forEach(btn => {
    btn.addEventListener('click', () => {
      textOverlay.noteStyle = btn.dataset.style;
      saveCurrentSettings();
      syncSidebarUI();
      scheduleApply();
    });
  });

  textNoteFont.querySelectorAll('.btn-option').forEach(btn => {
    btn.addEventListener('click', () => {
      textOverlay.noteFont = btn.dataset.font;
      document.fonts.load(`400 20px "${textOverlay.noteFont}"`).then(() => {
        saveCurrentSettings();
        syncSidebarUI();
        scheduleApply();
      });
    });
  });

  const btnClearDate = document.getElementById('btnClearDate');
  const btnClearNote = document.getElementById('btnClearNote');

  btnClearDate.addEventListener('click', () => {
    if (!textOverlay.date) return;
    saveSnapshot('light');
    updateGlobalDateSetting('date', '');
    textDate.value = '';
    showToast('날짜 스탬프가 해제되었습니다.');
  });

  btnClearNote.addEventListener('click', () => {
    if (!textOverlay.note) return;
    saveSnapshot('light');
    textOverlay.note = '';
    textOverlay.showEditorUI = false;
    textNote.value = '';
    saveCurrentSettings();
    scheduleApply();
    showToast('노트가 삭제되었습니다.');
  });
  
  // Gallery Drag Feedback
  imageGallery.addEventListener('dragenter', (e) => {
    e.preventDefault();
    imageGallery.classList.add('drag-over');
  });

  imageGallery.addEventListener('dragover', (e) => {
    e.preventDefault();
    imageGallery.classList.add('drag-over');
  });

  imageGallery.addEventListener('dragleave', () => {
    imageGallery.classList.remove('drag-over');
  });

  imageGallery.addEventListener('drop', () => {
    imageGallery.classList.remove('drag-over');
  });

  // ===== Helper: Show Custom Toast =====
  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.remove('hidden');
    
    // Force reflow
    toast.offsetHeight;
    
    toast.classList.add('show');

    // Auto hide after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.classList.add('hidden');
      }, 300);
    }, 3000);
  }

})();
