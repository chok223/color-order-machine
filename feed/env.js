'use strict';
// 환경: 옷장(보상), 배경, 낮/밤

// ---------- rewards, closet, backgrounds, night ----------
var ITEMS = [
  { id: 'ribbon', slot: 'head', crop: '70 80 100 70' },
  { id: 'scarf', slot: 'neck', crop: '70 250 160 100' },
  { id: 'hat', slot: 'head', crop: '105 20 90 110' },
  { id: 'glasses', slot: 'face', crop: '80 148 140 56' },
  { id: 'flower', slot: 'head', crop: '165 78 70 70' },
  { id: 'skinPink', slot: 'skin', color: '#ffd6e4' },
  { id: 'skinSky', slot: 'skin', color: '#d6efff' },
  { id: 'skinYellow', slot: 'skin', color: '#fff0a8' }
];
var owned = [], eq = { head: null, face: null, neck: null, skin: null }, night = false, bgIndex = 0;
try {
  owned = (load('items') || '').split(',').filter(Boolean);
  var savedEq = JSON.parse(load('equipped') || '{}');
  for (var k in eq) if (savedEq[k]) eq[k] = savedEq[k];
} catch (e) {}
bgIndex = parseInt(load('bg'), 10) || 0;

function applyLook() {
  var svg = rb();
  ITEMS.forEach(function (it) {
    if (it.slot === 'skin') return;
    var g = svg.querySelector('.a-' + it.id);
    if (g) g.classList.toggle('on', eq[it.slot] === it.id);
  });
  var color = '#fff';
  ITEMS.forEach(function (it) { if (it.slot === 'skin' && eq.skin === it.id) color = it.color; });
  svg.style.setProperty('--fur', color);
}
// 첫 보상 안내: 처음 받은 아이템은 자동으로 입히지 않고, 화살표로 옷장 -> 아이템을 누르게 해서 입는 법을 알려 줌
// tutorStep: 0 = 안내 없음/끝, 1 = 옷장 버튼 가리키는 중, 2 = 옷장 안에서 아이템 가리키는 중
var tutorStep = 0, tutorItem = null;
var TUT_ARROW = '<svg viewBox="0 0 100 100"><path d="M38 6 H62 V50 H84 L50 92 L16 50 H38 Z" fill="#ff5a5a" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/></svg>';
var elTut = document.createElement('div');
elTut.id = 'tut';
elTut.innerHTML = TUT_ARROW;
document.body.appendChild(elTut);

function pointAt(target, dir) {
  var r = target.getBoundingClientRect(), s = 84;
  elTut.className = 'show dir-' + dir;
  if (dir === 'left') {          // 대상의 오른쪽에서 왼쪽을 가리킴
    elTut.style.left = (r.right + 4) + 'px';
    elTut.style.top = (r.top + r.height / 2 - s / 2) + 'px';
  } else {                       // 대상 위에서 아래를 가리킴
    elTut.style.left = (r.left + r.width / 2 - s / 2) + 'px';
    elTut.style.top = (r.top - s - 2) + 'px';
  }
}
function hideTut() { elTut.className = ''; }
function tutorShow() {
  if (tutorStep === 1) pointAt($('btnCloset'), 'left');
  else if (tutorStep === 2) {
    var el = $('closetGrid').querySelector('.citem[data-id="' + tutorItem + '"]');
    if (el) pointAt(el, 'down');
  } else hideTut();
}
window.addEventListener('resize', tutorShow);

function grantItem() {
  for (var i = 0; i < ITEMS.length; i++) {
    if (owned.indexOf(ITEMS[i].id) < 0) {
      var first = owned.length === 0 && !load('tutDone');
      owned.push(ITEMS[i].id);
      store('items', owned.join(','));
      if (first) {
        tutorStep = 1; tutorItem = ITEMS[i].id;
      } else {
        eq[ITEMS[i].slot] = ITEMS[i].id;
        store('equipped', JSON.stringify(eq));
        applyLook();
      }
      return ITEMS[i];
    }
  }
  return null;
}
function itemIcon(it) {
  if (it.color) return '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="34" fill="' + it.color + '" stroke="' + INK + '" stroke-width="6"/></svg>';
  return '<svg viewBox="' + it.crop + '">' + ACC[it.id] + '</svg>';
}
var elCloset = $('closet');
function renderCloset() {
  var h = '';
  ITEMS.forEach(function (it) {
    var has = owned.indexOf(it.id) >= 0;
    h += '<div class="citem' + (has ? '' : ' locked') + (eq[it.slot] === it.id ? ' worn' : '') + '" data-id="' + it.id + '">' + itemIcon(it) + '</div>';
  });
  $('closetGrid').innerHTML = h;
}
$('btnCloset').addEventListener('click', function () {
  if (busy) return;
  renderCloset();
  elCloset.classList.add('show');
  if (tutorStep === 1) { tutorStep = 2; tutorShow(); }
});
// 잠긴 아이템을 누르면 안내 문구 (소리가 켜져 있으면 읽어 줌)
var LOCKED_MSG = '호감도를 쌓아 잠금해제 하세요', closetMsgTimer = null;
function showClosetMsg() {
  var m = $('closetMsg');
  m.textContent = LOCKED_MSG;
  m.classList.add('show');
  clearTimeout(closetMsgTimer);
  closetMsgTimer = setTimeout(hideClosetMsg, 3500);
  if (soundOn) { try { window.speechSynthesis.cancel(); } catch (e) {} speak(LOCKED_MSG, 'ko-KR'); }
}
function hideClosetMsg() { clearTimeout(closetMsgTimer); $('closetMsg').classList.remove('show'); }

$('closetClose').addEventListener('click', function () {
  hideClosetMsg();
  elCloset.classList.remove('show');
  if (tutorStep === 2) { tutorStep = 1; tutorShow(); }   // 입지 않고 닫으면 다시 옷장 버튼을 가리킴
});
$('closetGrid').addEventListener('click', function (e) {
  var el = e.target.closest ? e.target.closest('.citem') : null;
  if (!el) return;
  if (el.classList.contains('locked')) { showClosetMsg(); return; }
  hideClosetMsg();
  var it = ITEMS.filter(function (x) { return x.id === el.dataset.id; })[0];
  eq[it.slot] = eq[it.slot] === it.id ? null : it.id;
  store('equipped', JSON.stringify(eq));
  applyLook(); renderCloset();
  playClass(rb(), 'wig', 700);
  if (tutorStep === 2 && it.id === tutorItem) {   // 안내한 아이템을 입었으면 안내 끝
    tutorStep = 0; store('tutDone', 1); hideTut();
  }
});

var zoneEl = $('zone');
function showBg() {
  zoneEl.className = 'bg' + bgIndex;
  store('bg', bgIndex);
}
$('btnBg').addEventListener('click', function () {
  if (busy) return;
  bgIndex = (bgIndex + 1) % 3;
  showBg();
});
$('btnDn').addEventListener('click', function () {
  if (busy && !night) return;
  night = !night;
  document.body.classList.toggle('night', night);
  $('btnDn').innerHTML = night ? SVG.sun : SVG.moon;
  if (night) {
    busy = true; deselect();
    sleeping = true; setState('sleep'); setBubble(SLEEPY);
  } else {
    // 밤 -> 낮: 하품하며 천천히 일어난 뒤에 다시 활동 (그동안은 busy 유지)
    sleeping = false; lastTouch = Date.now();
    setState('idle');
    wakeMotion();
    later(function () { setBubble(idleBubble()); busy = false; lastTouch = Date.now(); }, WAKE_MS);
  }
});
