import '@fontsource-variable/inter';
import './styles.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import { content } from './content.js';
import { render } from './render.js';

gsap.registerPlugin(ScrollTrigger);
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 1. Text comes from src/content.js (rendered by src/render.js)
render(content);

// 2. Smooth scrolling (Lenis) + smooth anchor jumps from the nav
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ lerp: 0.09 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (a && a.hash.length > 1) { e.preventDefault(); lenis.scrollTo(a.hash); }
  });
}

async function start() {
  // 3. The gallery (src/gallery.js) builds the room, frames and the scroll-driven camera.
  //    Loaded after the text so content shows first; no WebGL → plain page.
  try { await import('./gallery.js'); }
  catch (err) { console.warn('3D disabled:', err); document.body.classList.add('no-3d'); }

  await document.fonts.ready;
  ScrollTrigger.refresh();   // re-measure layout → frames re-align with their sections

  // 4. Content scales from small → full size as it enters the view
  if (!reduced) {
    gsap.utils.toArray('.depth').forEach((el) => {
      const featured = el.classList.contains('depth-featured');
      gsap.fromTo(el, { scale: featured ? 0.84 : 0.93, opacity: 0.25 }, {
        scale: 1, opacity: 1, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 95%', end: 'top 55%', scrub: true },
      });
    });
  }
  document.getElementById('loader').classList.add('done');
}
start();
