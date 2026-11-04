'use strict';
// 그림(SVG): 토끼, 음식, 장신구, 아이콘

var INK = '#5a3a1a';

var ACC = {
  ribbon: '<path d="M118 112 L84 92 L84 134Z M118 112 L152 92 L152 134Z" fill="#ff6fa0" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/><circle cx="118" cy="112" r="11" fill="#ff9ec0" stroke="' + INK + '" stroke-width="4"/>',
  hat: '<path d="M118 118 L150 28 L182 118Z" fill="#ffd23f" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/><path d="M130 86 L170 86 M124 102 L176 102" stroke="#ff6fa0" stroke-width="7"/><circle cx="150" cy="26" r="9" fill="#ff6fa0" stroke="' + INK + '" stroke-width="4"/>',
  glasses: '<circle cx="112" cy="176" r="24" fill="rgba(190,225,255,.35)" stroke="' + INK + '" stroke-width="6"/><circle cx="188" cy="176" r="24" fill="rgba(190,225,255,.35)" stroke="' + INK + '" stroke-width="6"/><path d="M136 174 H164" stroke="' + INK + '" stroke-width="6"/>',
  scarf: '<path d="M80 262 Q150 296 220 262 L214 288 Q150 322 86 288Z" fill="#ff5a5a" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/><rect x="178" y="284" width="30" height="58" rx="9" fill="#ff5a5a" stroke="' + INK + '" stroke-width="5"/><path d="M186 304 H200 M186 320 H200" stroke="#fff" stroke-width="4"/>',
  flower: '<g fill="#ff9ec0" stroke="' + INK + '" stroke-width="3"><circle cx="196" cy="94" r="12"/><circle cx="214" cy="108" r="12"/><circle cx="207" cy="130" r="12"/><circle cx="185" cy="130" r="12"/><circle cx="178" cy="108" r="12"/></g><circle cx="196" cy="114" r="10" fill="#ffd23f" stroke="' + INK + '" stroke-width="3"/>'
};
var ACC_ICON_CLOSET = '<svg viewBox="70 80 100 70">' + ACC.ribbon + '</svg>';
var ACC_ALL = Object.keys(ACC).map(function (k) { return '<g class="acc a-' + k + '">' + ACC[k] + '</g>'; }).join('');
var SVG = {
  apple:
    '<svg viewBox="0 0 110 100"><path d="M55 30 C40 12 8 22 10 58 C12 86 38 96 55 88 C72 96 98 86 100 58 C102 22 70 12 55 30Z" fill="#ff4d4d" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/>' +
    '<path d="M55 30 C55 20 58 12 64 6" fill="none" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M62 14 C74 4 88 8 90 16 C80 22 68 20 62 14Z" fill="#4cc552" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>' +
    '<path d="M26 44 C24 54 26 62 30 68" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/></svg>',
  carrot:
    '<svg viewBox="0 0 110 100"><path d="M18 40 C10 36 8 62 20 80 L30 90 C50 96 98 40 90 24 C80 12 40 24 18 40Z" fill="#ff9a1f" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round" transform="rotate(0)"/>' +
    '<path d="M40 38 L50 46 M56 28 L66 38 M30 58 L40 66" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M86 22 C92 8 104 6 106 10 C102 16 96 18 90 22Z M86 24 C98 22 106 30 104 36 C96 36 90 30 86 24Z M80 18 C80 6 88 0 94 0 C94 8 90 14 84 18Z" fill="#4cc552" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/></svg>',
  ball:
    '<svg viewBox="0 0 110 100"><circle cx="55" cy="50" r="38" fill="#4da6ff" stroke="' + INK + '" stroke-width="5"/>' +
    '<path d="M20 40 Q55 62 90 40 M24 66 Q55 44 86 66" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/>' +
    '<circle cx="55" cy="50" r="7" fill="#ffd23f" stroke="' + INK + '" stroke-width="3"/></svg>',
  bush:
    '<svg viewBox="0 0 110 100"><g fill="#4cc552" stroke="' + INK + '" stroke-width="5"><circle cx="30" cy="62" r="24"/><circle cx="80" cy="62" r="24"/><circle cx="55" cy="42" r="30"/></g>' +
    '<circle cx="40" cy="38" r="5" fill="#ff7aa8"/><circle cx="68" cy="52" r="5" fill="#ffd23f"/><circle cx="30" cy="68" r="5" fill="#fff"/></svg>',
  bushBig:
    '<svg viewBox="0 0 300 380" preserveAspectRatio="none"><g fill="#4cc552" stroke="' + INK + '" stroke-width="6"><circle cx="70" cy="290" r="62"/><circle cx="230" cy="290" r="62"/><circle cx="90" cy="180" r="80"/><circle cx="210" cy="180" r="80"/><circle cx="150" cy="110" r="90"/><circle cx="150" cy="260" r="100"/></g>' +
    '<circle cx="150" cy="200" r="120" fill="#4cc552"/>' +
    '<circle cx="90" cy="110" r="9" fill="#ff7aa8"/><circle cx="200" cy="150" r="9" fill="#ffd23f"/><circle cx="120" cy="250" r="9" fill="#fff"/><circle cx="210" cy="290" r="9" fill="#ff7aa8"/></svg>',
  heart:
    '<svg class="heart" viewBox="0 0 100 100"><path d="M50 88 C10 58 6 30 24 18 C38 10 48 20 50 28 C52 20 62 10 76 18 C94 30 90 58 50 88Z"/></svg>',
  smallHeart:
    '<svg viewBox="0 0 100 100"><path d="M50 88 C10 58 6 30 24 18 C38 10 48 20 50 28 C52 20 62 10 76 18 C94 30 90 58 50 88Z" fill="#ff5a6e" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/></svg>',
  hungry:
    '<svg viewBox="0 0 100 100"><circle cx="50" cy="40" r="28" fill="#ffe0b8" stroke="' + INK + '" stroke-width="5"/>' +
    '<circle cx="40" cy="36" r="3.5" fill="' + INK + '"/><circle cx="60" cy="36" r="3.5" fill="' + INK + '"/>' +
    '<path d="M42 52 Q50 46 58 52" fill="none" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>' +
    '<ellipse cx="50" cy="84" rx="26" ry="14" fill="#8ecbff" stroke="' + INK + '" stroke-width="5"/>' +
    '<circle cx="50" cy="82" r="10" fill="#ffe0b8" stroke="' + INK + '" stroke-width="4"/>' +
    '<path d="M30 76 Q50 70 70 76" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linecap="round" opacity=".0"/></svg>',
  yummy:
    '<svg viewBox="0 0 100 100"><circle cx="42" cy="40" r="28" fill="#ffe0b8" stroke="' + INK + '" stroke-width="5"/>' +
    '<path d="M30 36 Q35 30 40 36 M46 36 Q51 30 56 36" fill="none" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M30 48 Q42 62 54 48Z" fill="#ff7a7a" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>' +
    '<rect x="64" y="60" width="26" height="30" rx="8" fill="#ffe0b8" stroke="' + INK + '" stroke-width="5"/>' +
    '<rect x="70" y="30" width="13" height="36" rx="6.5" fill="#ffe0b8" stroke="' + INK + '" stroke-width="5"/></svg>',
  full:
    '<svg viewBox="0 0 100 100"><circle cx="50" cy="32" r="24" fill="#ffe0b8" stroke="' + INK + '" stroke-width="5"/>' +
    '<path d="M36 28 Q41 22 46 28 M54 28 Q59 22 64 28" fill="none" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M42 40 Q50 48 58 40" fill="none" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>' +
    '<ellipse cx="50" cy="74" rx="32" ry="24" fill="#8ecbff" stroke="' + INK + '" stroke-width="5"/>' +
    '<circle cx="50" cy="76" r="9" fill="#ffe0b8" stroke="' + INK + '" stroke-width="4"/>' +
    '<path d="M30 70 Q50 56 70 70" fill="none" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/></svg>',
  seek:
    '<svg viewBox="0 0 100 100"><circle cx="42" cy="42" r="26" fill="#cfeaff" stroke="' + INK + '" stroke-width="6"/>' +
    '<path d="M62 62 L88 88" stroke="' + INK + '" stroke-width="10" stroke-linecap="round"/>' +
    '<text x="42" y="54" font-size="38" font-weight="bold" text-anchor="middle" fill="' + INK + '">?</text></svg>',
  gift:
    '<svg viewBox="0 0 100 100"><rect x="14" y="40" width="72" height="48" rx="6" fill="#ff7a7a" stroke="' + INK + '" stroke-width="5"/><rect x="10" y="28" width="80" height="18" rx="5" fill="#ff9a9a" stroke="' + INK + '" stroke-width="5"/><path d="M50 28 V88" stroke="#ffd23f" stroke-width="9"/><path d="M50 28 C30 6 18 22 34 28Z M50 28 C70 6 82 22 66 28Z" fill="#ffd23f" stroke="' + INK + '" stroke-width="4"/></svg>',
  moon:
    '<svg viewBox="0 0 100 100"><path d="M62 14 A38 38 0 1 0 86 64 A30 30 0 0 1 62 14Z" fill="#ffd23f" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/></svg>',
  sun:
    '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="20" fill="#ffd23f" stroke="' + INK + '" stroke-width="6"/><path d="M50 8V22 M50 78V92 M8 50H22 M78 50H92 M20 20L30 30 M70 70L80 80 M80 20L70 30 M30 70L20 80" stroke="' + INK + '" stroke-width="6" stroke-linecap="round"/></svg>',
  scene:
    '<svg viewBox="0 0 100 100"><rect x="8" y="14" width="84" height="72" rx="10" fill="#bfe8ff" stroke="' + INK + '" stroke-width="6"/><path d="M8 66 Q30 48 50 64 Q70 48 92 66 V76 Q92 86 82 86 H18 Q8 86 8 76Z" fill="#7fd96a" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/><circle cx="72" cy="36" r="9" fill="#ffd23f" stroke="' + INK + '" stroke-width="4"/></svg>',
  sleepy:
    '<svg viewBox="0 0 100 100"><circle cx="45" cy="55" r="28" fill="#ffe0b8" stroke="' + INK + '" stroke-width="5"/>' +
    '<path d="M32 52 Q38 58 44 52 M48 52 Q54 58 60 52" fill="none" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>' +
    '<ellipse cx="46" cy="70" rx="6" ry="4" fill="' + INK + '"/>' +
    '<path d="M70 14 H88 L70 34 H88" fill="none" stroke="#2f7bff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  speaker:
    function (on) {
      return '<svg viewBox="0 0 48 48"><path d="M6 18 H14 L26 8 V40 L14 30 H6Z" fill="' + INK + '"/>' +
        (on
          ? '<path d="M32 16 Q40 24 32 32 M37 10 Q50 24 37 38" fill="none" stroke="' + INK + '" stroke-width="3.5" stroke-linecap="round"/>'
          : '<path d="M32 17 L44 31 M44 17 L32 31" fill="none" stroke="#e03030" stroke-width="4" stroke-linecap="round"/>') +
        '</svg>';
    },
  rabbit:
    '<svg class="rb" data-state="idle" viewBox="0 0 300 380">' +
    '<ellipse cx="150" cy="300" rx="100" ry="72" class="fur" fill="#fff" stroke="' + INK + '" stroke-width="6"/>' +
    '<ellipse cx="150" cy="310" rx="52" ry="48" fill="#ffe6ee"/>' +
    '<ellipse cx="85" cy="364" rx="34" ry="14" class="fur" fill="#fff" stroke="' + INK + '" stroke-width="6"/>' +
    '<ellipse cx="215" cy="364" rx="34" ry="14" class="fur" fill="#fff" stroke="' + INK + '" stroke-width="6"/>' +
    '<g class="ear-l"><ellipse cx="105" cy="62" rx="32" ry="68" class="fur" fill="#fff" stroke="' + INK + '" stroke-width="6"/><ellipse cx="105" cy="68" rx="15" ry="46" fill="#ffc2d4"/></g>' +
    '<g class="ear-r"><ellipse cx="195" cy="62" rx="32" ry="68" class="fur" fill="#fff" stroke="' + INK + '" stroke-width="6"/><ellipse cx="195" cy="68" rx="15" ry="46" fill="#ffc2d4"/></g>' +
    '<ellipse cx="150" cy="188" rx="98" ry="86" class="fur" fill="#fff" stroke="' + INK + '" stroke-width="6"/>' +
    '<ellipse cx="88" cy="214" rx="20" ry="13" fill="#ffc2d4" opacity=".8"/>' +
    '<ellipse cx="212" cy="214" rx="20" ry="13" fill="#ffc2d4" opacity=".8"/>' +
    '<g class="eyes-open"><circle cx="112" cy="176" r="12" fill="' + INK + '"/><circle cx="188" cy="176" r="12" fill="' + INK + '"/>' +
    '<circle cx="116" cy="171" r="4" fill="#fff"/><circle cx="192" cy="171" r="4" fill="#fff"/></g>' +
    '<g class="eyes-happy"><path d="M96 180 Q112 160 128 180 M172 180 Q188 160 204 180" fill="none" stroke="' + INK + '" stroke-width="7" stroke-linecap="round"/></g>' +
    '<g class="eyes-sleep"><path d="M96 176 Q112 192 128 176 M172 176 Q188 192 204 176" fill="none" stroke="' + INK + '" stroke-width="7" stroke-linecap="round"/>' +
    '<path d="M100 188 L94 194 M124 188 L130 194 M176 188 L170 194 M200 188 L206 194" stroke="' + INK + '" stroke-width="3" stroke-linecap="round" opacity=".5"/></g>' +
    '<g class="eyes-yawn"><path d="M96 178 Q112 192 128 178 M172 178 Q188 192 204 178" fill="none" stroke="' + INK + '" stroke-width="7" stroke-linecap="round"/></g>' +
  '<g class="eyes-achoo"><path d="M98 166 L126 178 L98 190 M202 166 L174 178 L202 190" fill="none" stroke="' + INK + '" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></g>' +
  '<circle class="nose" cx="150" cy="212" r="26" fill="transparent"/>' +
    '<path class="nose-vis" d="M140 208 Q150 200 160 208 Q150 220 140 208Z" fill="#ff7a9a" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>' +
    '<g class="mouth m-idle"><path d="M150 218 Q150 232 134 232 M150 218 Q150 232 166 232" fill="none" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/></g>' +
    '<g class="mouth m-open"><ellipse cx="150" cy="238" rx="26" ry="24" fill="#8a2a3a" stroke="' + INK + '" stroke-width="5"/><ellipse cx="150" cy="250" rx="14" ry="9" fill="#ff7a8a"/></g>' +
    '<g class="mouth m-chew"><ellipse cx="150" cy="238" rx="22" ry="20" fill="#8a2a3a" stroke="' + INK + '" stroke-width="5"/></g>' +
    '<g class="mouth m-happy"><path d="M120 224 Q150 262 180 224Z" fill="#8a2a3a" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/><path d="M134 242 Q150 254 166 242 Q150 236 134 242Z" fill="#ff7a8a"/></g>' +
    '<g class="mouth m-yawn"><ellipse cx="150" cy="244" rx="17" ry="20" fill="#8a2a3a" stroke="' + INK + '" stroke-width="5"/><ellipse cx="150" cy="256" rx="10" ry="6" fill="#ff7a8a"/></g>' +
    ACC_ALL +
    '<g class="mouth m-sleep"><ellipse cx="150" cy="236" rx="9" ry="7" fill="#8a2a3a" stroke="' + INK + '" stroke-width="4"/></g>' +
    '<g class="zzz"><text x="232" y="110" font-size="40" font-weight="bold" fill="#2f7bff" stroke="' + INK + '" stroke-width="1.5">Z</text>' +
    '<text x="262" y="72" font-size="30" font-weight="bold" fill="#2f7bff" stroke="' + INK + '" stroke-width="1.5">z</text></g>' +
    '</svg>'
};
