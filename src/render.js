// Turns src/content.js into DOM. Plain template strings, no framework.
const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const list = (items = []) => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
const tags = (items = []) => `<ul class="tags">${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;

// Photos: list paths (inside /public) in content.js; each becomes a framed picture on the gallery wall.
// Museum label under each photo: the item's own `captions: [...]`, or "<title> · <year>" by default.
const yrs = (p = '') => { const u = [...new Set(p.match(/\d{4}/g) || [])]; return u.length > 1 ? `${u[0]}–${u[u.length - 1]}` : u[0] || ''; };
const cap = (x, label) => x.captions ?? (x.photos || []).map(() => [label, yrs(x.period)].filter(Boolean).join(' · '));
// A photo is a path string, or { src, side, y, dz, size, fit } to place/style it by hand (see content.js).
const src = (o) => (typeof o === 'string' ? o : o.src);
const frameOpts = (p) => (p.some((o) => typeof o !== 'string') ? ` data-frame-opts="${esc(JSON.stringify(p.map((o) => (typeof o === 'string' ? {} : { side: o.side, y: o.y, dz: o.dz, size: o.size, fit: o.fit }))))}"` : '');
const fr = (p, caps = []) =>
  p && p.length ? ` data-frames="${esc(p.map(src).join(','))}"${frameOpts(p)}${caps.length ? ` data-captions="${esc(caps.join('|'))}"` : ''}` : '';

function experienceCard(x) {
  const paper = x.paper
    ? `<aside class="paper"><h4>Research paper</h4>
        <p><strong>${x.paper.url ? `<a href="${esc(x.paper.url)}" target="_blank" rel="noopener">${esc(x.paper.title)}</a>` : esc(x.paper.title)}</strong></p>
        <p>${esc(x.paper.venue)}</p><p>${esc(x.paper.note)}</p></aside>`
    : '';
  return `<div class="depth ${x.featured ? 'depth-featured' : ''}"${fr(x.photos, cap(x, x.role))}>
    <article class="card ${x.featured ? 'featured' : ''}">
      <header>
        <h3>${esc(x.role)}</h3>
        <p class="org">${esc(x.org)}</p>
        <p class="period">${esc(x.period)}</p>
      </header>
      <div class="body">
        <p>${esc(x.summary)}</p>
        <h4>Responsibilities</h4>${list(x.responsibilities)}
        ${x.achievements?.length ? `<h4>Achievements</h4>${list(x.achievements)}` : ''}
        ${paper}
        ${tags(x.tech)}
      </div>
    </article></div>`;
}

export function render(c) {
  const $ = (id) => document.getElementById(id);
  const k = c.contact;
  const tagline = Array.isArray(c.tagline)
    ? c.tagline.map((line) => `<span>${esc(line)}</span>`).join('')
    : esc(c.tagline);

  $('nav').innerHTML = `<a class="brand" href="#hero">${esc(c.name)}</a>
    <nav aria-label="Sections"><a href="#hero">Home</a><a href="#about">About</a><a href="#education">Education</a><a href="#experience">Experience</a><a href="#more">Additional</a><a href="#skills">Skills</a><a href="#contact">Contact</a></nav>`;

  $('hero').innerHTML = `<div class="wrap"><h1>${esc(c.name)}</h1><p class="lead">${tagline}</p>
    <p class="hint">Scroll to move forward</p></div>`;

  // About: one large statement + a quieter second column. No box.
  $('about').innerHTML = `<div class="wrap"><h2 class="depth">About</h2><div class="about-grid box depth"${fr(c.aboutPhotos, c.aboutCaptions || (c.aboutPhotos || []).map(() => 'About me'))}><p class="big">${esc(c.about[0])}</p><div class="small">${c.about.slice(1).map((p) => `<p>${esc(p)}</p>`).join('')}</div></div></div>`;

  // Education: a vertical timeline
  $('education').innerHTML = `<div class="wrap"><h2 class="depth">Education</h2><div class="timeline box">${c.education
    .map((e) => `<article class="tl-item depth"><span class="dot"></span><p class="period">${esc(e.period)}</p><h3>${esc(e.degree)}</h3><p class="org">${esc(e.school)}</p><p>${Array.isArray(e.text) ? e.text.map((line) => esc(line)).join('<br>') : esc(e.text)}</p>${e.tags?.length ? tags(e.tags) : ''}</article>`)
    .join('')}</div></div>`;

  $('experience').innerHTML = `<div class="wrap"><h2 class="depth">Experience</h2><div class="xp">${c.experience.map(experienceCard).join('')}</div></div>`;

  // Additional: open ruled rows on a soft veil (same language as Education / Skills), period on the left
  $('more').innerHTML = `<div class="wrap"><h2 class="depth">Additional experience</h2><div class="extra box">${c.additional
    .map((a) => `<article class="row depth"${fr(a.photos, cap(a, a.title))}><p class="period">${esc(a.period)}</p><div><h3>${esc(a.title)}</h3><p class="org">${esc(a.org)}</p>${Array.isArray(a.text) ? a.text.map((paragraph) => `<p>${esc(paragraph)}</p>`).join('') : `<p>${esc(a.text)}</p>`}</div></article>`)
    .join('')}</div></div>` ;

  // Skills: open rows, group name on the left, chips on the right
  $('skills').innerHTML = `<div class="wrap"><h2 class="depth">Skills</h2><div class="skill-rows box">${Object.entries(c.skills)
    .map(([g, items]) => `<div class="skill-row depth"><h3>${esc(g)}</h3>${tags(items)}</div>`)
    .join('')}</div></div>`;

  // Contact: open, centred, email as the headline (no coloured box)
  $('contact').innerHTML = `<div class="wrap"><div class="contact box depth"><h2>Contact</h2><p>Open to conversations about internships and junior roles.</p>
    <a class="mail" href="mailto:${esc(k.email)}">${esc(k.email)}</a></div></div>`;
  $('foot').textContent = `© ${new Date().getFullYear()} ${c.name}`;
  document.title = `${c.name} – IT Professional`;
}