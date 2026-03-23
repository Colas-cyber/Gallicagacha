console.log("GallicaGacha V3.5 - Requêtes simplifiées");

const STORAGE_KEY = "gallica_collection_v1";
const PROXY_URL = "https://gallicagacha.vercel.app/api/gallica";

// ---- THÈMES — requêtes simplifiées et testées ----
// On utilise une seule année par requête, et dc.date seul (plus robuste)
const THEMES = [
  { query: 'dc.type adj "image" and dc.date adj "1900"',     label: "Photo 1900"      },
  { query: 'dc.type adj "image" and dc.date adj "1870"',     label: "Photo 1870"      },
  { query: 'dc.type adj "image" and dc.date adj "1914"',     label: "Grande Guerre"   },
  { query: 'dc.type adj "image" and dc.date adj "1889"',     label: "Exposition 1889" },
  { query: 'dc.type adj "image" and dc.date adj "1848"',     label: "Révolution 1848" },
  { query: 'dc.type adj "image" and dc.date adj "1880"',     label: "Belle Époque"    },
  { query: 'dc.type adj "image" and dc.date adj "1930"',     label: "Années 30"       },
  { query: 'dc.type adj "image" and dc.date adj "1860"',     label: "Second Empire"   },
  { query: 'dc.type adj "image" and dc.date adj "1918"',     label: "Armistice"       },
  { query: 'dc.type adj "fascicule" and dc.date adj "1900"', label: "Presse 1900"     },
  { query: 'dc.type adj "fascicule" and dc.date adj "1870"', label: "Presse 1870"     },
  { query: 'dc.type adj "fascicule" and dc.date adj "1914"', label: "Presse 1914"     },
];

// ---- FALLBACK ----
const FALLBACK_ARKS = [
  { ark: "bpt6k285345w",  title: "Le Figaro, déc. 1900",       type: "journal", pages: 4  },
  { ark: "bpt6k285269s",  title: "Le Figaro, sept. 1900",      type: "journal", pages: 4  },
  { ark: "bpt6k272546t",  title: "Figaro Supplément, 1890",    type: "journal", pages: 4  },
  { ark: "bpt6k2732198",  title: "Figaro Supplément, 1913",    type: "journal", pages: 4  },
  { ark: "btv1b84229574", title: "Album photographique (BnF)", type: "photo",   pages: 50 },
  { ark: "btv1b10507065b",title: "Vue de Paris, 1870",         type: "photo",   pages: 3  },
];

// ---- RARETÉS ----
const RARITIES = [
  { label: "COMMUN",     color: "#888888", weight: 50 },
  { label: "PEU COMMUN", color: "#2a9d4e", weight: 28 },
  { label: "RARE",       color: "#2768c4", weight: 14 },
  { label: "ÉPIQUE",     color: "#9932cc", weight: 6  },
  { label: "LÉGENDAIRE", color: "#c8a200", weight: 2  },
];

function pickRarity() {
  const total = RARITIES.reduce((s, r) => s + r.weight, 0);
  let rand = Math.random() * total;
  for (const r of RARITIES) { rand -= r.weight; if (rand <= 0) return r; }
  return RARITIES[0];
}

function buildImgUrl(arkId, page) {
  return `https://gallica.bnf.fr/iiif/ark:/12148/${arkId}/f${page}/full/600,/0/native.jpg`;
}
function buildImgFallback(arkId, page) {
  return `https://gallica.bnf.fr/ark:/12148/${arkId}/f${page}.thumbnail`;
}

// ---- FONCTION PRINCIPALE ----
async function openPack() {
  const pack = document.getElementById('mainPack');
  const status = document.getElementById('packStatus');
  if (!pack || pack.classList.contains('opening')) return;

  pack.classList.add('opening');
  if (status) status.innerText = "ACCÈS AUX ARCHIVES...";

  try {
    const card = await fetchRandomCard();
    saveHero(card);
    showModal(card);
  } catch (e) {
    console.error("Erreur :", e);
    if (status) status.innerText = "BNF SATURÉE, RÉESSAIE...";
  } finally {
    pack.classList.remove('opening');
    setTimeout(() => { if (status) status.innerText = "CLIQUER POUR CHERCHER"; }, 3000);
  }
}

// ---- PROXY ----
async function fetchRandomCard() {
  const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
  const startRecord = Math.floor(Math.random() * 50) + 1;
  const url = `${PROXY_URL}?query=${encodeURIComponent(theme.query)}&maximumRecords=1&startRecord=${startRecord}`;

  try {
    const res = await fetchWithTimeout(url, 8000);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const card = await res.json();
    if (card.error) throw new Error(card.error);
    // Remplacer par image HD
    card.imgUrl      = buildImgUrl(card.arkId, card.page);
    card.imgFallback = buildImgFallback(card.arkId, card.page);
    console.log("✅ Carte :", card.title, card.arkId);
    return card;
  } catch (e) {
    console.warn("⚠️ Fallback :", e.message);
    return buildFallbackCard();
  }
}

function buildFallbackCard() {
  const item = FALLBACK_ARKS[Math.floor(Math.random() * FALLBACK_ARKS.length)];
  const page = Math.floor(Math.random() * item.pages) + 1;
  return {
    arkId: item.ark, title: item.title, year: null, docType: item.type, page,
    imgUrl:      buildImgUrl(item.ark, page),
    imgFallback: buildImgFallback(item.ark, page),
    itemUrl:     `https://gallica.bnf.fr/ark:/12148/${item.ark}/f${page}.item`,
  };
}

function fetchWithTimeout(url, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(timer));
}

const TYPE_LABELS = {
  photo: "📷 Photographie", journal: "📰 Journal", fascicule: "📰 Périodique",
  carte: "🗺️ Carte", affiche: "🖼️ Affiche", dessin: "✏️ Dessin",
  revue: "📖 Revue", image: "🖼️ Image", "image fixe": "🖼️ Image",
  document: "📄 Document",
};

// ---- MODALE ----
function showModal(card) {
  document.querySelector('.gallica-overlay')?.remove();
  const rarity = pickRarity();
  const typeLabel = TYPE_LABELS[card.docType] || "📄 Document";
  const yearLabel = card.year || "XIXe s.";

  const div = document.createElement('div');
  div.className = 'gallica-overlay';
  div.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.88);
    display:flex;align-items:center;justify-content:center;
    z-index:9999;font-family:'Georgia',serif;animation:gfadeIn .3s ease;
  `;

  div.innerHTML = `
    <style>
      @keyframes gfadeIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
      .gc {
        background: #faf6ee;
        width: min(420px, 92vw);
        border-radius: 8px;
        overflow: hidden;
        border: 3px solid ${rarity.color};
        box-shadow: 0 0 50px ${rarity.color}88;
      }
      .gc-head {
        background: #1a1a2e; color: #d4af37;
        padding: 10px 16px; font-size: 11px;
        letter-spacing: 2px;
        border-bottom: 2px solid ${rarity.color};
        text-align: center;
      }
      .gc-badge {
        display: inline-block; padding: 3px 14px;
        background: ${rarity.color}; color: #fff;
        font-size: 10px; letter-spacing: 2px;
        border-radius: 3px; margin-bottom: 4px;
      }
      .gc-img {
        background: #1a1a2e;
        padding: 16px;
        text-align: center;
      }
      .gc-img img {
        width: min(340px, 80vw);
        height: min(420px, 52vh);
        object-fit: cover;
        border: 2px solid #d4af37;
        display: block; margin: 0 auto;
        cursor: pointer;
        transition: opacity .2s;
      }
      .gc-img img:hover { opacity: .85; }
      .gc-hint {
        color: #d4af37; font-size: 10px;
        margin-top: 8px; letter-spacing: 1px; opacity: .7;
      }
      .gc-body {
        padding: 14px 16px 4px;
        text-align: center;
      }
      .gc-title {
        font-size: 15px; font-weight: bold;
        color: #1a1a2e; margin: 0 0 6px; line-height: 1.4;
      }
      .gc-meta { font-size: 11px; color: #666; margin: 3px 0; }
      .gc-footer {
        margin: 12px 0 0;
        background: #1a1a2e;
        padding: 16px;
        text-align: center;
        cursor: pointer;
      }
      .gc-footer p {
        color: #d4af37;
        font-size: 13px;
        font-weight: bold;
        letter-spacing: 2px;
        margin: 0;
      }
      .gc-footer span {
        display: block;
        color: #888;
        font-size: 10px;
        letter-spacing: 1px;
        margin-top: 4px;
      }
    </style>
    <div class="gc">
      <div class="gc-head">
        <div class="gc-badge">${rarity.label}</div><br>
        BIBLIOTHÈQUE NATIONALE DE FRANCE
      </div>
      <div class="gc-img">
        <img
          src="${card.imgUrl}"
          alt="${card.title}"
          onerror="this.src='${card.imgFallback}';this.onerror=null;"
          onclick="window.open('${card.itemUrl}','_blank')"
          title="Voir sur Gallica">
        <p class="gc-hint">↑ cliquer pour voir sur Gallica</p>
      </div>
      <div class="gc-body">
        <p class="gc-title">${card.title}</p>
        <p class="gc-meta">${typeLabel} · ${yearLabel} · Page ${card.page}</p>
        <p class="gc-meta" style="font-size:9px;color:#bbb;">ark:/12148/${card.arkId}</p>
      </div>
      <div class="gc-footer" id="gc-close">
        <p>AJOUTÉ À LA COLLECTION</p>
        <span>cliquer pour fermer</span>
      </div>
    </div>
  `;

  document.body.appendChild(div);
  div.addEventListener('click', (e) => { if (e.target === div) div.remove(); });
  document.getElementById('gc-close').addEventListener('click', () => div.remove());
}

// ---- SAUVEGARDE ----
function saveHero(card) {
  try {
    const coll = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const isDupe = coll.some(c => c.arkId === card.arkId && c.page === card.page);
    if (!isDupe) {
      coll.unshift({
        name: card.title, img: card.imgUrl, url: card.itemUrl,
        ...card, collectedAt: new Date().toISOString(),
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(coll.slice(0, 500)));
    }
  } catch (e) { console.warn("LocalStorage :", e); }
}

// ---- COLLECTION ----
function showCollection() {
  const container = document.getElementById('collectionGrid');
  if (!container) return;
  const coll = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  if (coll.length === 0) {
    container.innerHTML = `<p style="text-align:center;color:#888;font-family:Georgia;padding:20px">
      Votre collection est vide. Ouvrez un premier pack !</p>`;
    return;
  }
  container.innerHTML = coll.map(card => `
    <div onclick="window.open('${card.url || card.itemUrl}','_blank')"
         title="${card.name || card.title}"
         style="width:130px;background:#faf6ee;border:1px solid #ccc;border-radius:4px;
                overflow:hidden;text-align:center;cursor:pointer;font-family:Georgia;
                transition:transform .15s"
         onmouseover="this.style.transform='scale(1.04)'"
         onmouseout="this.style.transform='scale(1)'">
      <img src="${card.img || card.imgUrl}" onerror="this.onerror=null;"
           style="width:100%;height:165px;object-fit:cover;display:block;background:#eee;">
      <div style="padding:5px 6px;font-size:10px;color:#333;white-space:nowrap;
                  overflow:hidden;text-overflow:ellipsis;">${card.name || card.title}</div>
      <div style="padding:0 6px 6px;font-size:9px;color:#888;">${card.year || "XIXe"}</div>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  const pack = document.getElementById('mainPack');
  if (pack) pack.addEventListener('click', openPack);
  showCollection();
});

window.openPack = openPack;
window.showCollection = showCollection;
console.log("GallicaGacha V3.4 - URL Vercel absolue");

const STORAGE_KEY = "gallica_collection_v1";

// ✅ URL absolue du proxy Vercel (fonctionne depuis n'importe où)
const PROXY_URL = "https://gallicagacha.vercel.app/api/gallica";

// ---- THÈMES ----
const THEMES = [
  { query: 'dc.type adj "image" and dc.date.issued any "1900 1901 1902"',      label: "Photo 1900"      },
  { query: 'dc.type adj "fascicule" and dc.date.issued any "1870 1871 1872"',  label: "Presse 1870"     },
  { query: 'dc.type adj "image" and dc.date.issued any "1914 1915 1916"',      label: "Grande Guerre"   },
  { query: 'dc.type adj "fascicule" and dc.date.issued any "1889 1890"',       label: "Exposition 1889" },
  { query: 'dc.type adj "image" and dc.date.issued any "1848 1849 1850"',      label: "Révolution 1848" },
  { query: 'dc.type adj "image" and dc.date.issued any "1880 1881 1882"',      label: "Belle Époque"    },
  { query: 'dc.type adj "fascicule" and dc.date.issued any "1930 1931 1932"',  label: "Années 30"       },
];

// ---- FALLBACK ----
const FALLBACK_ARKS = [
  { ark: "bpt6k285345w",  title: "Le Figaro, déc. 1900",       type: "journal", pages: 4  },
  { ark: "bpt6k285269s",  title: "Le Figaro, sept. 1900",      type: "journal", pages: 4  },
  { ark: "bpt6k272546t",  title: "Figaro Supplément, 1890",    type: "journal", pages: 4  },
  { ark: "bpt6k2732198",  title: "Figaro Supplément, 1913",    type: "journal", pages: 4  },
  { ark: "bpt6k2736663",  title: "Figaro Supplément, 1927",    type: "journal", pages: 4  },
  { ark: "btv1b84229574", title: "Album photographique (BnF)", type: "photo",   pages: 50 },
  { ark: "btv1b10507065b",title: "Vue de Paris, 1870",         type: "photo",   pages: 3  },
];

// ---- RARETÉS ----
const RARITIES = [
  { label: "COMMUN",     color: "#888888", weight: 50 },
  { label: "PEU COMMUN", color: "#2a9d4e", weight: 28 },
  { label: "RARE",       color: "#2768c4", weight: 14 },
  { label: "ÉPIQUE",     color: "#9932cc", weight: 6  },
  { label: "LÉGENDAIRE", color: "#c8a200", weight: 2  },
];

function pickRarity() {
  const total = RARITIES.reduce((s, r) => s + r.weight, 0);
  let rand = Math.random() * total;
  for (const r of RARITIES) { rand -= r.weight; if (rand <= 0) return r; }
  return RARITIES[0];
}

// ---- URLS IMAGE ----
function buildImgUrl(arkId, page) {
  return `https://gallica.bnf.fr/iiif/ark:/12148/${arkId}/f${page}/full/600,/0/native.jpg`;
}
function buildImgFallback(arkId, page) {
  return `https://gallica.bnf.fr/ark:/12148/${arkId}/f${page}.thumbnail`;
}

// ---- FONCTION PRINCIPALE ----
async function openPack() {
  const pack = document.getElementById('mainPack');
  const status = document.getElementById('packStatus');
  if (!pack || pack.classList.contains('opening')) return;

  pack.classList.add('opening');
  if (status) status.innerText = "ACCÈS AUX ARCHIVES...";

  try {
    const card = await fetchRandomCard();
    saveHero(card);
    showModal(card);
  } catch (e) {
    console.error("Erreur :", e);
    if (status) status.innerText = "BNF SATURÉE, RÉESSAIE...";
  } finally {
    pack.classList.remove('opening');
    setTimeout(() => { if (status) status.innerText = "CLIQUER POUR CHERCHER"; }, 3000);
  }
}

// ---- PROXY ----
async function fetchRandomCard() {
  const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
  const startRecord = Math.floor(Math.random() * 50) + 1;
  const url = `${PROXY_URL}?query=${encodeURIComponent(theme.query)}&maximumRecords=1&startRecord=${startRecord}`;
  try {
    const res = await fetchWithTimeout(url, 8000);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const card = await res.json();
    if (card.error) throw new Error(card.error);
    card.imgUrl      = buildImgUrl(card.arkId, card.page);
    card.imgFallback = buildImgFallback(card.arkId, card.page);
    return card;
  } catch (e) {
    console.warn("⚠️ Fallback :", e.message);
    return buildFallbackCard();
  }
}

function buildFallbackCard() {
  const item = FALLBACK_ARKS[Math.floor(Math.random() * FALLBACK_ARKS.length)];
  const page = Math.floor(Math.random() * item.pages) + 1;
  return {
    arkId: item.ark, title: item.title, year: null, docType: item.type, page,
    imgUrl:      buildImgUrl(item.ark, page),
    imgFallback: buildImgFallback(item.ark, page),
    itemUrl:     `https://gallica.bnf.fr/ark:/12148/${item.ark}/f${page}.item`,
  };
}

function fetchWithTimeout(url, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(timer));
}

const TYPE_LABELS = {
  photo: "📷 Photographie", journal: "📰 Journal", fascicule: "📰 Périodique",
  carte: "🗺️ Carte", affiche: "🖼️ Affiche", dessin: "✏️ Dessin",
  revue: "📖 Revue", image: "🖼️ Image", document: "📄 Document",
};

// ---- MODALE ----
function showModal(card) {
  document.querySelector('.gallica-overlay')?.remove();
  const rarity = pickRarity();
  const typeLabel = TYPE_LABELS[card.docType] || "📄 Document";
  const yearLabel = card.year || "XIXe s.";

  const div = document.createElement('div');
  div.className = 'gallica-overlay';
  div.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.88);
    display:flex;align-items:center;justify-content:center;
    z-index:9999;font-family:'Georgia',serif;animation:gfadeIn .3s ease;
  `;

  div.innerHTML = `
    <style>
      @keyframes gfadeIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
      .gc {
        background: #faf6ee;
        width: min(420px, 92vw);
        border-radius: 8px;
        overflow: hidden;
        border: 3px solid ${rarity.color};
        box-shadow: 0 0 50px ${rarity.color}88;
      }
      .gc-head {
        background: #1a1a2e; color: #d4af37;
        padding: 10px 16px; font-size: 11px;
        letter-spacing: 2px;
        border-bottom: 2px solid ${rarity.color};
        text-align: center;
      }
      .gc-badge {
        display: inline-block; padding: 3px 14px;
        background: ${rarity.color}; color: #fff;
        font-size: 10px; letter-spacing: 2px;
        border-radius: 3px; margin-bottom: 4px;
      }
      .gc-img {
        background: #1a1a2e;
        padding: 16px;
        text-align: center;
      }
      .gc-img img {
        width: min(340px, 80vw);
        height: min(420px, 52vh);
        object-fit: cover;
        border: 2px solid #d4af37;
        display: block; margin: 0 auto;
        cursor: pointer;
        transition: opacity .2s;
      }
      .gc-img img:hover { opacity: .85; }
      .gc-hint {
        color: #d4af37; font-size: 10px;
        margin-top: 8px; letter-spacing: 1px;
        opacity: .7;
      }
      .gc-body {
        padding: 14px 16px 4px;
        text-align: center;
      }
      .gc-title {
        font-size: 15px; font-weight: bold;
        color: #1a1a2e; margin: 0 0 6px;
        line-height: 1.4;
      }
      .gc-meta { font-size: 11px; color: #666; margin: 3px 0; }

      /* Bandeau bas — simple texte, pas un bouton */
      .gc-footer {
        margin: 12px 0 0;
        background: #1a1a2e;
        padding: 16px;
        text-align: center;
        cursor: pointer;
      }
      .gc-footer p {
        color: #d4af37;
        font-size: 13px;
        font-weight: bold;
        letter-spacing: 2px;
        margin: 0;
      }
      .gc-footer span {
        display: block;
        color: #888;
        font-size: 10px;
        letter-spacing: 1px;
        margin-top: 4px;
      }
    </style>
    <div class="gc">
      <div class="gc-head">
        <div class="gc-badge">${rarity.label}</div><br>
        BIBLIOTHÈQUE NATIONALE DE FRANCE
      </div>

      <div class="gc-img">
        <img
          src="${card.imgUrl}"
          alt="${card.title}"
          onerror="this.src='${card.imgFallback}';this.onerror=null;"
          onclick="window.open('${card.itemUrl}','_blank')"
          title="Voir sur Gallica">
        <p class="gc-hint">↑ cliquer pour voir sur Gallica</p>
      </div>

      <div class="gc-body">
        <p class="gc-title">${card.title}</p>
        <p class="gc-meta">${typeLabel} · ${yearLabel} · Page ${card.page}</p>
        <p class="gc-meta" style="font-size:9px;color:#bbb;">ark:/12148/${card.arkId}</p>
      </div>

      <div class="gc-footer" id="gc-close" title="Fermer">
        <p>AJOUTÉ À LA COLLECTION</p>
        <span>cliquer pour fermer</span>
      </div>
    </div>
  `;

  document.body.appendChild(div);
  div.addEventListener('click', (e) => { if (e.target === div) div.remove(); });
  document.getElementById('gc-close').addEventListener('click', () => div.remove());
}

// ---- SAUVEGARDE ----
function saveHero(card) {
  try {
    const coll = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const isDupe = coll.some(c => c.arkId === card.arkId && c.page === card.page);
    if (!isDupe) {
      coll.unshift({
        name: card.title, img: card.imgUrl, url: card.itemUrl,
        ...card, collectedAt: new Date().toISOString(),
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(coll.slice(0, 500)));
    }
  } catch (e) { console.warn("LocalStorage :", e); }
}

// ---- COLLECTION ----
function showCollection() {
  const container = document.getElementById('collectionGrid');
  if (!container) return;
  const coll = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  if (coll.length === 0) {
    container.innerHTML = `<p style="text-align:center;color:#888;font-family:Georgia;padding:20px">
      Votre collection est vide. Ouvrez un premier pack !</p>`;
    return;
  }
  container.innerHTML = coll.map(card => `
    <div onclick="window.open('${card.url || card.itemUrl}','_blank')"
         title="${card.name || card.title}"
         style="width:130px;background:#faf6ee;border:1px solid #ccc;border-radius:4px;
                overflow:hidden;text-align:center;cursor:pointer;font-family:Georgia;
                transition:transform .15s"
         onmouseover="this.style.transform='scale(1.04)'"
         onmouseout="this.style.transform='scale(1)'">
      <img src="${card.img || card.imgUrl}" onerror="this.onerror=null;"
           style="width:100%;height:165px;object-fit:cover;display:block;background:#eee;">
      <div style="padding:5px 6px;font-size:10px;color:#333;white-space:nowrap;
                  overflow:hidden;text-overflow:ellipsis;">${card.name || card.title}</div>
      <div style="padding:0 6px 6px;font-size:9px;color:#888;">${card.year || "XIXe"}</div>
    </div>
  `).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  const pack = document.getElementById('mainPack');
  if (pack) pack.addEventListener('click', openPack);
  showCollection();
});

window.openPack = openPack;
window.showCollection = showCollection;
