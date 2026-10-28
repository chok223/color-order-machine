// ===== 색깔 그림 주문 기계 =====

const STORAGE_SETTINGS = 'com_settings_v1';
const STORAGE_LOGS = 'com_logs_v1';
const IMAGE_EXT = 'svg'; // AI 그림(png)이 준비되면 이 값을 'png'로 바꾸면 됩니다.

let cardsData = null;      // cards.json 내용
let settings = loadSettings();
let logs = loadLogs();

let order = { what: null, color: null, action: null };
let currentShown = null;   // 화면에 떠 있는 가장 최근 그림 정보
let speechReady = false;

// ---------- 유틸 ----------

function $(sel, root) { return (root || document).querySelector(sel); }
function $all(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS);
    if (raw) return Object.assign(defaultSettings(), JSON.parse(raw));
  } catch (e) {}
  return defaultSettings();
}

function defaultSettings() {
  return {
    visibility: {},       // { stepId: [cardId, ...] } 비어 있으면 전체 보임
    simpleMode: false,
    simplePreset: { what: null, color: null, action: null },
    sound: false
  };
}

function saveSettings() {
  localStorage.setItem(STORAGE_SETTINGS, JSON.stringify(settings));
}

function loadLogs() {
  try {
    const raw = localStorage.getItem(STORAGE_LOGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

function saveLogs() {
  localStorage.setItem(STORAGE_LOGS, JSON.stringify(logs));
}

function cardById(stepId, cardId) {
  const step = cardsData.steps.find(s => s.id === stepId);
  if (!step) return null;
  return step.cards.find(c => c.id === cardId) || null;
}

function visibleCards(step) {
  const vis = settings.visibility[step.id];
  if (!vis || vis.length === 0) return step.cards;
  return step.cards.filter(c => vis.includes(c.id));
}

// 밝은 배경에는 어두운 글자
function isLightColor(hex) {
  if (!hex || hex === 'rainbow') return false;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62;
}

function showToast(msg) {
  const toast = $('#toast');
  toast.textContent = msg;
  toast.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { toast.hidden = true; }, 1800);
}

// ---------- 초기화 ----------

async function init() {
  try {
    const res = await fetch('cards.json');
    cardsData = await res.json();
  } catch (e) {
    showToast('카드 정보를 불러오지 못했어요');
    return;
  }

  renderPicker();
  renderSlots();
  updateOrderButton();
  applySimpleModeUI();
  bindGlobalEvents();
  buildSettingsCardVisibility();
  buildSimplePresetPicker();
  $('#simpleModeToggle').checked = settings.simpleMode;
  $('#soundToggle').checked = settings.sound;
  refreshLogView();
}

// ---------- 카드 고르는 곳 ----------

function renderPicker() {
  const area = $('#pickerArea');
  area.innerHTML = '';

  cardsData.steps.forEach(step => {
    const row = document.createElement('div');
    row.className = 'picker-row';
    row.dataset.step = step.id;

    const label = document.createElement('div');
    label.className = 'picker-row-label';
    label.textContent = step.label;
    row.appendChild(label);

    const cardsWrap = document.createElement('div');
    cardsWrap.className = 'picker-cards';

    visibleCards(step).forEach(card => {
      cardsWrap.appendChild(buildCardEl(step, card));
    });

    row.appendChild(cardsWrap);
    area.appendChild(row);
  });
}

function buildCardEl(step, card) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'card';
  el.dataset.step = step.id;
  el.dataset.id = card.id;

  if (step.id === 'color') {
    el.classList.add('color-card');
    if (card.id === 'rainbow') {
      el.classList.add('rainbow-card');
    } else {
      el.style.background = card.hex;
      if (isLightColor(card.hex)) el.classList.add('light-text-dark');
      if (card.hex.toUpperCase() === '#FFFFFF') el.classList.add('white-card');
    }
    const nameEl = document.createElement('span');
    nameEl.textContent = card.name;
    const enEl = document.createElement('span');
    enEl.className = 'en';
    enEl.textContent = card.en || '';
    el.appendChild(nameEl);
    el.appendChild(enEl);
  } else {
    const img = document.createElement('img');
    img.src = `images/${card.id}.${IMAGE_EXT}`;
    img.alt = card.name;
    img.draggable = false;
    const nameEl = document.createElement('span');
    nameEl.textContent = card.name;
    el.appendChild(img);
    el.appendChild(nameEl);
  }

  if (order[step.id] === card.id) el.classList.add('selected');

  el.addEventListener('click', () => onCardPick(step, card));
  return el;
}

function onCardPick(step, card) {
  order[step.id] = card.id;
  renderPicker();
  renderSlots();
  updateOrderButton();

  if (step.id === 'color' && settings.sound) {
    speakColor(card);
  }
}

// ---------- 주문 칸 ----------

function renderSlots() {
  cardsData.steps.forEach(step => {
    const slot = $(`#slot-${step.id}`);
    const content = slot.querySelector('.slot-content');
    const existingClear = slot.querySelector('.slot-clear');
    if (existingClear) existingClear.remove();

    const picked = order[step.id];
    if (!picked) {
      content.className = 'slot-content empty';
      content.innerHTML = '';
      slot.classList.remove('filled');
      return;
    }

    const card = cardById(step.id, picked);
    slot.classList.add('filled');
    content.className = 'slot-content';
    content.innerHTML = '';

    if (step.id === 'color') {
      const swatch = document.createElement('div');
      swatch.style.width = '34px';
      swatch.style.height = '34px';
      swatch.style.borderRadius = '50%';
      swatch.style.border = card.hex.toUpperCase() === '#FFFFFF' ? '2px solid #2E3A59' : '2px solid rgba(0,0,0,.2)';
      if (card.id === 'rainbow') {
        swatch.style.background = 'linear-gradient(135deg,#E53935,#FB8C00,#FDD835,#43A047,#1E88E5,#8E24AA)';
      } else {
        swatch.style.background = card.hex;
      }
      content.appendChild(swatch);
      const label = document.createElement('span');
      label.textContent = card.name;
      content.appendChild(label);
    } else {
      const img = document.createElement('img');
      img.src = `images/${card.id}.${IMAGE_EXT}`;
      img.alt = card.name;
      content.appendChild(img);
      const label = document.createElement('span');
      label.textContent = card.name;
      content.appendChild(label);
    }

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'slot-clear';
    clearBtn.textContent = '×';
    clearBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      order[step.id] = null;
      renderPicker();
      renderSlots();
      updateOrderButton();
    });
    slot.appendChild(clearBtn);
  });
}

function updateOrderButton() {
  const btn = $('#orderBtn');
  if (settings.simpleMode) {
    btn.disabled = !(settings.simplePreset.what);
  } else {
    btn.disabled = !order.what;
  }
}

// ---------- 주문하기 / 그림 ----------

function resolveImagePath(whatId, colorId, actionId) {
  let name = whatId;
  if (colorId) name += `_${colorId}`;
  if (actionId) name += `_${actionId}`;
  return `images/${name}.${IMAGE_EXT}`;
}

function tryLoadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

async function placeOrder() {
  const whatId = settings.simpleMode ? settings.simplePreset.what : order.what;
  const colorId = settings.simpleMode ? settings.simplePreset.color : order.color;
  const actionId = settings.simpleMode ? settings.simplePreset.action : order.action;
  if (!whatId) return;

  const whatCard = cardById('what', whatId);
  const colorCard = colorId ? cardById('color', colorId) : null;
  const actionCard = actionId ? cardById('action', actionId) : null;

  const comboSrc = resolveImagePath(whatId, colorId, actionId);
  const baseSrc = resolveImagePath(whatId, null, null);

  let finalSrc = baseSrc;
  let fallback = false;

  if (colorId || actionId) {
    const ok = await tryLoadImage(comboSrc);
    if (ok) {
      finalSrc = comboSrc;
    } else {
      finalSrc = baseSrc;
      fallback = true;
    }
  }

  // 이전 그림 자리로 지금까지 보여준 "새 그림"을 옮김
  if (currentShown) {
    renderResultSlot($('#prevResult'), currentShown, false);
    $('#resultArrow').hidden = false;
  }

  const shown = {
    src: finalSrc,
    fallback,
    borderColor: colorCard && colorCard.id !== 'rainbow' ? colorCard.hex : (colorCard ? 'rainbow' : null),
    label: [whatCard.name, colorCard?.name, actionCard?.name].filter(Boolean).join(' · ')
  };
  renderResultSlot($('#newResult'), shown, true);
  currentShown = shown;

  addLog(whatCard, colorCard, actionCard);

  if (settings.sound && colorCard) {
    speakColor(colorCard);
  }
}

function renderResultSlot(slotEl, info, animate) {
  slotEl.innerHTML = '';
  slotEl.style.borderImage = 'none';
  slotEl.style.borderWidth = '6px';
  slotEl.style.borderStyle = 'solid';
  slotEl.style.borderColor = 'transparent';

  const img = document.createElement('img');
  img.src = info.src;
  img.alt = info.label;
  if (animate) img.classList.add('pop-in');
  slotEl.appendChild(img);

  if (info.fallback && info.borderColor) {
    slotEl.style.borderColor = info.borderColor === 'rainbow'
      ? '#8E24AA'
      : info.borderColor;
    if (info.borderColor === 'rainbow') {
      slotEl.style.borderImage = 'linear-gradient(135deg,#E53935,#FB8C00,#FDD835,#43A047,#1E88E5,#8E24AA) 1';
      slotEl.style.borderWidth = '6px';
      slotEl.style.borderStyle = 'solid';
    }
  }
}

function resetAll() {
  order = { what: null, color: null, action: null };
  currentShown = null;
  renderPicker();
  renderSlots();
  updateOrderButton();
  const prevEl = $('#prevResult');
  const newEl = $('#newResult');
  prevEl.removeAttribute('style');
  newEl.removeAttribute('style');
  prevEl.innerHTML = '<div class="result-placeholder">이전 그림</div>';
  newEl.innerHTML = '<div class="result-placeholder">여기에 그림이 나와요</div>';
  $('#resultArrow').hidden = true;
}

// ---------- 소리 ----------

function speakColor(colorCard) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  const ko = new SpeechSynthesisUtterance(colorCard.name);
  ko.lang = 'ko-KR';
  ko.rate = 0.9;

  const en = new SpeechSynthesisUtterance(colorCard.en || '');
  en.lang = 'en-US';
  en.rate = 0.9;

  window.speechSynthesis.speak(ko);
  if (colorCard.en) window.speechSynthesis.speak(en);
}

// ---------- 기록 ----------

function addLog(whatCard, colorCard, actionCard) {
  logs.push({
    t: new Date().toISOString(),
    what: whatCard.id,
    whatName: whatCard.name,
    color: colorCard ? colorCard.id : null,
    colorName: colorCard ? colorCard.name : null,
    action: actionCard ? actionCard.id : null,
    actionName: actionCard ? actionCard.name : null
  });
  saveLogs();
  refreshLogView();
}

function logLineText(l) {
  return [l.whatName, l.colorName, l.actionName].filter(Boolean).join(' + ');
}

function refreshLogView() {
  const listEl = $('#logList');
  const summaryEl = $('#logSummary');
  if (!listEl) return;

  if (logs.length === 0) {
    listEl.innerHTML = '<div>아직 기록이 없어요</div>';
    summaryEl.innerHTML = '';
    return;
  }

  const byDate = {};
  logs.forEach(l => {
    const d = l.t.slice(0, 10);
    (byDate[d] = byDate[d] || []).push(l);
  });

  const topOf = (field) => {
    const count = {};
    logs.forEach(l => { if (l[field]) count[l[field]] = (count[l[field]] || 0) + 1; });
    let top = null, topCount = 0;
    Object.entries(count).forEach(([name, c]) => { if (c > topCount) { top = name; topCount = c; } });
    return top ? `${top} (${topCount}번)` : null;
  };
  const topColor = topOf('colorName');
  const topAction = topOf('actionName');
  const bits = [`전체 ${logs.length}번 주문`];
  if (topColor) bits.push(`가장 많이 고른 색: ${topColor}`);
  if (topAction) bits.push(`가장 많이 고른 행동: ${topAction}`);
  summaryEl.innerHTML = bits.join(' · ');

  const dates = Object.keys(byDate).sort().reverse();
  listEl.innerHTML = dates.map(d => {
    const items = byDate[d].map(l => {
      const time = l.t.slice(11, 16);
      return `<div>${time} ${logLineText(l)}</div>`;
    }).join('');
    return `<div style="margin-bottom:8px"><strong>${d}</strong>${items}</div>`;
  }).join('');
}

function logsAsText() {
  return logs.map(l => `${l.t.slice(0, 10)} ${l.t.slice(11, 16)} ${logLineText(l)}`).join('\n');
}

// ---------- 설정 화면 ----------

function openSettings() {
  $('#settingsOverlay').hidden = false;
}
function closeSettings() {
  $('#settingsOverlay').hidden = true;
  saveSettings();
  renderPicker();
  renderSlots();
  updateOrderButton();
  applySimpleModeUI();
}

function buildSettingsCardVisibility() {
  const area = $('#cardVisibilityArea');
  area.innerHTML = '';
  cardsData.steps.forEach(step => {
    const wrap = document.createElement('div');
    wrap.className = 'cv-step';
    const title = document.createElement('div');
    title.className = 'cv-step-title';
    title.textContent = step.label;
    wrap.appendChild(title);

    const checks = document.createElement('div');
    checks.className = 'cv-checks';
    const vis = settings.visibility[step.id];

    step.cards.forEach(card => {
      const label = document.createElement('label');
      label.className = 'cv-check-item';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = !vis || vis.includes(card.id);
      input.addEventListener('change', () => {
        const current = settings.visibility[step.id] || step.cards.map(c => c.id);
        let next;
        if (input.checked) {
          next = Array.from(new Set([...current, card.id]));
        } else {
          next = current.filter(id => id !== card.id);
        }
        // 전체 선택이면 저장 생략(빈 배열 = 전체 보임 규칙과 충돌 방지)
        settings.visibility[step.id] = next.length === step.cards.length ? [] : next;
        saveSettings();
      });
      label.appendChild(input);
      label.appendChild(document.createTextNode(card.name));
      checks.appendChild(label);
    });

    wrap.appendChild(checks);
    area.appendChild(wrap);
  });
}

function buildSimplePresetPicker() {
  const area = $('#simplePresetArea');
  area.innerHTML = '';
  cardsData.steps.forEach(step => {
    step.cards.forEach(card => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'preset-pick';
      btn.textContent = `${step.label.replace(/^[①②③]\s*/, '')}: ${card.name}`;
      if (settings.simplePreset[step.id] === card.id) btn.classList.add('active');
      btn.addEventListener('click', () => {
        settings.simplePreset[step.id] = card.id;
        saveSettings();
        buildSimplePresetPicker();
        updateOrderButton();
      });
      area.appendChild(btn);
    });
  });
}

function applySimpleModeUI() {
  const picker = $('#pickerArea');
  const slots = $('.order-slots');
  if (settings.simpleMode) {
    picker.hidden = true;
    slots.hidden = true;
  } else {
    picker.hidden = false;
    slots.hidden = false;
  }
  updateOrderButton();
}

// ---------- 실수 방지 / 길게 누르기 / 전역 이벤트 ----------

function bindGlobalEvents() {
  $('#orderBtn').addEventListener('click', placeOrder);
  $('#resetBtn').addEventListener('click', resetAll);
  $('#closeSettingsBtn').addEventListener('click', closeSettings);

  $('#simpleModeToggle').addEventListener('change', (e) => {
    settings.simpleMode = e.target.checked;
    saveSettings();
    applySimpleModeUI();
  });
  $('#soundToggle').addEventListener('change', (e) => {
    settings.sound = e.target.checked;
    saveSettings();
  });

  $('#copyLogBtn').addEventListener('click', async () => {
    const text = logsAsText();
    try {
      await navigator.clipboard.writeText(text || '기록이 없어요');
      showToast('기록을 복사했어요');
    } catch (e) {
      showToast('복사할 수 없어요');
    }
  });

  let clearArmed = false;
  $('#clearLogBtn').addEventListener('click', (e) => {
    if (!clearArmed) {
      clearArmed = true;
      e.target.textContent = '한 번 더 누르면 지워져요';
      setTimeout(() => { clearArmed = false; e.target.textContent = '기록 지우기'; }, 3000);
      return;
    }
    logs = [];
    saveLogs();
    refreshLogView();
    clearArmed = false;
    e.target.textContent = '기록 지우기';
    showToast('기록을 지웠어요');
  });

  // 제목 3초 꾹 눌러 설정 열기
  const title = $('#titleLongPress');
  let pressTimer = null;
  const startPress = () => {
    pressTimer = setTimeout(openSettings, 3000);
  };
  const cancelPress = () => {
    if (pressTimer) clearTimeout(pressTimer);
    pressTimer = null;
  };
  title.addEventListener('touchstart', startPress, { passive: true });
  title.addEventListener('touchend', cancelPress);
  title.addEventListener('touchcancel', cancelPress);
  title.addEventListener('mousedown', startPress);
  title.addEventListener('mouseup', cancelPress);
  title.addEventListener('mouseleave', cancelPress);

  // 두 손가락 확대 막기
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length > 1) e.preventDefault();
  }, { passive: false });

  // 더블탭 확대 막기 (스크롤 가능한 영역은 제외)
  let lastTouchEnd = 0;
  document.addEventListener('touchend', (e) => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  }, false);

  // 길게 눌러 선택하기/메뉴 막기
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  // 핀치 확대(제스처) 막기 (iOS/일부 안드로이드 브라우저)
  document.addEventListener('gesturestart', (e) => e.preventDefault());
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

init();
