// ============================================================
//  설정값 (멘토가 바꿀 수 있는 것은 여기 맨 위에 모여 있음)
// ============================================================
var TOUCHES_TO_COMPLETE = 20;   // 이 횟수만큼 터치하면 남은 부분까지 전부 칠해지며 완성
var SOUND_ON = false;           // 효과음: 기본 꺼짐. 켜려면 true
var SOUND_VOLUME = 0.06;        // 효과음 크기 (0 ~ 1, 아주 작게)
var MENTOR_HOLD_MS = 2000;      // 멘토 버튼을 이만큼 길게 눌러야 작동
var DONE_BUTTON_DELAY_MS = 2500;// 완성 후 '그림 고르기' 버튼이 나타나기까지

// 아래는 느낌을 조절하는 값 (보통은 건드릴 필요 없음)
var WAVE_MS = 2600;             // 터치 한 번의 파동이 퍼지는 시간
var WAVE_RADIUS = 0.22;         // 파동 기본 크기 (화면 짧은 변 기준 비율)
var MIN_NEW_AREA = 0.03;        // 한 번 터치할 때 최소한 새로 칠해지는 면적 비율
var FINISH_MS = 4500;           // 마지막 터치 후 전체가 칠해지는 시간
// ============================================================

(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var picker = $('picker'), stage = $('stage'), canvas = $('paint');
  var ctx = canvas.getContext('2d');
  var btnDone = $('btnDone'), btnMentor = $('btnMentor'), panel = $('panel'), fileInput = $('fileInput');

  // ---------- 그림 목록 ----------
  var pictures = [];   // { name, source: function(ctx, w, h) 로 컬러 그림을 그림 }

  // ===== 샘플 그림 (도형으로 직접 그림, 저작권 문제 없음) =====
  // 가운데 1000x1000 칸에 그리고, 배경은 화면 전체로 번지게 그린다.
  function sceneFrame(c, w, h, draw) {
    var s = Math.min(w, h) / 1000;
    c.save();
    c.translate((w - 1000 * s) / 2, (h - 1000 * s) / 2);
    c.scale(s, s);
    draw(c);
    c.restore();
  }
  function ell(c, x, y, rx, ry, fill) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = fill; c.fill(); }
  function vgrad(c, y0, y1, a, b) { var g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; }

  function drawSun(c, w, h) {
    c.fillStyle = vgrad(c, 0, h, '#6ec6f5', '#c8ecff'); c.fillRect(0, 0, w, h);
    sceneFrame(c, w, h, function (c) {
      // 구름
      [[220, 200, 1], [800, 330, 0.8]].forEach(function (p) {
        ell(c, p[0], p[1], 90 * p[2], 45 * p[2], '#fff'); ell(c, p[0] - 60 * p[2], p[1] + 12 * p[2], 60 * p[2], 36 * p[2], '#fff');
        ell(c, p[0] + 60 * p[2], p[1] + 14 * p[2], 66 * p[2], 34 * p[2], '#fff');
      });
      // 햇살
      c.strokeStyle = '#ff9a1f'; c.lineWidth = 34; c.lineCap = 'round';
      for (var i = 0; i < 12; i++) {
        var a = i * Math.PI / 6;
        c.beginPath(); c.moveTo(500 + Math.cos(a) * 250, 400 + Math.sin(a) * 250); c.lineTo(500 + Math.cos(a) * 340, 400 + Math.sin(a) * 340); c.stroke();
      }
      // 해
      ell(c, 500, 400, 205, 205, '#ffd21f');
      ell(c, 500, 400, 205, 205, 'rgba(255,150,30,.25)');
      ell(c, 500, 400, 175, 175, '#ffe14d');
      // 얼굴
      ell(c, 430, 375, 17, 22, '#5a3a1a'); ell(c, 570, 375, 17, 22, '#5a3a1a');
      ell(c, 385, 440, 28, 18, 'rgba(255,90,90,.5)'); ell(c, 615, 440, 28, 18, 'rgba(255,90,90,.5)');
      c.beginPath(); c.arc(500, 420, 62, 0.15 * Math.PI, 0.85 * Math.PI); c.strokeStyle = '#5a3a1a'; c.lineWidth = 14; c.stroke();
      // 언덕
      ell(c, 250, 1020, 800, 330, '#5cc04a'); ell(c, 820, 1060, 700, 300, '#3fa83a');
      // 꽃 몇 송이
      [[180, 850], [760, 880], [900, 830]].forEach(function (p) {
        for (var k = 0; k < 5; k++) { var an = k * 2 * Math.PI / 5; ell(c, p[0] + Math.cos(an) * 20, p[1] + Math.sin(an) * 20, 14, 14, '#ff6a9e'); }
        ell(c, p[0], p[1], 11, 11, '#ffe14d');
      });
    });
  }

  function drawFlower(c, w, h) {
    c.fillStyle = vgrad(c, 0, h, '#ffe3f1', '#fff3c4'); c.fillRect(0, 0, w, h);
    sceneFrame(c, w, h, function (c) {
      // 땅
      ell(c, 500, 1130, 1400, 330, '#7bc65a');
      // 줄기
      c.strokeStyle = '#2e9b3e'; c.lineWidth = 34; c.lineCap = 'round';
      c.beginPath(); c.moveTo(500, 500); c.bezierCurveTo(470, 640, 540, 760, 500, 900); c.stroke();
      // 잎
      c.fillStyle = '#3fb34f';
      c.beginPath(); c.moveTo(505, 740); c.bezierCurveTo(630, 640, 760, 680, 790, 740); c.bezierCurveTo(700, 800, 580, 800, 505, 740); c.fill();
      c.beginPath(); c.moveTo(495, 800); c.bezierCurveTo(380, 700, 250, 730, 210, 800); c.bezierCurveTo(310, 860, 420, 860, 495, 800); c.fill();
      // 꽃잎
      var cols = ['#ff4f7b', '#ff7aa2'];
      for (var i = 0; i < 8; i++) {
        var a = i * Math.PI / 4;
        ell(c, 500 + Math.cos(a) * 140, 360 + Math.sin(a) * 140, 88, 88, cols[i % 2]);
      }
      ell(c, 500, 360, 100, 100, '#ffd21f'); ell(c, 500, 360, 62, 62, '#ff9a1f');
      // 얼굴
      ell(c, 470, 345, 9, 12, '#5a3a1a'); ell(c, 530, 345, 9, 12, '#5a3a1a');
      c.beginPath(); c.arc(500, 360, 28, 0.2 * Math.PI, 0.8 * Math.PI); c.strokeStyle = '#5a3a1a'; c.lineWidth = 7; c.stroke();
      // 나비
      ell(c, 800, 260, 40, 28, '#8e5be0'); ell(c, 850, 240, 40, 28, '#b583ff'); ell(c, 825, 250, 7, 26, '#5a3a1a');
    });
  }

  function drawFish(c, w, h) {
    c.fillStyle = vgrad(c, 0, h, '#2fb6e8', '#1565c0'); c.fillRect(0, 0, w, h);
    sceneFrame(c, w, h, function (c) {
      // 모래
      ell(c, 500, 1130, 1500, 330, '#f2d48a');
      // 해초
      c.strokeStyle = '#2fae5a'; c.lineWidth = 26; c.lineCap = 'round';
      [[130, 880], [190, 900], [830, 880], [890, 900]].forEach(function (p) {
        c.beginPath(); c.moveTo(p[0], p[1]); c.bezierCurveTo(p[0] - 40, p[1] - 90, p[0] + 40, p[1] - 170, p[0], p[1] - 260); c.stroke();
      });
      // 꼬리
      c.fillStyle = '#ff7a1a';
      c.beginPath(); c.moveTo(700, 500); c.lineTo(900, 360); c.quadraticCurveTo(940, 500, 900, 640); c.closePath(); c.fill();
      // 몸
      ell(c, 480, 500, 260, 175, '#ff9a2e');
      // 배
      ell(c, 470, 590, 190, 70, '#ffd9a0');
      // 줄무늬
      c.save(); c.beginPath(); c.ellipse(480, 500, 260, 175, 0, 0, Math.PI * 2); c.clip();
      c.fillStyle = '#ff5a2e'; c.fillRect(420, 300, 46, 400); c.fillRect(530, 300, 46, 400);
      c.restore();
      // 지느러미
      c.fillStyle = '#ff6a2e';
      c.beginPath(); c.moveTo(430, 335); c.quadraticCurveTo(490, 220, 580, 345); c.closePath(); c.fill();
      // 눈
      ell(c, 300, 470, 40, 40, '#fff'); ell(c, 310, 472, 22, 22, '#222');
      c.beginPath(); c.arc(285, 535, 34, 0.1 * Math.PI, 0.8 * Math.PI); c.strokeStyle = '#7a2f10'; c.lineWidth = 10; c.stroke();
      // 방울
      [[240, 330, 26], [200, 250, 18], [260, 180, 12]].forEach(function (b) {
        c.beginPath(); c.arc(b[0], b[1], b[2], 0, Math.PI * 2); c.fillStyle = 'rgba(255,255,255,.35)'; c.fill();
        c.lineWidth = 5; c.strokeStyle = 'rgba(255,255,255,.8)'; c.stroke();
      });
    });
  }

  function rr(c, x, y, w, h, r, fill) {
    c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); c.fillStyle = fill; c.fill();
  }
  function cloud(c, x, y, k) {
    ell(c, x, y, 90 * k, 45 * k, '#fff'); ell(c, x - 60 * k, y + 12 * k, 60 * k, 36 * k, '#fff'); ell(c, x + 60 * k, y + 14 * k, 66 * k, 34 * k, '#fff');
  }

  function drawRainbow(c, w, h) {
    c.fillStyle = vgrad(c, 0, h, '#7fd0ff', '#e6f6ff'); c.fillRect(0, 0, w, h);
    sceneFrame(c, w, h, function (c) {
      ell(c, 880, 130, 70, 70, '#ffd21f');
      var cols = ['#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa'];
      c.lineWidth = 46; c.lineCap = 'butt';
      cols.forEach(function (col, i) {
        c.beginPath(); c.arc(500, 760, 440 - i * 44, Math.PI, 0); c.strokeStyle = col; c.stroke();
      });
      cloud(c, 150, 760, 1.1); cloud(c, 850, 760, 1.1);
      ell(c, 300, 1100, 900, 330, '#62c455'); ell(c, 800, 1120, 800, 300, '#47ac3d');
    });
  }

  function drawHouse(c, w, h) {
    c.fillStyle = vgrad(c, 0, h, '#8fd3ff', '#e9f7ff'); c.fillRect(0, 0, w, h);
    sceneFrame(c, w, h, function (c) {
      ell(c, 120, 140, 70, 70, '#ffd21f'); cloud(c, 760, 170, 0.9);
      ell(c, 500, 1130, 1500, 400, '#6cc653');
      // 나무
      rr(c, 840, 560, 40, 280, 10, '#8d5a2b'); ell(c, 860, 500, 110, 120, '#2e9b3e'); ell(c, 810, 560, 70, 70, '#3fb34f');
      // 집
      c.fillStyle = '#7d7d7d'; c.fillRect(580, 270, 50, 120);
      rr(c, 220, 440, 500, 400, 12, '#ffb74d');
      c.fillStyle = '#e53935'; c.beginPath(); c.moveTo(180, 450); c.lineTo(470, 220); c.lineTo(760, 450); c.closePath(); c.fill();
      rr(c, 420, 620, 100, 220, 10, '#8d5a2b'); ell(c, 500, 735, 8, 8, '#ffd21f');
      [[270, 520], [570, 520]].forEach(function (p) {
        rr(c, p[0], p[1], 110, 110, 10, '#5fb7f0');
        c.fillStyle = '#fff'; c.fillRect(p[0] + 50, p[1], 10, 110); c.fillRect(p[0], p[1] + 50, 110, 10);
      });
      // 꽃
      [[130, 880, '#ff6a9e'], [200, 920, '#ffd21f'], [700, 930, '#ff6a9e']].forEach(function (p) { ell(c, p[0], p[1], 20, 20, p[2]); ell(c, p[0], p[1], 8, 8, '#fff'); });
    });
  }

  function drawBus(c, w, h) {
    c.fillStyle = vgrad(c, 0, h, '#8fd3ff', '#eaf7ff'); c.fillRect(0, 0, w, h);
    sceneFrame(c, w, h, function (c) {
      cloud(c, 220, 180, 1); cloud(c, 800, 260, 0.8);
      ell(c, 500, 900, 1500, 260, '#7bc65a');          // 풀
      c.fillStyle = '#6b6b6b'; c.fillRect(-1000, 760, 3000, 1200);   // 도로
      c.fillStyle = '#fff'; for (var x = -100; x < 1100; x += 220) c.fillRect(x, 905, 120, 14);
      // 버스
      rr(c, 110, 380, 780, 340, 50, '#ffcc1f');
      rr(c, 110, 560, 780, 40, 0, '#ff8f1f');
      for (var i = 0; i < 4; i++) rr(c, 160 + i * 150, 430, 120, 110, 16, '#7fd1ff');
      rr(c, 770, 430, 90, 150, 16, '#7fd1ff');
      ell(c, 872, 640, 18, 18, '#fff7b0');
      [[270, 730], [700, 730]].forEach(function (p) { ell(c, p[0], p[1], 78, 78, '#333'); ell(c, p[0], p[1], 38, 38, '#cfcfcf'); });
    });
  }

  function tilt(c, x, y, rx, ry, rot, fill) { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); c.fillStyle = fill; c.fill(); }
  function tri(c, a, b, d, fill) { c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.lineTo(d[0], d[1]); c.closePath(); c.fillStyle = fill; c.fill(); }

  function drawBalloons(c, w, h) {
    c.fillStyle = vgrad(c, 0, h, '#7fd0ff', '#fff1c9'); c.fillRect(0, 0, w, h);
    sceneFrame(c, w, h, function (c) {
      cloud(c, 190, 180, 1); cloud(c, 830, 250, 0.9);
      ell(c, 300, 1120, 900, 330, '#62c455'); ell(c, 800, 1130, 800, 300, '#47ac3d');
      [[250, 400, '#e53935'], [500, 310, '#fdd835'], [760, 420, '#1e88e5'], [390, 590, '#43a047'], [640, 610, '#ab47bc']].forEach(function (b) {
        c.strokeStyle = '#6b5a4a'; c.lineWidth = 5; c.lineCap = 'round';
        c.beginPath(); c.moveTo(b[0], b[1] + 125); c.quadraticCurveTo(b[0] + 30, b[1] + 260, 500, 880); c.stroke();
        tri(c, [b[0], b[1] + 118], [b[0] - 16, b[1] + 146], [b[0] + 16, b[1] + 146], b[2]);
        ell(c, b[0], b[1], 98, 122, b[2]);
        ell(c, b[0] - 38, b[1] - 46, 20, 34, 'rgba(255,255,255,.45)');
      });
      rr(c, 440, 860, 120, 80, 12, '#c98a3a');
    });
  }

  function drawIceCream(c, w, h) {
    c.fillStyle = vgrad(c, 0, h, '#ffd9ea', '#fff6d6'); c.fillRect(0, 0, w, h);
    sceneFrame(c, w, h, function (c) {
      [[120, 160, '#ff9ec4'], [880, 260, '#8fe0d0'], [150, 720, '#ffe14d'], [870, 780, '#b583ff']].forEach(function (p) { ell(c, p[0], p[1], 34, 34, p[2]); });
      tri(c, [320, 520], [680, 520], [500, 960], '#e8a850');
      c.save(); c.beginPath(); c.moveTo(320, 520); c.lineTo(680, 520); c.lineTo(500, 960); c.closePath(); c.clip();
      c.strokeStyle = '#c98a30'; c.lineWidth = 9;
      for (var i = -8; i < 12; i++) {
        c.beginPath(); c.moveTo(250 + i * 50, 500); c.lineTo(250 + i * 50 + 260, 980); c.stroke();
        c.beginPath(); c.moveTo(750 - i * 50, 500); c.lineTo(750 - i * 50 - 260, 980); c.stroke();
      }
      c.restore();
      ell(c, 500, 500, 215, 100, '#ff9ec4'); ell(c, 330, 560, 34, 52, '#ff9ec4'); ell(c, 660, 556, 30, 44, '#ff9ec4');
      ell(c, 500, 380, 185, 120, '#fff2c8'); ell(c, 500, 255, 150, 105, '#8fe0d0');
      ell(c, 500, 150, 38, 38, '#e53935'); c.strokeStyle = '#2e9b3e'; c.lineWidth = 9; c.lineCap = 'round';
      c.beginPath(); c.moveTo(500, 118); c.quadraticCurveTo(520, 70, 570, 60); c.stroke();
      [[420, 240, 0.6, '#e53935'], [560, 270, -0.5, '#fdd835'], [500, 330, 0.9, '#1e88e5'], [380, 400, -0.7, '#ab47bc'], [610, 410, 0.4, '#43a047'], [480, 480, -0.4, '#fdd835']].forEach(function (s) {
        tilt(c, s[0], s[1], 20, 7, s[2], s[3]);
      });
    });
  }

  function drawBoat(c, w, h) {
    c.fillStyle = vgrad(c, 0, h, '#7fd0ff', '#fff1c9'); c.fillRect(0, 0, w, h);
    sceneFrame(c, w, h, function (c) {
      ell(c, 820, 170, 85, 85, '#ffd21f'); cloud(c, 200, 190, 1);
      c.fillStyle = vgrad(c, 600, 1000, '#2fb6e8', '#1565c0'); c.fillRect(-1000, 620, 3000, 1000);
      // 배
      rr(c, 490, 250, 22, 380, 8, '#8d5a2b');
      tri(c, [514, 270], [514, 570], [760, 570], '#ffffff');
      tri(c, [488, 320], [488, 570], [290, 570], '#ffd21f');
      tri(c, [500, 250], [500, 190], [600, 220], '#e53935');
      c.fillStyle = '#e53935'; c.beginPath(); c.moveTo(230, 590); c.lineTo(780, 590); c.lineTo(690, 720); c.lineTo(330, 720); c.closePath(); c.fill();
      c.fillStyle = '#fff'; c.fillRect(250, 612, 510, 14);
      [[400, 660], [500, 660], [600, 660]].forEach(function (p) { ell(c, p[0], p[1], 20, 20, '#7fd1ff'); });
      // 앞 파도
      [[150, 760], [420, 790], [700, 765], [930, 800], [280, 880], [600, 900], [870, 920]].forEach(function (p) { ell(c, p[0], p[1], 130, 40, '#4fa3f0'); ell(c, p[0], p[1] + 14, 130, 36, '#1e88e5'); });
    });
  }

  function drawTree(c, w, h) {
    c.fillStyle = vgrad(c, 0, h, '#8fd3ff', '#eaf7ff'); c.fillRect(0, 0, w, h);
    sceneFrame(c, w, h, function (c) {
      ell(c, 130, 130, 70, 70, '#ffd21f'); cloud(c, 800, 170, 0.9);
      ell(c, 500, 1130, 1500, 400, '#6cc653');
      rr(c, 440, 520, 120, 380, 24, '#8d5a2b');
      [[500, 360, 250, 210], [340, 440, 150, 130], [670, 440, 150, 130], [420, 280, 150, 130], [590, 270, 150, 130]].forEach(function (b) { ell(c, b[0], b[1], b[2], b[3], '#3fb34f'); });
      [[350, 360], [500, 250], [640, 340], [430, 470], [600, 480], [270, 470], [720, 450]].forEach(function (p) {
        ell(c, p[0], p[1], 34, 32, '#e53935'); ell(c, p[0] - 10, p[1] - 10, 8, 10, 'rgba(255,255,255,.5)');
        tilt(c, p[0] + 12, p[1] - 34, 18, 8, -0.6, '#2e9b3e');
      });
      [[220, 900, '#ff6a9e'], [800, 930, '#ffd21f'], [680, 870, '#ff6a9e']].forEach(function (p) { ell(c, p[0], p[1], 20, 20, p[2]); ell(c, p[0], p[1], 8, 8, '#fff'); });
      ell(c, 330, 880, 36, 34, '#e53935');
    });
  }

  function drawButterfly(c, w, h) {
    c.fillStyle = vgrad(c, 0, h, '#e2f6c4', '#fff3c4'); c.fillRect(0, 0, w, h);
    sceneFrame(c, w, h, function (c) {
      ell(c, 500, 1150, 1500, 330, '#7bc65a');
      [[140, 840, '#ff6a9e'], [300, 900, '#ffd21f'], [700, 890, '#ff6a9e'], [860, 830, '#b583ff'], [520, 930, '#ffd21f']].forEach(function (p) {
        c.strokeStyle = '#2e9b3e'; c.lineWidth = 12; c.beginPath(); c.moveTo(p[0], p[1]); c.lineTo(p[0], 1010); c.stroke();
        for (var k = 0; k < 6; k++) { var a = k * Math.PI / 3; ell(c, p[0] + Math.cos(a) * 34, p[1] + Math.sin(a) * 34, 24, 24, p[2]); }
        ell(c, p[0], p[1], 20, 20, '#fff3a0');
      });
      tilt(c, 360, 380, 170, 105, -0.55, '#ff8f1f'); tilt(c, 640, 380, 170, 105, 0.55, '#ff8f1f');
      tilt(c, 395, 580, 120, 85, 0.55, '#ffb74d'); tilt(c, 605, 580, 120, 85, -0.55, '#ffb74d');
      [[330, 370], [670, 370]].forEach(function (p) { ell(c, p[0], p[1], 52, 42, '#fff3d0'); ell(c, p[0], p[1], 28, 22, '#e53935'); });
      [[385, 590], [615, 590]].forEach(function (p) { ell(c, p[0], p[1], 34, 28, '#fff3d0'); ell(c, p[0], p[1], 16, 13, '#8e24aa'); });
      rr(c, 482, 310, 36, 340, 18, '#5a3a1a');
      ell(c, 500, 300, 36, 36, '#5a3a1a');
      c.strokeStyle = '#5a3a1a'; c.lineWidth = 8; c.lineCap = 'round';
      c.beginPath(); c.moveTo(488, 275); c.quadraticCurveTo(450, 210, 410, 200); c.stroke();
      c.beginPath(); c.moveTo(512, 275); c.quadraticCurveTo(550, 210, 590, 200); c.stroke();
    });
  }

  function drawCat(c, w, h) {
    c.fillStyle = vgrad(c, 0, h, '#ffe9c7', '#ffd9a0'); c.fillRect(0, 0, w, h);
    sceneFrame(c, w, h, function (c) {
      ell(c, 500, 1120, 1500, 340, '#c98a5a');
      ell(c, 190, 900, 78, 78, '#e53935'); c.strokeStyle = '#b71c1c'; c.lineWidth = 7;
      c.beginPath(); c.arc(190, 900, 50, 0.2, 2.6); c.stroke(); c.beginPath(); c.arc(190, 900, 30, 3.4, 5.6); c.stroke();
      // 꼬리
      c.strokeStyle = '#ff9a2e'; c.lineWidth = 64; c.lineCap = 'round';
      c.beginPath(); c.moveTo(690, 860); c.bezierCurveTo(900, 880, 940, 640, 840, 560); c.stroke();
      // 몸
      ell(c, 500, 770, 220, 215, '#ff9a2e'); ell(c, 500, 820, 120, 140, '#ffe0b8');
      ell(c, 390, 960, 70, 36, '#ff9a2e'); ell(c, 610, 960, 70, 36, '#ff9a2e');
      // 귀
      tri(c, [320, 340], [350, 150], [470, 270], '#ff9a2e'); tri(c, [680, 340], [650, 150], [530, 270], '#ff9a2e');
      tri(c, [352, 300], [366, 200], [430, 270], '#ffb6c1'); tri(c, [648, 300], [634, 200], [570, 270], '#ffb6c1');
      // 얼굴
      ell(c, 500, 440, 200, 172, '#ff9a2e');
      c.strokeStyle = '#e0701a'; c.lineWidth = 16;
      [[500, 290, 500, 345], [450, 298, 456, 345], [550, 298, 544, 345]].forEach(function (s) { c.beginPath(); c.moveTo(s[0], s[1]); c.lineTo(s[2], s[3]); c.stroke(); });
      [[420, 430], [580, 430]].forEach(function (p) { ell(c, p[0], p[1], 36, 44, '#7bd36b'); ell(c, p[0], p[1], 14, 34, '#222'); ell(c, p[0] - 8, p[1] - 12, 8, 8, '#fff'); });
      ell(c, 500, 502, 30, 20, '#ff7a9a');
      c.strokeStyle = '#7a3f10'; c.lineWidth = 8;
      c.beginPath(); c.moveTo(500, 520); c.lineTo(500, 540); c.stroke();
      c.beginPath(); c.arc(472, 540, 28, 0, 0.9 * Math.PI * 0.6); c.stroke(); c.beginPath(); c.arc(528, 540, 28, Math.PI - 0.9 * Math.PI * 0.6, Math.PI); c.stroke();
      c.strokeStyle = '#fff'; c.lineWidth = 5;
      [[-1, -14], [-1, 6], [1, -14], [1, 6]].forEach(function (s) {
        c.beginPath(); c.moveTo(500 + s[0] * 90, 520 + s[1]); c.lineTo(500 + s[0] * 210, 500 + s[1] * 3); c.stroke();
      });
      ell(c, 335, 505, 30, 18, 'rgba(255,90,90,.35)'); ell(c, 665, 505, 30, 18, 'rgba(255,90,90,.35)');
    });
  }

  var SAMPLES = [
    { name: 'sun', draw: drawSun }, { name: 'flower', draw: drawFlower }, { name: 'fish', draw: drawFish },
    { name: 'rainbow', draw: drawRainbow }, { name: 'house', draw: drawHouse }, { name: 'bus', draw: drawBus },
    { name: 'balloons', draw: drawBalloons }, { name: 'icecream', draw: drawIceCream }, { name: 'boat', draw: drawBoat },
    { name: 'tree', draw: drawTree }, { name: 'butterfly', draw: drawButterfly }, { name: 'cat', draw: drawCat }
  ];

  // ===== images/ 폴더의 그림 (images/list.json 목록을 읽는다) =====
  function loadImage(src) {
    return new Promise(function (res, rej) {
      var im = new Image();
      im.onload = function () { res(im); };
      im.onerror = rej;
      im.src = src;
    });
  }
  // 그림 파일을 화면에 '통째로' 맞춰 그린다. 남는 가장자리는 그림 모서리 색으로 채운다.
  function drawFile(im) {
    return function (c, w, h) {
      var bg = '#ffffff';
      try {
        var t = document.createElement('canvas'); t.width = t.height = 1;
        var tc = t.getContext('2d'); tc.drawImage(im, 0, 0, 1, 1, 0, 0, 1, 1);   // 왼쪽 위 모서리 한 점의 색
        var d = tc.getImageData(0, 0, 1, 1).data; bg = 'rgb(' + d[0] + ',' + d[1] + ',' + d[2] + ')';
      } catch (e) {}
      c.fillStyle = bg; c.fillRect(0, 0, w, h);
      var s = Math.min(w / im.naturalWidth, h / im.naturalHeight);
      var dw = im.naturalWidth * s, dh = im.naturalHeight * s;
      c.drawImage(im, (w - dw) / 2, (h - dh) / 2, dw, dh);
    };
  }
  function loadFiles() {
    return fetch('images/list.json', { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error('no list');
      return r.json();
    }).then(function (names) {
      if (!Array.isArray(names)) return [];
      return Promise.all(names.map(function (n) {
        return loadImage('images/' + encodeURIComponent(n)).then(function (im) { return { name: n, draw: drawFile(im) }; }).catch(function () { return null; });
      }));
    }).then(function (arr) { return arr.filter(Boolean); }).catch(function () { return []; });
  }

  // ===== 멘토가 앱에서 직접 추가한 그림 (이 패드 안에만 저장: IndexedDB) =====
  var DB_NAME = 'coloring-db', STORE = 'pics', MAX_SIDE = 1600;
  var fileLoaded = [];    // images/ 폴더 그림
  var userLoaded = [];    // 앱에서 추가한 그림 { id, blob, url, draw }
  function openDB() {
    return new Promise(function (res, rej) {
      if (!window.indexedDB) { rej(new Error('no idb')); return; }
      var r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true }); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
  }
  function idbDo(mode, fn) {
    return openDB().then(function (db) {
      return new Promise(function (res, rej) {
        var tx = db.transaction(STORE, mode), req = fn(tx.objectStore(STORE));
        tx.oncomplete = function () { db.close(); res(req && req.result); };
        tx.onerror = tx.onabort = function () { db.close(); rej(tx.error); };
      });
    });
  }
  // 큰 사진은 줄여서(긴 변 1600) 저장한다. 투명한 부분은 흰색으로 채운다.
  function shrink(file) {
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(file), im = new Image();
      im.onload = function () {
        var k = Math.min(1, MAX_SIDE / Math.max(im.naturalWidth, im.naturalHeight));
        var c = newCanvas(Math.max(1, Math.round(im.naturalWidth * k)), Math.max(1, Math.round(im.naturalHeight * k)));
        var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? res(b) : rej(new Error('blob')); }, 'image/jpeg', 0.9);
      };
      im.onerror = function () { URL.revokeObjectURL(url); rej(new Error('decode')); };
      im.src = url;
    });
  }
  function loadUserPics() {
    return idbDo('readonly', function (s) { return s.getAll(); }).then(function (recs) {
      return Promise.all((recs || []).map(function (r) {
        var url = URL.createObjectURL(r.blob);
        return loadImage(url).then(function (im) { return { id: r.id, name: 'mine' + r.id, url: url, draw: drawFile(im) }; })
          .catch(function () { URL.revokeObjectURL(url); return null; });
      }));
    }).then(function (a) { return a.filter(Boolean); }).catch(function () { return []; });
  }
  function reloadUser() {
    return loadUserPics().then(function (arr) {
      userLoaded.forEach(function (u) { URL.revokeObjectURL(u.url); });
      userLoaded = arr; refreshPictures();
    });
  }
  var hidden = [];     // 멘토가 지운 기본 그림 이름 (되돌리기 가능)
  try { hidden = JSON.parse(localStorage.getItem('coloring-hidden') || '[]') || []; } catch (e) { hidden = []; }
  function saveHidden() { try { localStorage.setItem('coloring-hidden', JSON.stringify(hidden)); } catch (e) {} }
  function refreshPictures() {
    pictures = SAMPLES.concat(fileLoaded, userLoaded).filter(function (p) { return hidden.indexOf(p.name) < 0; });
    buildPicker();
    if (!panel.hidden) buildPanelList();
  }

  // ---------- 흑백 만들기 (코드로 회색조 변환) ----------
  function makeGray(colorCanvas) {
    var g = document.createElement('canvas');
    g.width = colorCanvas.width; g.height = colorCanvas.height;
    var gc = g.getContext('2d');
    if ('filter' in gc) {
      gc.filter = 'grayscale(1)';
      gc.drawImage(colorCanvas, 0, 0);
      gc.filter = 'none';
      return g;
    }
    gc.drawImage(colorCanvas, 0, 0);
    var id = gc.getImageData(0, 0, g.width, g.height), p = id.data;
    for (var i = 0; i < p.length; i += 4) {
      var l = 0.299 * p[i] + 0.587 * p[i + 1] + 0.114 * p[i + 2];
      p[i] = p[i + 1] = p[i + 2] = l;
    }
    gc.putImageData(id, 0, 0);
    return g;
  }
  function newCanvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

  // ---------- 시작 화면 ----------
  function layoutPicker() {
    var n = pictures.length;
    if (!n) return;
    var cs = getComputedStyle(picker);
    var W = picker.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    var H = picker.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    var gap = 16, best = 0, bestCols = 1;
    for (var cols = 1; cols <= n; cols++) {
      var rows = Math.ceil(n / cols);
      var size = Math.min((W - gap * (cols - 1)) / cols, (H - gap * (rows - 1)) / rows);
      if (size > best) { best = size; bestCols = cols; }
    }
    // 가로가 넓으면 직사각형으로: 높이는 칸 크기, 너비는 화면 비율에 맞춤
    var cw = Math.floor(Math.min(best * 1.25, (W - gap * (bestCols - 1)) / bestCols)), ch = Math.floor(best);
    picker.querySelectorAll('.thumb').forEach(function (b) { b.style.width = cw + 'px'; b.style.height = ch + 'px'; });
    picker.style.maxWidth = '';
  }
  function buildPicker() {
    picker.innerHTML = '';
    pictures.forEach(function (p, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'thumb'; b.setAttribute('aria-label', p.name);
      var c = document.createElement('canvas'); c.width = 500; c.height = 400;
      p.draw(c.getContext('2d'), c.width, c.height);
      b.appendChild(c);
      b.addEventListener('click', function () { startPicture(i); });
      picker.appendChild(b);
    });
    layoutPicker();
  }
  function showPicker() {
    endRun();
    stage.hidden = true; picker.hidden = false; btnMentor.hidden = false;
    layoutPicker();
  }

  // ---------- 색칠 화면 ----------
  var colorL = null, grayL = null, maskL = null, tmpL = null;   // 레이어
  var W = 0, H = 0, S = 0;       // 그림 크기(픽셀)와 짧은 변
  var cur = null;                // 지금 고른 그림
  var waves = [];                // { u, v, r(짧은 변 기준 비율), sweep, t0, dur }
  var touchCount = 0, finishing = false, complete = false;
  var runToken = 0, raf = 0, doneTimer = 0;
  var GX = 40, GY = 40, covered = null;   // 칠해질 예정인 칸(거친 격자)

  function startPicture(i) {
    cur = pictures[i];
    picker.hidden = true; btnMentor.hidden = true; stage.hidden = false;
    setupLayers();
    resetRun();
  }

  function setupLayers() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var cw = Math.max(1, Math.round(stage.clientWidth * dpr)), ch = Math.max(1, Math.round(stage.clientHeight * dpr));
    var cap = 2200000, k = Math.min(1, Math.sqrt(cap / (cw * ch)));   // 너무 크면 줄여서 부드럽게
    W = Math.max(1, Math.round(cw * k)); H = Math.max(1, Math.round(ch * k)); S = Math.min(W, H);
    canvas.width = W; canvas.height = H;
    colorL = newCanvas(W, H); cur.draw(colorL.getContext('2d'), W, H);
    grayL = makeGray(colorL);
    maskL = newCanvas(W, H); tmpL = newCanvas(W, H);
    rebuildMask(performance.now());
    rebuildCovered();
    render(performance.now());
  }

  function resetRun() {
    endRun();
    waves = []; touchCount = 0; finishing = false; complete = false;
    covered = new Uint8Array(GX * GY);
    btnDone.hidden = true;
    canvas.classList.remove('pulse');
    maskL.getContext('2d').clearRect(0, 0, W, H);
    render(performance.now());
  }
  function endRun() {
    runToken++;
    cancelAnimationFrame(raf); raf = 0;
    clearTimeout(doneTimer);
  }

  // ---- 파동 계산 ----
  function farthest(u, v) {
    var x = u * W, y = v * H;
    return Math.max(Math.hypot(x, y), Math.hypot(W - x, y), Math.hypot(x, H - y), Math.hypot(W - x, H - y));
  }
  function waveMaxR(wv) { return wv.sweep ? farthest(wv.u, wv.v) : wv.r * S; }
  function waveRadius(wv, now) {
    var p = Math.min(1, Math.max(0, (now - wv.t0) / wv.dur));
    var e = wv.sweep ? (p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2)   // 천천히 시작해 천천히 끝남
                     : 1 - Math.pow(1 - p, 2.2);                                // 바로 보이고 점점 느려짐
    return waveMaxR(wv) * e;
  }
  function waveProgress(wv, now) { return Math.min(1, Math.max(0, (now - wv.t0) / wv.dur)); }

  function markCovered(u, v, r) {
    var x = u * W, y = v * H, n = 0;
    for (var j = 0; j < GY; j++) for (var i = 0; i < GX; i++) {
      var k = j * GX + i;
      if (covered[k]) continue;
      if (Math.hypot((i + .5) / GX * W - x, (j + .5) / GY * H - y) <= r) { covered[k] = 1; n++; }
    }
    return n;
  }
  function countNew(u, v, r) {
    var x = u * W, y = v * H, n = 0;
    for (var j = 0; j < GY; j++) for (var i = 0; i < GX; i++) {
      if (covered[j * GX + i]) continue;
      if (Math.hypot((i + .5) / GX * W - x, (j + .5) / GY * H - y) <= r) n++;
    }
    return n;
  }
  function rebuildCovered() {
    covered = new Uint8Array(GX * GY);
    waves.forEach(function (wv) { markCovered(wv.u, wv.v, waveMaxR(wv)); });
  }

  // 터치 한 번 = 파동 하나. 이미 칠해진 곳이어도 파동은 나오고, 반드시 새로 칠해지는 부분이 생기도록 크기를 키운다.
  function addTouch(x, y) {
    if (finishing || complete) return;
    var now = performance.now();
    touchCount++;
    var u = x / W, v = y / H;
    var wv;
    if (touchCount >= TOUCHES_TO_COMPLETE) {
      finishing = true;
      wv = { u: u, v: v, r: 0, sweep: true, t0: now, dur: FINISH_MS };
      covered.fill(1);
    } else {
      var r = WAVE_RADIUS * S, far = farthest(u, v), total = GX * GY;
      while (r < far && countNew(u, v, r) < MIN_NEW_AREA * total) r += 0.03 * S;
      r = Math.min(r, far);
      markCovered(u, v, r);
      wv = { u: u, v: v, r: r / S, sweep: false, t0: now, dur: WAVE_MS };
    }
    waves.push(wv);
    playSound();
    kick();
  }

  // ---- 그리기 ----
  function rebuildMask(now) {
    var m = maskL.getContext('2d');
    m.clearRect(0, 0, W, H);
    if (complete) { m.fillStyle = '#000'; m.fillRect(0, 0, W, H); return; }
    waves.forEach(function (wv) { disc(m, wv.u * W, wv.v * H, waveRadius(wv, now)); });
  }
  function disc(m, x, y, r) {
    if (r <= 0) return;
    var f = Math.max(2, Math.min(r * 0.12, S * 0.03));     // 가장자리를 부드럽게
    var g = m.createRadialGradient(x, y, Math.max(0, r - f), x, y, r);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    m.fillStyle = g; m.beginPath(); m.arc(x, y, r, 0, Math.PI * 2); m.fill();
  }

  function render(now) {
    // 파동이 지나간 영역을 마스크에 쌓는다
    var m = maskL.getContext('2d');
    for (var i = 0; i < waves.length; i++) {
      var wv = waves[i];
      if (wv.done) continue;
      disc(m, wv.u * W, wv.v * H, waveRadius(wv, now));
      if (waveProgress(wv, now) >= 1) { wv.done = true; disc(m, wv.u * W, wv.v * H, waveMaxR(wv)); }
    }
    // 흑백 위에, 마스크로 오려낸 컬러를 얹는다
    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(grayL, 0, 0);
    if (waves.length || complete) {
      var t = tmpL.getContext('2d');
      t.globalCompositeOperation = 'source-over';
      t.clearRect(0, 0, W, H);
      t.drawImage(colorL, 0, 0);
      t.globalCompositeOperation = 'destination-in';
      t.drawImage(maskL, 0, 0);
      t.globalCompositeOperation = 'source-over';
      ctx.drawImage(tmpL, 0, 0);
    }
    // 번쩍임 없는 은은한 물결 고리: 천천히 옅어진다
    for (var j = 0; j < waves.length; j++) {
      var w2 = waves[j];
      var p = waveProgress(w2, now);
      if (p >= 1) continue;
      var rr = waveRadius(w2, now);
      if (rr <= 0) continue;
      var a = 0.42 * Math.pow(1 - p, 1.4);
      ctx.beginPath(); ctx.arc(w2.u * W, w2.v * H, rr, 0, Math.PI * 2);
      ctx.lineWidth = Math.max(3, S * 0.02); ctx.strokeStyle = 'rgba(255,255,255,' + (a * 0.55).toFixed(3) + ')'; ctx.stroke();
      ctx.lineWidth = Math.max(2, S * 0.006); ctx.strokeStyle = 'rgba(255,255,255,' + a.toFixed(3) + ')'; ctx.stroke();
    }
  }

  function active(now) {
    for (var i = 0; i < waves.length; i++) if (waveProgress(waves[i], now) < 1) return true;
    return false;
  }
  function frame(now) {
    raf = 0;
    render(now);
    if (active(now)) { raf = requestAnimationFrame(frame); return; }
    // 파동이 모두 끝났을 때 한 번 더 마무리로 그린다 (고리 지우기)
    render(performance.now() + 1);
    if (finishing && !complete) onComplete();
  }
  function kick() { if (!raf) raf = requestAnimationFrame(frame); }

  function onComplete() {
    complete = true;
    rebuildMask(performance.now());
    render(performance.now());
    var token = runToken;
    canvas.classList.remove('pulse');
    void canvas.offsetWidth;
    canvas.classList.add('pulse');           // 살짝 커졌다 돌아오기
    doneTimer = setTimeout(function () {
      if (token === runToken) btnDone.hidden = false;
    }, DONE_BUTTON_DELAY_MS);
  }

  canvas.addEventListener('pointerdown', function (e) {
    e.preventDefault();
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    var rc = canvas.getBoundingClientRect();
    addTouch((e.clientX - rc.left) / rc.width * W, (e.clientY - rc.top) / rc.height * H);
  });

  btnDone.addEventListener('click', showPicker);

  // ---------- 멘토 전용 버튼: 2초 길게 누르기 ----------
  function holdButton(btn, action) {
    var timer = 0;
    function cancel() { clearTimeout(timer); timer = 0; btn.classList.remove('holding'); }
    btn.addEventListener('pointerdown', function (e) {
      e.preventDefault(); e.stopPropagation();
      try { btn.setPointerCapture(e.pointerId); } catch (x) {}
      cancel();
      btn.classList.add('holding');
      timer = setTimeout(function () { cancel(); action(); }, MENTOR_HOLD_MS);
    });
    ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (t) { btn.addEventListener(t, cancel); });
    btn.addEventListener('click', function (e) { e.preventDefault(); });   // 짧게 눌러서는 아무 일도 없음
  }
  holdButton($('btnRestart'), function () { resetRun(); });
  holdButton($('btnHome'), showPicker);

  // ---------- 멘토 관리 화면: 그림 추가/삭제 (2초 길게 눌러서 열기) ----------
  var statusEl = $('panelStatus'), listEl = $('panelList'), stagedEl = $('stagedList'), stagedWrap = $('stagedWrap');
  var btnCommit = $('btnCommit'), btnRestore = $('btnRestore');
  var staged = [];                 // 고르기만 하고 아직 저장하지 않은 그림 { blob, url, draw, name }
  var pendingKey = null, pendingTimer = 0;
  function say(t) { statusEl.textContent = t || ''; }
  function cardFor(p, onDel, key) {
    var card = document.createElement('div'); card.className = 'card';
    var c = newCanvas(200, 150); p.draw(c.getContext('2d'), 200, 150); card.appendChild(c);
    var del = document.createElement('button'); del.type = 'button'; del.className = 'del'; del.textContent = '✕'; del.setAttribute('aria-label', '삭제');
    del.addEventListener('click', function () {
      if (pendingKey !== key) {                        // 첫 번째 누름: '삭제?'로 바뀌고, 한 번 더 눌러야 지워짐
        clearTimeout(pendingTimer); pendingKey = key;
        panel.querySelectorAll('.del').forEach(function (b) { b.classList.remove('sure'); b.textContent = '✕'; });
        del.classList.add('sure'); del.textContent = '삭제?';
        pendingTimer = setTimeout(function () { pendingKey = null; del.classList.remove('sure'); del.textContent = '✕'; }, 3000);
        return;
      }
      pendingKey = null; clearTimeout(pendingTimer); onDel();
    });
    card.appendChild(del); return card;
  }
  function buildPanelList() {
    // 추가 대기 중인 그림
    stagedEl.innerHTML = '';
    stagedWrap.hidden = !staged.length;
    staged.forEach(function (s) {
      stagedEl.appendChild(cardFor(s, function () { URL.revokeObjectURL(s.url); staged.splice(staged.indexOf(s), 1); say(''); buildPanelList(); }, s));
    });
    btnCommit.textContent = '추가하기 (' + staged.length + '장)';
    // 지금 있는 그림 (기본 그림 + images 폴더 + 추가한 그림)
    listEl.innerHTML = '';
    pictures.forEach(function (p) {
      listEl.appendChild(cardFor(p, function () { deletePicture(p); }, p));
    });
    btnRestore.hidden = !hidden.length;
  }
  function deletePicture(p) {
    if (pictures.length <= 1) { say('마지막 그림 한 장은 지울 수 없습니다.'); return; }
    if (p.id) {                                          // 앱에서 추가한 그림: 저장소에서 완전히 지움
      idbDo('readwrite', function (s) { return s.delete(p.id); }).then(reloadUser).then(function () { say('지웠습니다.'); }).catch(function () { say('지우지 못했습니다.'); });
    } else {                                             // 기본 그림: 숨김 (되돌릴 수 있음)
      hidden.push(p.name); saveHidden(); refreshPictures(); say('지웠습니다. (아래 버튼으로 되돌릴 수 있습니다)');
    }
  }
  function clearStaged() { staged.forEach(function (s) { URL.revokeObjectURL(s.url); }); staged = []; }
  function openPanel() { say(''); clearStaged(); panel.hidden = false; buildPanelList(); }
  function closePanel() { panel.hidden = true; clearStaged(); pendingKey = null; clearTimeout(pendingTimer); }
  holdButton(btnMentor, openPanel);
  $('btnClose').addEventListener('click', closePanel);
  $('btnAdd').addEventListener('click', function () { fileInput.value = ''; fileInput.click(); });
  btnRestore.addEventListener('click', function () { hidden = []; saveHidden(); refreshPictures(); say('지운 기본 그림을 모두 되돌렸습니다.'); });

  // 1단계: 그림 고르기 → '추가할 그림'에 올려만 둔다 (아직 저장 안 됨)
  fileInput.addEventListener('change', function () {
    var files = Array.prototype.slice.call(fileInput.files || []);
    if (!files.length) return;
    say('불러오는 중…');
    var bad = 0;
    files.reduce(function (p, f) {
      return p.then(function () {
        return shrink(f).then(function (b) {
          var url = URL.createObjectURL(b);
          return loadImage(url).then(function (im) { staged.push({ name: f.name, blob: b, url: url, draw: drawFile(im) }); });
        }).catch(function () { bad++; });
      });
    }, Promise.resolve()).then(function () {
      say((staged.length ? '아래 "추가하기"를 눌러야 저장됩니다.' : '') + (bad ? ' (' + bad + '장은 그림 파일이 아니라서 건너뜀)' : ''));
      buildPanelList();
    });
  });
  // 2단계: '추가하기'를 눌러야 진짜 저장
  btnCommit.addEventListener('click', function () {
    if (!staged.length) return;
    var list = staged.slice(), n = 0;
    say('저장하는 중…');
    list.reduce(function (p, s) {
      return p.then(function () { return idbDo('readwrite', function (st) { return st.add({ blob: s.blob, name: s.name, added: Date.now() }); }).then(function () { n++; }).catch(function () {}); });
    }, Promise.resolve()).then(function () {
      clearStaged(); return reloadUser();
    }).then(function () {
      say(n + '장 추가했습니다.');
      if (n && navigator.storage && navigator.storage.persist) { try { navigator.storage.persist(); } catch (e) {} }
    });
  });

  // ---------- 소리 (기본 꺼짐) ----------
  var actx = null;
  function playSound() {
    if (!SOUND_ON || SOUND_VOLUME <= 0) return;
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended') actx.resume();
      var t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine'; o.frequency.value = 523;               // 부드러운 사인파 한 가지 소리
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(Math.min(1, SOUND_VOLUME), t + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
      o.connect(g); g.connect(actx.destination);
      o.start(t); o.stop(t + 0.85);
    } catch (e) {}
  }

  // ---------- 화면 크기/방향이 바뀔 때 ----------
  var resizeTimer = 0;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (!stage.hidden && cur) { setupLayers(); if (active(performance.now())) kick(); }
      else layoutPicker();
    }, 120);
  });

  // ---------- 브라우저 기본 동작 막기 ----------
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.addEventListener('selectstart', function (e) { e.preventDefault(); });
  document.addEventListener('dragstart', function (e) { e.preventDefault(); });
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (t) {
    document.addEventListener(t, function (e) { e.preventDefault(); });
  });
  document.addEventListener('touchmove', function (e) {
    if (e.target.closest && e.target.closest('#panelBody')) return;   // 관리 화면의 목록은 밀어서 볼 수 있게
    e.preventDefault();
  }, { passive: false });
  document.addEventListener('touchstart', function (e) { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }

  // ---------- 시작 ----------
  pictures = SAMPLES.slice();
  buildPicker();
  loadFiles().then(function (files) { fileLoaded = files; return reloadUser(); });

  // 시험용: 테스트에서 상태를 확인할 수 있게 읽기 전용으로 노출
  window.__coloring = { state: function () { return { touchCount: touchCount, finishing: finishing, complete: complete, waves: waves.length, pictures: pictures.length, soundOn: SOUND_ON }; } };
})();
