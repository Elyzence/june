/* =====================================================================
 * GALLERY PORTFOLIO — Three.js room + GSAP ScrollTrigger camera
 *
 * HOW THE CAMERA WORKS
 *  - The room is one long corridor (walls left/right, floor, ceiling).
 *  - A single number `state.p` (0→1) is tied to page scroll with ScrollTrigger (scrub).
 *  - p moves the camera forward along -Z, adds a very gentle sway, and narrows the
 *    field of view slightly (FOV 56→48), which reads as a calm "approach / zoom in".
 *  - Framed photos are placed on the walls so each one sits just ahead of the camera
 *    when its HTML section is centred on screen. Positions are re-computed on every
 *    ScrollTrigger refresh (resize, font load), so layout changes stay in sync.
 *
 * HOW TO ADD PHOTOS: see data-frames="..." in index.html (files go in /public/photos).
 * Tweak the look with the constants below.
 * ===================================================================== */
import * as THREE from 'three';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

console.info('gallery: centred caption plate build');   // check in the browser console that you are running this version
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const BG = 0xf7f3ed;
const Z_START = 16, Z_END = -90;       // camera travel (start further back, move forward)
const ROOM_LEN = 150, ROOM_H = 6;
const FRAME_AHEAD = 9;                 // how far ahead of the camera a frame hangs
const FRAME_SIZE = [3.2, 2.4];         // photo width × height (world units)
const EYE_Y = 1.8;

const canvas = document.getElementById('gallery');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 3));
const scene = new THREE.Scene();
scene.background = new THREE.Color(BG);
scene.fog = new THREE.Fog(BG, 14, 62);
const camera = new THREE.PerspectiveCamera(56, 1, 0.1, 120);

// Lighting: soft, diffused. A light follows the camera so nearby walls glow gently.
scene.add(new THREE.HemisphereLight(0xffffff, 0xe6dccb, 1.9));
const follow = new THREE.PointLight(0xfff0de, 35, 30, 1.4);
scene.add(follow);

const mat = (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 1, metalness: 0 });
const room = new THREE.Group();   // rebuilt on refresh (walls depend on aspect ratio)
scene.add(room);

/** Soft grey-blue placeholder photo, used until a real image loads. */
function placeholderTexture() {
  const c = document.createElement('canvas'); c.width = 640; c.height = 480;
  const g = c.getContext('2d'), grad = g.createLinearGradient(0, 0, 640, 480);
  grad.addColorStop(0, '#c9d3d6'); grad.addColorStop(1, '#e6dfd2');
  g.fillStyle = grad; g.fillRect(0, 0, 640, 480);
  g.fillStyle = 'rgba(58,58,60,.35)'; g.font = '28px system-ui'; g.textAlign = 'center';
  g.fillText('Your photo here', 320, 250);
  return new THREE.CanvasTexture(c);
}
/** Faint radial drop shadow behind a frame. */
function shadowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const g = c.getContext('2d'), r = g.createRadialGradient(64, 64, 20, 64, 64, 64);
  r.addColorStop(0, 'rgba(60,50,40,.35)'); r.addColorStop(1, 'rgba(60,50,40,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
const shadowTex = shadowTexture(), loader = new THREE.TextureLoader();

/** Museum label plate: a flat light-grey rectangle exactly as wide as the frame, text centred in the middle
 *  (title in charcoal, year in soft grey underneath). Hangs just below the frame. */
function makeLabel(text, frameSize = FRAME_SIZE) {
  const FONT = "'Inter Variable', Inter, system-ui, sans-serif";
  const cut = text.lastIndexOf(' · ');
  const title = cut > 0 ? text.slice(0, cut) : text, sub = cut > 0 ? text.slice(cut + 3) : '';
  const W = 2048, H = 150, fw = (FRAME_SIZE[0] + 0.34) * 0.8;      // Keep caption plates the same size for every photo.
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const spaced = (em) => { if ('letterSpacing' in g) g.letterSpacing = em; };
  g.fillStyle = '#f1f0ed'; g.fillRect(0, 0, W, H);             // white with a touch of grey (change the colour here)
  // g.strokeStyle = 'rgba(43,42,40,.22)'; g.lineWidth = 8; g.strokeRect(4, 4, W - 8, H - 8);   // clear outline so the plate stands out from the beige wall
  g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  let size = 74;
  const setTitle = () => { g.font = `400 ${size}px ${FONT}`; spaced('0.005em'); return g.measureText(title).width; };
  while (setTitle() > W - 160 && size > 50) size -= 2;
  const subSize = Math.round(size * 0.64), gap = 34;
  const capT = size * 0.72, capS = subSize * 0.72;
  const block = sub ? capT + gap + capS : capT, top = (H - block) / 2;
  g.fillStyle = '#2b2a28'; setTitle(); g.fillText(title, W / 2, top + capT);
  if (sub) { g.font = `400 ${subSize}px ${FONT}`; spaced('0.08em'); g.fillStyle = '#7b766d'; g.fillText(sub, W / 2, top + capT + gap + capS); }
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const h = (fw * H) / W;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(fw, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, fog: false, toneMapped: false }));   // no fog: stays crisp at a distance
  m.position.set(0, -(frameSize[1] / 2 + 0.17 + 0.12 + h / 2), 0.06);   // x = 0: centred right below the frame
  return m;
}

/** One framed artwork. `url` is a path inside /public (e.g. "photos/a.jpg"). */
function makeFrame(url, caption, options = {}) {
  const size = options.size || FRAME_SIZE;
  const [w, h] = size, g = new THREE.Group();
  g.userData.size = size;
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.7, h * 1.7), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  shadow.position.z = 0.01;
  const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.34, h + 0.34, 0.14), mat(0xe4d6c0));
  frame.position.z = 0.08;
  const passepartout = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.14, h + 0.14), mat(0xfbf8f3));
  passepartout.position.z = 0.16;
  const ph = placeholderTexture();
  // emissive (0 at rest) lets the photo brighten to true colours while zoomed
  const photoMat = new THREE.MeshStandardMaterial({ map: ph, emissiveMap: ph, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.9 });
  g.userData.photoMat = photoMat;
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(w, h), photoMat);
  photo.position.z = 0.17;
  loader.load(import.meta.env.BASE_URL + url, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 16;
    photoMat.map = photoMat.emissiveMap = t;
    g.userData.loaded = true;   // only real photos are clickable
    const ir = t.image.width / t.image.height, fr = w / h;
    if (options.fit === 'contain') {
      const photoSize = ir > fr ? [w, w / ir] : [h * ir, h];
      photo.geometry.dispose();
      photo.geometry = new THREE.PlaneGeometry(...photoSize);
      t.repeat.set(1, 1); t.offset.set(0, 0);
    } else if (ir > fr) {
      t.repeat.x = fr / ir; t.offset.x = (1 - t.repeat.x) / 2;
    } else {
      t.repeat.y = ir / fr; t.offset.y = (1 - t.repeat.y) / 2;
    }
    photoMat.needsUpdate = true;
  }, undefined, () => {}); // missing file → keep placeholder
  g.userData.isFrame = true;       // used by hover-to-zoom
  g.add(shadow, frame, passepartout, photo);
  if (caption) g.add(makeLabel(caption, size));
  return g;
}

// Veil: while a photo is open, the room behind softens under a translucent beige layer that sits
// between the room and the (fully opaque) photo. It hangs just in front of the camera.
scene.add(camera);
const veil = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ color: BG, transparent: true, opacity: 0, depthTest: false, depthWrite: false, fog: false }));
veil.position.z = -3; veil.renderOrder = 5; veil.frustumCulled = false; veil.visible = false;
camera.add(veil);

// ---- Hover-to-zoom state ---------------------------------------------------
let frames = [], hovered = null, opened = null;
function registerFrame(g) {
  const u = g.userData;
  u.homePos = g.position.clone(); u.homeQuat = g.quaternion.clone(); u.t = 0; u.h = 0;
  u.normal = new THREE.Vector3(0, 0, 1).applyQuaternion(u.homeQuat);   // direction pointing away from the wall
  // Invisible hit area that stays on the wall, so the photo can't "run away" from the pointer while it flies to the centre.
  const proxy = new THREE.Mesh(new THREE.PlaneGeometry(u.size[0] + 0.5, u.size[1] + 0.5), new THREE.MeshBasicMaterial({ visible: false }));
  proxy.position.copy(g.position); proxy.quaternion.copy(g.quaternion); proxy.translateZ(0.3);
  proxy.userData.owner = g;
  room.add(proxy); frames.push(g);
}

const zAt = (p) => Z_START + (Z_END - Z_START) * p;

function build() {
  room.clear(); frames = []; hovered = null; opened = null;
  const aspect = innerWidth / innerHeight;
  const wallX = aspect < 1 ? 3.4 : 5.6;       // narrower corridor on portrait screens
  camera.aspect = aspect; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight, false);

  const zMid = (Z_START + Z_END) / 2 - 10;
  const plane = (w, h, color, pos, rot) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat(color));
    m.position.set(...pos); m.rotation.set(...rot); room.add(m);
  };
  plane(ROOM_LEN, ROOM_H, 0xf1ebe0, [-wallX, ROOM_H / 2, zMid], [0, Math.PI / 2, 0]);   // left wall
  plane(ROOM_LEN, ROOM_H, 0xf1ebe0, [wallX, ROOM_H / 2, zMid], [0, -Math.PI / 2, 0]);   // right wall
  plane(wallX * 2, ROOM_LEN, 0xe9e0d0, [0, 0, zMid], [-Math.PI / 2, 0, 0]);             // floor
  plane(wallX * 2, ROOM_LEN, 0xfaf7f2, [0, ROOM_H, zMid], [Math.PI / 2, 0, 0]);         // ceiling
  plane(wallX * 2, ROOM_H, 0xf1ebe0, [0, ROOM_H / 2, Z_END - 40], [0, 0, 0]);            // end wall
  for (let z = Z_START; z > Z_END - 30; z -= 12) {                                       // soft ceiling light strips
    const s = new THREE.Mesh(new THREE.BoxGeometry(wallX * 0.8, 0.04, 0.5), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    s.position.set(0, ROOM_H - 0.03, z); room.add(s);
  }

  // Place frames: each [data-frames] element → frames just ahead of the camera when it is centred.
  const maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  document.querySelectorAll('[data-frames]').forEach((el) => {
    const caps = (el.dataset.captions || '').split('|');
    const opts = JSON.parse(el.dataset.frameOpts || '[]');   // per-photo position overrides from content.js
    const r = el.getBoundingClientRect();
    const centre = r.top + scrollY + r.height / 2 - innerHeight / 2;
    const camZ = zAt(Math.min(Math.max(centre / maxScroll, 0), 1));
    el.dataset.frames.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 2).forEach((url, i) => {
      const o = opts[i] || {};                                           // { side, y, dz } — all optional
      const side = o.side === 'left' ? -1 : o.side === 'right' ? 1 : (i === 0 ? 1 : -1);                     // 1st = right wall, 2nd = left wall
      const f = makeFrame(url, caps[i], o);
      f.position.set(side * (wallX - 0.02), o.y ?? 2.7, camZ - FRAME_AHEAD - i * 6 - (o.dz ?? 0));
      f.rotation.y = side > 0 ? -Math.PI / 2 : Math.PI / 2;
      room.add(f); registerFrame(f);
    });
  });
}

// ---- Scroll → camera --------------------------------------------------------
const state = { p: 0 };
gsap.to(state, {
  p: 1, ease: 'none',
  scrollTrigger: { trigger: document.documentElement, start: 'top top', end: 'bottom bottom', scrub: REDUCED ? true : 1.2 }
});

function frame() {
  const z = zAt(state.p), sway = REDUCED ? 0 : Math.sin(state.p * 9) * 0.35;
  camera.position.set(sway, EYE_Y, z);
  camera.lookAt(sway * 0.5, EYE_Y + 0.1, z - 10);
  camera.fov = 56 - 8 * state.p; camera.updateProjectionMatrix();   // gentle zoom-in
  follow.position.set(0, 4, z - 3);
  updateFrames();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

// ---- Photos: hover = gentle hint, click = glide to the centre ------------------
// Hover: the frame lifts slightly off the wall and the cursor becomes a magnifier (no text needed).
// Click/tap: the photo glides to the centre, the page dims (body.peek). Click again, Esc or scrolling closes it.
const ZOOM_DIST = 6;                       // how far in front of the camera the opened photo sits
const SOLID = 'a,button,.nav';              // real links/buttons still work; text cards are see-through for photo clicks
const raycaster = new THREE.Raycaster(), ptr = { ndc: new THREE.Vector2(), active: false, solid: false };
const _dir = new THREE.Vector3(), _target = new THREE.Vector3();
let cursor = '', scrollAtOpen = 0;
const setPtr = (e) => {
  ptr.ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ptr.active = true; ptr.solid = !!e.target.closest(SOLID);   // pointer over text → ignore the gallery behind it
};
addEventListener('pointermove', setPtr, { passive: true });
addEventListener('pointerdown', setPtr, { passive: true });
document.documentElement.addEventListener('pointerleave', () => { ptr.active = false; });

function pick() {
  if (!ptr.active || ptr.solid) return null;
  raycaster.setFromCamera(ptr.ndc, camera);
  const o = raycaster.intersectObjects(room.children, true)[0]?.object;
  if (!o) return null;
  return o.userData.owner || (o.parent && o.parent.userData.isFrame ? o.parent : null);
}

const close = () => { opened = null; };
addEventListener('click', (e) => {
  if (opened) { close(); return; }
  setPtr(e);
  const g = pick();
  if (g) { opened = g; scrollAtOpen = scrollY; }
});
addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
addEventListener('scroll', () => { if (opened && Math.abs(scrollY - scrollAtOpen) > 40) close(); }, { passive: true });

function updateFrames() {
  hovered = opened ? null : pick();
  camera.updateMatrixWorld();
  camera.getWorldDirection(_dir);
  _target.copy(camera.position).addScaledVector(_dir, ZOOM_DIST);
  const visH = 2 * ZOOM_DIST * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  let mix = 0;
  for (const g of frames) {
    const u = g.userData, openGoal = g === opened ? 1 : 0, hintGoal = g === hovered ? 1 : 0;
    const zoom = Math.min((visH * 0.7) / (u.size[1] + 0.34), (visH * camera.aspect * 0.86) / (u.size[0] + 0.34));
    u.t = REDUCED ? openGoal : u.t + (openGoal - u.t) * 0.11;
    u.h = REDUCED ? hintGoal : u.h + (hintGoal - u.h) * 0.16;
    if (Math.abs(openGoal - u.t) < 0.002) u.t = openGoal;
    const e = u.t * u.t * (3 - 2 * u.t), lift = u.h * (1 - e);   // smoothstep; hint fades as it opens
    g.position.lerpVectors(u.homePos, _target, e).addScaledVector(u.normal, 0.3 * lift);
    g.quaternion.copy(u.homeQuat).slerp(camera.quaternion, e);   // turn to face the viewer
    g.scale.setScalar(1 + (zoom - 1) * e + 0.03 * lift);
    u.photoMat.emissiveIntensity = 0.12 * e + 0.1 * lift;   // just enough to keep the photo's colours true
    mix = Math.max(mix, e);
    // While (nearly) open, draw the frame, photo and label on top of everything. Otherwise the floor/walls cut into
    // the enlarged frame (that is why its bottom edge vanished). Explicit renderOrder keeps the layers in the right order.
    const on = e > 0.01;
    if (u.onTop !== on) {
      u.onTop = on;
      g.children.forEach((m, i) => {
        const mt = m.material;
        if (m.userData.t0 === undefined) m.userData.t0 = mt.transparent;
        m.renderOrder = on ? 10 + i : 0; mt.depthTest = !on;
        mt.transparent = on ? true : m.userData.t0; mt.needsUpdate = true;
        // Crisp text/photo when opened: the label image is larger than it appears on screen, and mipmapping then softens it.
        // Plain linear filtering keeps it sharp up close; the smooth mipmapped look returns on the wall (less shimmer when scrolling).
        if (i > 0 && mt.map) { mt.map.minFilter = on ? THREE.LinearFilter : THREE.LinearMipmapLinearFilter; mt.map.needsUpdate = true; }   // drawn after the veil, still fully opaque
      });
      g.children[0].visible = !on;   // the soft wall shadow isn't needed (and would draw over the frame)
    }
  }
  veil.visible = mix > 0.002; veil.material.opacity = 0.55 * mix;
  follow.intensity = 35 * (1 - 0.82 * mix);   // calm the camera light while a photo is open, so frame and photo aren't glaring
  document.body.classList.toggle('peek', !!opened);
  const want = opened ? 'zoom-out' : hovered ? 'zoom-in' : '';
  if (want !== cursor) document.body.style.cursor = cursor = want;
}

ScrollTrigger.addEventListener('refresh', build);
build(); frame();