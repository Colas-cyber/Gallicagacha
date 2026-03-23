console.log("GallicaGacha V3 - Proxy Vercel actif");

const STORAGE_KEY = "gallica_collection_v1";

// Proxy Vercel local — fonctionne automatiquement sur vercel.app
const PROXY_URL = "/api/gallica";

// ---- THÈMES DE RECHERCHE ----
const THEMES = [
  { query: 'dc.type adj "image" and dc.date.issued any "1900 1901 1902"',      label: "Photo 1900"      },
  { query: 'dc.type adj "fascicule" and dc.date.issued any "1870 1871 1872"',  label: "Presse 1870"     },
  { query: 'dc.type adj "image" and dc.date.issued any "1914 1915 1916"',      label: "Grande Guerre"   },
  { query: 'dc.type adj "fascicule" and dc.date.issued any "1889 1890"',       label: "Exposition 1889" },
  { query: 'dc.type adj "image" and dc.date.issued any "1848 1849 1850"',      label: "Révolution 1848" },
  { query: 'dc.type adj "image" and dc.date.issued any "1880 1881 1882"',      label: "Belle Époque"    },
  { query: 'dc.type adj "fascicule" and dc.date.issued any "1930 1931 1932"',  label: "Années 30"       },
];

// ---- LISTE DE SECOURS si le proxy est inaccessible ----
const FALLBACK_ARKS = [
  { ark: "btv1b84229574",  title: "Album photographique (BnF)",   type: "photo",   pages: 50 },
  { ark: "bpt6k1510599t",  title: "Le Figaro, 1900",              type: "journal", pages: 6  },
  { ark: "bpt6k2787065",   title: "Le Petit Journal, 1895",       type: "journal", pages: 4  },
  { ark: "bpt6k57643051",  title: "L'Illustration, 1914",         type: "journal", pages: 20 },
  { ark: "bpt6k6564760j",  title: "La Mode Illustrée, 1870",      type: "journal", pages: 8  },
  { ark: "btv1b10507065b", title: "Vue de Paris, 1870",           type: "photo",   pages: 1  },
  { ark: "bpt6k9676459g",  title: "Le Monde Illustré, 1889",      type: "journal", pages: 16 },
  { ark: "bpt6k1024977",   title: "Gazette des Beaux-Arts, 1900", type: "revue",   pages: 30 },
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
  for (const r of RARITIES) {
    rand -= r.weight;
    if (rand <= 0) return r;
  }
  return RARITIES[0];
}

// ---- FONCTION PRINCIPALE (appelée par onclick dans index.html) ----
async function openPack() {
  const pack = document.getElementById('mainPack');
  const status = document.getElementById('packStatus');
  if (!pack || pack.classList.contains('opening')) return;

  pack.classList.add('opening');
  if (status) status.innerText = "ACCÈS AUX ARCHIVES...";

  try {
    const card = await fetchRandomCard();
    showModal(card);
    saveHero(card);
  } catch (e) {
    console.error("Erreur fatale :", e);
    if (status) status.innerText = "BNF SATURÉE, RÉESSAIE...";
  } finally {
    pack.classList.remove('opening');
    setTimeout(() => {
      if (status) status.innerText = "CLIQUER POUR CHERCHER";
    }, 3000);
  }
}

// ---- APPEL AU PROXY VERCEL ----
async function fetchRandomCard() {
  const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
  const startRecord = Math.floor(Math.random() * 50) + 1;
  const url = `${PROXY_URL}?query=${encodeURIComponent(theme.query)}&maximumRecords=1&startRecord=${startRecord}`;

  try {
    const res = await fetchWithTimeout(url, 8000);
    if (!res.ok) throw new Error(`Proxy HTTP ${res.status}`);
    const card = await res.json();
    if (card.error) throw new Error(card.error);
    console.log("✅ Carte reçue :", card.title);
    return card;
  } catch (e) {
    console.warn("⚠️ Proxy échoué, fallback :", e.message);
    return buildFallbackCard();
  }
}

// ---- CARTE DE SECOURS ----
function buildFallbackCard() {
  const item = FALLBACK_ARKS[Math.floor(Math.random() * FALLBACK_ARKS.length)];
  const page = Math.floor(Math.random() * item.pages) + 1;
  return {
    arkId:    item.ark,
    title:    item.title,
    year:     null,
    docType:  item.type,
    page,
    imgUrl:   `https://gallica.bnf.fr/ark:/12148/${item.ark}/f${page}.thumbnail`,
    itemUrl:  `https://gallica.bnf.fr/ark:/12148/${item.ark}/f${page}.item`,
    coverUrl: `https://gallica.bnf.fr/ark:/12148/${item.ark}.thumbnail`,
  };
}

// ---- FETCH AVEC TIMEOUT ----
function fetchWithTimeout(url, ms) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { signal: ctrl.signal }).finally(() => clearTimeout(timer));
}

// ---- LABELS TYPES ----
const TYPE_LABELS = {
  photo:     "📷 Photographie",
  journal:   "📰 Journal",
  fascicule: "📰 Périodique",
  carte:     "🗺️ Carte",
  affiche:   "🖼️ Affiche",
  dessin:    "✏️ Dessin",
  revue:     "📖 Revue",
  image:     "🖼️ Image",
  document:  "📄 Document",
};

// ---- MODALE ----
function showModal(card) {
  // Supprimer ancienne modale
  document.querySelector('.gallica-overlay')?.remove();

  const rarity = pickRarity();
  const typeLabel = TYPE_LABELS[card.docType] || "📄 Document";
  const yearLabel = card.year || "XIXe s.";

  const div = document.createElement('div');
  div.className = 'gallica-overlay';
  div.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.88);
    display:flex;align-items:center;justify-content:center;
    z-index:9999;font-family:'Georgia',serif;
    animation:gfadeIn .3s ease;
  `;

  div.innerHTML = `
    <style>
      @keyframes gfadeIn{from{opacity:0;transform:scale(.92)}to{opacity:1;transform:scale(1)}}
      .gc{background:#faf6ee;width:310px;border-radius:6px;overflow:hidden;
          border:3px solid ${rarity.color};box-shadow:0 0 35px ${rarity.color}66;}
      .gc-head{background:#1a1a2e;color:#d4af37;padding:10px 14px;font-size:11px;
               letter-spacing:2px;border-bottom:2px solid ${rarity.color};text-align:center;}
      .gc-badge{display:inline-block;padding:3px 12px;background:${rarity.color};
                color:#fff;font-size:10px;letter-spacing:2px;border-radius:3px;margin-bottom:4px;}
      .gc-img{background:#1a1a2e;padding:14px;text-align:center;}
      .gc-img img{width:190px;height:250px;object-fit:cover;
                  border:2px solid #d4af37;display:block;margin:0 auto;}
      .gc-body{padding:14px;text-align:center;}
      .gc-title{font-size:14px;font-weight:bold;color:#1a1a2e;margin:0 0 8px;line-height:1.4;}
      .gc-meta{font-size:11px;color:#666;margin:3px 0;}
      .gc-actions{display:flex;gap:8px;padding:10px 14px 14px;}
      .gc-btn{flex:1;padding:10px;cursor:pointer;border-radius:3px;
              font-family:Georgia;font-size:12px;letter-spacing:1px;}
      .gc-collect{background:#1a1a2e;color:#d4af37;border:1px solid #d4af37;}
      .gc-collect:hover{background:#d4af37;color:#1a1a2e;}
      .gc-view{background:transparent;color:#1a1a2e;border:1px solid #1a1a2e;
               text-decoration:none;display:flex;align-items:center;justify-content:center;}
      .gc-view:hover{background:#1a1a2e;color:#faf6ee;}
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
          onerror="this.src='${card.coverUrl}';this.onerror=null;">
      </div>
      <div class="gc-body">
        <p class="gc-title">${card.title}</p>
        <p class="gc-meta">${typeLabel} · ${yearLabel} · Page ${card.page}</p>
        <p class="gc-meta" style="font-size:9px;color:#aaa;">ark:/12148/${card.arkId}</p>
      </div>
      <div class="gc-actions">
        <button class="gc-btn gc-collect" id="gc-btn-collect">✦ COLLECTER</button>
        <a href="${card.itemUrl}" target="_blank" class="gc-btn gc-view">VOIR →</a>
      </div>
    </div>
  `;

  document.body.appendChild(div);
  div.addEventListener('click', (e) => { if (e.target === div) div.remove(); });
  document.getElementById('gc-btn-collect').addEventListener('click', () => {
    div.remove();
    showFlash();
  });
}

// ---- FLASH CONFIRMATION ----
function showFlash() {
  const f = document.createElement('div');
  f.style.cssText = `
    position:fixed;bottom:28px;left:50%;transform:translateX(-50%);
    background:#d4af37;color:#1a1a2e;padding:11px 22px;border-radius:4px;
    font-family:Georgia;font-size:13px;z-index:9999;
    box-shadow:0 4px 14px rgba(0,0,0,.3);`;
  f.textContent = "✦ Ajouté à votre collection !";
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 2400);
}

// ---- SAUVEGARDE (compatible avec l'ancien format) ----
function saveHero(card) {
  try {
    const coll = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const isDupe = coll.some(c => c.arkId === card.arkId && c.page === card.page);
    if (!isDupe) {
      coll.unshift({
        // Champs anciens (compatibilité collection.html)
        name: card.title,
        img:  card.imgUrl,
        url:  card.itemUrl,
        // Champs nouveaux
        ...card,
        collectedAt: new Date().toISOString(),
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(coll.slice(0, 500)));
    }
  } catch (e) {
    console.warn("LocalStorage indisponible :", e);
  }
}
