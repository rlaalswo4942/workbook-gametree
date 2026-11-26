"use strict";
// 워크북 게임트리 — 연관검색어처럼 골라 가며, 무대에서 직접 실험하고 내 웹 게임을 만드는 미션 웹앱.
// 화면 틀·저장·동기화·검색은 스터디_프레임 엔진(css/style.css, js/store.js, js/search.js)을 그대로 쓴다.
// 과정(따라 하기·과제·제출 체크리스트)은 각자 PC의 워크북 원문 파일을 그대로 읽어 보여 준다 — 평가 기준과 어긋나지 않게, 공개 사이트에 강의 자료를 싣지 않게.
// 각자 본인 Gemini 키(무료)를 넣어 쓴다. API 키와 워크북 원문은 이 기기에만 두고 동기화하지 않는다.

// ================= 미션 = 워크북 3~8장 =================
const CH_TITLE = { 3: "Canvas 게임화면 그리기", 4: "게임루프 움직이게 하기", 5: "입력처리 조작하기", 6: "충돌 점수 승패", 7: "디버깅과 코드읽기", 8: "게임답게 만들기", 9: "플레이테스트와 개선" };
// [이름, 워크북 장, 이 미션에서 할 일, '더 깊게'로 볼 개념 섹션(null이면 조작 방식에 따라)]
const STEPS = [
  ["화면", 3, "Canvas로 내 게임의 첫 화면 그리기 (아직 안 움직여도 됨)", [["2.2", "Canvas — 도화지 한 장"], ["2.3", "좌표계 — 이번 주에서 가장 중요한 것"]]],
  ["움직임", 4, "게임 루프로 내 게임의 무언가가 스스로 움직이게 하기", [["2.4", "속도 = 한 프레임에 더하는 값"], ["2.5", "게임 루프 — 심장"]]],
  ["조작", 5, "키보드나 마우스로 플레이어 조작하기 (방식 B)", null],
  ["규칙", 6, "충돌·점수·게임 오버로 처음부터 끝까지 플레이 가능한 최소 버전", [["2.5", "충돌 판정 — 부딪혔는지 계산으로 알아낸다"], ["2.7", "점수와 게임 오버 조건"]]],
  ["디버깅", 7, "에러·조용한 버그를 찾고 디버그 표시(showDebug) 붙이기", [["2.5", "조용한 버그 — 에러가 없는데 이상할 때"], ["2.8", "다섯 단계 디버깅 절차"]]],
  ["게임답게", 8, "시작 화면·효과음·난이도 상승·최고 점수 중 두 가지 이상", [["2.3", "화면 전환 — 상태를 하나 더 늘린다"], ["2.4", "난이도 곡선 — 점점 조여 온다"]]],
];
const INPUT_SECTIONS = {
  key: [["2.4", "두 가지 조작 방식 — 이번 주의 핵심"], ["2.5", "화면 밖으로 나가지 않게 막기"]],
  mouse: [["2.4", "두 가지 조작 방식 — 이번 주의 핵심"], ["2.6", "마우스 입력"]],
};
const sectionsFor = (k, inp) => STEPS[k - 1][3] || INPUT_SECTIONS[inp] || INPUT_SECTIONS.key;

// 워크북이 선택지를 정해 둔 미션은 그 선택지만 쓴다 (5장 Step 6 조작 방식, 6장 Step 3 점수 방식, 8장 과제 1 '네 가지 중 두 가지 이상')
const FIXED_NEXT = {
  3: ["방향키 네 방향", "좌우만 움직이기", "마우스 x 따라가기", "클릭으로 무언가 하기", "스페이스바 점프"],
  4: ["시간형 점수 (버틴 시간)", "닿으면 오르는 점수 (아이템)"],
  6: ["시작 화면 + 최고 점수 저장", "효과음 + 난이도 상승", "시작 화면 + 효과음", "난이도 상승 + 최고 점수 저장", "네 가지 모두"],
};
const controlOf = (choice) => (/좌우/.test(choice) ? "lr" : /마우스/.test(choice) ? "mousex" : /클릭/.test(choice) ? "click" : /점프/.test(choice) ? "jump" : "4way");
const scoreModeOf = (choice) => (/아이템|닿으면/.test(choice) ? "item" : "time");
const featuresOf = (choice) => { const all = /네 가지/.test(choice || ""); return { start: all || /시작 화면/.test(choice), sound: all || /효과음/.test(choice), diff: all || /난이도/.test(choice), best: all || /최고 점수/.test(choice) }; };

// 단계마다 무대에서 해 보는 실험 — 워크북 따라 하기의 실험을 그대로 옮김. auto = 해 보면 저절로 체크
const LABS = {
  1: { name: "좌표 실험실", ref: "3장 Step 2·5", tip: "'좌표 연습'을 켜기 전에 네 사각형이 어디에 나올지 먼저 예상해요. 물체를 끌면 fillRect의 x, y 숫자가 바뀌는 게 보여요. (Step 5는 VS Code에서 손으로 숫자를 고쳐요)",
    auto: [["coords", "좌표 연습: 네 사각형 위치를 예상하고 확인했다"], ["grid", "격자로 마우스 좌표를 읽어 봤다"], ["drag", "물체를 끌어 x, y 숫자가 바뀌는 것을 봤다"]] },
  2: { name: "게임 루프 실험실", ref: "4장 Step 1·3", tip: "연습용 공으로 실험 1~5를 하나씩 해 보고, 확인한 뒤 되돌려요. 속도 튜닝(Step 5)은 '내 게임'에서 숫자만 바꿔요.",
    auto: [["e1", "실험 1: 지우기(clearRect)를 빼 봤다"], ["e2", "실험 2: 다음 프레임 예약을 빼 봤다"], ["e3", "실험 3: 시동 줄(gameLoop();)을 빼 봤다"], ["e4", "실험 4: speedX를 1·20·-3·0으로 바꿔 봤다"], ["e5", "실험 5: speedY를 넣어 대각선으로 움직여 봤다"]] },
  3: { name: "조작 실험실", ref: "5장 Step 2·3·5", tip: "'직접 해 보기'를 켜고 방식 A와 방식 B로 각각 꾹 눌러 보고, 오른쪽+위를 같이 눌러 봐요. 방향 뒤집기와 이동 속도도 바꿔 봐요.",
    auto: [["aHold", "방식 A: 꾹 눌러 한 칸 가고 멈칫하는 것을 봤다"], ["bHold", "방식 B: 꾹 눌러 매끄럽게 움직이는 것을 봤다"], ["bDiag", "방식 B: 오른쪽+위를 같이 눌러 대각선으로 갔다"], ["flip", "Step 5: 방향 뒤집기(− ↔ +)를 해 봤다"]] },
  4: { name: "충돌·점수 실험실", ref: "6장 Step 2·4·6", tip: "판정 영역(showHitbox)을 켜고 한 판을 GAME OVER까지 해 봐요. R 키로 다시 시작하고, 숫자를 바꿔 10~30초 버티는 수준을 찾아요.",
    auto: [["hitbox", "showHitbox로 판정 영역(빨간 테두리)을 켜 봤다"], ["gameover", "한 판을 GAME OVER까지 해 봤다"], ["restart", "R 키로 다시 시작해 봤다"], ["tuned", "10~30초를 버틴 판이 있다"]] },
  5: { name: "디버깅 실험실", ref: "7장 Step 2·3", tip: "D 키로 디버그 표시(x, y·개수·gameState·점수)를 봐요. '숨은 버그 3개 심기'를 켜고, AI에게 묻지 말고 찾은 것을 적은 다음 '확인'을 눌러요.",
    auto: [["debug", "D 키로 디버그 표시를 켜 상태를 봤다"], ["hunt", "숨은 버그를 찾아 적고 확인했다"]] },
  6: { name: "게임답게 실험실", ref: "8장 Step 1~4", tip: "고른 기능을 켜고 시작 → 플레이 → 게임 오버 → 재시작을 한 판 해 봐요.",
    auto: [["start", "시작 화면에서 아무 키나 눌러 시작해 봤다"], ["sound", "효과음과 M 키 음소거를 해 봤다"], ["diff", "난이도 상승을 켜고 20초 넘게 해 봤다"], ["best", "최고 점수를 세워 봤다 (새로고침해도 남음)"]] },
};
const labAutos = (n, features) => LABS[n.k].auto.filter(([key]) => n.k !== 6 || !features || features[key]);

// 7장 Step 2 '숨은 버그 찾기' — 에러 1개, 조용한 버그 2개 (워크북 조건 그대로)
const BUGS = [
  { id: "ref", kind: "에러", desc: "키 입력 처리에서 변수 이름 오타(playerr) — 콘솔에 ReferenceError가 나고 플레이어가 안 움직인다", console: "Uncaught ReferenceError: playerr is not defined  (script.js:42)" },
  { id: "hitbox", kind: "조용한 버그", desc: "충돌 판정 기준점을 가운데로 잘못 잡아, 판정 영역이 그림보다 오른쪽 아래로 반 칸 밀렸다 (안 닿았는데 GAME OVER)" },
  { id: "concat", kind: "조용한 버그", desc: "점수에 숫자 대신 글자 \"1\"을 더해 0 → \"01\" → \"011\"처럼 이어붙는다 (에러도 NaN도 없이 틀림)" },
];

// 이해 확인 — 워크북 본문에 적힌 내용 그대로 (AI가 만들지 않음)
const QUIZ = {
  1: { q: "fillRect(x, y, 가로, 세로)에서 흰 사각형의 y를 300에서 100으로 바꾸면?", options: ["위로 올라간다", "아래로 내려간다", "오른쪽으로 간다"], answer: 0, why: "Canvas는 왼쪽 위가 (0, 0)이고 y가 커질수록 아래예요. (3장 Step 2)" },
  2: { q: "gameLoop 안의 ctx.clearRect(...) 줄 앞에 // 를 붙이면?", options: ["공이 지나간 자리가 다 남아서 긴 막대가 그려진다", "공이 처음 위치에 멈춘다", "화면이 완전히 비어 있다"], answer: 0, why: "애니메이션은 매 프레임 지우고 새로 그린 결과물이라는 증거예요. (4장 Step 3 실험 1)" },
  3: { q: "방식 A(keydown 안에서 직접 위치를 바꾸는 방식)로 키를 꾹 누르면?", options: ["한 칸 움직이고 잠깐 멈췄다가 다다다다 움직인다", "매끄럽게 계속 움직인다", "전혀 움직이지 않는다"], answer: 0, why: "키보드 자동 반복이 운영체제 설정에 따라 작동하기 때문이에요. 이 수업에서는 방식 B를 써요. (5장 2.4)" },
  4: { q: "버틴 시간을 점수로 만들 때 프레임 수를 세면 안 되는 이유는?", options: ["120Hz 기기에서 점수가 두 배가 된다", "점수가 음수가 된다", "충돌 판정이 꺼진다"], answer: 0, why: "Date.now()로 시작 시각을 기록해 흐른 시간(초)을 점수로 써요. (6장 Step 3)" },
  5: { q: "score = score + \"1\" 로 바꾸면 점수는 어떻게 보일까?", options: ["\"01\", \"011\"처럼 글자가 이어붙는다", "NaN이 뜬다", "ReferenceError가 난다"], answer: 0, why: "+는 글자 이어붙이기로 동작해서 에러도 NaN도 없이 조용히 틀려요. (7장 Step 1 실험 4)" },
  6: { q: "localStorage에서 불러온 최고 점수를 Number()로 바꾸지 않으면?", options: ["\"9\" > \"100\"처럼 글자 비교가 되어 잘못 갱신된다", "새로고침하면 사라진다", "소리가 안 난다"], answer: 0, why: "그래서 불러올 때 Number()로 숫자로 바꾸고, 일부러 낮은 점수로 죽어 보는 테스트를 해요. (8장 Step 4)" },
};

const TUTOR = `너는 '바이브코딩 워크북' 수업의 조교다. 학생은 프로그래밍을 처음 배우는 대학생이고, VS Code의 자기 AI 에이전트로 my-game 폴더(index.html, style.css, script.js)에 800×600 canvas(id "game") 웹 게임을 만든다.
워크북 방식을 따른다: 조작은 keys 객체에 눌린 키를 기록하고 게임 루프에서 움직이는 방식 B, 시간 점수는 Date.now(), 판정 영역 표시는 showHitbox, 디버그 표시는 showDebug와 D 키, 상태는 gameState("start"/"playing"/"gameover"), 재시작은 resetGame과 R 키, 최고 점수는 localStorage와 Number().
규칙:
- 완성 코드를 통째로 주지 않는다. 방향, 확인 방법, 워크북 절차로 안내한다. 코드가 꼭 필요하면 10줄 이하 조각만.
- 막혔을 때는 워크북 7장의 다섯 단계(멈춘다 → 본다 → 좁힌다 → 설명한다 → 고친다)로 안내한다.
- 이번 장보다 뒤의 장 내용을 미리 넣지 않는다.
- 회고 작성은 거절한다. 회고는 학생이 직접 써야 한다(AI가 쓰면 0점).
- 한국어로 짧고 쉽게 답한다.`;

// ================= 기본 제공 형식 (피하기: 6개 미션 예시) =================
const SCENE_W = 800, SCENE_H = 600; // 워크북 3장 Step 1: 800×600 canvas
const P_PLAYER = { id: "player", role: "player", shape: "rect", x: 384, y: 504, w: 32, h: 32, color: "#3b82f6" };
const P_GROUND = { id: "ground", role: "wall", shape: "rect", x: 0, y: 540, w: 800, h: 60, color: "#4b5563" };
const SKY = { id: "sky", role: "deco", shape: "rect", x: 0, y: 0, w: 800, h: 540, color: "#7dd3fc" };
const rock = (id, x, y, vy, motion = "fall") => ({ id, role: "enemy", shape: "circle", x, y, r: 20, color: "#ef4444", motion, vy });
const ROCKS = [rock("rock", 400, 80, 3), rock("rock2", 140, 0, 4), rock("rock3", 640, 0, 3.5), rock("rock4", 280, 0, 4.5)];
const LABEL = { id: "label", role: "deco", shape: "text", x: 16, y: 16, text: "피해서 버텨라", size: 24, color: "#ffffff" };
const DODGE = [
  ["하늘에서 떨어지는 돌", "파란 하늘 아래 길 위의 플레이어와 위쪽의 빨간 돌을 그린다.", [SKY, P_GROUND, P_PLAYER, rock("rock", 400, 80, 0, "none"), rock("rock2", 140, 120, 0, "none"), rock("rock3", 640, 60, 0, "none"), LABEL]],
  ["빨간 돌이 아래로 떨어진다", "빨간 돌들이 아래로 떨어지고, 사라지면 위에서 다시 나타난다.", [SKY, P_GROUND, P_PLAYER, ROCKS[0], ROCKS[1], ROCKS[2], LABEL]],
  ["좌우만 움직이기", "←→ 방향키로 플레이어를 좌우로 움직인다 (방식 B).", [SKY, P_GROUND, P_PLAYER, ROCKS[0], ROCKS[1], ROCKS[2], LABEL]],
  ["시간형 점수 (버틴 시간)", "돌에 닿으면 GAME OVER, 버틴 시간이 점수, R 키로 다시 시작한다.", [SKY, P_GROUND, P_PLAYER, ...ROCKS]],
  ["판정 영역이 그림보다 크다", "디버그 표시를 붙이고, 스치기만 해도 죽는 느낌의 원인을 좁힌다.", [SKY, P_GROUND, P_PLAYER, ...ROCKS]],
  ["난이도 상승 + 최고 점수 저장", "10초마다 조금씩 어려워지고(상한 있음), 최고 점수가 남는다.", [SKY, P_GROUND, P_PLAYER, ...ROCKS]],
];
const PRESET_GENRES = [
  { name: "피하기", desc: "떨어지는 것을 좌우로 피하기", lvl: "★☆☆", ctl: "키보드", inp: "key", intro: "위에서 떨어지는 것을 좌우로 움직여 피한다. 오래 버틸수록 점수가 오른다. 6개 미션이 미리 다 만들어진 예시다.", next: [DODGE[0][0]] },
  { name: "받아먹기", desc: "떨어지는 것을 바구니로 받기", lvl: "★☆☆", ctl: "키보드 또는 마우스", inp: "key", intro: "떨어지는 과일을 바구니로 받는다. 놓치면 목숨이 줄어든다.", next: ["바구니와 떨어지는 과일", "접시로 받는 케이크", "그물로 받는 별똥별"] },
  { name: "두더지 잡기", desc: "나타나는 것을 빨리 클릭하기", lvl: "★★☆", ctl: "마우스", inp: "mouse", intro: "여기저기 나타나는 두더지를 사라지기 전에 클릭한다. 제한 시간 안에 많이 잡을수록 점수가 높다.", next: ["3×3 구멍 격자", "잔디밭에 흩어진 구멍", "창문에서 튀어나오는 유령"] },
  { name: "숫자 퍼즐", desc: "드래그로 묶어 합 10 만들기 (사과게임형)", lvl: "★★★", ctl: "마우스 드래그", inp: "mouse", intro: "숫자가 적힌 사과를 드래그로 묶어 합이 10이 되면 없앤다. 제한 시간 안에 많이 없앨수록 점수가 높다.", next: ["10×6 숫자 사과 격자", "숫자 블록 탑", "숫자 카드 뒤집기 판"] },
];

// ================= 순수 함수 (node에서도 검사한다) =================
const oneLine = (s) => String(s ?? "").replace(/\s*\n\s*/g, " ").trim();
const arr = (v) => (Array.isArray(v) ? v : v ? [v] : []).map(oneLine).filter(Boolean);
const cleanName = (s) => oneLine(s).replace(/[\\/:*?"<>|#^[\]›]/g, "").replace(/\s+/g, " ").slice(0, 30);
const nodeId = (genre, k, choice) => `${genre}›${k}›${choice}`;
const hash = (s) => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.codePointAt(0), 16777619); return h >>> 0; };
const nextList = (n) => (n.k < 6 ? FIXED_NEXT[n.k + 1] || n.next || [] : []);

// Gemini 모델 시도 순서: 정확한 큰 모델 먼저(속도보다 정확도). 음성·이미지·임베딩 모델은 뺀다.
// 목록은 바뀔 수 있어 순서만 정하고, 되는지는 호출해서 확인한다.
// (Groq는 학교 네트워크에서 가입이 signup_blocked로 막히고 Grok은 유료라 2026-11-26 뺐다.)
const MODEL_PREF = [/^gemini-[\d.]+-pro$/, /^gemini-[\d.]+-flash$/, /^gemini-[\d.]+-pro/, /^gemini-[\d.]+-flash(?!-lite)/, /^gemini-.*flash-lite/];
function rankModels(models) {
  const ok = models.filter((m) => /^gemini/.test(m) && !/embed|tts|image|audio|live|aqa|robotics|computer-use/.test(m));
  const score = (m) => { const i = MODEL_PREF.findIndex((re) => re.test(m)); return i < 0 ? MODEL_PREF.length : i; };
  return ok.sort((a, b) => score(a) - score(b) || b.localeCompare(a)); // 같은 순위면 최신 버전 먼저
}

const parseJson = (t) => JSON.parse(String(t).replace(/^\s*```(?:json)?\s*/i, "").replace(/\s*```\s*$/, ""));

function normGenre(d) {
  const next = arr(d && d.next).map(cleanName).filter(Boolean).slice(0, 3);
  if (next.length < 2) throw new Error("AI 응답 형식이 맞지 않아요. 다시 시도하세요.");
  return { desc: oneLine(d.desc), lvl: oneLine(d.lvl) || "★★☆", ctl: oneLine(d.ctl), inp: d.inp === "mouse" ? "mouse" : "key", intro: oneLine(d.intro), next };
}

function normStep(d, k) {
  if (!d || !d.goal) throw new Error("AI 응답 형식이 맞지 않아요. 다시 시도하세요.");
  const needNext = k < 6 && !FIXED_NEXT[k + 1];
  const s = { goal: oneLine(d.goal), next: needNext ? arr(d.next).map(cleanName).filter(Boolean).slice(0, 3) : [] };
  if (needNext && s.next.length < 2) throw new Error("다음 미션 선택지가 비어 있어요. 다시 시도하세요.");
  return s;
}

const normSuggest = (d) => [...new Set(arr(d && d.s).map(cleanName).filter(Boolean))].slice(0, 5);

// ---- 무대 장면: AI는 장면 JSON만 만든다. 그리기·조작·충돌은 이 코드가 한다 (AI 코드는 실행하지 않음) ----
const SHAPES = ["rect", "circle", "text"];
const MOTIONS = ["none", "move", "bounce", "fall", "blink", "follow", "sway"];
const ROLES = ["player", "enemy", "item", "wall", "deco"];
const cleanId = (s) => String(s || "").replace(/[^\w가-힣-]/g, "").slice(0, 20);
const looksPlayer = (o) => /^(player|hero|me)$|player|basket|paddle|ship|cursor|plate|net/i.test(o.id);

function normScene(d) {
  if (!d || !Array.isArray(d.objects) || !d.objects.length) return null;
  const num = (v, lo, hi, def) => { v = Number(v); return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : def; };
  const color = (c, def) => (/^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\))$/i.test(String(c).trim()) ? String(c).trim() : def);
  const seen = new Set();
  let hasPlayer = false;
  const objects = d.objects.filter((o) => o && typeof o === "object").slice(0, 40).map((o, i) => {
    let id = cleanId(o.id) || `o${i}`;
    while (seen.has(id)) id += "_";
    seen.add(id);
    const shape = SHAPES.includes(o.shape) ? o.shape : "rect", motion = MOTIONS.includes(o.motion) ? o.motion : "none";
    let role = ROLES.includes(o.role) ? o.role : shape === "text" ? "deco" : looksPlayer({ id }) || motion === "sway" ? "player" : ["fall", "move", "bounce", "follow"].includes(motion) ? "enemy" : "deco";
    if (role === "player") { if (hasPlayer || shape === "text") role = "deco"; else hasPlayer = true; }
    return {
      id, role, shape,
      x: num(o.x, -80, SCENE_W, SCENE_W / 2), y: num(o.y, -80, SCENE_H, SCENE_H / 2),
      w: num(o.w, 2, SCENE_W, 40), h: num(o.h, 2, SCENE_H, 40), r: num(o.r, 2, 300, 20),
      color: color(o.color, "#e0e0e0"), text: String(o.text || "").slice(0, 30), size: num(o.size, 10, 64, 24),
      motion, vx: num(o.vx, -16, 16, 0), vy: num(o.vy, -16, 16, 0), target: cleanId(o.target),
    };
  });
  return { bg: color(d.bg, "#1e1e2e"), objects };
}
// 4장 Step 1의 연습용 공: 흰 공 하나가 가로로 움직이고 좌우 끝에서 튕긴다
// 4장: 움직이는 물체의 한 프레임 속도(픽셀)
const baseSpeed = (scene) => { const o = (scene?.objects || []).find((x) => ["fall", "move", "bounce"].includes(x.motion)); return o ? Math.abs(o.vy) || Math.abs(o.vx) || 3 : 3; };
// 4장 Step 1의 연습용 공
const PRACTICE_BALL = { bg: "#202124", objects: [{ id: "ball", role: "deco", shape: "circle", x: 100, y: 300, r: 20, color: "#ffffff", motion: "bounce", vx: 3, vy: 0, w: 40, h: 40, size: 24, text: "", target: "" }] };

function bbox(o) {
  if (o.shape === "circle") return [o.x - o.r, o.y - o.r, o.r * 2, o.r * 2];
  if (o.shape === "text") return [o.x, o.y, o.size * 0.62 * o.text.length, o.size];
  return [o.x, o.y, o.w, o.h];
}
// bugs.hitbox = 7장 숨은 버그: 기준점을 가운데로 잘못 잡아 판정 영역이 오른쪽 아래로 반 칸 밀림 / shrink = 6장 Step 6 '판정 영역 조금 줄이기'(px)
const hitbox = (o, bug, shrink = 0) => { const b = bbox(o); const s = o.role === "player" ? shrink : 0; const r = [b[0] + s, b[1] + s, b[2] - 2 * s, b[3] - 2 * s]; return bug ? [r[0] + b[2] / 2, r[1] + b[3] / 2, r[2], r[3]] : r; };
const overlap = (a, b) => a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1];

// state: "start" | "playing" | "gameover" (6장 gameState, 8장 Step 1에서 "start" 추가)
function makeWorld(scene, state = "playing") {
  return { objs: scene.objects.map((o, i) => ({ ...o, x0: o.x, y0: o.y, phase: i * 1.7 })), score: 0, scoreStr: "0", elapsed: 0, t: 0, state, vy: 0, clicks: [], errors: 0 };
}
// opt: { speed(물체 속도 배율), diff{inc, cap}(8장 난이도: 10초마다 inc씩, 상한 cap), play(충돌 켬), scoreMode "time"|"item",
//        control "4way"|"lr"|"mousex"|"click"|"jump", moveSpeed(플레이어 속도, 5장 기본 5), flip(방향 뒤집기),
//        input{ method "A"|"B", keys:Set, pulses:[{dx,dy}], mouse:{x,y}|null, clicks:[{x,y}], jump:bool }, bugs{ref,hitbox,concat}, shrink }
// dt = 지난 프레임부터 흐른 초 (Date.now 방식 — 프레임 수가 아니라 실제 시간)
function tick(w, opt = {}, dt = 1 / 60) {
  const ev = { scored: false, died: false };
  if (w.state !== "playing") return ev;
  w.elapsed += dt; w.t++;
  const f = opt.diff ? Math.min(opt.diff.cap || 2, 1 + (opt.diff.inc || 0.2) * Math.floor(w.elapsed / 10)) : 1;
  const sp = (opt.speed ?? 1) * f;
  const walls = w.objs.filter((o) => o.role === "wall");
  for (const o of w.objs) {
    const [, , bw, bh] = bbox(o);
    if (o.role === "player" && opt.input) {
      const inp = opt.input, px = o.x, py = o.y, ms = opt.moveSpeed || 5, sgn = opt.flip ? -1 : 1;
      const ctl = opt.control || "4way", lockY = ctl === "lr" || ctl === "jump" || ctl === "mousex";
      for (const c of inp.clicks || []) w.clicks.push({ x: c.x, y: c.y });
      if (opt.bugs && opt.bugs.ref) { if ((inp.keys && inp.keys.size) || (inp.pulses || []).length) w.errors++; inp.pulses = []; continue; } // 키 처리에서 ReferenceError → 안 움직임
      if (ctl === "mousex") {
        if (inp.mouse) o.x = inp.mouse.x - (o.shape === "circle" ? 0 : bw / 2);
      } else if (inp.method === "A") {
        for (const p of inp.pulses || []) { o.x += p.dx * 5 * sgn; if (!lockY) o.y += p.dy * 5; } // 방식 A: keydown마다 5픽셀
      } else {
        const on = (...ks) => ks.some((x) => inp.keys && inp.keys.has(x));
        o.x += (on("ArrowRight", "d", "D") - on("ArrowLeft", "a", "A")) * ms * sgn;
        if (!lockY) o.y += (on("ArrowDown", "s", "S") - on("ArrowUp", "w", "W")) * ms;
      }
      if (ctl === "jump") { // 5장 Step 6: 위로 솟는 속도는 음수, 매 프레임 중력을 더함, 공중에서는 다시 점프 못 함
        const ground = Math.min(SCENE_H, ...walls.map((wl) => bbox(wl)[1]).filter((y) => y > o.y)) - bh;
        if (inp.jump && o.y >= ground - 0.5) w.vy = -12;
        w.vy += 0.6; o.y = Math.min(ground, o.y + w.vy);
        if (o.y >= ground) w.vy = 0;
      }
      const ox = o.shape === "circle" ? o.r : 0;
      o.x = Math.min(SCENE_W - bw + ox, Math.max(ox, o.x)); o.y = Math.min(SCENE_H - bh + ox, Math.max(ox, o.y));
      if (ctl !== "jump" && walls.some((wl) => overlap(bbox(o), bbox(wl)))) { o.x = px; o.y = py; }
      continue;
    }
    if (o.motion === "move") {
      o.x += (o.vx || 1) * sp; o.y += o.vy * sp;
      const [l, t] = bbox(o);
      if (l > SCENE_W) o.x -= SCENE_W + bw; if (l + bw < 0) o.x += SCENE_W + bw;
      if (t > SCENE_H) o.y -= SCENE_H + bh; if (t + bh < 0) o.y += SCENE_H + bh;
    } else if (o.motion === "bounce") {
      o.x += o.vx * sp; o.y += o.vy * sp;
      const [l, t] = bbox(o);
      if (l < 0 || l + bw > SCENE_W) { o.vx *= -1; o.x += o.vx * sp; }
      if (t < 0 || t + bh > SCENE_H) { o.vy *= -1; o.y += o.vy * sp; }
    } else if (o.motion === "fall") {
      o.y += (Math.abs(o.vy) || 3) * sp;
      if (bbox(o)[1] > SCENE_H) respawn(o, w.t);
    } else if (o.motion === "sway") {
      o.x = o.x0 + Math.sin(w.t / 40 + o.phase) * 80;
    } else if (o.motion === "follow") {
      const tg = w.objs.find((p) => p.id === o.target && p !== o);
      if (tg) {
        const dx = tg.x - o.x, dy = tg.y - o.y, d = Math.hypot(dx, dy), m = Math.min(d, Math.max(1, Math.hypot(o.vx, o.vy) || 2) * sp);
        if (d > 0.5) { o.x += (dx / d) * m; o.y += (dy / d) * m; }
      }
    }
  }
  const bugConcat = opt.bugs && opt.bugs.concat;
  if (opt.play) {
    const p = w.objs.find((o) => o.role === "player");
    if (p) {
      const pb = hitbox(p, opt.bugs && opt.bugs.hitbox, opt.shrink || 0);
      for (const o of w.objs) {
        if (o === p || (o.role !== "enemy" && o.role !== "item") || !overlap(pb, hitbox(o, opt.bugs && opt.bugs.hitbox))) continue;
        if (o.role === "enemy") { w.state = "gameover"; ev.died = true; break; }
        if (opt.scoreMode === "item") { w.score += 10; w.scoreStr = bugConcat ? w.scoreStr + "1" : String(w.score); ev.scored = true; respawn(o, w.t); } // 6장 Step 3: 닿으면 10점, 새 위치에서 다시
      }
    }
    if (opt.scoreMode !== "item") { // 시간형: 흐른 시간(초)을 Math.floor로
      const sec = Math.floor(w.elapsed);
      if (sec !== w.score) { w.score = sec; w.scoreStr = bugConcat ? w.scoreStr + "1" : String(sec); }
    }
  }
  return ev;
}
function respawn(o, t) {
  const [, , bw, bh] = bbox(o);
  o.y = (o.shape === "circle" ? o.r : 0) - bh - 10 - (t % 60);
  o.x = (o.shape === "circle" ? o.r : 0) + ((o.x0 * 7 + t * 197) % Math.max(1, SCENE_W - bw));
}

// opt: { grid, hitbox(showHitbox), debug(showDebug), bugs, shrink, sel, mouse, hud(점수 표시), best, newBest, mute, coords(3장 Step 2 연습), start{title,goal,controls}, noDraw(4장 실험 3) }
function drawWorld(ctx, scene, w, opt = {}) {
  if (opt.noDraw) { ctx.fillStyle = "#111216"; ctx.fillRect(0, 0, SCENE_W, SCENE_H); return; }
  if (!opt.noClear) { ctx.fillStyle = scene.bg; ctx.fillRect(0, 0, SCENE_W, SCENE_H); }
  if (opt.grid) {
    ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.fillStyle = "rgba(255,255,255,.6)"; ctx.lineWidth = 1; ctx.font = "12px sans-serif"; ctx.textBaseline = "top";
    for (let x = 0; x <= SCENE_W; x += 100) { ctx.beginPath(); ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, SCENE_H); ctx.stroke(); ctx.fillText(x, x + 3, 3); }
    for (let y = 100; y <= SCENE_H; y += 100) { ctx.beginPath(); ctx.moveTo(0, y + .5); ctx.lineTo(SCENE_W, y + .5); ctx.stroke(); ctx.fillText(y, 3, y + 3); }
  }
  for (const o of w.objs) {
    ctx.globalAlpha = o.motion === "blink" && Math.floor(w.t / 30) % 2 ? 0.15 : 1;
    ctx.fillStyle = o.color;
    if (o.shape === "circle") { ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2); ctx.fill(); }
    else if (o.shape === "text") { ctx.font = `bold ${o.size}px sans-serif`; ctx.textBaseline = "top"; ctx.fillText(o.text, o.x, o.y); }
    else ctx.fillRect(o.x, o.y, o.w, o.h);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#ffffff";
  for (const c of w.clicks) { ctx.beginPath(); ctx.arc(c.x, c.y, 8, 0, Math.PI * 2); ctx.fill(); } // 5장 Step 6 클릭: 클릭한 위치에 작은 원
  if (opt.coords) { // 3장 Step 2 좌표 연습: (0,0) 빨강 · (750,0) 노랑 · (0,550) 초록 · (400,300) 흰 20×20
    const sq = [[0, 0, 50, "#ef4444"], [750, 0, 50, "#facc15"], [0, 550, 50, "#22c55e"], [400, 300, 20, "#ffffff"]];
    ctx.font = "14px sans-serif"; ctx.textBaseline = "top";
    for (const [x, y, s, c] of sq) { ctx.fillStyle = c; ctx.fillRect(x, y, s, s); ctx.fillStyle = "#fff"; const tx = x > 600 ? x - 70 : x + s + 6; ctx.fillText(`(${x}, ${y})`, tx, y > 500 ? y + 18 : y + 4); }
  }
  if (opt.hitbox || opt.debug) { // 6장 Step 2: 판정 영역을 빨간 테두리로
    ctx.strokeStyle = "#ff3b30"; ctx.lineWidth = 2;
    for (const o of w.objs) if (["player", "enemy", "item"].includes(o.role)) { const b = hitbox(o, opt.bugs && opt.bugs.hitbox, opt.shrink || 0); ctx.strokeRect(b[0], b[1], b[2], b[3]); }
  }
  if (opt.sel) {
    const o = w.objs.find((x) => x.id === opt.sel);
    if (o) {
      const b = bbox(o);
      ctx.setLineDash([6, 4]); ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.strokeRect(b[0] - 3, b[1] - 3, b[2] + 6, b[3] + 6); ctx.setLineDash([]);
      label(ctx, o.shape === "circle" ? `ctx.arc(${Math.round(o.x)}, ${Math.round(o.y)}, ${o.r}, …)  ← ${o.id}` : o.shape === "rect" ? `ctx.fillRect(${Math.round(o.x)}, ${Math.round(o.y)}, ${o.w}, ${o.h})  ← ${o.id}` : `ctx.fillText(…, ${Math.round(o.x)}, ${Math.round(o.y)})  ← ${o.id}`, b[0], b[1] + b[3] + 8);
    }
  }
  if (opt.grid && opt.mouse) {
    const { x, y } = opt.mouse;
    ctx.strokeStyle = "rgba(255,255,255,.55)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, SCENE_H); ctx.moveTo(0, y); ctx.lineTo(SCENE_W, y); ctx.stroke();
    label(ctx, `x: ${Math.round(x)}, y: ${Math.round(y)}`, x + 10, y + 10);
  }
  if (opt.hud) { // 6장 Step 3: 왼쪽 위에 "점수: 0" 흰 글씨 / 8장 Step 4: 플레이 중 최고 점수를 작게
    ctx.font = "bold 22px sans-serif"; ctx.textBaseline = "top"; ctx.fillStyle = "#ffffff"; ctx.fillText(`점수: ${w.scoreStr}`, 16, 16);
    if (opt.best != null) { ctx.font = "15px sans-serif"; ctx.textAlign = "right"; ctx.fillText(`최고 점수: ${opt.best}`, SCENE_W - 16, 18); ctx.textAlign = "start"; }
  }
  if (opt.mute) { ctx.font = "14px sans-serif"; ctx.textBaseline = "bottom"; ctx.fillStyle = "#ffffff"; ctx.textAlign = "right"; ctx.fillText("음소거 (M)", SCENE_W - 12, SCENE_H - 10); ctx.textAlign = "start"; }
  if (opt.debug) { // 7장 Step 3: 플레이어 x, y · 개수 · gameState · 점수
    const p = w.objs.find((o) => o.role === "player"), cnt = w.objs.filter((o) => o.role === "enemy" || o.role === "item").length;
    const lines = [`x: ${p ? Math.round(p.x) : "-"}, y: ${p ? Math.round(p.y) : "-"}`, `개수: ${cnt}`, `gameState: ${w.state}`, `점수: ${w.scoreStr}`];
    ctx.font = "13px monospace"; ctx.textBaseline = "top"; ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(10, 50, 190, lines.length * 18 + 10);
    ctx.fillStyle = "#4ade80"; lines.forEach((l, i) => ctx.fillText(l, 18, 56 + i * 18));
  }
  if (w.state === "start" && opt.start) { // 8장 Step 1 시작 화면
    ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(0, 0, SCENE_W, SCENE_H);
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "bold 44px sans-serif"; ctx.fillText(opt.start.title, SCENE_W / 2, 220);
    ctx.font = "20px sans-serif"; ctx.fillText(opt.start.goal, SCENE_W / 2, 290); ctx.fillText(opt.start.controls, SCENE_W / 2, 325);
    if (Math.floor(Date.now() / 500) % 2) { ctx.font = "16px sans-serif"; ctx.fillText("아무 키나 눌러 시작", SCENE_W / 2, 430); }
    ctx.textAlign = "start";
  }
  if (w.state === "gameover") { // 6장 Step 4 + 8장 Step 4
    ctx.fillStyle = "rgba(0,0,0,.6)"; ctx.fillRect(0, 0, SCENE_W, SCENE_H);
    ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "bold 56px sans-serif"; ctx.fillText("GAME OVER", SCENE_W / 2, 230);
    ctx.font = "24px sans-serif"; ctx.fillText(`최종 점수: ${w.scoreStr}`, SCENE_W / 2, 300);
    let y = 340;
    if (opt.best != null) { ctx.fillText(`최고 점수: ${opt.best}${opt.newBest ? "  신기록!" : ""}`, SCENE_W / 2, y); y += 40; }
    ctx.font = "16px sans-serif"; ctx.fillText("R 키를 눌러 다시 시작", SCENE_W / 2, y + 10);
    ctx.textAlign = "start";
  }
}
function label(ctx, text, x, y) {
  ctx.font = "14px monospace"; ctx.textBaseline = "top";
  const tw = ctx.measureText(text).width; x = Math.max(4, Math.min(x, SCENE_W - tw - 10)); y = Math.min(y, SCENE_H - 22);
  ctx.fillStyle = "rgba(0,0,0,.75)"; ctx.fillRect(x - 4, y - 3, tw + 8, 20); ctx.fillStyle = "#fff"; ctx.fillText(text, x, y);
}
function pickAt(w, x, y) { for (let i = w.objs.length - 1; i >= 0; i--) { const o = w.objs[i], b = bbox(o); if (o.role !== "deco" || o.shape !== "rect" || b[2] < SCENE_W) if (x >= b[0] && x <= b[0] + b[2] && y >= b[1] && y <= b[1] + b[3]) return o; } return null; }

// ---- 워크북 원문 읽기: 장 파일에서 '3. 따라 하기 실습 / 4. 과제 / 5. 제출 체크리스트'를 그대로 꺼낸다 ----
// 체크박스 줄(- [ ] / - [x])은 사이트에서 누를 수 있는 항목이 된다. 원문의 [x] 표시는 무시하고 모두 빈 칸으로 시작한다.
function blockAfter(lines, startRe, level) {
  let i = lines.findIndex((l) => startRe.test(l)), inCode = false;
  if (i < 0) return null;
  const out = [];
  for (let j = i + 1; j < lines.length; j++) {
    if (/^```/.test(lines[j])) inCode = !inCode;
    const m = !inCode && lines[j].match(/^(#{1,6})\s/);
    if (m && m[1].length <= level) break;
    out.push(lines[j]);
  }
  return out;
}
function splitBy(lines, re) { // 같은 급 제목(### …)으로 나눈다
  const parts = []; let cur = { title: "", lines: [] }, inCode = false;
  for (const l of lines) {
    if (/^```/.test(l)) inCode = !inCode;
    if (!inCode && re.test(l)) { if (cur.title || cur.lines.some((x) => x.trim())) parts.push(cur); cur = { title: l.replace(/^#+\s*/, ""), lines: [] }; }
    else cur.lines.push(l);
  }
  if (cur.title || cur.lines.some((x) => x.trim())) parts.push(cur);
  return parts;
}
const TASK_RE = /^\s*[-*]\s+\[[ xX]\]\s+/;
function taskTexts(md) { let inCode = false; const out = []; for (const l of md.split("\n")) { if (/^```/.test(l)) inCode = !inCode; if (!inCode && TASK_RE.test(l)) out.push(l.replace(TASK_RE, "").trim()); } return out; }
// 원문 [x]를 빈 칸으로 (각자 새로 체크)
const unticked = (md) => { let inCode = false; return md.split("\n").map((l) => { if (/^```/.test(l)) inCode = !inCode; return !inCode && TASK_RE.test(l) ? l.replace(/\[[xX]\]/, "[ ]") : l; }).join("\n"); };
function parseChapter(md) {
  const lines = String(md || "").split(/\r?\n/);
  const prac = blockAfter(lines, /^##\s+3\.\s*따라 하기/, 2), task = blockAfter(lines, /^##\s+4\.\s*내 게임에 적용하기/, 2), sub = blockAfter(lines, /^##\s+5\.\s*제출 체크리스트/, 2);
  if (!prac || !task || !sub) return null;
  const sp = splitBy(prac, /^###\s/), tp = splitBy(task, /^###\s/);
  const mk = (p, key) => { const md2 = unticked(p.lines.join("\n").trim()); return { key, title: p.title, md: md2, tasks: taskTexts(md2) }; };
  return {
    intro: sp[0] && !sp[0].title ? unticked(sp[0].lines.join("\n").trim()) : "",
    steps: sp.filter((p) => p.title).map((p, i) => mk(p, `s${i + 1}`)),
    tasks: tp.filter((p) => p.title).map((p, i) => mk(p, `t${i + 1}`)),
    submit: mk({ title: "제출 체크리스트", lines: sub }, "u"),
  };
}
// 부록 E.5 제출 전 공통 체크리스트
function parseCommon(md) {
  const b = blockAfter(String(md || "").split(/\r?\n/), /^##\s+E\.5/, 2);
  if (!b) return null;
  const md2 = unticked(b.join("\n").trim());
  return { key: "e", title: "제출 전 공통 체크리스트 (부록 E.5)", md: md2, tasks: taskTexts(md2) };
}

// ---- 미션 진행: 실험(자동) + 워크북 체크 항목(따라 하기·과제·제출·공통) + 이해 확인 ----
function missionItems(n, chapter, common, features) {
  const done = n.done || {}, labs = n.labs || {}, out = labAutos(n, features).map(([key, lbl]) => ({ key: `lab:${key}`, label: lbl, kind: "lab", ok: !!labs[key] }));
  const add = (sec, kind) => sec && sec.tasks.forEach((t, i) => out.push({ key: `${sec.key}:${i}`, label: t, kind, sec: sec.title, ok: !!done[`${sec.key}:${i}`] }));
  // 스터디_프레임의 섹션 '읽음'처럼 Step마다 '마침' 항목 하나 + 원문의 체크박스들
  if (chapter) { chapter.steps.forEach((s) => { out.push({ key: `${s.key}:done`, label: `${s.title.replace(/\s*\(\d+분\).*$/, "")} 마침`, kind: "stepdone", sec: "따라 하기 실습", ok: !!done[`${s.key}:done`] }); add(s, "step"); }); chapter.tasks.forEach((t) => add(t, "task")); add(chapter.submit, "submit"); }
  add(common, "common");
  out.push({ key: "quiz", label: "이해 확인 문제를 맞혔다", kind: "quiz", ok: n.quizPick === QUIZ[n.k].answer });
  return out;
}
const progress = (items) => ({ done: items.filter((x) => x.ok).length, total: items.length });

// ---- '내 게임 버전' 검사: AI가 괄호·예시 자리만 바꾸고 나머지 줄은 원문 그대로 두었는가 ----
const PERSONAL_RE = /\(내 게임|\(예:|\(설명\)|\(적 \/ 장애물 \/ 아이템\)|\(아이템\)|\(충돌할 때\)|\(점수를 얻을 때\)|\(적의 속도|\(고른 함수|\(버그 이름\)|게임: 지각 탈출|\(\s*설명\s*\)/;
function requiredLines(orig) {
  const out = []; let inDraw = false;
  for (const raw of String(orig).split("\n")) {
    const l = raw.trim();
    if (!l) { inDraw = false; continue; }
    if (/^그릴 것:/.test(l)) { inDraw = true; continue; }
    if (inDraw || /^게임:/.test(l) || l.includes("(") || /예:/.test(l)) continue;
    out.push(l);
  }
  return out;
}
function verifyPersonal(orig, out) {
  const got = new Set(String(out || "").split("\n").map((l) => l.trim()));
  if (!String(out || "").trim() || /```/.test(out)) return { ok: false, missing: ["(빈 응답)"] };
  const missing = requiredLines(orig).filter((l) => !got.has(l));
  return { ok: !missing.length, missing };
}

// ---- 경로 지도 배치: 깊이(단계)는 가로, 갈래는 세로. ghost = 아직 안 고른 연관 검색어 ----
function layoutTree(rootLabel, nodes, ghosts = []) {
  const items = [], edges = [];
  let row = 0;
  const kidsOf = (pid) => [
    ...nodes.filter((n) => n.parent === pid).sort((a, b) => a.choice.localeCompare(b.choice)).map((n) => ({ kind: "node", id: n.id, label: n.choice })),
    ...ghosts.filter((g) => g.parent === pid).map((g) => ({ kind: "ghost", id: `ghost:${pid}:${g.choice}`, label: g.choice, choice: g.choice, parent: pid })),
  ];
  const place = (it, depth) => {
    const kids = it.kind === "ghost" ? [] : kidsOf(it.kind === "root" ? "" : it.id);
    const ys = kids.map((c) => place(c, depth + 1));
    const y = ys.length ? (ys[0] + ys[ys.length - 1]) / 2 : row++;
    items.push({ ...it, depth, y });
    ys.forEach((cy) => edges.push({ depth, y1: y, y2: cy }));
    return y;
  };
  place({ kind: "root", id: "", label: rootLabel }, 0);
  return { items, edges, rows: Math.max(row, 1), cols: Math.max(...items.map((i) => i.depth)) + 1 };
}

// ---- 프롬프트 ----
const JSON_RULE = "라이브러리 없이 my-game 폴더의 index.html · style.css · script.js, 800×600 canvas(id \"game\"). 초보 대학생 수준. JSON 하나만 출력한다.";

function genrePrompt(name, idea) {
  return `새 게임 형식 "${name}"을 시작한다.${idea ? `\n학생 아이디어: ${idea}` : ""}
미션 1은 워크북 3장: 내 게임의 첫 화면(배경, 플레이어, 장애물·아이템, 글자 하나 이상)을 그린다. 아직 움직이지 않는다.
미션 1 첫 화면을 어떤 모습으로 그릴지, 서로 확실히 다른 선택지 3개를 낸다.
선택지 규칙: 각 15자 이내 검색어처럼 짧게. 이 게임만의 구체적인 화면이어야 한다. 움직임·조작·점수는 아직 넣지 않는다.
${JSON_RULE}
모양: {"desc":"20자 안팎 한 줄 설명","lvl":"★☆☆ 또는 ★★☆ 또는 ★★★","ctl":"키보드 / 마우스 등","inp":"key 또는 mouse","intro":"두 문장 소개","next":["선택지1","선택지2","선택지3"]}`;
}

function scenePrompt(k, prev) {
  const p = prev ? JSON.stringify({ bg: prev.bg, objects: prev.objects.map((o) =>
    Object.fromEntries(Object.entries(o).filter(([key, v]) => v !== "" && v !== undefined && !(key === "target" && !v)))) }) : "(없음, 이번이 첫 장면)";
  return `scene 규칙: 이 게임의 목표 모습을 800×600 화면 목업으로 그린다(워크북과 같은 크기). 이전 장면을 이어받아, 이번 미션에서 생기거나 바뀌는 것을 더하거나 고친 "전체 장면"을 낸다. 이전 물체는 id를 그대로 둔다. 물체 30개 이하.
좌표: 왼쪽 위가 0,0. rect와 text는 x,y가 왼쪽 위, circle은 x,y가 중심.
shape: rect(w,h) / circle(r) / text(text,size). color는 "#rrggbb" 또는 "rgba(…)".
role: player(학생이 조작할 것, 하나만, id "player") / enemy(닿으면 게임 오버) / item(닿으면 점수) / wall(못 지나감, 바닥 등) / deco(배경·글자).
motion: none / move(vx,vy로 계속) / bounce(벽에 튕김) / fall(떨어지고 다시 위에서) / blink / follow(target id 쪽으로) / sway.
${k === 1 ? "미션 1은 화면만 그리므로 모든 motion은 none이다. 글자(text)를 하나 이상 넣는다." : "아직 안 배운 뒤 장의 기능은 넣지 않는다."}
이전 장면: ${p}`;
}

function stepPrompt(genre, info, path, k, choice, prev) {
  const [sname, ch, what] = STEPS[k - 1];
  const needNext = k < 6 && !FIXED_NEXT[k + 1];
  const nextPart = needNext ? `,"next":["다음 미션 방향 3개"]` : "";
  const nextRule = needNext
    ? `next 규칙: 다음 미션 ${k + 1}(워크북 ${STEPS[k][1]}장: ${STEPS[k][2]})에서 고를 서로 다른 방향 3개. ${k + 1 === 2 ? "'이번에 움직일 것'(예: 위쪽 장애물이 아래로 떨어진다)을 이 게임에 맞게." : "'내 게임에서 실제로 생길 만한 버그 후보'(예: 판정 영역이 그림보다 크다)를 이 게임에 맞게."} 각 15자 이내.`
    : "";
  return `게임 형식 "${genre}" — ${info}
지금까지 학생이 고른 길:
${path.length ? path.join("\n") : "(아직 없음, 이번이 첫 미션)"}
이번 미션: 미션 ${k} "${sname}" (워크북 ${ch}장) — ${what}
학생이 고른 방향: "${choice}"
goal은 이 방향으로 이번 미션에서 내 게임에 할 일을 한 문장으로 쓴다. 워크북 ${ch}장 범위를 넘지 않는다.
${nextRule}
${scenePrompt(k, prev)}
${JSON_RULE}
모양: {"goal":"이번 미션 목표 한 문장"${nextPart},"scene":{"bg":"#rrggbb","objects":[{"id":"player","role":"player","shape":"rect","x":384,"y":500,"w":32,"h":32,"color":"#3b82f6","motion":"none"}]}}`;
}

// 워크북 요청 원문에서 괄호·예시 자리만 내 게임으로 바꾸게 한다 (나머지 줄은 verifyPersonal로 검사)
function personalPrompt(orig, ctx) {
  return `아래는 워크북의 AI 요청 원문이다. 학생의 게임에 맞게 "자리"만 채워라.
바꿔도 되는 것: 괄호 안 자리 표시와 예시 — 예: "(내 게임 이름과 한 줄 설명)", "(예: …)", "(적 / 장애물 / 아이템)", "(설명)", "(충돌할 때)" — 그리고 "게임:" 줄과 "그릴 것:" 아래 예시 목록.
바꾸면 안 되는 것: 그 밖의 모든 줄. 한 글자도 바꾸거나 빼거나 순서를 바꾸지 말고 그대로 둔다. 새 줄이나 새 조건을 더하지 않는다.
괄호 자리를 채울 때 괄호는 지우고 내용만 쓴다.
학생의 게임: ${ctx.genre} — ${ctx.desc}
지금까지 고른 길: ${ctx.path || "없음"}
이번 미션: ${ctx.choice} — ${ctx.goal}${ctx.extra ? `\n참고: ${ctx.extra}` : ""}
원문:
${orig}
바꾼 요청 전체만 출력한다. 설명이나 코드 블록 표시(\`\`\`)는 쓰지 않는다.`;
}

function suggestPrompt(text, ctx) {
  return `학생이 검색창에 "${text}"까지 입력했다.
${ctx ? `맥락: 웹 게임 "${ctx.genre}"의 미션 ${ctx.k}(워크북 ${STEPS[ctx.k - 1][1]}장: ${STEPS[ctx.k - 1][2]})에서 하고 싶은 것을 찾는 중. 지금까지: ${ctx.path || "없음"}` : "맥락: 만들고 싶은 웹 게임 형식을 찾는 중."}
검색창 자동완성처럼, 입력한 말을 이어 쓰거나 포함한 구체적인 검색어 5개를 낸다. 각 15자 이내, 서로 다르게. ${ctx ? "이 장 범위 안에서 할 수 있는 것만." : "게임 형식 이름이나 '형식 + 특징' 꼴로."}
JSON 하나만 출력한다. 모양: {"s":["검색어1","검색어2","검색어3","검색어4","검색어5"]}`;
}

// ---- 워크북 원문에서 개념 섹션 하나 꺼내기 ("2.4" → 그 제목부터 같은 급 다음 제목 전까지) ----
function extractSection(md, num) {
  const lines = String(md || "").split(/\r?\n/);
  const re = new RegExp(`^(#{2,4})\\s+${num.replace(/\./g, "\\.")}(\\s|$)`);
  let start = -1, level = 0, inCode = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^```/.test(lines[i])) inCode = !inCode;
    if (inCode) continue;
    const m = lines[i].match(re);
    if (m) { start = i; level = m[1].length; break; }
  }
  if (start < 0) return "";
  const out = [lines[start]];
  inCode = false;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^```/.test(lines[i])) inCode = !inCode;
    const m = !inCode && lines[i].match(/^(#{1,6})\s/);
    if (m && m[1].length <= level) break;
    out.push(lines[i]);
  }
  return out.join("\n").trim();
}

// ---- 회고 재료 표: 실험실에서 시도한 값만 채우고 '느낌·판단·이유'는 비워 둔다 (회고는 학생이 직접) ----
function recordTables(n) {
  const v = n.vals || {}, out = [];
  if (n.k === 2 && (v.tried || []).length) out.push({ title: "과제 2. 속도 튜닝 기록 — 시도한 값", md: ["| 속도 값 | 느낌 | 판단 |", "|---|---|---|", ...v.tried.map((x) => `| ${x} |  |  |`)].join("\n") });
  if (n.k === 3 && (v.moveTried || []).length) out.push({ title: "과제 2. 조작 느낌 튜닝 기록 — 시도한 값", md: ["| 이동 속도 | 느낌 | 판단 |", "|---|---|---|", ...v.moveTried.map((x) => `| ${x} |  |  |`)].join("\n") });
  if (n.k === 4 && ((v.tune || []).length || (v.runs || []).length)) out.push({ title: "과제 2. 난이도 조정 기록 — 바꾼 값", md: ["| 바꾼 것 | 전 | 후 | 이유 |", "|---|---|---|---|", ...(v.tune || []).map((t) => `| ${t.what} | ${t.before} | ${t.after} |  |`), "", `내가 한 판에 버틴 시간: ${(v.runs || []).map((s) => s + "초").join(", ") || "-"}`].join("\n") });
  if (n.k === 6 && (v.runs || []).length) out.push({ title: "과제 3. 난이도 체감 기록 — 내가 버틴 시간", md: ["| 시점 | 내 체감 | 조정한 것 |", "|---|---|---|", "| 0~10초 |  |  |", "| 30초 |  |  |", "| 1분 이후 |  |  |", "", `내가 버틴 최고 기록: ${Math.max(...v.runs)}초`].join("\n") });
  if (n.k === 5 && (v.hunt || []).some(Boolean)) out.push({ title: "과제 1 재료. 숨은 버그 찾기에서 내가 적은 것", md: v.hunt.map((x, i) => `${i + 1}) ${x || "(못 찾음)"}`).join("\n") });
  return out;
}

// ---- 과제 기록 내보내기 (파일 이름에 한글·공백 없음: 부록 E.4) ----
const EXPORT_NAME = "gametree-log.md";
function buildExport(S, chapters = {}, common = null, now = new Date()) {
  const out = [`# 게임트리 미션 기록`, ``, `> 내보낸 때: ${now.toLocaleString("ko-KR")}`, `> 과제용 기록이다. 다른 기기에서 이어 하려면 사이트의 동기화 설정이나 백업 파일을 쓴다.`, `> 회고는 이 파일을 보고 **내 말로 직접** 쓴다.`, ``];
  for (const g of Object.values(S.genres)) {
    const nodes = Object.values(S.nodes).filter((n) => n.genre === g.name);
    if (!nodes.length) continue;
    out.push(`## ${g.name}`, `${g.desc} · ${g.ctl}`, ``);
    for (const n of nodes.sort((a, b) => a.k - b.k || a.choice.localeCompare(b.choice))) {
      const feats = n.k === 6 ? featuresOf(n.choice) : null;
      const items = missionItems(n, chapters[STEPS[n.k - 1][1]] || null, common, feats), p = progress(items);
      out.push(`### 미션 ${n.k} ${STEPS[n.k - 1][0]} (워크북 ${STEPS[n.k - 1][1]}장) — ${n.choice} (${p.done}/${p.total})`, `- 목표: ${n.goal}`);
      let sec = "";
      for (const it of items) { const s = it.sec || (it.kind === "lab" ? "실험실" : it.kind === "quiz" ? "이해 확인" : ""); if (s !== sec) { out.push(``, `**${s}**`); sec = s; } out.push(`- [${it.ok ? "x" : " "}] ${it.label}`); }
      for (const t of recordTables(n)) out.push(``, `**${t.title}**`, ``, t.md);
      for (const h of n.hints || []) out.push(``, `질문 (${h.at}): ${h.q}`, ``, h.a.split("\n").map((l) => "> " + l).join("\n"));
      out.push(``);
    }
  }
  return out.join("\n");
}

function cleanVals(v) {
  v = v && typeof v === "object" ? v : {};
  const n = (x, lo, hi) => (Number.isFinite(Number(x)) ? Math.min(hi, Math.max(lo, Number(x))) : undefined);
  const nums = (a, lo, hi) => (Array.isArray(a) ? a.map((x) => n(x, lo, hi)).filter((x) => x !== undefined).slice(0, 30) : []);
  const moved = {};
  for (const [id, p] of Object.entries(v.moved || {}).slice(0, 40)) if (cleanId(id) && p) moved[cleanId(id)] = { x: n(p.x, -80, SCENE_W) ?? 0, y: n(p.y, -80, SCENE_H) ?? 0 };
  const personal = {};
  for (const [k, s] of Object.entries(v.personal || {}).slice(0, 20)) if (/^[\w:.-]{1,20}$/.test(k)) personal[k] = String(s || "").slice(0, 4000);
  return {
    moved, personal,
    tried: nums(v.tried, -50, 50), moveTried: nums(v.moveTried, 0, 50), runs: nums(v.runs, 0, 3600),
    tune: (Array.isArray(v.tune) ? v.tune : []).slice(0, 30).map((t) => ({ what: oneLine(t && t.what).slice(0, 30), before: oneLine(t && t.before).slice(0, 20), after: oneLine(t && t.after).slice(0, 20) })),
    hunt: (Array.isArray(v.hunt) ? v.hunt : []).slice(0, 3).map((s) => String(s || "").slice(0, 300)),
    huntChecked: !!v.huntChecked,
  };
}
const boolMap = (o, max = 300) => Object.fromEntries(Object.entries(o && typeof o === "object" ? o : {}).slice(0, max).filter(([k]) => /^[\w:]{1,30}$/.test(k)).map(([k, v]) => [k, !!v]));

function parseImport(text) {
  const d = JSON.parse(text);
  if (!d || typeof d.genres !== "object" || typeof d.nodes !== "object") throw new Error("게임트리 기록이 아니에요.");
  const S = { v: 3, genres: {}, nodes: {} };
  for (const g of Object.values(d.genres)) {
    const name = cleanName(g && g.name);
    if (!name) continue;
    S.genres[name] = { name, desc: oneLine(g.desc), lvl: oneLine(g.lvl), ctl: oneLine(g.ctl), inp: g.inp === "mouse" ? "mouse" : "key", intro: oneLine(g.intro), next: arr(g.next).map(cleanName).slice(0, 3), preset: !!g.preset, ai: !!g.ai };
  }
  for (const n of Object.values(d.nodes)) {
    const k = Number(n && n.k);
    const genre = cleanName(n && n.genre), choice = cleanName(n && n.choice);
    if (!S.genres[genre] || !(k >= 1 && k <= 6) || !choice) continue;
    const id = nodeId(genre, k, choice);
    S.nodes[id] = {
      id, genre, k, choice, parent: typeof n.parent === "string" ? n.parent : "",
      goal: oneLine(n.goal), next: arr(n.next).map(cleanName).slice(0, 3),
      quizPick: Number.isInteger(n.quizPick) ? n.quizPick : null,
      scene: normScene(n.scene), done: boolMap(n.done), labs: boolMap(n.labs), vals: cleanVals(n.vals), preset: !!n.preset, ai: !!n.ai,
      hints: (Array.isArray(n.hints) ? n.hints : []).slice(0, 50).map((h) => ({ q: String(h.q || "").slice(0, 2000), a: String(h.a || "").slice(0, 8000), at: oneLine(h.at) })),
    };
  }
  return S;
}

function presetState() {
  const S = { v: 3, genres: {}, nodes: {} };
  for (const g of PRESET_GENRES) S.genres[g.name] = { ...g, preset: true };
  let parent = "";
  DODGE.forEach(([choice, goal, objs], i) => {
    const k = i + 1, id = nodeId("피하기", k, choice);
    S.nodes[id] = { id, genre: "피하기", k, choice, parent, goal, next: DODGE[i + 1] ? [DODGE[i + 1][0]] : [], quizPick: null,
      scene: normScene({ bg: "#7dd3fc", objects: objs }), done: {}, labs: {}, vals: cleanVals({}), hints: [], preset: true };
    parent = id;
  });
  return S;
}

// ---- 공유 링크: 경로 데이터를 압축해 주소 뒤에 붙인다 ----
const b64u = (bytes) => { let s = ""; for (const b of bytes) s += String.fromCharCode(b); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); };
const unb64u = (s) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
async function encodeShare(obj) {
  const raw = new TextEncoder().encode(JSON.stringify(obj));
  if (typeof CompressionStream === "undefined") return "p" + b64u(raw);
  const buf = await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream("deflate-raw"))).arrayBuffer();
  return "z" + b64u(new Uint8Array(buf));
}
async function decodeShare(code) {
  const bytes = unb64u(code.slice(1));
  const text = code[0] === "z"
    ? await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text()
    : new TextDecoder().decode(bytes);
  const d = JSON.parse(text);
  return { S: parseImport(JSON.stringify(d)), at: String(d.at || "") };
}

// ================= Gemini (무료 · 구글 계정만 · 브라우저에서 바로 호출 가능) =================
// OpenAI와 같은 형식의 주소를 쓴다. 정확도를 위해 temperature를 낮추고, JSON이 필요한 곳은 JSON 모드로 받는다(못 쓰는 모델이면 JSON 모드 없이 한 번 더).
const BASE = "https://generativelanguage.googleapis.com/v1beta/openai";
const HOST = "generativelanguage.googleapis.com";
const BAD_KEY = "API 키가 맞지 않아요. Gemini 키(AIza로 시작)를 다시 복사해 넣으세요.";
const TIMEOUT_S = 60;
const TEMPERATURE = 0.2;

function requestBody(model, system, user, json) {
  const b = { model, messages: [{ role: "system", content: system }, { role: "user", content: user }], temperature: TEMPERATURE, max_tokens: 8192 };
  if (json) b.response_format = { type: "json_object" };
  if (/gemini-[\d.]+-(pro|flash)/.test(model)) b.reasoning_effort = "low"; // 생각하는 모델: 너무 오래 생각하지 않게
  return JSON.stringify(b);
}

async function callModel(key, model, body) {
  const ac = new AbortController(), timer = setTimeout(() => ac.abort(), TIMEOUT_S * 1000);
  try {
    const r = await fetch(`${BASE}/chat/completions`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` }, body, signal: ac.signal,
    });
    let j = {}; try { j = await r.json(); } catch (e) {}
    if (r.ok) {
      const text = String(j.choices?.[0]?.message?.content || "").trim();
      return text ? { text } : { retry: true, status: "empty", why: "빈 응답" };
    }
    const msg = String(j.error?.message || "").slice(0, 160);
    if (r.status === 401 || (r.status === 400 && /api.?key/i.test(msg))) return { err: BAD_KEY };
    if (r.status === 403) return { err: `이 키로는 쓸 수 없어요. (${msg})` };
    const why = { 404: "없는 모델", 429: "이 모델 한도 초과", 413: "요청이 너무 큼", 500: "서버 오류", 502: "서버 오류", 503: "붐빔" }[r.status] || `${r.status} ${msg}`;
    return { retry: true, status: r.status, why }; // 400(모델이 JSON 모드를 못 씀 등)도 다음 모델로
  } catch (e) {
    if (e.name === "AbortError") return { retry: true, status: "timeout", why: `${TIMEOUT_S}초 동안 응답 없음` };
    return { err: `Gemini에 접속하지 못했어요. 인터넷 연결이나 학교 방화벽(${HOST})을 확인하세요.` };
  } finally { clearTimeout(timer); }
}

async function listModels(key) {
  let r;
  try { r = await fetch(`${BASE}/models`, { headers: { Authorization: `Bearer ${key}` } }); }
  catch (e) { throw new Error(`Gemini에 접속하지 못했어요. 인터넷 연결이나 학교 방화벽(${HOST})을 확인하세요.`); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error([400, 401, 403].includes(r.status) ? BAD_KEY : `모델 목록을 못 불러왔어요 (${r.status}).`);
  return (j.data || []).filter((m) => m.active !== false).map((m) => String(m.id).replace(/^models\//, ""));
}

// 저장된 모델 먼저, 안 되면 목록 순서대로 최대 5개. 성공한 모델을 기억한다. log(msg)로 진행 상황을 알린다.
async function askAI(ai, system, user, json, log = () => {}) {
  if (!ai.key) throw new Error("먼저 API 키를 넣으세요.");
  let queue = ai.model ? [ai.model] : [];
  const tried = new Set(), fails = [];
  while (tried.size < 5) {
    if (!queue.length) { log("📋 쓸 수 있는 모델 확인 중…"); queue = rankModels(await listModels(ai.key)).filter((m) => !tried.has(m)); }
    const model = queue.shift();
    if (!model) break;
    tried.add(model);
    log(`🔄 ${tried.size}번째 시도: ${model}`);
    let r = await callModel(ai.key, model, requestBody(model, system, user, json));
    if (json && r.status === 400) r = await callModel(ai.key, model, requestBody(model, system, user, false)); // JSON 모드 미지원 모델
    if (r.text) { ai.model = model; return r.text; }
    if (!r.retry) throw new Error(r.err);
    log(`⚠️ ${model}: ${r.why} → 다음 모델로`);
    fails.push(r);
  }
  if (fails.length && fails.every((f) => f.status === 429)) throw new Error("무료 사용 한도를 넘었어요. 1분쯤 뒤에 다시 시도하세요.");
  throw new Error("지금 쓸 수 있는 모델이 없어요 (붐빔·시간 초과). 잠시 뒤 다시 시도하세요.");
}

// ================= 화면: 스터디_프레임식 (왼쪽 목차 · 위쪽 막대 · 홈 / 형식 / 미션 문서 페이지) =================
// search.js(프레임 엔진)가 부르는 App.toast·App.fit 자리. boot에서 채운다
const App = { toast() {}, fit() {} };
if (typeof window !== "undefined") window.App = App;

function boot() {
  const $ = (s) => document.querySelector(s);
  const main = $("#main"), crumb = $("#crumb");
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // 글자는 항상 textContent로 넣는다 (AI 응답을 HTML로 해석하지 않음)
  function h(tag, props = {}, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (k === "class") el.className = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) el.setAttribute(k, v === true ? "" : v);
    }
    for (const c of kids.flat()) if (c != null && c !== false) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
    return el;
  }
  const fill = (el, ...kids) => el.replaceChildren(...kids.flat().filter((k) => k != null && k !== false));

  // ---- 이 기기에만 두는 값: API 키·모델·워크북 원문 (동기화하지 않음) ----
  const raw = {
    get(area, k) { try { return area ? area.getItem(k) : null; } catch (e) { return null; } },
    set(area, k, v) { try { if (area) v == null ? area.removeItem(k) : area.setItem(k, v); } catch (e) {} },
  };
  const LS = (() => { try { return localStorage; } catch (e) { return null; } })();
  const SS = (() => { try { return sessionStorage; } catch (e) { return null; } })();
  const ai = { key: raw.get(SS, "gt-gemini-key") || raw.get(LS, "gt-gemini-key") || "", model: raw.get(LS, "gt-gemini-model") || "", checking: false };
  let WB = {};
  try { WB = JSON.parse(raw.get(LS, "gt-wb") || "{}"); } catch (e) {}
  let CH = {}, COMMON = null; // 워크북에서 읽은 장별 따라 하기·과제·제출 체크리스트
  function parseWB() { CH = {}; for (let c = 3; c <= 8; c++) if (WB[c]) CH[c] = parseChapter(WB[c]); COMMON = WB.E ? parseCommon(WB.E) : null; }
  parseWB();

  // ---- 미션 기록: 프레임 Store(브라우저 저장 + 동기화). 미션마다 키 하나(n:<id>) ----
  function loadState() {
    const P = presetState(), d = { genres: { ...P.genres }, nodes: { ...P.nodes } };
    for (const [k, g] of Object.entries(Store.get("genres", {}) || {})) d.genres[k] = g;
    for (const k of Object.keys(Store.exportAll())) if (k.startsWith("n:")) { const v = Store.get(k); if (v) d.nodes[k.slice(2)] = v; }
    try { return parseImport(JSON.stringify(d)); } catch (e) { return P; }
  }
  let S = presetState();
  const saveNode = (n) => Store.set("n:" + n.id, n);
  const saveGenres = () => Store.set("genres", Object.fromEntries(Object.values(S.genres).filter((g) => !g.preset).map((g) => [g.name, g])));
  const touched = (n) => n.ai || Object.values(n.done || {}).some(Boolean) || Object.values(n.labs || {}).some(Boolean) || n.quizPick != null || (n.hints || []).length;
  const trailOf = (n, D) => { const t = []; for (let x = n; x; x = D.nodes[x.parent]) t.unshift(x); return t; };
  const settingOf = (n, D) => { const t = trailOf(n, D), at = (k) => t.find((x) => x.k === k); return { control: at(3) ? controlOf(at(3).choice) : null, scoreMode: at(4) ? scoreModeOf(at(4).choice) : "time", features: at(6) ? featuresOf(at(6).choice) : null }; };
  const itemsOf = (n, D = S) => missionItems(n, CH[STEPS[n.k - 1][1]] || null, COMMON, n.k === 6 ? featuresOf(n.choice) : null);

  // ---- 알림 ----
  let tt;
  function toast(msg) { const t = $("#toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 2800); }
  App.toast = toast;
  const runbox = $("#runbox");
  let busy = false;
  async function run(title, fn) {
    if (busy) throw new Error("다른 요청을 만드는 중이에요. 끝날 때까지 기다려 주세요.");
    busy = true;
    const t0 = Date.now(), lines = [];
    const draw = () => { runbox.hidden = false; runbox.textContent = `⏳ ${title} · ${Math.round((Date.now() - t0) / 1000)}초\n${lines.slice(-4).join("\n")}`; };
    const timer = setInterval(draw, 1000); draw();
    try { const r = await fn((m) => { lines.push(m); draw(); }); raw.set(LS, "gt-gemini-model", ai.model); paintKey(); return r; }
    finally { busy = false; clearInterval(timer); runbox.hidden = true; }
  }
  const fail = (e) => toast("❌ " + e.message);

  // ---- 창(모달): 프레임 .modal 그대로 ----
  const modal = (id) => $(id);
  const open = (m) => m.classList.add("show"), close = (m) => m.classList.remove("show");
  for (const id of ["#sync-modal", "#key-modal", "#text-modal", "#map-modal", "#info-modal"]) {
    const m = modal(id);
    m.addEventListener("click", (e) => { if (e.target === m || e.target.closest("[data-close]")) close(m); });
  }
  addEventListener("keydown", (e) => { if (e.key === "Escape") document.querySelectorAll(".modal.show").forEach(close); });

  // ---- API 키 ----
  const keyBtn = $("#keyBtn"), keyM = modal("#key-modal");
  function paintKey() {
    keyBtn.className = "icon-btn " + (ai.checking ? "wait" : ai.key ? "ok" : "no");
    keyBtn.textContent = ai.checking ? "키 확인 중" : ai.key ? (ai.model ? ai.model.replace(/^[\w-]+\//, "") : "연결됨") : "API 키 넣기";
  }
  function openKey() { keyM.querySelector("input[type=password]").value = ai.key; keyM.querySelector("[data-persist]").checked = !!raw.get(LS, "gt-gemini-key"); open(keyM); setTimeout(() => keyM.querySelector("input[type=password]").focus({ preventScroll: true }), 50); }
  keyBtn.onclick = openKey;
  keyM.querySelector("form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const key = keyM.querySelector("input[type=password]").value.trim(), persist = keyM.querySelector("[data-persist]").checked;
    if (!key) return toast("키를 붙여 넣어 주세요");
    if (!/^AIza/.test(key)) return toast("Gemini 키(AIza로 시작)만 쓸 수 있어요. Google AI Studio에서 받은 키를 넣어 주세요");
    const probe = { key, model: ai.model }, btn = keyM.querySelector("[type=submit]");
    ai.checking = true; paintKey(); btn.disabled = true;
    try {
      await run("키 확인 중", (log) => askAI(probe, "한 단어로 답한다.", "ping", false, log));
      ai.key = key; ai.model = probe.model; raw.set(LS, "gt-gemini-model", ai.model);
      raw.set(SS, "gt-gemini-key", key); raw.set(LS, "gt-gemini-key", persist ? key : null);
      close(keyM); toast(`Gemini 연결됐어요 (모델: ${ai.model})`); route();
    } catch (err) { fail(err); }
    finally { ai.checking = false; btn.disabled = false; paintKey(); }
  });
  const needKey = (fn) => (...a) => (ai.key ? fn(...a) : openKey());

  function ask(title, fields, okText) {
    return new Promise((resolve) => {
      const m = modal("#text-modal"), form = m.querySelector("form");
      m.querySelector("h3").textContent = title; m.querySelector("[type=submit]").textContent = okText;
      const inputs = fields.map((f) => { const i = f.area ? h("textarea", { rows: 3, placeholder: f.ph || "" }) : h("input", { type: "text", placeholder: f.ph || "" }); i.value = f.value || ""; return i; });
      fill(m.querySelector(".fields"), fields.map((f, i) => h("label", {}, f.name, inputs[i])));
      const done = (v) => { form.onsubmit = null; obs.disconnect(); close(m); resolve(v); };
      form.onsubmit = (e) => { e.preventDefault(); done(inputs.map((i) => i.value.trim())); };
      const obs = new MutationObserver(() => { if (!m.classList.contains("show")) { obs.disconnect(); form.onsubmit = null; resolve(null); } });
      obs.observe(m, { attributes: true, attributeFilter: ["class"] });
      open(m); setTimeout(() => inputs[0].focus({ preventScroll: true }), 50);
    });
  }
  function info(title, ...body) { const m = modal("#info-modal"); m.querySelector("h3").textContent = title; fill(m.querySelector(".info-body"), body); open(m); }

  // ---- 지금 위치 ----  cur.mode: home | genre | node | share(남이 보낸 경로 보기)
  let cur = { mode: "home" }, shared = null;
  const data = () => (cur.mode === "share" && shared ? shared.S : S);
  const curNode = () => (cur.mode === "node" || cur.mode === "share" ? data().nodes[cur.id] : null);
  const trail = (n, D = data()) => trailOf(n, D);
  const childrenOf = (genre, parentId, D = data()) => Object.values(D.nodes).filter((n) => n.genre === genre && n.parent === parentId).sort((a, b) => a.choice.localeCompare(b.choice));
  const go = (hash) => { if (location.hash === hash) route(); else location.hash = hash; };
  const nodeHash = (id) => `#/n/${encodeURIComponent(id)}`, genreHash = (g) => `#/g/${encodeURIComponent(g)}`;
  const curGenre = () => (cur.mode === "genre" ? cur.genre : curNode()?.genre || null);
  function nextCtx() {
    if (cur.mode === "genre") return { genre: cur.genre, fromId: "", k: 1, list: S.genres[cur.genre].next, fixed: false };
    if (cur.mode === "node") { const n = S.nodes[cur.id]; return n.k < 6 ? { genre: n.genre, fromId: n.id, k: n.k + 1, list: nextList(n), fixed: !!FIXED_NEXT[n.k + 1] } : null; }
    return null;
  }

  // ---- 미션 만들기 (연관 검색어에 마우스를 올리면 미리 만들어 둔다) ----
  const pending = new Map();
  let prefetching = 0;
  async function generateNode(genre, fromId, choice, log) {
    const from = fromId ? S.nodes[fromId] : null, k = from ? from.k + 1 : 1, g = S.genres[genre];
    const path = from ? trail(from, S).map((n) => `미션 ${n.k}(${STEPS[n.k - 1][0]}): 고른 방향 "${n.choice}" → 목표: ${n.goal}`) : [];
    const prev = from?.scene || null;
    const r = parseJson(await askAI(ai, TUTOR, stepPrompt(genre, `${g.desc} (조작: ${g.ctl})`, path, k, choice, prev), true, log));
    const s = normStep(r, k);
    return { id: nodeId(genre, k, choice), genre, k, choice, parent: fromId || "", ...s, quizPick: null, scene: normScene(r.scene) || prev, done: {}, labs: {}, vals: cleanVals({}), hints: [], ai: true };
  }
  function prefetch(genre, fromId, choice) {
    const k = fromId ? S.nodes[fromId].k + 1 : 1, id = nodeId(genre, k, choice);
    if (!ai.key || S.nodes[id] || pending.has(id) || prefetching >= 1) return;
    prefetching++;
    const entry = { ready: false, p: generateNode(genre, fromId, choice, () => {}) };
    pending.set(id, entry);
    entry.p.then(() => { entry.ready = true; }, () => pending.delete(id)).finally(() => { prefetching--; paintChips(); });
    paintChips();
  }
  function hoverPrefetch(el, genre, fromId, choice) {
    let timer;
    const start = () => { clearTimeout(timer); timer = setTimeout(() => prefetch(genre, fromId, choice), 350); };
    el.addEventListener("pointerenter", start); el.addEventListener("focus", start);
    el.addEventListener("pointerleave", () => clearTimeout(timer)); el.addEventListener("blur", () => clearTimeout(timer));
  }
  const choose = needKey(async (genre, fromId, choice) => {
    choice = cleanName(choice);
    if (!choice) return;
    const k = fromId ? S.nodes[fromId].k + 1 : 1;
    if (k > 6) return;
    if (FIXED_NEXT[k] && !FIXED_NEXT[k].includes(choice)) return toast("이 미션은 워크북이 정해 둔 선택지 중에서 골라요");
    const id = nodeId(genre, k, choice);
    if (S.nodes[id]) return go(nodeHash(id));
    try {
      const node = await run(`미션 ${k} "${choice}" 만드는 중`, async (log) => {
        const pre = pending.get(id);
        if (pre) { log(pre.ready ? "⚡ 미리 만들어 둔 미션을 꺼내요" : "⚡ 미리 만들던 미션을 마무리하는 중…"); try { return await pre.p; } catch (e) { log("미리 만들기가 실패해서 다시 만들어요"); } }
        return generateNode(genre, fromId, choice, log);
      });
      pending.delete(id);
      S.nodes[id] = node; saveNode(node); go(nodeHash(id));
    } catch (e) { fail(e); }
  });
  const newGenre = needKey(async (preset = "") => {
    const v = await ask("새 게임 형식 만들기 (AI)", [{ name: "형식 이름", ph: "예: 슈팅, 리듬 게임, 미로 탈출", value: preset }, { name: "아이디어 (선택)", ph: "어떤 게임인지 한두 줄", area: true }], "만들기");
    if (!v) return;
    const name = cleanName(v[0]);
    if (!name) return toast("형식 이름을 넣으세요");
    if (S.genres[name]) return go(genreHash(name));
    try {
      const g = await run(`"${name}" 만드는 중`, async (log) => normGenre(parseJson(await askAI(ai, TUTOR, genrePrompt(name, v[1]), true, log))));
      S.genres[name] = { name, ...g, ai: true }; saveGenres(); go(genreHash(name));
    } catch (e) { fail(e); }
  });
  const askHint = needKey(async (n, q) => {
    if (!q) return toast("질문을 적어 주세요");
    const note = [`${n.genre} 미션 ${n.k} ${STEPS[n.k - 1][0]} (워크북 ${STEPS[n.k - 1][1]}장) — ${n.choice}`, `목표: ${n.goal}`].join("\n");
    try {
      const a = await run("힌트 만드는 중", (log) => askAI(ai, TUTOR, `학생이 지금 하고 있는 미션:\n${note}\n학생 질문: ${q}`, false, log));
      n.hints.push({ q, a: a.trim(), at: new Date().toLocaleString("ko-KR") }); saveNode(n); refreshPage();
    } catch (e) { fail(e); }
  });
  // 워크북 요청 원문의 '자리'만 내 게임으로 채운다 → 나머지 줄이 원문과 같은지 검사해서 같을 때만 보여 준다
  const personalize = needKey(async (n, key, orig) => {
    const D = data(), g = D.genres[n.genre];
    const objs = (n.scene?.objects || []).filter((o) => o.role !== "deco" || o.shape === "text").slice(0, 8)
      .map((o) => `${o.id}(${o.role}, ${o.shape === "circle" ? `원 반지름 ${o.r}` : o.shape === "text" ? `글자 "${o.text}"` : `사각형 ${o.w}×${o.h}`}, ${o.color}, (${Math.round(o.x)}, ${Math.round(o.y)}))`).join(", ");
    const moved = Object.entries(n.vals.moved || {}).map(([id, p]) => `${id}는 (${Math.round(p.x)}, ${Math.round(p.y)})`).join(", ");
    const ctx = { genre: n.genre, desc: g.desc, path: trail(n, D).map((x) => x.choice).join(" → "), choice: n.choice, goal: n.goal, extra: [objs && `무대 목업의 물체: ${objs}`, moved && `학생이 옮긴 위치: ${moved}`].filter(Boolean).join(" / ") };
    try {
      const out = (await run("내 게임 버전 만드는 중", (log) => askAI(ai, TUTOR, personalPrompt(orig, ctx), false, log))).trim();
      const v = verifyPersonal(orig, out);
      if (!v.ok) return toast(`원문에서 달라진 줄이 있어 보여 주지 않아요: ${v.missing[0]}`);
      n.vals.personal = { ...n.vals.personal, [key]: out }; saveNode(n); refreshPage();
    } catch (e) { fail(e); }
  });

  // 실험실에서 해 본 일 → 자동 체크
  function labDone(key) {
    const n = curNode();
    if (!n || cur.mode === "share" || n.labs[key] || !labAutos(n, n.k === 6 ? featuresOf(n.choice) : null).some(([k]) => k === key)) return;
    const was = (() => { const p = progress(itemsOf(n)); return p.done === p.total; })();
    n.labs[key] = true; saveNode(n); refreshPage();
    toast(`✓ 실험 완료: ${LABS[n.k].auto.find(([k]) => k === key)[1]}`);
    const p = progress(itemsOf(n)); if (!was && p.done === p.total) celebrate(n);
  }
  function pushVal(key, value) { const n = curNode(); if (!n || cur.mode === "share") return; const a = (n.vals[key] || []).filter((x) => x !== value); a.push(value); n.vals[key] = a.slice(-12); saveNode(n); refreshPage(); }
  function celebrate(n) {
    toast(`미션 ${n.k} 완료! ${n.k < 6 ? "아래 '다음 미션'에서 연관 검색어를 골라요" : "6개 미션을 모두 끝냈어요"}`);
    const hero = main.querySelector(".hero"); if (hero) { hero.classList.add("party"); setTimeout(() => hero.classList.remove("party"), 1200); }
  }

  // ================= 무대 (페이지마다 옮겨 다니는 카드 하나) — 800×600, 워크북과 같은 크기 =================
  const cv = h("canvas", { id: "stage", width: SCENE_W, height: SCENE_H, tabindex: 0, "aria-label": "게임 무대" });
  const stageTitle = h("span"), stageBtnsEl = h("div", { class: "stage-btns" }), labBar = h("div", { class: "lab-bar" }), consoleEl = h("pre", { class: "fake-console", hidden: true }), stageNote = h("div", { class: "stage-note" });
  const stageCard = h("section", { class: "card stage-card", id: "stagecard" }, h("h2", {}, stageTitle, stageBtnsEl), cv, labBar, consoleEl, stageNote);
  const g2 = cv.getContext("2d");
  const stage = {};
  const STAGE0 = () => ({
    scene: null, w: null, inp: "key", k: 0, control: false, method: "B", playing: !matchMedia("(prefers-reduced-motion: reduce)").matches,
    keys: new Set(), pulses: [], clicks: [], jump: false, mouse: null, sel: null, drag: null, step: false, showcase: -1,
    grid: false, coords: false, practice: false, noClear: false, frozen: false, noDraw: false, speed: 1, ballVx: 3, ballVy: 0, triedE4: new Set(),
    moveSpeed: 5, flip: false, lockY: false, mine: false, hitbox: false, shrink: 0, enemySpeed: 1, debug: false, bugs: false,
    start: false, sound: false, mute: false, diff: false, best: false, newBest: false, holdAt: {}, _es0: 1, _sh0: 0, empty: false,
  });
  Object.assign(stage, STAGE0());
  let audio;
  function beep(freq, ms) {
    if (!stage.sound || stage.mute) return;
    try {
      audio = audio || new AudioContext();
      const o = audio.createOscillator(), gn = audio.createGain();
      o.frequency.value = freq; gn.gain.value = 0.08; o.connect(gn).connect(audio.destination);
      o.start(); gn.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + ms / 1000); o.stop(audio.currentTime + ms / 1000);
    } catch (e) {}
  }
  const bestKey = () => `best:${cur.id}`;
  const curSet = () => { const n = curNode(); return n ? settingOf(n, data()) : { control: null, scoreMode: "time", features: null }; };
  function sceneNow() { return stage.k === 2 && stage.practice ? { ...PRACTICE_BALL, objects: PRACTICE_BALL.objects.map((o) => ({ ...o, vx: stage.ballVx, vy: stage.ballVy })) } : stage.scene; }
  function resetWorld() {
    const sc = sceneNow();
    stage.w = sc ? makeWorld(sc, stage.k === 6 && stage.start && stage.control ? "start" : "playing") : null;
    stage.newBest = false; stage.frozenDrawn = false;
  }
  function setScene(scene, inp = "key") { stage.scene = scene; stage.inp = inp; stage.sel = null; stage.drag = null; resetWorld(); }
  const playable = () => stage.control && stage.k >= 4;
  const showcase = Object.values(presetState().nodes);
  let lastTs = 0, mmTick = 0;
  function frame(ts) {
    const dt = Math.min(0.05, lastTs ? (ts - lastTs) / 1000 : 1 / 60); lastTs = ts;
    if (stage.showcase >= 0) { // 홈: 피하기 미션 1→6을 차례로 보여 준다
      const idx = Math.floor(stage.showcase / 220) % showcase.length;
      if (stage.showcase % 220 === 0) { setScene(showcase[idx].scene, "key"); stageTitle.textContent = `피하기 미션 ${idx + 1} · ${showcase[idx].choice}`; }
      stage.showcase++;
    }
    if (stage.w && cv.isConnected) {
      const set = curSet(), ctl = stage.k === 3 && !stage.mine ? (stage.lockY ? "lr" : "4way") : set.control || (stage.lockY ? "lr" : "4way");
      const frozenNow = stage.frozen && stage.frozenDrawn;
      if ((stage.playing || stage.control || stage.step) && !stage.drag && !frozenNow && !stage.noDraw) {
        const ev = tick(stage.w, {
          speed: stage.k === 2 && !stage.practice ? stage.speed : stage.k >= 4 ? stage.enemySpeed : 1,
          diff: stage.k === 6 && stage.diff ? { inc: 0.2, cap: 2 } : null, play: playable(), scoreMode: set.scoreMode,
          control: ctl, moveSpeed: stage.moveSpeed, flip: stage.flip, shrink: stage.shrink,
          bugs: stage.k === 5 && stage.bugs ? { ref: true, hitbox: true, concat: true } : null,
          input: stage.control ? { method: stage.k === 3 && !stage.mine ? stage.method : "B", keys: stage.keys, pulses: stage.pulses.splice(0), mouse: stage.mouse, clicks: stage.clicks.splice(0), jump: stage.keys.has(" ") } : null,
        }, dt);
        if (ev.scored) beep(880, 90);
        if (ev.died) onDied();
        stage.step = false;
        if (stage.k === 6 && stage.diff && stage.w.elapsed > 20) labDone("diff");
      }
      if (stage.frozen) stage.frozenDrawn = true;
      const best = stage.k === 6 && stage.best ? Number(Store.get(bestKey(), 0) || 0) : null;
      drawWorld(g2, sceneNow(), stage.w, {
        noClear: stage.noClear, noDraw: stage.noDraw, grid: stage.grid, coords: stage.coords, hitbox: stage.hitbox, debug: stage.debug, shrink: stage.shrink,
        bugs: stage.k === 5 && stage.bugs ? { hitbox: true } : null, sel: stage.sel, mouse: stage.mouse,
        hud: playable(), best, newBest: stage.newBest, mute: stage.k === 6 && stage.sound && stage.mute,
        start: stage.k === 6 ? { title: curNode()?.genre || "", goal: curNode()?.goal || "", controls: "방향키로 이동 · R 재시작" + (stage.sound ? " · M 음소거" : "") } : null,
      });
      if (stage.k === 5 && stage.bugs) { consoleEl.hidden = !stage.w.errors; consoleEl.textContent = `콘솔 (F12)\n${BUGS[0].console}${stage.w.errors > 1 ? `  ×${stage.w.errors}` : ""}`; } else consoleEl.hidden = true;
    } else if (!stage.w && cv.isConnected && stage.empty) { g2.fillStyle = "#111216"; g2.fillRect(0, 0, SCENE_W, SCENE_H); }
    if (++mmTick % 15 === 0) paintMini();
    requestAnimationFrame(frame);
  }
  function onDied() {
    beep(160, 300);
    const n = curNode(); if (!n) return;
    const sec = Math.round(stage.w.elapsed * 10) / 10;
    if (stage.k === 4 || stage.k === 6) pushVal("runs", sec);
    labDone("gameover");
    if (stage.k === 4 && sec >= 10 && sec <= 30) labDone("tuned");
    if (stage.k === 6 && stage.best) {
      const best = Number(Store.get(bestKey(), 0) || 0), score = Number(stage.w.score) || 0; // 8장 Step 4: Number()로 숫자 비교
      if (score > best) { Store.set(bestKey(), score); stage.newBest = true; labDone("best"); }
    }
    if (stage.k === 5 && stage.bugs) stageNote.textContent = "방금 이상하지 않았나요? 디버그 표시(D)를 켜고 판정 영역·점수를 보며 원인을 좁혀 보세요.";
  }
  // 무대 입력. 무대는 칸 비율에 맞춰 여백을 두고 그려지므로(object-fit: contain) 그 여백을 빼고 장면 좌표로 바꾼다
  const toScene = (e) => {
    const r = cv.getBoundingClientRect(), s = Math.min(r.width / SCENE_W, r.height / SCENE_H);
    return { x: (e.clientX - r.left - (r.width - SCENE_W * s) / 2) / s, y: (e.clientY - r.top - (r.height - SCENE_H * s) / 2) / s };
  };
  cv.addEventListener("keydown", (e) => {
    if (stage.w?.state === "start") { e.preventDefault(); stage.w.state = "playing"; labDone("start"); return; } // 8장: 아무 키나 눌러 시작
    if (e.key === "r" || e.key === "R") { const was = stage.w?.state === "gameover"; resetWorld(); if (was) labDone("restart"); return; }
    if ((e.key === "m" || e.key === "M") && stage.k === 6 && stage.sound) { stage.mute = !stage.mute; labDone("sound"); return; }
    if ((e.key === "d" || e.key === "D") && stage.k === 5) { toggleDebug(); return; }
    if (!stage.control) return;
    if (/^Arrow| /.test(e.key)) e.preventDefault(); // 5장 Step 3: 방향키·스페이스바로 페이지가 스크롤되지 않게
    stage.keys.add(e.key);
    if (stage.k === 3 && !stage.mine) {
      if (stage.method === "A") {
        const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
        if (d) stage.pulses.push({ dx: d[0], dy: d[1] });
        if (e.repeat) labDone("aHold");
      } else {
        if (!stage.holdAt[e.key]) stage.holdAt[e.key] = performance.now();
        const hz = ["ArrowLeft", "ArrowRight"].some((k) => stage.keys.has(k)), vt = ["ArrowUp", "ArrowDown"].some((k) => stage.keys.has(k));
        if (hz && vt) labDone("bDiag");
      }
    }
  });
  cv.addEventListener("keyup", (e) => {
    if (stage.k === 3 && !stage.mine && stage.method === "B" && stage.holdAt[e.key] && performance.now() - stage.holdAt[e.key] > 500) labDone("bHold");
    delete stage.holdAt[e.key]; stage.keys.delete(e.key);
  });
  cv.addEventListener("blur", () => { if (refreshing) return; stage.keys.clear(); stage.holdAt = {}; });
  cv.addEventListener("pointerdown", (e) => {
    cv.focus({ preventScroll: true });
    if (!stage.w) return;
    const p = toScene(e);
    if (stage.control && curSet().control === "click") { stage.clicks.push(p); return; }
    if (stage.k === 1 && !stage.control) {
      const o = pickAt(stage.w, p.x, p.y);
      stage.sel = o ? o.id : null;
      if (o) { stage.drag = { id: o.id, dx: p.x - o.x, dy: p.y - o.y }; cv.setPointerCapture(e.pointerId); }
      paintLab();
    }
  });
  cv.addEventListener("pointermove", (e) => {
    stage.mouse = toScene(e);
    if (stage.grid) labDone("grid");
    if (stage.drag && stage.w) {
      const o = stage.w.objs.find((x) => x.id === stage.drag.id);
      if (o) { o.x = Math.round(stage.mouse.x - stage.drag.dx); o.y = Math.round(stage.mouse.y - stage.drag.dy); o.x0 = o.x; o.y0 = o.y; }
    }
  });
  cv.addEventListener("pointerup", () => {
    if (!stage.drag || !stage.w) return;
    const o = stage.w.objs.find((x) => x.id === stage.drag.id), n = curNode();
    stage.drag = null;
    if (o && n && cur.mode !== "share") { n.vals.moved = { ...n.vals.moved, [o.id]: { x: o.x, y: o.y } }; saveNode(n); labDone("drag"); refreshPage(); }
  });
  cv.addEventListener("pointerleave", () => { if (!stage.drag) stage.mouse = null; });
  function toggleDebug() { stage.debug = !stage.debug; if (stage.debug) labDone("debug"); paintLab(); }

  function stageButtons() {
    fill(stageBtnsEl);
    if (!stage.w || stage.showcase >= 0) return;
    const n = curNode(), D = data();
    const hasPlayer = stage.w.objs.some((o) => o.role === "player");
    stageBtnsEl.append(
      h("button", { type: "button", onclick: () => { stage.playing = !stage.playing; stageButtons(); } }, stage.playing ? "멈춤" : "움직임"),
      stage.k >= 3 ? h("button", { type: "button", class: stage.control ? "on" : "", disabled: !hasPlayer, title: hasPlayer ? "" : "이 장면에는 플레이어가 없어요", onclick: () => {
        stage.control = !stage.control; stage.keys.clear(); resetWorld(); stageButtons(); paintLab();
        if (stage.control) cv.focus({ preventScroll: true });
      } }, stage.control ? "그만하기" : "직접 해 보기") : null);
    const hist = n ? trail(n, D).filter((x) => x.scene) : [];
    if (hist.length > 1) {
      stageBtnsEl.append(h("span", { class: "s" }, "미션 비교"));
      for (const x of hist) stageBtnsEl.append(h("button", { type: "button", class: x.scene === stage.scene ? "on" : "", title: x.choice, onclick: () => {
        stage.control = false; stage.practice = false; setScene(x.scene, stage.inp); stageTitle.textContent = x === n ? `미션 ${n.k}까지 쌓인 목표 모습` : `미션 ${x.k} 때 모습`; stageButtons(); paintLab();
      } }, String(x.k)));
    }
  }
  function paintLab() {
    fill(labBar); stageNote.textContent = "";
    const n = curNode();
    if (!n || !stage.w || stage.showcase >= 0) return;
    const k = n.k, L = LABS[k], set = settingOf(n, data());
    const tog = (label, key, extra) => h("button", { type: "button", class: stage[key] ? "on" : "", onclick: () => { stage[key] = !stage[key]; extra && extra(stage[key]); paintLab(); } }, label);
    const slider = (label, min, max, step, val, fmt, oninput, onchange) => { const out = h("output", {}, fmt(val)); return h("label", { class: "slider" }, label, h("input", { type: "range", min, max, step, value: val, "aria-label": label, oninput: (e) => { oninput(Number(e.target.value)); out.textContent = fmt(Number(e.target.value)); }, onchange: (e) => onchange(Number(e.target.value)) }), out); };
    labBar.append(h("span", { class: "nm" }, `${L.name} · ${L.ref}`));
    if (k === 1) {
      labBar.append(tog("좌표 연습 (Step 2)", "coords", (on) => on && labDone("coords")), tog("격자 · 마우스 좌표", "grid"));
      stageNote.textContent = stage.coords ? "예상한 자리와 맞나요? 0, 0은 왼쪽 위, y가 커지면 아래예요." : stage.sel ? "끌어서 옮겨 보세요. fillRect의 x, y 숫자가 바뀌어요." : L.tip;
    }
    if (k === 2) {
      labBar.append(h("button", { type: "button", class: stage.practice ? "on" : "", onclick: () => { stage.practice = true; resetWorld(); paintLab(); } }, "연습용 공 (Step 1·3)"), h("button", { type: "button", class: stage.practice ? "" : "on", onclick: () => { Object.assign(stage, { practice: false, noClear: false, frozen: false, noDraw: false }); resetWorld(); paintLab(); } }, "내 게임 (Step 4·5)"));
      if (stage.practice) {
        labBar.append(
          tog("실험 1: clearRect 빼기", "noClear", (on) => { if (on) labDone("e1"); resetWorld(); }),
          tog("실험 2: 다음 프레임 예약 빼기", "frozen", (on) => { if (on) labDone("e2"); resetWorld(); }),
          tog("실험 3: gameLoop(); 빼기", "noDraw", (on) => { if (on) labDone("e3"); resetWorld(); }),
          h("span", { class: "s" }, "실험 4 speedX ="), ...[1, 20, -3, 0].map((v) => h("button", { type: "button", class: stage.ballVx === v ? "on" : "", onclick: () => { stage.ballVx = v; stage.triedE4.add(v); if (stage.triedE4.size >= 4) labDone("e4"); resetWorld(); paintLab(); } }, String(v))),
          h("button", { type: "button", class: stage.ballVy ? "on" : "", onclick: () => { stage.ballVy = stage.ballVy ? 0 : 2; if (stage.ballVy) labDone("e5"); resetWorld(); paintLab(); } }, "실험 5: speedY = 2"),
          h("button", { type: "button", onclick: () => { Object.assign(stage, { noClear: false, frozen: false, noDraw: false, ballVx: 3, ballVy: 0 }); resetWorld(); paintLab(); } }, "모두 되돌리기"));
        stageNote.textContent = stage.noClear ? "공이 지나간 자리가 다 남아요 — '지우고 다시 그린다'의 증거." : stage.frozen ? "공이 처음 위치에 멈춰 있어요 — 딱 한 프레임만 그려졌어요." : stage.noDraw ? "화면이 완전히 비어 있어요 — 함수를 만들어만 두고 부르지 않았어요." : "실험은 하나씩 하고, 확인한 뒤 되돌려요. (4장 Step 3)";
      } else {
        const base = baseSpeed(stage.scene);
        labBar.append(slider("속도 값", 1, 12, 1, Math.round(base * stage.speed), (v) => `${v}`, (v) => { stage.speed = v / base; }, (v) => pushVal("tried", v)));
        stageNote.textContent = "Step 5: AI 없이 숫자만 바꿔 마음에 드는 느낌을 찾아요. 시도한 값은 아래 과제 2 표에 모여요 (느낌·판단은 직접 써요).";
      }
    }
    if (k === 3) {
      for (const m of ["A", "B"]) labBar.append(h("button", { type: "button", class: !stage.mine && stage.method === m ? "on" : "", onclick: () => { stage.mine = false; stage.method = m; resetWorld(); paintLab(); cv.focus({ preventScroll: true }); } }, m === "A" ? "방식 A (Step 2 · keydown마다 5px)" : "방식 B (Step 3 · keys 기억)"));
      labBar.append(h("button", { type: "button", class: stage.mine ? "on" : "", onclick: () => { stage.mine = true; resetWorld(); paintLab(); cv.focus({ preventScroll: true }); } }, `내 게임 조작 (Step 6): ${n.choice}`),
        tog("방향 뒤집기 (− ↔ +)", "flip", (on) => on && labDone("flip")), tog("위아래 막기", "lockY"),
        slider("이동 속도", 1, 15, 1, stage.moveSpeed, (v) => `${v}`, (v) => { stage.moveSpeed = v; }, (v) => pushVal("moveTried", v)));
      stageNote.textContent = !stage.control ? "먼저 위의 '직접 해 보기'를 켜요." : stage.mine ? ({ mousex: "무대 위에서 마우스를 움직여 보세요.", click: "무대를 클릭하면 그 자리에 작은 원이 생겨요.", jump: "←→로 움직이고 스페이스바로 점프해 보세요.", lr: "←→로 좌우만 움직여요.", "4way": "방향키 네 개로 움직여요." }[set.control || "4way"]) : stage.method === "A" ? "꾹 눌러 보세요 — 한 칸 가고 잠깐 멈췄다가 다다다다 움직여요. 오른쪽+위도 같이 눌러 보세요." : "꾹 눌러 보세요 — 매끄럽게 움직여요. 오른쪽+위를 같이 누르면 대각선으로 가요.";
    }
    if (k === 4) {
      labBar.append(tog("판정 영역 보기 (showHitbox)", "hitbox", (on) => on && labDone("hitbox")), h("button", { type: "button", onclick: () => { const was = stage.w?.state === "gameover"; resetWorld(); if (was) labDone("restart"); cv.focus({ preventScroll: true }); } }, "다시 (R)"),
        slider("적 속도 ×", 0.5, 2, 0.25, stage.enemySpeed, (v) => `${v}`, (v) => { stage.enemySpeed = v; }, (v) => { tune("적 속도 ×", stage._es0 ?? 1, v); stage._es0 = v; }),
        slider("판정 영역 줄이기", 0, 8, 1, stage.shrink, (v) => `${v}px`, (v) => { stage.shrink = v; }, (v) => { tune("판정 영역 (양쪽)", `${stage._sh0 ?? 0}px 작게`, `${v}px 작게`); stage._sh0 = v; }));
      stageNote.textContent = stage.control ? `${set.scoreMode === "item" ? "아이템에 닿으면 10점" : "버틴 시간(초)이 점수"} · 적에 닿으면 GAME OVER · R 키로 다시. 목표는 10~30초 버티는 수준.` : "'직접 해 보기'를 켜면 진짜로 부딪혀요.";
    }
    if (k === 5) {
      labBar.append(h("button", { type: "button", class: stage.debug ? "on" : "", onclick: toggleDebug }, "디버그 표시 (D · showDebug)"), tog("숨은 버그 3개 심기 (Step 2)", "bugs", () => resetWorld()), h("button", { type: "button", onclick: () => { resetWorld(); cv.focus({ preventScroll: true }); } }, "다시 (R)"));
      if (stage.bugs && !n.vals.huntChecked && cur.mode !== "share") {
        const ins = [0, 1, 2].map((i) => h("input", { type: "text", placeholder: `찾은 버그 ${i + 1} (무엇이 이상한가)`, value: (n.vals.hunt || [])[i] || "" }));
        labBar.append(h("div", { class: "bug-quiz" }, h("b", {}, "AI에게 묻지 말고 찾아요. 에러 1개 + 조용한 버그 2개"), ...ins,
          h("button", { type: "button", onclick: () => {
            const hunt = ins.map((x) => x.value.trim());
            if (!hunt.some(Boolean)) return toast("찾은 것을 하나 이상 적어 주세요");
            const nn = curNode(); nn.vals.hunt = hunt; nn.vals.huntChecked = true; saveNode(nn); stage.bugs = false; resetWorld(); labDone("hunt"); refreshPage();
          } }, "확인 — 심은 버그 보기")));
      }
      if (n.vals.huntChecked) labBar.append(h("div", { class: "bug-quiz" }, h("b", {}, "심었던 버그"), h("ol", {}, BUGS.map((b) => h("li", {}, `[${b.kind}] ${b.desc}`))), h("span", { class: "s" }, "두 개만 찾아도 충분해요. 찾는 과정이 회고 2번의 재료예요.")));
      stageNote.textContent = stage.bugs ? "'직접 해 보기'로 한 판 해 보고, 콘솔과 디버그 표시를 보며 이상한 점을 적어요." : L.tip;
    }
    if (k === 6) {
      const f = featuresOf(n.choice), mark = (key) => (f[key] ? " ★" : "");
      labBar.append(tog(`시작 화면${mark("start")}`, "start", () => resetWorld()), tog(`효과음 · M 음소거${mark("sound")}`, "sound", (on) => on && beep(660, 120)), tog(`난이도 상승${mark("diff")}`, "diff", () => resetWorld()), tog(`최고 점수 저장${mark("best")}`, "best"),
        h("button", { type: "button", onclick: () => { resetWorld(); cv.focus({ preventScroll: true }); } }, "다시 (R)"));
      const best = Number(Store.get(bestKey(), 0) || 0);
      stageNote.textContent = `★ = 내가 고른 것 (${n.choice}). ${stage.diff ? "10초마다 조금씩 어려워지고 상한(×2)에서 멈춰요. " : ""}${stage.best ? `최고 점수 ${best || 0} — localStorage에 저장돼서 새로고침해도 남아요.` : ""}`;
    }
  }
  function tune(what, before, after) { if (String(before) === String(after)) return; const n = curNode(); if (!n || cur.mode === "share") return; n.vals.tune = [...(n.vals.tune || []), { what, before: String(before), after: String(after) }].slice(-20); saveNode(n); refreshPage(); }
  function resetStageFor(n, g) {
    Object.assign(stage, STAGE0(), { playing: stage.playing });
    if (!n) { stage.empty = true; stage.scene = null; stage.w = null; return; }
    const v = n.vals || {};
    stage.k = n.k; stage.empty = false;
    let scene = n.scene;
    if (scene && n.k === 1 && v.moved && Object.keys(v.moved).length) scene = { ...scene, objects: scene.objects.map((o) => (v.moved[o.id] ? { ...o, ...v.moved[o.id] } : o)) };
    if (n.k === 6) { const f = featuresOf(n.choice); Object.assign(stage, { start: f.start, sound: f.sound, diff: f.diff, best: f.best }); }
    setScene(scene, g.inp);
    stageTitle.textContent = `미션 ${n.k}까지 쌓인 목표 모습 · 800×600`;
  }

  // ================= 연관 검색어 (검색창 + 칩) =================
  const q = h("input", { type: "search", id: "q", autocomplete: "off", "aria-label": "연관 검색어 검색", enterkeyhint: "search" });
  const sug = h("ul", { class: "suggest", role: "listbox", hidden: true });
  const chips = h("div", { class: "chips" });
  const dock = h("div", { class: "dock" }, h("div", { class: "gsearch" }, q, sug), chips);
  function paintChips() {
    fill(chips);
    if (cur.mode === "home") {
      q.placeholder = "어떤 게임을 만들고 싶어? 예: 미로, 리듬 게임, 슈팅";
      chips.append(h("span", { class: "lbl" }, "연관 검색어"));
      for (const g of Object.values(S.genres)) chips.append(h("button", { type: "button", class: "chip", onclick: () => go(genreHash(g.name)) }, g.name));
      chips.append(h("button", { type: "button", class: "chip ghost", onclick: () => newGenre() }, "+ 새 형식"));
      return;
    }
    const ctx = nextCtx();
    if (!ctx) return;
    q.placeholder = ctx.fixed ? `워크북이 정해 둔 선택지 중에서 골라요 (미션 ${ctx.k} ${STEPS[ctx.k - 1][0]})` : `미션 ${ctx.k}(${STEPS[ctx.k - 1][0]})에서 하고 싶은 것을 검색… 예: ${ctx.list[0] || ""}`;
    chips.append(h("span", { class: "lbl" }, ctx.fixed ? "워크북 선택지" : "연관 검색어"));
    const shown = new Set();
    for (const c of ctx.list) {
      const id = nodeId(ctx.genre, ctx.k, c), exists = S.nodes[id], pre = pending.get(id);
      shown.add(c);
      const b = h("button", { type: "button", class: `chip ${exists ? "done" : pre ? (pre.ready ? "ready" : "loading") : ""}`, title: exists ? "이미 만든 갈래 — 눌러서 열기" : pre?.ready ? "미리 만들어 둠 — 누르면 바로 열려요" : "이 방향으로 다음 미션 만들기", onclick: () => choose(ctx.genre, ctx.fromId, c) }, c);
      if (!exists) hoverPrefetch(b, ctx.genre, ctx.fromId, c);
      chips.append(b);
    }
    for (const n of childrenOf(ctx.genre, ctx.fromId, S)) if (!shown.has(n.choice)) chips.append(h("button", { type: "button", class: "chip done", onclick: () => go(nodeHash(n.id)) }, n.choice));
  }
  let items = [], sel = -1, aiTimer, aiSeq = 0;
  const aiCache = new Map();
  function localItems(text) {
    const low = text.toLowerCase(), out = [], ctx = nextCtx();
    if (ctx) {
      for (const c of ctx.list) if (!low || c.toLowerCase().includes(low)) out.push({ label: c, sub: ctx.fixed ? "워크북 선택지" : `미션 ${ctx.k} 연관 검색어`, act: () => choose(ctx.genre, ctx.fromId, c) });
      if (text && !ctx.fixed && !ctx.list.includes(text)) out.push({ label: `"${text}" 방향으로 미션 ${ctx.k} 만들기`, sub: "AI", act: () => choose(ctx.genre, ctx.fromId, text) });
    }
    for (const g of Object.values(S.genres)) if (!low || (g.name + g.desc).toLowerCase().includes(low)) out.push({ label: g.name, sub: g.desc, act: () => go(genreHash(g.name)) });
    if (low) for (const n of Object.values(S.nodes)) if ((n.choice + n.goal).toLowerCase().includes(low)) out.push({ label: `${n.genre} · 미션 ${n.k} ${n.choice}`, sub: "내 기록", act: () => go(nodeHash(n.id)) });
    if (text && !S.genres[cleanName(text)] && !ctx) out.push({ label: `"${text}" 새 형식 만들기`, sub: "AI", act: () => newGenre(text) });
    return out;
  }
  function paintSuggest(list, aiList, loading) {
    const ctx = nextCtx();
    const aiItems = (aiList || []).map((s) => (ctx
      ? { label: s, sub: "AI 추천", ai: true, act: () => choose(ctx.genre, ctx.fromId, s) }
      : { label: s, sub: "AI 추천 형식", ai: true, act: () => (S.genres[s] ? go(genreHash(s)) : newGenre(s)) }));
    items = [...list.slice(0, 7), ...aiItems];
    sel = -1;
    fill(sug, items.map((it, i) => h("li", { role: "option", class: it.ai ? "ai" : "", onmousedown: (e) => { e.preventDefault(); pick(i); } }, it.ai ? h("b", {}, it.label) : h("span", {}, it.label), h("span", { class: "s" }, it.sub))),
      loading ? h("li", {}, h("span", { class: "s" }, "AI 연관 검색어 찾는 중…")) : null);
    sug.hidden = !items.length && !loading;
  }
  function suggest() {
    const text = q.value.trim(), list = localItems(text), ctx = nextCtx();
    clearTimeout(aiTimer);
    if (cur.mode === "share" || text.length < 2 || !ai.key || (ctx && ctx.fixed)) return paintSuggest(list);
    const ck = `${ctx ? ctx.fromId || ctx.genre : "home"}|${text}`;
    if (aiCache.has(ck)) return paintSuggest(list, aiCache.get(ck));
    paintSuggest(list, [], true);
    const seq = ++aiSeq;
    aiTimer = setTimeout(async () => {
      try {
        const path = ctx && ctx.fromId ? trail(S.nodes[ctx.fromId], S).map((n) => n.choice).join(" → ") : "";
        const out = normSuggest(parseJson(await askAI(ai, TUTOR, suggestPrompt(text, ctx && { genre: ctx.genre, k: ctx.k, path }), true)));
        aiCache.set(ck, out);
        if (seq === aiSeq && document.activeElement === q) paintSuggest(localItems(q.value.trim()), out);
      } catch (e) { if (seq === aiSeq) paintSuggest(localItems(q.value.trim())); }
    }, 600);
  }
  function pick(i) { const it = items[i]; if (!it) return; sug.hidden = true; q.value = ""; q.blur(); it.act(); }
  q.addEventListener("input", suggest);
  q.addEventListener("focus", suggest);
  q.addEventListener("blur", () => setTimeout(() => (sug.hidden = true), 120));
  q.addEventListener("keydown", (e) => {
    if ((e.key === "ArrowDown" || e.key === "ArrowUp") && items.length) {
      e.preventDefault(); sel = (sel + (e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
      [...sug.children].forEach((li, i) => li.classList.toggle("on", i === sel));
    } else if (e.key === "Enter") { e.preventDefault(); pick(sel < 0 ? 0 : sel); }
    else if (e.key === "Escape") { sug.hidden = true; q.blur(); }
  });

  // ================= 왼쪽 목차 =================
  const foldSt = {};
  function sideItem(label, sub, onclick, { active = false, bar = null, cls = "" } = {}) {
    return h("button", { class: `side-item ${active ? "active" : ""} ${cls}`, onclick: () => { onclick(); if (innerWidth < 900) setSide(false); } },
      h("span", { class: "txt" }, sub ? h("small", {}, sub) : null, h("span", {}, label), bar != null ? h("div", { class: "mini-bar" }, h("i", { style: `width:${bar}%` })) : null));
  }
  function renderSide() {
    const nav = $("#side-nav"), D = S, here = cur.mode === "node" ? cur.id : null, gNow = curGenre();
    const out = [h("div", { class: "side-group" }, "시작"), sideItem("홈", null, () => go("#/"), { active: cur.mode === "home" }), sideItem("경로 지도", "갈래를 크게 보기", openMap)];
    const mine = Object.values(D.genres).filter((g) => Object.values(D.nodes).some((n) => n.genre === g.name && touched(n)) || g.ai || g.name === gNow);
    const rest = Object.values(D.genres).filter((g) => !mine.includes(g));
    for (const g of mine) {
      const shut = g.name in foldSt ? foldSt[g.name] : g.name !== gNow;
      out.push(h("div", { class: "side-group", style: "cursor:pointer", onclick: () => { foldSt[g.name] = !shut; renderSide(); } }, `${g.name} ${shut ? "▸" : "▾"}`));
      if (shut) continue;
      out.push(sideItem("형식 소개 · 미션 1 고르기", `${g.lvl} · ${g.ctl}`, () => go(genreHash(g.name)), { active: cur.mode === "genre" && cur.genre === g.name }));
      const walk = (pid) => childrenOf(g.name, pid, D).forEach((n) => {
        const p = progress(itemsOf(n));
        out.push(sideItem(n.choice, `미션 ${n.k} ${STEPS[n.k - 1][0]} · 워크북 ${STEPS[n.k - 1][1]}장 · ${p.done}/${p.total}`, () => go(nodeHash(n.id)), { active: n.id === here, bar: Math.round((p.done / p.total) * 100), cls: `d${n.k} ${p.done === p.total ? "full" : ""}` }));
        walk(n.id);
      });
      walk("");
    }
    if (rest.length) { out.push(h("div", { class: "side-group" }, "게임 형식 고르기")); for (const g of rest) out.push(sideItem(g.name, g.desc, () => go(genreHash(g.name)), { active: cur.mode === "genre" && cur.genre === g.name })); }
    const wbN = Object.keys(CH).length;
    out.push(h("div", { class: "side-group" }, "도구"), sideItem("워크북 폴더 연결", wbN ? `${wbN}개 장${COMMON ? " + 부록 E" : ""} 연결됨` : "꼭 필요 — 과정은 원문에서 읽어요", () => $("#wb-pick").click(), { cls: wbN ? "" : "warn" }), sideItem("새 형식 만들기", "AI로 내 게임 형식 추가", () => newGenre()), sideItem("API 키", ai.key ? "연결됨" : "아직 없음", openKey));
    fill(nav, out);
  }
  function setSide(isOpen) { document.body.classList.toggle("side-closed", !isOpen); Store.set("sideOpen", isOpen); }
  $("#side-toggle").addEventListener("click", () => setSide(document.body.classList.contains("side-closed")));
  $("#side-close").addEventListener("click", () => setSide(false));

  // ================= 위쪽: 미니맵 · 큰 지도 =================
  function mapModel(genre) {
    const D = cur.mode === "share" ? data() : S, ctx = cur.mode === "share" ? null : nextCtx();
    const ghosts = ctx && ctx.genre === genre ? ctx.list.filter((c) => !S.nodes[nodeId(genre, ctx.k, c)]).map((c) => ({ parent: ctx.fromId, choice: c })) : [];
    return layoutTree(genre, Object.values(D.nodes).filter((n) => n.genre === genre), ghosts);
  }
  const mini = $("#minimap canvas"), mg = mini.getContext("2d");
  function paintMini() {
    const W = mini.width, H = mini.height;
    mg.clearRect(0, 0, W, H); mg.fillStyle = "#f5f5f7"; mg.fillRect(0, 0, W, H);
    const genre = curGenre();
    if (!genre) { mg.fillStyle = "#86868b"; mg.font = "600 20px sans-serif"; mg.textBaseline = "middle"; mg.fillText("경로 지도", 14, H / 2); return; }
    const L = mapModel(genre), here = cur.mode === "genre" ? "" : cur.id;
    const sx = (d) => 14 + (L.cols > 1 ? d * ((W - 28) / (L.cols - 1)) : (W - 28) / 2), sy = (y) => (L.rows > 1 ? 12 + y * ((H - 24) / (L.rows - 1)) : H / 2);
    mg.strokeStyle = "#c7c7cc"; mg.lineWidth = 3;
    for (const e of L.edges) { mg.beginPath(); mg.moveTo(sx(e.depth), sy(e.y1)); mg.lineTo(sx(e.depth + 1), sy(e.y2)); mg.stroke(); }
    const blink = Math.floor(Date.now() / 450) % 2;
    for (const it of L.items) {
      const x = sx(it.depth), y = sy(it.y), isHere = it.kind === "root" ? here === "" : it.id === here;
      mg.beginPath(); mg.arc(x, y, isHere ? 8 : 5.5, 0, 7);
      if (it.kind === "ghost") { mg.strokeStyle = pending.get(nodeId(genre, it.depth, it.choice))?.ready ? "#1d1d1f" : "#aeaeb2"; mg.lineWidth = 2; mg.stroke(); }
      else { mg.fillStyle = isHere ? (blink ? "#1d1d1f" : "#86868b") : "#1d1d1f"; mg.fill(); }
    }
  }
  $("#minimap").onclick = openMap;
  function openMap() {
    const m = modal("#map-modal"), genre = curGenre() || Object.keys(S.genres)[0];
    const tabs = m.querySelector(".map-genres");
    const paintTabs = (gn) => fill(tabs, Object.values(S.genres).map((g) => h("button", { type: "button", class: `chip ${g.name === gn ? "on" : ""}`, onclick: () => { paintBigMap(g.name); paintTabs(g.name); } }, g.name)));
    paintTabs(genre); open(m); paintBigMap(genre);
  }
  function paintBigMap(genre) {
    const m = modal("#map-modal"), box = m.querySelector(".big-map");
    const L = mapModel(genre), D = cur.mode === "share" ? data() : S, here = cur.mode === "genre" ? (cur.genre === genre ? "" : null) : cur.id;
    const COL = 230, ROW = 56, PW = 200, PH = 38, PAD = 16, W = L.cols * COL + PAD, H = L.rows * ROW + PAD;
    const NS = "http://www.w3.org/2000/svg", svg = document.createElementNS(NS, "svg");
    const el = (tag, attrs, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v); kids.forEach((c) => e.append(c)); return e; };
    svg.setAttribute("width", W); svg.setAttribute("height", H); svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    const px = (d) => PAD + d * COL, py = (y) => PAD + y * ROW;
    for (const e of L.edges) { const x1 = px(e.depth) + PW, y1 = py(e.y1) + PH / 2, x2 = px(e.depth + 1), y2 = py(e.y2) + PH / 2, mx = (x1 + x2) / 2; svg.append(el("path", { d: `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`, class: "edge" })); }
    let hereAt = null;
    for (const it of L.items) {
      const node = it.kind === "node" ? D.nodes[it.id] : null, p = node ? progress(itemsOf(node)) : null;
      const label = it.kind === "root" ? it.label : it.kind === "ghost" ? `+ ${it.label}` : `${it.depth}. ${it.label}`;
      const isHere = it.kind === "root" ? here === "" : it.id === here, pre = it.kind === "ghost" && pending.get(nodeId(genre, it.depth, it.choice));
      const gEl = el("g", { class: ["pill-n", it.kind, isHere ? "here" : "", pre?.ready ? "ready" : ""].join(" "), transform: `translate(${px(it.depth)},${py(it.y)})`, tabindex: 0, role: "button", "aria-label": label },
        el("title", {}, document.createTextNode(label)), el("rect", { class: "bg", width: PW, height: PH, rx: 19 }),
        el("text", { x: 14, y: PH / 2 + 5 }, document.createTextNode(label.length > 15 ? label.slice(0, 14) + "…" : label)));
      if (p) gEl.append(el("rect", { class: "bar-bg", x: 14, y: PH - 7, width: PW - 28, height: 3, rx: 1.5 }), el("rect", { class: "bar", x: 14, y: PH - 7, width: ((PW - 28) * p.done) / p.total, height: 3, rx: 1.5 }));
      const act = () => { close(m); if (it.kind === "root") { if (cur.mode !== "share") go(genreHash(genre)); } else if (it.kind === "ghost") choose(genre, it.parent, it.choice); else if (cur.mode !== "share") go(nodeHash(it.id)); };
      gEl.addEventListener("click", act);
      gEl.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); act(); } });
      if (it.kind === "ghost") hoverPrefetch(gEl, genre, it.parent, it.choice);
      if (isHere) hereAt = { x: px(it.depth), y: py(it.y) };
      svg.append(gEl);
    }
    fill(box, svg);
    if (hereAt) requestAnimationFrame(() => { box.scrollLeft = Math.max(0, hereAt.x - box.clientWidth / 2 + PW / 2); box.scrollTop = Math.max(0, hereAt.y - box.clientHeight / 2); });
  }

  // ================= 워크북 원문 그리기: 체크박스는 누를 수 있게, 요청 코드에는 복사·'내 게임 버전' =================
  function mdToEl(md) {
    const box = h("div", { class: "wbmd" });
    if (window.marked && window.DOMPurify) box.innerHTML = DOMPurify.sanitize(marked.parse(md));
    else { // 렌더러를 못 불러온 경우: 코드 블록·체크박스만 살린 단순 표시
      md.split(/```\w*\n?/).forEach((part, i) => {
        if (i % 2) return box.append(h("pre", {}, h("code", {}, part.replace(/\n$/, ""))));
        part.split("\n").forEach((l) => { if (TASK_RE.test(l)) box.append(h("ul", {}, h("li", {}, h("input", { type: "checkbox" }), " " + l.replace(TASK_RE, "")))); else if (l.trim()) box.append(h("p", {}, l)); });
      });
    }
    return box;
  }
  function wbSection(n, sec, ro, { mark } = {}) {
    const box = mdToEl(sec.md);
    box.querySelectorAll('input[type="checkbox"]').forEach((ip, i) => {
      const key = `${sec.key}:${i}`;
      ip.removeAttribute("disabled"); ip.checked = !!n.done[key]; ip.disabled = ro;
      ip.closest("li")?.classList.add("task", ...(n.done[key] ? ["on"] : []));
      ip.addEventListener("change", () => {
        const was = (() => { const p = progress(itemsOf(n)); return p.done === p.total; })();
        n.done[key] = ip.checked; saveNode(n); refreshPage();
        const p = progress(itemsOf(n)); if (!was && p.done === p.total) celebrate(n);
      });
    });
    box.querySelectorAll("pre").forEach((pre, i) => {
      const code = pre.textContent.replace(/\n$/, ""), pkey = `${sec.key}.${i}`, mine = n.vals.personal?.[pkey];
      const bar = h("div", { class: "pre-bar" }, h("button", { type: "button", onclick: () => copy(code, "원문 요청을 복사했어요") }, "복사"));
      if (PERSONAL_RE.test(code) && !ro) bar.append(h("button", { type: "button", onclick: () => personalize(n, pkey, code) }, mine ? "내 게임 버전 다시 만들기" : "내 게임 버전 만들기 (AI)"));
      pre.before(bar);
      if (mine) pre.after(h("div", { class: "mine-box" }, h("div", { class: "lbl" }, "내 게임 버전 — 괄호·예시 자리만 바꿨고, 나머지 줄은 원문 그대로인지 검사했어요"), h("pre", {}, mine), h("div", { class: "pre-bar" }, h("button", { type: "button", onclick: () => copy(mine, "내 게임 버전을 복사했어요. VS Code AI에게 붙여 넣으세요") }, "복사"))));
    });
    if (mark) mark(box);
    return box;
  }
  async function copy(text, msg) { try { await navigator.clipboard.writeText(text); toast(msg); } catch (e) { toast("복사하지 못했어요. 직접 드래그해서 복사하세요"); } }
  // 내가 고른 선택(5장 조작, 6장 점수, 8장 기능)을 원문 안에서 표시
  function markChoice(n, sec) {
    return (box) => {
      const tag = (el, txt) => { el.classList.add("mine-pick"); el.prepend(h("span", { class: "badge" }, txt)); };
      if (n.k === 3 && /Step 6/.test(sec.title)) {
        const kw = { lr: "좌우만", mousex: "마우스", click: "클릭", jump: "점프" }[controlOf(n.choice)];
        box.querySelectorAll("p > strong").forEach((s) => { if (kw && s.textContent.includes(kw)) tag(s.parentElement, "내가 고른 조작"); });
        if (!kw) box.prepend(h("p", { class: "mine-pick" }, h("span", { class: "badge" }, "내가 고른 조작"), "방향키 네 방향 — Step 3에서 만든 조작을 그대로 써요."));
      }
      if (n.k === 4 && /Step 3/.test(sec.title)) { const kw = scoreModeOf(n.choice) === "item" ? "닿으면" : "시간형"; box.querySelectorAll("p > strong").forEach((s) => { if (s.textContent.includes(kw)) tag(s.parentElement, "내가 고른 점수 방식"); }); }
      if (n.k === 6) {
        const f = featuresOf(n.choice), kws = [f.start && "시작 화면", f.sound && "효과음", f.diff && "난이도", f.best && "최고 점수"].filter(Boolean);
        if (/과제 1/.test(sec.title)) box.querySelectorAll("li").forEach((li) => { if (kws.some((k) => li.textContent.includes(k))) li.classList.add("mine-pick"); });
        const stepKw = { "Step 1": "시작 화면", "Step 2": "효과음", "Step 3": "난이도", "Step 4": "최고 점수" };
        for (const [st, kw] of Object.entries(stepKw)) if (sec.title.startsWith(st) && kws.includes(kw)) box.prepend(h("p", { class: "mine-pick" }, h("span", { class: "badge" }, "내가 고른 기능"), `이번 미션에서 고른 '${n.choice}'에 들어 있어요.`));
      }
    };
  }

  // ================= 페이지 =================
  function card(id, title, small, ...body) { return h("section", { class: "card", id }, h("h2", {}, title, small ? h("small", {}, small) : null), ...body); }
  function wbMissing(ch) {
    return card("wbneed", "워크북 원문 연결이 필요해요", "과정은 원문에서 그대로 읽어요",
      h("p", {}, `이 미션의 따라 하기 실습 · 과제 · 제출 체크리스트는 워크북 ${ch}장 원문을 그대로 보여 줘요. 평가 기준과 어긋나지 않게, 그리고 공개 사이트에 강의 자료를 올리지 않기 위해 각자 PC의 워크북 파일에서 읽어요.`),
      h("div", { class: "acts-row" }, h("button", { class: "pill", onclick: () => $("#wb-pick").click() }, "워크북 폴더 연결"), h("span", { class: "note" }, "바이브코딩_워크북_N장_….md 파일이 든 폴더를 골라요 (부록 E 포함)")));
  }
  function renderHome() {
    const mine = Object.values(S.nodes).filter(touched);
    const tot = mine.reduce((a, n) => { const p = progress(itemsOf(n)); return [a[0] + p.done, a[1] + p.total]; }, [0, 0]);
    const qz = mine.filter((n) => n.quizPick != null), qOk = qz.filter((n) => n.quizPick === QUIZ[n.k].answer).length;
    const last = Store.get("last", null), lastN = last && S.nodes[last];
    stage.showcase = 0; stage.k = 0; stage.control = false; fill(stageBtnsEl); fill(labBar);
    stageNote.textContent = "미션을 고를 때마다 AI가 내 게임의 목표 모습을 무대에 쌓아 그리고, 거기서 워크북 실험을 직접 해 봐요.";
    const wbN = Object.keys(CH).length;
    fill(main, h("div", { class: "home" },
      h("p", { class: "eyebrow" }, "바이브코딩 워크북 3~8장 · 게임 만들기 미션"),
      h("h1", {}, "워크북 게임트리"),
      h("p", { class: "sub" }, "연관 검색어처럼 골라 가며, 무대에서 워크북 실험을 직접 해 보고 내 웹 게임을 만들어요."),
      wbN ? null : h("div", { class: "notice warn" }, h("b", {}, "먼저 워크북 폴더를 연결하세요. "), "미션마다 따라 하기 실습·과제·제출 체크리스트를 워크북 원문 그대로 보여 줘요. ", h("button", { class: "pill", onclick: () => $("#wb-pick").click() }, "워크북 폴더 연결")),
      dock,
      h("div", { class: "start-row", style: "margin-top:20px" },
        lastN ? h("button", { class: "big", onclick: () => go(nodeHash(lastN.id)) }, `이어하기 · ${lastN.genre} 미션 ${lastN.k}`) : h("button", { class: "big", onclick: () => go(genreHash("피하기")) }, "예시(피하기)로 시작하기"),
        h("button", { class: "big alt", onclick: () => newGenre() }, "새 형식 만들기"),
        ai.key ? null : h("button", { class: "big alt", onclick: openKey }, "API 키 넣기")),
      h("div", { class: "stats" },
        h("div", {}, h("small", {}, "미션 진행"), h("b", {}, tot[1] ? `${Math.round((tot[0] / tot[1]) * 100)}%` : "—"), h("span", {}, `${mine.length}개 미션 · 체크 ${tot[0]}/${tot[1]}`)),
        h("div", {}, h("small", {}, "이해 확인 정답률"), h("b", {}, qz.length ? `${Math.round((qOk / qz.length) * 100)}%` : "—"), h("span", {}, `푼 문제 ${qz.length}개`))),
      h("h2", { class: "grp" }, "게임 형식", h("small", {}, "고르면 미션 1부터 (워크북 3장)")),
      h("div", { class: "cat-grid" }, Object.values(S.genres).map((g) => {
        const ns = Object.values(S.nodes).filter((n) => n.genre === g.name && touched(n)), done = ns.filter((n) => { const p = progress(itemsOf(n)); return p.done === p.total; }).length;
        return h("button", { class: "cat", onclick: () => go(genreHash(g.name)) }, h("span", { class: "body" }, h("span", { class: "tag" }, `${g.lvl} · ${g.ctl}${g.ai ? " · AI" : ""}`), h("b", {}, g.name), h("p", {}, g.desc),
          h("span", { class: "prog" }, h("span", { class: "mini-bar" }, h("i", { style: `width:${Math.min(100, (done / 6) * 100)}%` })), ns.length ? `미션 ${ns.length}개 · 완료 ${done}` : "아직 시작 안 함")));
      }), h("button", { class: "cat", onclick: () => newGenre() }, h("span", { class: "body" }, h("span", { class: "tag" }, "AI"), h("b", {}, "새 형식 만들기"), h("p", {}, "원하는 게임이 없으면 이름과 아이디어만 넣어요")))),
      h("h2", { class: "grp" }, "이렇게 쌓여요", h("small", {}, "예시 · 피하기 미션 1 → 6")),
      stageCard,
      h("h2", { class: "grp" }, "알아 둘 것"),
      h("div", { class: "notice" }, "회고는 직접 써요 (회고 전체를 AI가 쓰면 회고 항목 0점 — 부록 E.4). 폴더·파일 이름에 한글·공백을 쓰지 않아요 (회고.md 등 .md 문서는 예외). 키는 남에게 주거나 코드·GitHub에 올리지 마세요. 학교 PC에서는 왼쪽 아래 '동기화 설정'에 같은 코드를 넣으면 다른 기기에서 이어 할 수 있어요.")));
  }
  function renderGenre(g) {
    resetStageFor(null);
    fill(main, h("div", { class: "home" },
      h("p", { class: "eyebrow" }, `${g.lvl} · 조작: ${g.ctl}${g.ai ? " · AI가 만든 형식" : ""}`),
      h("h1", {}, g.name), h("p", { class: "sub" }, g.intro),
      card("next", "미션 1 고르기", "화면 · 워크북 3장", h("p", { class: "note", style: "margin:0 0 12px" }, `${STEPS[0][2]}. 하나 고르면 그 방향으로 미션 1이 만들어지고, 거기서 미션 2 연관 검색어가 또 나와요.`), dock),
      card("route", "미션 지도", "워크북 3~8장 순서", h("ol", { class: "route" }, STEPS.map(([name, ch, what], i) => h("li", {}, h("b", {}, `미션 ${i + 1} ${name}`), h("span", { class: "s" }, ` — 워크북 ${ch}장 · ${what} · ${LABS[i + 1].name}${FIXED_NEXT[i + 1] ? " · 워크북 선택지" : ""}`)))))));
  }
  function renderMission(n, ro) {
    const D = data(), g = D.genres[n.genre], [sname, ch] = STEPS[n.k - 1], chap = CH[ch] || null, its = itemsOf(n), p = progress(its), C = 2 * Math.PI * 34;
    const hero = h("div", { class: "hero", id: "top" });
    hero.innerHTML = `<div class="k">미션 ${n.k} / 6 · ${esc(sname)} · 워크북 ${ch}장 ${esc(CH_TITLE[ch])}${n.ai ? " · AI 초안" : ""}</div><h1>${esc(n.choice)}</h1><div class="en">${esc(n.goal)}</div>
      <div class="hero-row"><button data-jump="stagecard">무대·실험</button><button data-jump="steps">따라 하기</button><button data-jump="tasks">과제</button><button data-jump="quiz">이해 확인</button><button data-jump="submit">제출 체크</button><button data-jump="next">${n.k < 6 ? "다음 미션 ›" : "완주 ›"}</button></div>
      <svg class="ring" viewBox="0 0 84 84"><circle cx="42" cy="42" r="34" fill="none" stroke="#e8e8ed" stroke-width="6"/><circle cx="42" cy="42" r="34" fill="none" stroke="#1d1d1f" stroke-width="6" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - p.done / p.total)}" transform="rotate(-90 42 42)"/></svg>
      <div class="ring"><b>${Math.round((p.done / p.total) * 100)}%</b></div>`;
    hero.addEventListener("click", (e) => { const j = e.target.closest("[data-jump]"); if (j) document.getElementById(j.dataset.jump)?.scrollIntoView({ behavior: "smooth", block: "start" }); });
    const ckEl = (it) => h("div", { class: `ck ${it.ok ? "done" : ""} auto` }, h("span", { class: "box" }), h("span", { class: "lbl" }, it.label), h("span", { class: "tag" }, "자동"));
    const tables = recordTables(n).map((t) => h("div", { class: "rec" }, h("div", { class: "lbl" }, t.title), mdToEl(t.md), h("div", { class: "pre-bar" }, h("button", { type: "button", onclick: () => copy(t.md, "표를 복사했어요. 회고에 붙이고 빈 칸은 직접 채워요") }, "표 복사"))));
    // 따라 하기 (Step마다 '마침' + 원문)
    const stepsCard = chap ? card("steps", "따라 하기 실습", `워크북 ${ch}장 3절 원문`, chap.intro ? mdToEl(chap.intro) : null,
      ...chap.steps.map((s) => {
        const dk = `${s.key}:done`, isDone = !!n.done[dk];
        return h("section", { class: `sec ${isDone ? "done" : ""}`, id: `st-${s.key}` },
          h("div", { class: "sec-head" }, h("h3", {}, s.title), h("button", { class: "done-btn", disabled: ro, onclick: () => {
            const was = (() => { const pp = progress(itemsOf(n)); return pp.done === pp.total; })();
            n.done[dk] = !isDone; saveNode(n); refreshPage();
            const pp = progress(itemsOf(n)); if (!was && pp.done === pp.total) celebrate(n);
          } }, isDone ? "✓ 마침" : "마침")),
          wbSection(n, s, ro, { mark: markChoice(n, s) }));
      })) : wbMissing(ch);
    const tasksCard = chap ? card("tasks", "내 게임에 적용하기 (과제)", `워크북 ${ch}장 4절 원문`, ...chap.tasks.map((t) => h("div", { class: "task-sec" }, h("h3", {}, t.title), wbSection(n, t, ro, { mark: markChoice(n, t) }))),
      tables.length ? h("div", { class: "task-sec" }, h("h3", {}, "회고 재료 — 실험실에서 시도한 값"), h("p", { class: "note" }, "값만 채웠어요. 느낌·판단·이유는 직접 써요 (회고는 본인이 씀)."), ...tables) : null) : null;
    const submitCard = chap ? card("submit", "제출 체크리스트", `워크북 ${ch}장 5절 · 부록 E.5`, wbSection(n, chap.submit, ro), COMMON ? h("div", { class: "task-sec" }, h("h3", {}, COMMON.title), wbSection(n, COMMON, ro)) : h("p", { class: "note" }, "부록 E 파일도 같은 폴더에 있으면 공통 체크리스트가 함께 보여요.")) : null;
    // 이해 확인 (워크북 본문 그대로)
    const Qz = QUIZ[n.k], order = Qz.options.map((_, i) => i).sort((a, b) => hash(n.id + a) - hash(n.id + b)), picked = n.quizPick, okPick = picked === Qz.answer;
    const quizCard = card("quiz", "이해 확인", `워크북 ${ch}장 본문`, h("p", { class: "quiz-q" }, Qz.q),
      h("div", { class: "quiz-opts" }, order.map((i) => h("button", { type: "button", disabled: ro, class: picked === i ? (i === Qz.answer ? "right" : "wrong") : "", onclick: () => {
        const was = (() => { const pp = progress(itemsOf(n)); return pp.done === pp.total; })();
        n.quizPick = i; saveNode(n); refreshPage();
        const pp = progress(itemsOf(n)); if (!was && pp.done === pp.total) celebrate(n);
      } }, Qz.options[i]))),
      picked != null ? h("p", { class: `quiz-fb ${okPick ? "ok" : "no"}` }, okPick ? `정답 — ${Qz.why}` : "다시 골라 보세요") : null);
    const qBox = h("textarea", { rows: 3, placeholder: "막힌 점, 에러 메시지, 이해 안 되는 코드를 적어요. (워크북 7장 2.6: 하려던 것 / 실제 / 재현 조건 / 에러 원문 / 시도한 것)" });
    const kids = childrenOf(n.genre, n.id, D), parent = D.nodes[n.parent];
    fill(main, h("div", { class: "home mission" },
      ro ? h("div", { class: "banner" }, h("span", {}, "공유받은 경로를 보는 중이에요."), h("button", { class: "pill", onclick: takeShared }, "내 기록에 담고 이어 하기")) : null,
      hero, stageCard,
      card("labs", "실험 체크리스트", `${LABS[n.k].ref} · 무대에서 해 보면 자동 체크`, h("p", { class: "note", style: "margin:0 0 8px" }, LABS[n.k].tip), h("div", { class: "checklist" }, its.filter((i) => i.kind === "lab").map(ckEl))),
      stepsCard, tasksCard, quizCard, submitCard,
      ro ? null : card("hint", "막혔어요", n.hints.length ? `${n.hints.length}개 기록` : "AI 조교에게 묻기 · 7장 2.8 절차대로", ...n.hints.map((x) => h("div", { class: "hint" }, h("div", { class: "q" }, x.q), h("div", { class: "a" }, x.a), h("div", { class: "t" }, x.at))),
        qBox, h("div", { class: "acts-row" }, h("button", { class: "pill", onclick: () => askHint(n, qBox.value.trim()) }, "물어보기"))),
      ro ? null : n.k < 6
        ? card("next", `다음 미션 · 미션 ${n.k + 1} ${STEPS[n.k][0]}`, `워크북 ${STEPS[n.k][1]}장${FIXED_NEXT[n.k + 1] ? " · 워크북이 정해 둔 선택지" : ""}`, h("p", { class: "note", style: "margin:0 0 12px" }, `${STEPS[n.k][2]}. ${FIXED_NEXT[n.k + 1] ? "워크북에 나온 선택지 중에서 골라요." : "연관 검색어를 고르거나 검색해요."} 마우스를 올려 두면 미리 만들어 둬요.`), dock)
        : card("next", "완주", "6개 미션", h("p", {}, "이제 워크북 9장 플레이테스트로 가요. 왼쪽 메뉴의 '경로 지도'에서 다른 갈래도 골라 볼 수 있어요.")),
      h("div", { class: "deeper" }, h("button", { onclick: () => openWorkbook(n.k, g.inp) }, `더 깊게: 워크북 ${ch}장 ${sectionsFor(n.k, g.inp).map(([x]) => x).join(" · ")} 개념 원문 보기`)),
      h("div", { class: "pn" },
        parent ? h("button", { onclick: () => go(ro ? location.hash : nodeHash(parent.id)) }, h("small", {}, "‹ 이전 미션"), `미션 ${parent.k} ${parent.choice}`) : h("button", { onclick: () => go(genreHash(n.genre)) }, h("small", {}, "‹ 형식"), n.genre),
        kids[0] && !ro ? h("button", { onclick: () => go(nodeHash(kids[0].id)) }, h("small", {}, "다음 미션 ›"), `미션 ${kids[0].k} ${kids[0].choice}`) : h("button", { onclick: () => document.getElementById("next")?.scrollIntoView({ behavior: "smooth" }) }, h("small", {}, n.k < 6 ? "다음 미션 ›" : "마지막"), n.k < 6 ? "선택지 고르기" : "완주"))));
    stageButtons(); paintLab();
  }
  function openWorkbook(k, inp) {
    const ch = STEPS[k - 1][1];
    if (!WB[ch]) return info(`워크북 ${ch}장 ${CH_TITLE[ch]}`, h("p", {}, "워크북 원문은 각자 PC에서만 불러와요."), h("button", { class: "pill", onclick: () => { close(modal("#info-modal")); $("#wb-pick").click(); } }, "워크북 폴더 연결"));
    info(`워크북 ${ch}장 ${CH_TITLE[ch]}`, ...sectionsFor(k, inp).map(([num]) => mdToEl(extractSection(WB[ch], num) || "섹션을 찾지 못했어요.")));
  }

  // 같은 페이지 안에서 기록이 바뀌었을 때: 무대 상태는 그대로 두고 나머지만 다시 그린다(스크롤 위치 유지)
  // 무대 카드를 새 페이지로 옮기면 무대가 포커스를 잃는다 → 다시 그리는 동안은 키 기록을 지우지 않고, 끝나면 포커스를 돌려준다
  let refreshing = false;
  function refreshPage() {
    const y = main.scrollTop, n = curNode(), hadFocus = document.activeElement === cv;
    refreshing = true;
    try {
      if (n) renderMission(n, cur.mode === "share"); else if (cur.mode === "genre") renderGenre(S.genres[cur.genre]); else renderHome();
      main.scrollTop = y; renderSide(); paintChips();
      if (hadFocus) cv.focus({ preventScroll: true });
    } finally { refreshing = false; }
  }

  // ---- 공유 ----
  async function shareLink() {
    if (cur.mode !== "node") return toast("미션을 연 상태에서 공유할 수 있어요");
    const n = S.nodes[cur.id], t = trail(n, S);
    const payload = { v: 3, at: n.id, genres: { [n.genre]: S.genres[n.genre] }, nodes: Object.fromEntries(t.map((x) => [x.id, { ...x, hints: [], done: {}, labs: {}, quizPick: null, vals: {} }])) };
    const url = `${location.origin}${location.pathname}#/share/${await encodeShare(payload)}`;
    try { await navigator.clipboard.writeText(url); toast(`공유 링크를 복사했어요 (미션 ${t.length}개 경로)`); } catch (e) { prompt("이 링크를 복사해서 보내세요", url); }
  }
  function takeShared() {
    if (!shared) return;
    for (const [k, v] of Object.entries(shared.S.genres)) if (!S.genres[k]) S.genres[k] = v;
    for (const [k, v] of Object.entries(shared.S.nodes)) if (!S.nodes[k]) { S.nodes[k] = v; saveNode(v); }
    saveGenres(); toast("내 기록에 담았어요. 여기서부터 이어 가요"); go(nodeHash(shared.at));
  }

  // ================= 이동 =================
  async function route() {
    const m = location.hash.match(/^#\/(g|n|share)\/(.+)$/);
    const kind = m ? m[1] : "", arg = m ? (kind === "share" ? m[2] : decodeURIComponent(m[2])) : "";
    stage.showcase = -1;
    if (kind === "g" && S.genres[arg]) cur = { mode: "genre", genre: arg };
    else if (kind === "n" && S.nodes[arg]) cur = { mode: "node", id: arg };
    else if (kind === "share") {
      try { shared = await decodeShare(arg); if (!shared.S.nodes[shared.at]) throw new Error(); cur = { mode: "share", id: shared.at }; }
      catch (e) { toast("공유 링크를 읽지 못했어요. 링크가 잘렸는지 확인하세요"); cur = { mode: "home" }; }
    } else { if (kind) toast("이 기기에 없는 기록이에요. 동기화 설정이나 백업 불러오기를 해 보세요"); cur = { mode: "home" }; }
    const n = curNode();
    if (n) {
      const D = data();
      if (cur.mode === "node") Store.set("last", n.id);
      crumb.innerHTML = `${esc(n.genre)} › 미션 ${n.k} ${esc(STEPS[n.k - 1][0])}<small>워크북 ${STEPS[n.k - 1][1]}장 · ${esc(n.choice)}</small>`;
      resetStageFor(n, D.genres[n.genre]);
      renderMission(n, cur.mode === "share");
    } else if (cur.mode === "genre") { crumb.innerHTML = `${esc(cur.genre)}<small>형식 · 미션 1 고르기</small>`; renderGenre(S.genres[cur.genre]); }
    else { crumb.textContent = "워크북 게임트리"; renderHome(); }
    document.title = n ? `${n.choice} · 워크북 게임트리` : cur.mode === "genre" ? `${cur.genre} · 워크북 게임트리` : "워크북 게임트리";
    main.scrollTop = 0;
    paintKey(); renderSide(); paintChips(); paintMini();
  }
  addEventListener("hashchange", route);

  // ================= 백업 · 동기화 (스터디_프레임과 같은 방식) · 과제 기록 =================
  $("#btn-export").addEventListener("click", () => {
    const a = h("a", { href: URL.createObjectURL(new Blob([JSON.stringify(Store.exportAll())], { type: "application/json" })), download: `gametree-backup-${new Date().toISOString().slice(0, 10)}.json` });
    document.body.append(a); a.click(); a.remove(); toast("백업 파일을 저장했어요");
  });
  const fImp = $("#file-import");
  $("#btn-import").addEventListener("click", () => fImp.click());
  fImp.addEventListener("change", async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const o = JSON.parse(await f.text());
      if (!o || typeof o !== "object" || Array.isArray(o) || !Object.values(o).every((r) => r && typeof r === "object" && "t" in r && "v" in r)) throw new Error("형식");
      const cnt = Store.importAll(o); S = loadState(); toast(`백업을 불러왔어요 (${cnt}개 항목)`); route();
    } catch (err) { toast("이 파일은 워크북 게임트리 백업 파일이 아니에요"); }
    e.target.value = "";
  });
  $("#btn-md").addEventListener("click", () => {
    const mine = { ...S, nodes: Object.fromEntries(Object.entries(S.nodes).filter(([, n]) => touched(n))) };
    const a = h("a", { href: URL.createObjectURL(new Blob([buildExport(mine, CH, COMMON)], { type: "text/markdown" })), download: EXPORT_NAME });
    document.body.append(a); a.click(); a.remove(); toast(`${EXPORT_NAME}을 받았어요 (파일 이름에 한글·공백 없음)`);
  });
  const syncM = modal("#sync-modal");
  function openSync() {
    const on = Store.syncConnected();
    syncM.querySelector(".state").textContent = on ? "이 기기는 동기화 중입니다." : Store.syncAvailable() ? "이 기기는 아직 동기화되지 않았어요." : "이 주소에서는 동기화를 쓸 수 없어요 (https 웹 주소에서 열어 주세요).";
    syncM.querySelector("[data-off]").style.display = on ? "" : "none";
    syncM.querySelector("input").value = "";
    open(syncM); setTimeout(() => syncM.querySelector("input").focus({ preventScroll: true }), 50);
  }
  $("#btn-sync").addEventListener("click", openSync);
  syncM.querySelector("form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const code = syncM.querySelector("input").value.trim();
    if (code.length < 6) return toast("코드는 6자 이상으로 정해 주세요");
    const btn = syncM.querySelector("[type=submit]"); btn.disabled = true; btn.textContent = "연결 중…";
    const ok = await Store.syncConnect(code);
    btn.disabled = false; btn.textContent = "연결";
    if (ok) { close(syncM); S = loadState(); toast("동기화 연결! 다른 기기에서도 같은 코드를 입력하세요"); route(); }
    else toast("동기화 서버에 연결하지 못했어요. 인터넷을 확인해 주세요");
  });
  syncM.querySelector("[data-off]").addEventListener("click", () => { Store.syncDisconnect(); close(syncM); toast("동기화를 껐어요. 이 기기 기록은 그대로 남아요"); });
  Store.onRemote(() => { S = loadState(); if (cur.mode === "node" && !S.nodes[cur.id]) return route(); refreshPage(); });

  // 워크북 폴더: 장 파일(3~9장) + 부록 E를 이 기기에만 저장
  $("#wb-pick").addEventListener("change", async (e) => {
    const found = {};
    for (const f of e.target.files) {
      const mm = f.name.match(/워크북_(\d+)장_.*\.md$/);
      if (mm && CH_TITLE[mm[1]]) found[mm[1]] = await f.text();
      else if (/워크북_부록E_.*\.md$/.test(f.name)) found.E = await f.text();
    }
    e.target.value = "";
    const cnt = Object.keys(found).filter((k) => k !== "E").length;
    if (!cnt) return toast("워크북 장 파일(바이브코딩_워크북_N장_….md)을 찾지 못했어요");
    WB = found; raw.set(LS, "gt-wb", JSON.stringify(WB)); parseWB();
    const bad = [3, 4, 5, 6, 7, 8].filter((c) => WB[c] && !CH[c]);
    toast(`워크북 ${cnt}개 장${WB.E ? " + 부록 E" : ""}를 연결했어요${bad.length ? ` (${bad.join(", ")}장은 형식이 달라 읽지 못함)` : ""}`);
    route();
  });

  // ---- 시작 ----
  if (Store.get("sideOpen", innerWidth >= 1100) === false || innerWidth < 900) document.body.classList.add("side-closed");
  paintKey();
  Store.init().catch(() => "local").then(() => {
    S = loadState();
    route();
    requestAnimationFrame(frame);
    if (!ai.key) setTimeout(openKey, 400);
  });
}

if (typeof module !== "undefined") module.exports = { rankModels, parseJson, normGenre, normStep, normScene, normSuggest, makeWorld, tick, drawWorld, bbox, hitbox, overlap, pickAt, parseChapter, parseCommon, missionItems, progress, verifyPersonal, requiredLines, PERSONAL_RE, recordTables, baseSpeed, layoutTree, genrePrompt, stepPrompt, personalPrompt, suggestPrompt, extractSection, buildExport, parseImport, presetState, encodeShare, decodeShare, askAI, requestBody, nodeId, cleanName, cleanVals, nextList, controlOf, scoreModeOf, featuresOf, labAutos, STEPS, LABS, QUIZ, BUGS, FIXED_NEXT, PRACTICE_BALL, EXPORT_NAME, SCENE_W, SCENE_H };
if (typeof document !== "undefined") boot();
