import "./style.css";
import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import gsap from "gsap";
import { tree, links, type EntryData } from "./data/content";

// ---------------------------------------------------------------------------
// WebGL 基本セットアップ
// ---------------------------------------------------------------------------

const canvas = document.querySelector<HTMLCanvasElement>("#gl")!;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070d);

const camera = new THREE.PerspectiveCamera(
  46,
  window.innerWidth / window.innerHeight,
  0.1,
  200,
);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  0.5, // strength
  0.6, // radius
  0.35, // threshold
);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

// ---------------------------------------------------------------------------
// ゾーン: 項目ごとに離れた場所へ世界を作り、カメラが飛んで切り替える
// ---------------------------------------------------------------------------

interface Zone {
  origin: THREE.Vector3;
  bg: THREE.Color;
}

const zones: Record<string, Zone> = {
  home: { origin: new THREE.Vector3(0, 0, 0), bg: new THREE.Color(0x05070d) },
  about: { origin: new THREE.Vector3(46, 0, -8), bg: new THREE.Color(0x120d05) },
  research: { origin: new THREE.Vector3(0, 0, -55), bg: new THREE.Color(0x050e18) },
  game: { origin: new THREE.Vector3(-46, 0, 0), bg: new THREE.Color(0x0a0d1f) },
  fatebound: { origin: new THREE.Vector3(-88, 0, -8), bg: new THREE.Color(0x12060f) },
  zonediver: { origin: new THREE.Vector3(-52, 0, -50), bg: new THREE.Color(0x04100a) },
  links: { origin: new THREE.Vector3(0, 34, -14), bg: new THREE.Color(0x0b0716) },
  thesis: { origin: new THREE.Vector3(-40, 28, -64), bg: new THREE.Color(0x0a0f16) },
  mockviewer: { origin: new THREE.Vector3(46, 0, -62), bg: new THREE.Color(0x061412) },
};

const CAM_OFFSET = new THREE.Vector3(0, 1.3, 9.5);
const LOOK_OFFSET = new THREE.Vector3(0, 1.0, 0);

// ---- 星々(静止。全ゾーンを包む) ----
const starCount = 1400;
const starPos = new Float32Array(starCount * 3);
for (let i = 0; i < starCount; i++) {
  starPos[i * 3] = (Math.random() - 0.5) * 210;
  starPos[i * 3 + 1] = Math.random() * 48 - 8;
  starPos[i * 3 + 2] = 4 - Math.random() * 72;
}
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
const stars = new THREE.Points(
  starGeo,
  new THREE.PointsMaterial({
    color: 0x9fc8e8,
    size: 0.09,
    transparent: true,
    opacity: 0.65,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  }),
);
scene.add(stars);

/** 黒い面+光るエッジ */
function edgedMesh(geo: THREE.BufferGeometry, faceColor: number, edgeColor: number) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: faceColor })));
  g.add(
    new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: edgeColor }),
    ),
  );
  return g;
}

// ---- HOME: ワイヤーフレーム球 + 輪 ----
const homeGroup = new THREE.Group();
homeGroup.position.copy(zones.home.origin);
scene.add(homeGroup);

const homeSphere = new THREE.Mesh(
  new THREE.IcosahedronGeometry(2.8, 1),
  new THREE.MeshBasicMaterial({ color: 0x6ae8ff, wireframe: true, transparent: true, opacity: 0.35 }),
);
homeSphere.position.set(4.2, 1.9, -3.5);
homeGroup.add(homeSphere);

const homeRing = new THREE.Mesh(
  new THREE.TorusGeometry(4.1, 0.015, 8, 90),
  new THREE.MeshBasicMaterial({ color: 0x6ae8ff, transparent: true, opacity: 0.5 }),
);
homeRing.position.copy(homeSphere.position);
homeRing.rotation.x = 1.35;
homeGroup.add(homeRing);

const homeIco = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.9, 0),
  new THREE.MeshBasicMaterial({ color: 0xff4fd8, wireframe: true, transparent: true, opacity: 0.3 }),
);
homeIco.position.set(-6.5, 3.2, -5);
homeGroup.add(homeIco);

// ---- GAME: ワイヤーフレームのダイス群 ----
const gameGroup = new THREE.Group();
gameGroup.position.copy(zones.game.origin);
scene.add(gameGroup);

const diceSpecs: [THREE.BufferGeometry, number, number, number, number][] = [
  // [形状, x, y, z, 色]
  [new THREE.BoxGeometry(1.6, 1.6, 1.6), -2.6, 1.9, -1, 0x6ae8ff],
  [new THREE.IcosahedronGeometry(1.2, 0), 1.2, 2.6, -3, 0xff4fd8],
  [new THREE.OctahedronGeometry(1.0, 0), 3.4, 1.2, 0.5, 0x7eff9a],
  [new THREE.TetrahedronGeometry(0.9, 0), -0.6, 0.8, 1.5, 0xffc46a],
];
const dice: THREE.Group[] = [];
for (const [geo, x, y, z, col] of diceSpecs) {
  const d = edgedMesh(geo, 0x070a14, col);
  d.position.set(x, y, z);
  gameGroup.add(d);
  dice.push(d);
}

// ---- RESEARCH: 原子軌道 ----
const researchGroup = new THREE.Group();
researchGroup.position.copy(zones.research.origin);
scene.add(researchGroup);

const nucleus = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.35, 1),
  new THREE.MeshBasicMaterial({ color: 0xcfe8ff }),
);
nucleus.position.set(0, 1.6, -1);
researchGroup.add(nucleus);

const orbits: THREE.Group[] = [];
for (let i = 0; i < 3; i++) {
  const orbit = new THREE.Group();
  orbit.position.copy(nucleus.position);
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.4, 0.018, 8, 90),
    new THREE.MeshBasicMaterial({ color: 0x9ad8ff, transparent: true, opacity: 0.4 }),
  );
  orbit.add(ring);
  const electron = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.12, 0),
    new THREE.MeshBasicMaterial({ color: 0x9ad8ff }),
  );
  electron.position.x = 2.4;
  orbit.add(electron);
  orbit.rotation.x = (i * Math.PI) / 3 + 0.4;
  orbit.rotation.y = (i * Math.PI) / 4;
  researchGroup.add(orbit);
  orbits.push(orbit);
}

// ---- THESIS: 浮遊するワイヤーフレームの紙面 ----
const thesisGroup = new THREE.Group();
thesisGroup.position.copy(zones.thesis.origin);
scene.add(thesisGroup);

const pages: THREE.Group[] = [];
for (let i = 0; i < 4; i++) {
  const page = new THREE.Group();
  const sheet = edgedMesh(new THREE.BoxGeometry(1.7, 2.3, 0.02), 0x070c12, 0xcfe8ff);
  page.add(sheet);
  // 紙面の「本文」の線
  const lineVerts: number[] = [];
  for (let ln = 0; ln < 6; ln++) {
    const y = 0.8 - ln * 0.3;
    const w = ln === 0 ? 0.9 : 1.3 - (ln % 3) * 0.15;
    lineVerts.push(-w / 2, y, 0.03, w / 2, y, 0.03);
  }
  const lineGeo = new THREE.BufferGeometry();
  lineGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(lineVerts), 3));
  page.add(
    new THREE.LineSegments(
      lineGeo,
      new THREE.LineBasicMaterial({ color: 0x9ad8ff, transparent: true, opacity: 0.5 }),
    ),
  );
  page.position.set(-1.8 + i * 1.3, 1.7 + (i % 2) * 0.3, -i * 0.9);
  page.rotation.y = -0.25 + i * 0.14;
  page.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.06;
  thesisGroup.add(page);
  pages.push(page);
}

// ---- MOCK VIEWER: ワイヤーフレームのブラウザ画面 ----
const viewerGroup = new THREE.Group();
viewerGroup.position.copy(zones.mockviewer.origin);
scene.add(viewerGroup);

const viewerFrame = new THREE.Group();
const VC = 0x4fe8c8;
viewerFrame.add(edgedMesh(new THREE.BoxGeometry(4.6, 3.0, 0.04), 0x061210, VC));
// 上部バー + ボタン3つ
const bar = new THREE.Mesh(
  new THREE.PlaneGeometry(4.6, 0.02),
  new THREE.MeshBasicMaterial({ color: VC, transparent: true, opacity: 0.7 }),
);
bar.position.set(0, 1.1, 0.04);
viewerFrame.add(bar);
for (let i = 0; i < 3; i++) {
  const dot = new THREE.Mesh(
    new THREE.CircleGeometry(0.045, 12),
    new THREE.MeshBasicMaterial({ color: VC }),
  );
  dot.position.set(-2.05 + i * 0.18, 1.25, 0.04);
  viewerFrame.add(dot);
}
// 中身のモック(サイドバー+コンテンツブロック)
const mockRects: [number, number, number, number][] = [
  // [x, y, w, h]
  [-1.75, -0.15, 0.9, 2.2],
  [0.55, 0.55, 3.3, 0.8],
  [-0.25, -0.75, 1.7, 1.4],
  [1.45, -0.75, 1.5, 1.4],
];
for (const [x, y, w, h] of mockRects) {
  const rect = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.PlaneGeometry(w, h)),
    new THREE.LineBasicMaterial({ color: VC, transparent: true, opacity: 0.45 }),
  );
  rect.position.set(x, y, 0.04);
  viewerFrame.add(rect);
}
viewerFrame.position.set(0, 1.7, -1);
viewerGroup.add(viewerFrame);

// ---- FATEBOUND: マゼンタのカードの扇 ----
const deckGroup = new THREE.Group();
deckGroup.position.copy(zones.fatebound.origin);
scene.add(deckGroup);

const cardGeo = new THREE.BoxGeometry(1.5, 2.1, 0.05);
const CARD_N = 7;
for (let i = 0; i < CARD_N; i++) {
  const fi = i - (CARD_N - 1) / 2;
  const card = edgedMesh(cardGeo, 0x150410, 0xff4fd8);
  card.position.set(fi * 1.45, 1.8 - Math.abs(fi) * 0.22, -Math.abs(fi) * 0.4);
  card.rotation.z = -fi * 0.17;
  card.rotation.y = fi * 0.1;
  deckGroup.add(card);
}
const deckRing = new THREE.Mesh(
  new THREE.TorusGeometry(3.4, 0.02, 8, 80),
  new THREE.MeshBasicMaterial({ color: 0xff4fd8, transparent: true, opacity: 0.5 }),
);
deckRing.position.set(0, 0.2, 0);
deckRing.rotation.x = Math.PI / 2;
deckGroup.add(deckRing);

// ---- ZONEDIVER: 緑のダイブトンネル ----
const diveGroup = new THREE.Group();
diveGroup.position.copy(zones.zonediver.origin);
scene.add(diveGroup);

const diveRings: THREE.Mesh[] = [];
for (let i = 0; i < 9; i++) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.6 - i * 0.12, 0.022, 8, 64),
    new THREE.MeshBasicMaterial({
      color: 0x46c96e,
      transparent: true,
      opacity: 0.5 - i * 0.045,
    }),
  );
  ring.position.set(0, 1.5, -i * 2.4 + 2);
  diveRings.push(ring);
  diveGroup.add(ring);
}
const diveCore = new THREE.Mesh(
  new THREE.IcosahedronGeometry(0.5, 0),
  new THREE.MeshBasicMaterial({ color: 0xcfffdc }),
);
diveCore.position.set(0, 1.5, -18);
diveGroup.add(diveCore);

// ---- ABOUT: 琥珀色のトーラスノット ----
const aboutGroup = new THREE.Group();
aboutGroup.position.copy(zones.about.origin);
scene.add(aboutGroup);

const aboutKnot = new THREE.Mesh(
  new THREE.TorusKnotGeometry(1.7, 0.5, 140, 14),
  new THREE.MeshBasicMaterial({ color: 0xffc46a, wireframe: true, transparent: true, opacity: 0.28 }),
);
aboutKnot.position.set(0, 1.6, -2);
aboutGroup.add(aboutKnot);

const aboutRing = new THREE.Mesh(
  new THREE.TorusGeometry(3.4, 0.015, 8, 80),
  new THREE.MeshBasicMaterial({ color: 0xffc46a, transparent: true, opacity: 0.4 }),
);
aboutRing.position.copy(aboutKnot.position);
aboutRing.rotation.x = 1.4;
aboutGroup.add(aboutRing);

// ---- LINKS: 紫のネットワークグラフ ----
const linksGroup = new THREE.Group();
linksGroup.position.copy(zones.links.origin);
scene.add(linksGroup);

const nodePositions: THREE.Vector3[] = [];
for (let i = 0; i < 12; i++) {
  const v = new THREE.Vector3(
    (Math.sin(i * 2.1) + Math.sin(i * 0.7)) * 2.2,
    1.5 + (Math.cos(i * 1.7) + Math.sin(i * 1.1)) * 1.4,
    -2 + Math.cos(i * 2.6) * 2.2,
  );
  nodePositions.push(v);
  const node = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.11, 0),
    new THREE.MeshBasicMaterial({ color: 0xb98aff }),
  );
  node.position.copy(v);
  linksGroup.add(node);
}
const linkVerts: number[] = [];
for (let i = 0; i < nodePositions.length; i++) {
  for (let j = i + 1; j < nodePositions.length; j++) {
    if (nodePositions[i].distanceTo(nodePositions[j]) < 3.1) {
      linkVerts.push(...nodePositions[i].toArray(), ...nodePositions[j].toArray());
    }
  }
}
const linkGeo = new THREE.BufferGeometry();
linkGeo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(linkVerts), 3));
linksGroup.add(
  new THREE.LineSegments(
    linkGeo,
    new THREE.LineBasicMaterial({ color: 0xb98aff, transparent: true, opacity: 0.35 }),
  ),
);

// ---------------------------------------------------------------------------
// カメラ移動(ゾーン間を「シュッと」飛ぶ)
// ---------------------------------------------------------------------------

const camBase = zones.home.origin.clone().add(CAM_OFFSET);
const lookBase = zones.home.origin.clone().add(LOOK_OFFSET);
camera.position.copy(camBase);
camera.lookAt(lookBase);

let currentZone = "home";

function flyTo(name: string) {
  if (!(name in zones) || name === currentZone) return;
  currentZone = name;
  const z = zones[name];
  const dur = 0.85;
  const ease = "power3.inOut";
  gsap.to(camBase, {
    x: z.origin.x + CAM_OFFSET.x,
    y: z.origin.y + CAM_OFFSET.y,
    z: z.origin.z + CAM_OFFSET.z,
    duration: dur,
    ease,
    overwrite: "auto",
  });
  gsap.to(lookBase, {
    x: z.origin.x + LOOK_OFFSET.x,
    y: z.origin.y + LOOK_OFFSET.y,
    z: z.origin.z + LOOK_OFFSET.z,
    duration: dur,
    ease,
    overwrite: "auto",
  });
  gsap.to(scene.background as THREE.Color, {
    r: z.bg.r,
    g: z.bg.g,
    b: z.bg.b,
    duration: dur,
    ease,
    overwrite: "auto",
  });
}

// ---------------------------------------------------------------------------
// 入力(パララックス)
// ---------------------------------------------------------------------------

const pointerNdc = new THREE.Vector2(0, 0);
window.addEventListener("pointermove", (e) => {
  pointerNdc.set(
    (e.clientX / innerWidth) * 2 - 1,
    -(e.clientY / innerHeight) * 2 + 1,
  );
});

// ---------------------------------------------------------------------------
// UI: 階層リスト(INDEX → GAME 内サブリスト)
// ---------------------------------------------------------------------------

const worksUl = document.querySelector<HTMLUListElement>("#works")!;
const kickerEl = document.querySelector<HTMLParagraphElement>(".kicker")!;
const backBtn = document.querySelector<HTMLButtonElement>("#back-btn")!;

/** いま開いているカテゴリ(null = トップ) */
let currentParent: EntryData | null = null;

/** ホバーを離れたときの帰還先ゾーン */
function baseZone(): string {
  return currentParent ? currentParent.id : "home";
}

function buildItems(entries: EntryData[]) {
  worksUl.innerHTML = "";
  entries.forEach((entry, i) => {
    const li = document.createElement("li");
    li.className = "work";
    li.dataset.id = entry.id;
    li.innerHTML = `
      <span class="idx">${String(i + 1).padStart(2, "0")}</span>
      <h2>${entry.title}</h2>
      <span class="meta">${entry.subtitle}</span>
    `;
    li.addEventListener("mouseenter", () => {
      if (!panelOpen) flyTo(entry.id);
    });
    li.addEventListener("mouseleave", () => {
      if (!panelOpen) flyTo(baseZone());
    });
    li.addEventListener("click", () => {
      flyTo(entry.id);
      if (entry.children) {
        descendInto(entry);
      } else {
        openPanel(entryPanelContent(entry));
      }
    });
    worksUl.appendChild(li);
  });
}

/** リストを入れ替えるトランジション */
function renderList(entries: EntryData[], kicker: string) {
  const oldItems = Array.from(worksUl.children);
  const build = () => {
    kickerEl.textContent = kicker;
    backBtn.classList.toggle("hidden", currentParent === null);
    buildItems(entries);
    gsap.from(worksUl.children, {
      opacity: 0,
      x: 40,
      duration: 0.45,
      stagger: 0.07,
      ease: "power3.out",
      clearProps: "transform", // ホバーの translateX を CSS に返す
    });
  };
  if (oldItems.length === 0) {
    build();
    return;
  }
  gsap.to(oldItems, {
    opacity: 0,
    x: -40,
    duration: 0.28,
    stagger: 0.05,
    ease: "power2.in",
    onComplete: build,
  });
}

function descendInto(entry: EntryData) {
  currentParent = entry;
  renderList(entry.children!, entry.title);
}

function goBack() {
  if (!currentParent) return;
  currentParent = null;
  renderList(tree, "INDEX");
  flyTo("home");
}

backBtn.addEventListener("click", goBack);

// ---------------------------------------------------------------------------
// 詳細パネル
// ---------------------------------------------------------------------------

interface PanelContent {
  kicker: string;
  title: string;
  desc: string;
  tags: string[];
  links: { label: string; url: string | null }[];
  images?: string[];
}

function entryPanelContent(entry: EntryData): PanelContent {
  let panelLinks: { label: string; url: string | null }[];
  if (entry.links) {
    panelLinks = entry.links;
  } else if (entry.id === "about") {
    panelLinks = links; // SNS リンク
  } else {
    panelLinks = [{ label: entry.url ? "PLAY" : "COMING SOON", url: entry.url }];
  }
  return {
    kicker: currentParent ? currentParent.title : entry.title,
    title: entry.id === "about" ? "本家智也" : entry.title,
    desc: entry.description,
    tags: entry.tags,
    links: panelLinks,
    images: entry.images,
  };
}

const panel = document.querySelector<HTMLDivElement>("#panel")!;
const panelBody = document.querySelector<HTMLElement>("#panel-body")!;
const panelBackdrop = document.querySelector<HTMLDivElement>("#panel-backdrop")!;
let panelOpen = false;

function openPanel(content: PanelContent) {
  if (panelOpen) return;
  panelOpen = true;

  panel.querySelector(".panel-kicker")!.textContent = content.kicker;
  panel.querySelector(".panel-title")!.textContent = content.title;
  panel.querySelector(".panel-desc")!.textContent = content.desc;
  // 画像: 広い画面では左のステージへ、狭い画面ではパネル内リストへ(CSSで切替)
  const imagesEl = panel.querySelector(".panel-images")!;
  imagesEl.innerHTML = "";
  for (const src of content.images ?? []) {
    const img = document.createElement("img");
    img.src = src;
    img.alt = content.title;
    img.loading = "lazy";
    imagesEl.appendChild(img);
  }
  setupStage(content.images ?? [], content.title);
  const tags = panel.querySelector(".panel-tags")!;
  tags.innerHTML = "";
  for (const t of content.tags) {
    const s = document.createElement("span");
    s.textContent = t;
    tags.appendChild(s);
  }
  const linksEl = panel.querySelector(".panel-links")!;
  linksEl.innerHTML = "";
  for (const l of content.links) {
    if (l.url) {
      const a = document.createElement("a");
      a.textContent = l.label;
      a.href = l.url;
      a.target = "_blank";
      a.rel = "noreferrer";
      linksEl.appendChild(a);
    } else {
      const span = document.createElement("span");
      span.className = "soon";
      span.textContent = l.label;
      linksEl.appendChild(span);
    }
  }

  panel.classList.remove("hidden");
  panel.setAttribute("aria-hidden", "false");
  gsap.fromTo(panelBackdrop, { opacity: 0 }, { opacity: 1, duration: 0.4 });
  gsap.fromTo(
    panelBody,
    { xPercent: 100 },
    { xPercent: 0, duration: 0.6, ease: "power3.out" },
  );
}

function closePanel() {
  if (!panelOpen) return;
  gsap.to(panelBackdrop, { opacity: 0, duration: 0.3 });
  gsap.to(panelBody, {
    xPercent: 100,
    duration: 0.45,
    ease: "power3.in",
    onComplete: () => {
      panel.classList.add("hidden");
      panel.setAttribute("aria-hidden", "true");
      panelOpen = false;
      flyTo(baseZone());
    },
  });
}

panelBackdrop.addEventListener("click", closePanel);
document.querySelector("#panel-close")!.addEventListener("click", closePanel);

// ---- 左側の画像ステージ ----
const stage = document.querySelector<HTMLDivElement>("#panel-stage")!;
const stageImg = document.querySelector<HTMLImageElement>("#stage-img")!;
const stageThumbs = document.querySelector<HTMLDivElement>("#stage-thumbs")!;

function setupStage(images: string[], alt: string) {
  stageThumbs.innerHTML = "";
  if (images.length === 0) {
    stage.classList.add("hidden");
    return;
  }
  stageImg.src = images[0];
  stageImg.alt = alt;
  const thumbs: HTMLImageElement[] = [];
  images.forEach((src, i) => {
    const thumb = document.createElement("img");
    thumb.src = src;
    thumb.alt = `${alt} ${i + 1}`;
    if (i === 0) thumb.classList.add("active");
    thumb.addEventListener("click", () => {
      stageImg.src = src;
      thumbs.forEach((el) => el.classList.remove("active"));
      thumb.classList.add("active");
      gsap.fromTo(stageImg, { opacity: 0.3 }, { opacity: 1, duration: 0.35 });
    });
    thumbs.push(thumb);
    stageThumbs.appendChild(thumb);
  });
  // サムネイルが1枚だけなら切替UIは出さない
  if (images.length === 1) stageThumbs.innerHTML = "";
  stage.classList.remove("hidden");
  gsap.fromTo(
    stage,
    { opacity: 0, x: -28 },
    { opacity: 1, x: 0, duration: 0.55, ease: "power3.out" },
  );
}

// ステージの余白クリックは背景クリックと同じ扱いで閉じる
stage.addEventListener("click", (e) => {
  if (e.target === stage) closePanel();
});

window.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (panelOpen) closePanel();
  else goBack();
});

// ナビ(LINKS)
document.querySelectorAll<HTMLButtonElement>(".nav-btn").forEach((btn) => {
  btn.addEventListener("mouseenter", () => {
    if (!panelOpen) flyTo("links");
  });
  btn.addEventListener("mouseleave", () => {
    if (!panelOpen) flyTo(baseZone());
  });
  btn.addEventListener("click", () => {
    flyTo("links");
    openPanel({
      kicker: "LINKS",
      title: "Elsewhere",
      desc: "各サービスのプロフィールはこちら。\n※URL は差し替え予定。",
      tags: [],
      links,
    });
  });
});

// ---------------------------------------------------------------------------
// イントロ(上空から HOME へ降りる)
// ---------------------------------------------------------------------------

renderList(tree, "INDEX");

camBase.y += 7;
camBase.z += 6;
gsap.to(camBase, {
  y: zones.home.origin.y + CAM_OFFSET.y,
  z: zones.home.origin.z + CAM_OFFSET.z,
  duration: 1.8,
  ease: "power3.out",
});
gsap.from("header.ui, footer.ui", { opacity: 0, duration: 1.2, delay: 0.4 });
gsap.from(".kicker", { opacity: 0, y: 14, duration: 0.9, delay: 0.6 });

// ---------------------------------------------------------------------------
// メインループ
// ---------------------------------------------------------------------------

const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();

  // ゾーン基準位置 + パララックス
  camera.position.x += (camBase.x + pointerNdc.x * 0.6 - camera.position.x) * 0.08;
  camera.position.y += (camBase.y - pointerNdc.y * 0.4 - camera.position.y) * 0.08;
  camera.position.z += (camBase.z - camera.position.z) * 0.08;
  camera.lookAt(lookBase);

  // HOME
  homeSphere.rotation.y = t * 0.1;
  homeSphere.rotation.x = t * 0.04;
  homeRing.rotation.z = t * 0.05;
  homeIco.rotation.y = -t * 0.15;

  // GAME(ダイスがゆっくり回りながら浮遊)
  dice.forEach((d, i) => {
    d.rotation.x = t * 0.2 + i;
    d.rotation.y = t * 0.25 + i * 2;
    d.position.y += Math.sin(t * 0.7 + i * 1.9) * 0.0025;
  });

  // RESEARCH(電子が軌道を回る)
  orbits.forEach((orbit, i) => {
    orbit.rotation.z = t * (0.5 + i * 0.18);
  });
  nucleus.rotation.y = t * 0.4;

  // THESIS(紙面がゆっくり漂う)/ MOCK VIEWER(画面がゆっくり傾く)
  pages.forEach((page, i) => {
    page.position.y += Math.sin(t * 0.6 + i * 1.6) * 0.0022;
    page.rotation.y += Math.sin(t * 0.3 + i) * 0.0006;
  });
  viewerFrame.rotation.y = Math.sin(t * 0.4) * 0.16;
  viewerFrame.rotation.x = Math.sin(t * 0.27) * 0.05;

  // DECKBUILDER
  deckGroup.rotation.y = Math.sin(t * 0.25) * 0.12;
  deckRing.rotation.z = t * 0.15;

  // ZONEDIVER
  diveRings.forEach((ring, i) => {
    ring.rotation.z = t * 0.2 * (i % 2 === 0 ? 1 : -1);
  });
  diveCore.rotation.y = t * 0.5;

  // ABOUT / LINKS
  aboutKnot.rotation.y = t * 0.12;
  aboutKnot.rotation.x = t * 0.05;
  aboutRing.rotation.z = t * 0.06;
  linksGroup.rotation.y = t * 0.08;

  composer.render();
}

animate();

// ---------------------------------------------------------------------------
// リサイズ
// ---------------------------------------------------------------------------

window.addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
});
