'use strict';
// 공통: 상수, 상태, 소리, 말풍선, 도우미, 하트 효과

var FOODS = [
  { id: 'apple', ko: '빨간 사과', en: 'Red' },
  { id: 'carrot', ko: '주황 당근', en: 'Orange' }
];

var PLAYS = [
  { id: 'ball', ko: '공 놀이', en: 'Ball' },
  { id: 'bush', ko: '숨바꼭질', en: 'Hide' }
];
var MAX_CELLS = 5, UNLOCK_AT = 3, DECAY_MS = 35000, decayAt = Date.now();
var HUNGRY = { text: '배고파요', symbol: 'hungry' };
var PLAY = { text: '재밌어요', symbol: 'yummy' };
var SEEK = { text: '어디 숨었을까요?', symbol: 'seek' };
var NOTHERE = { text: '여기 없어요! 다른 곳에 있어요', symbol: 'seek' };
var GIFT = { text: '선물이에요!', symbol: 'gift' };
var PEEK = { text: '찾았다!', symbol: 'yummy' };
var FULLB = { text: '배불러요', symbol: 'full' };
var YUMMY = { text: '맛있어요', symbol: 'yummy' };

var $ = function (id) { return document.getElementById(id); };
var elFoods = $('foods'), elRabbit = $('rabbit'),
    elSymbol = $('symbol'), elBubbleText = $('bubbleText'), elFloaters = $('floaters'),
    elSpeaker = $('speaker'), elTitle = $('title'), elReset = $('reset'), elZone = $('zone');

var seeking = false, cells = 0, locked = false, busy = false, selected = null, soundOn = false;
var timers = [];

try { soundOn = localStorage.getItem('feed.sound') === '1'; } catch (e) {}
function saveSound() { try { localStorage.setItem('feed.sound', soundOn ? '1' : '0'); } catch (e) {} }

var voices = [];
function loadVoices() { try { voices = window.speechSynthesis.getVoices(); } catch (e) {} }
if ('speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}
function speak(text, lang) {
  if (!soundOn || !('speechSynthesis' in window)) return;
  try {
    var u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.85;
    for (var i = 0; i < voices.length; i++) {
      if (voices[i].lang && voices[i].lang.replace('_', '-').indexOf(lang) === 0) { u.voice = voices[i]; break; }
    }
    window.speechSynthesis.speak(u);
  } catch (e) {}
}
function speakFood(f) {
  if (!soundOn || !('speechSynthesis' in window)) return;
  try { window.speechSynthesis.cancel(); } catch (e) {}
  speak(f.ko, 'ko-KR');
  speak(f.en, 'en-US');
}

function idleBubble() { return cells <= 1 ? HUNGRY : null; }
function becomeHungry() {
  if (sleeping || busy || petting) return;
  sayBubble(HUNGRY);
  playClass(rb().querySelector('.ear-l'), 'wig', 700);
  playClass(rb().querySelector('.ear-r'), 'wig', 700);
}
function setBubble(b, force) {
  if (seeking && !force) return;
  $('bubble').classList.toggle('hide', !b);
  if (!b) return;
  elSymbol.innerHTML = SVG[b.symbol];
  elBubbleText.textContent = b.text;
}
function sayBubble(b, force) {
  if (seeking && !force) return;
  if (!b) { setBubble(b, force); return; }
  setBubble(b, force);
  if (soundOn && 'speechSynthesis' in window) {
    try { window.speechSynthesis.cancel(); } catch (e) {}
    speak(b.text, 'ko-KR');
  }
}
function rb() { return elRabbit.querySelector('.rb'); }
function setState(s) { rb().setAttribute('data-state', s); }

function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
function clearTimers() { timers.forEach(clearTimeout); timers = []; }

function overRabbit(x, y) {
  var r = elRabbit.getBoundingClientRect();
  var m = 30;
  return x >= r.left - m && x <= r.right + m && y >= r.top - m && y <= r.bottom + m;
}
function mouthPoint() {
  var r = elRabbit.getBoundingClientRect();
  return { x: r.left + r.width * 0.5, y: r.top + r.height * (238 / 380) };
}
function makeGhost(foodId, x, y) {
  var g = document.createElement('div');
  g.className = 'ghost';
  g.innerHTML = SVG[foodId];
  g.style.left = x + 'px'; g.style.top = y + 'px';
  document.body.appendChild(g);
  return g;
}
function cardCenter(card) {
  var r = card.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}
function cardOf(foodId) { return elFoods.querySelector('.card.' + foodId); }

function store(k, v) { try { localStorage.setItem('feed.' + k, String(v)); } catch (e) {} }
function load(k) { try { return localStorage.getItem('feed.' + k); } catch (e) { return null; } }
function playClass(el, cls, ms) {
  if (!el) return;
  el.classList.add(cls);
  setTimeout(function () { el.classList.remove(cls); }, ms);
}

function floatAt(x, y) {
  var z = elZone.getBoundingClientRect();
  var h = document.createElement('div');
  h.className = 'floater';
  h.innerHTML = SVG.smallHeart;
  h.style.left = (x - z.left - 20) + 'px';
  h.style.top = (y - z.top - 30) + 'px';
  elFloaters.appendChild(h);
  setTimeout(function () { if (h.parentNode) h.parentNode.removeChild(h); }, 1700);
}

function floatHeart() {
  var r = elRabbit.getBoundingClientRect(), z = elZone.getBoundingClientRect();
  for (var i = 0; i < 3; i++) {
    (function (i) {
      later(function () {
        var h = document.createElement('div');
        h.className = 'floater';
        h.innerHTML = SVG.smallHeart;
        h.style.left = (r.left - z.left + r.width * (0.3 + 0.2 * i)) + 'px';
        h.style.top = (r.top - z.top + r.height * 0.1) + 'px';
        elFloaters.appendChild(h);
        later(function () { if (h.parentNode) h.parentNode.removeChild(h); }, 1700);
      }, i * 250);
    })(i);
  }
}
