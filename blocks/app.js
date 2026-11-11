// 색 블록 터치: 어느 블록을 눌러도 그 블록이 바로 반응한다.
// 순서, 정답, 틀림, 점수, 시간 제한, 라운드가 없다.
(function () {
  'use strict';

  // [색, 이름(화면에 안 보임), 이모지]  앞의 9개는 기존 색, 뒤의 3개가 새로 늘린 색
  var COLORS = [
    ['#E53935', '빨강', '🍎'], ['#FB8C00', '주황', '🍊'], ['#FDD835', '노랑', '🍌'],
    ['#43A047', '초록', '🐸'], ['#4FC3F7', '하늘', '☁️'], ['#1E88E5', '파랑', '🐳'],
    ['#8E24AA', '보라', '🍇'], ['#EC407A', '분홍', '🌸'], ['#8D6E63', '갈색', '🐻'],
    ['#9CCC65', '연두', '🥝'], ['#00ACC1', '청록', '🐢'], ['#3949AB', '남색', '🌙']
  ];
  var LIT_MS = 400; // 빛이 켜져 있는 시간 (원본과 같음). 길게 하려면 키우세요

  var board = document.getElementById('board');

  COLORS.forEach(function (c) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'cell';
    b.style.setProperty('--c', c[0]);
    b.setAttribute('aria-label', c[1]);
    b.innerHTML = '<i class="veil"></i><span class="emoji" aria-hidden="true">' + c[2] + '</span>';
    var timer = 0;
    b.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      // 원본처럼 'lit' 상태를 잠깐 켰다 끈다. 연타하면 켜진 시간만 이어서 늘어난다.
      b.classList.add('lit');
      clearTimeout(timer);
      timer = setTimeout(function () { b.classList.remove('lit'); }, LIT_MS);
    });
    board.appendChild(b);
  });

  // 브라우저 기본 동작 막기 (확대/축소, 길게 눌러 나오는 메뉴, 스크롤 튕김)
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.addEventListener('selectstart', function (e) { e.preventDefault(); });
  document.addEventListener('dragstart', function (e) { e.preventDefault(); });
  ['gesturestart', 'gesturechange', 'gestureend'].forEach(function (t) {
    document.addEventListener(t, function (e) { e.preventDefault(); });
  });
  document.addEventListener('touchmove', function (e) { e.preventDefault(); }, { passive: false });
  document.addEventListener('touchstart', function (e) { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
