console.log("GallicaGacha V3.7 - Rareté sauvegardée");

const STORAGE_KEY = "gallica_collection_v1";
const PROXY_URL = "https://gallicagacha.vercel.app/api/gallica";

// ---- THÈMES ----
const THEMES = [
  // Moyen Âge
  { query: 'dc.type adj "image" and dc.date adj "1200"',       label: "Enluminure médiévale" },
  { query: 'dc.type adj "image" and dc.date adj "1350"',       label: "Image XIVe"           },
  { query: 'dc.type adj "image" and dc.date adj "1450"',       label: "Image XVe"            },
  { query: 'dc.type adj "image" and dc.date adj "1400"',       label: "Image médiévale"      },
  { query: 'dc.type adj "carte" and dc.date adj "1480"',       label: "Carte médiévale"      },
  // Renaissance
  { query: 'dc.type adj "image" and dc.date adj "1520"',       label: "Image XVIe"           },
  { query: 'dc.type adj "carte" and dc.date adj "1550"',       label: "Carte Renaissance"    },
  { query: 'dc.type adj "image" and dc.date adj "1560"',       label: "Estampe XVIe"         },
  { query: 'dc.type adj "image" and dc.date adj "1580"',       label: "Estampe XVIe"         },
  // XVIIe
  { query: 'dc.type adj "image" and dc.date adj "1620"',       label: "Image XVIIe"          },
  { query: 'dc.type adj "carte" and dc.date adj "1650"',       label: "Carte XVIIe"          },
  { query: 'dc.type adj "image" and dc.date adj "1680"',       label: "Estampe XVIIe"        },
  { query: 'dc.type adj "image" and dc.date adj "1660"',       label: "Image XVIIe"          },
  // XVIIIe
  { query: 'dc.type adj "image" and dc.date adj "1720"',       label: "Image XVIIIe"         },
  { query: 'dc.type adj "carte" and dc.date adj "1750"',       label: "Carte XVIIIe"         },
  { query: 'dc.type adj "image" and dc.date adj "1780"',       label: "Estampe XVIIIe"       },
  { query: 'dc.type adj "fascicule" and dc.date adj "1790"',   label: "Presse Révolution"    },
  { query: 'dc.type adj "image" and dc.date adj "1760"',       label: "Lumières"             },
  // XIXe
  { query: 'dc.type adj "image" and dc.date adj "1820"',       label: "Image 1820"         },
  { query: 'dc.type adj "image" and dc.date adj "1848"',       label: "Révolution 1848"    },
  { query: 'dc.type adj "image" and dc.date adj "1860"',       label: "Second Empire"      },
  { query: 'dc.type adj "image" and dc.date adj "1870"',       label: "Commune de Paris"   },
  { query: 'dc.type adj "image" and dc.date adj "1880"',       label: "Belle Époque"       },
  { query: 'dc.type adj "image" and dc.date adj "1889"',       label: "Exposition 1889"    },
  { query: 'dc.type adj "image" and dc.date adj "1900"',       label: "Photo 1900"         },
  { query: 'dc.type adj "fascicule" and dc.date adj "1850"',   label: "Presse 1850"        },
  { query: 'dc.type adj "fascicule" and dc.date adj "1870"',   label: "Presse 1870"        },
  { query: 'dc.type adj "fascicule" and dc.date adj "1900"',   label: "Presse 1900"        },
  { query: 'dc.type adj "carte" and dc.date adj "1850"',       label: "Carte XIXe"         },
  { query: 'dc.type adj "carte" and dc.date adj "1880"',       label: "Carte Belle Époque" },
  // XXe
  { query: 'dc.type adj "image" and dc.date adj "1914"',       label: "Grande Guerre"      },
  { query: 'dc.type adj "image" and dc.date adj "1918"',       label: "Armistice 1918"     },
  { query: 'dc.type adj "image" and dc.date adj "1920"',       label: "Années folles"      },
  { query: 'dc.type adj "image" and dc.date adj "1925"',       label: "Art Déco"           },
  { query: 'dc.type adj "image" and dc.date adj "1930"',       label: "Années 30"          },
  { query: 'dc.type adj "fascicule" and dc.date adj "1914"',   label: "Presse 1914"        },
  { query: 'dc.type adj "fascicule" and dc.date adj "1930"',   label: "Presse 1930"        },
  { query: 'dc.type adj "carte" and dc.date adj "1914"',       label: "Carte Grande Guerre"},
  { query: 'dc.type adj "carte" and dc.date adj "1930"',       label: "Carte XXe"          },
];

// ---- FALLBACK ----
const FALLBACK_ARKS = [
  { ark: "bpt6k285345w",  title: "Le Figaro, 1900",            type: "journal", pages: 4,  year: "1900" },
  { ark: "bpt6k285269s",  title: "Le Figaro, sept. 1900",      type: "journal", pages: 4,  year: "1900" },
  { ark: "btv1b84229574", title: "Album photographique (BnF)", type: "photo",   pages: 50, year: "1900" },
  { ark: "btv1b10507065b",title: "Vue de Paris, 1870",         type: "photo",   pages: 3,  year: "1870" },
  { ark: "bpt6k272546t",  title: "Figaro Supplément, 1890",    type: "journal", pages: 4,  year: "1890" },
];

// ---- RARETÉS ----
// Poids de base — les manuscrits et cartes boostent les raretés hautes
const RARITIES = [
  { label: "COMMUN",     short: "C",  color: "#888888", weight: 50 },
  { label: "PEU COMMUN", short: "R",  color: "#2a9d4e", weight: 28 },
  { label: "RARE",       short: "SR", color: "#2768c4", weight: 14 },
  { label: "ÉPIQUE",     short: "UR", color: "#9932cc", weight: 6  },
  { label: "LÉGENDAIRE", short: "LR", color: "#c8a200", weight: 2  },
];

// Boost de rareté selon le type de document
const RARITY_BOOST = { "manuscrit": 2.5, "carte": 1.8 };

function pickRarity(docType) {
  const boost = RARITY_BOOST[docType] || 1;
  // On redistribue les poids : les raretés hautes (index 3,4) sont boostées
  const shifted = RARITIES.map((r, i) => ({
    ...r,
    weight: i >= 3 ? r.weight * boost : r.weight / (boost * 0.5)
  }));
  const total = shifted.reduce((s, r) => s + r.weight, 0);
  let rand = Math.random() * total;
  for (const r of shifted) { rand -= r.weight; if (rand <= 0) return r; }
  return RARITIES[0];
}

// ---- URLS IMAGE — passent par le proxy Vercel (pas de blocage CORS) ----
const IMG_PROXY = "https://gallicagacha.vercel.app/api/gallica";

function buildImgUrl(arkId, page) {
  const arkPath = `ark:/12148/${arkId}/f${page}`;
  return `${IMG_PROXY}?img=${encodeURIComponent(arkPath)}`;
}
function buildImgFallback(arkId, page) {
  const arkPath = `ark:/12148/${arkId}/f1`;
  return `${IMG_PROXY}?img=${encodeURIComponent(arkPath)}`;
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
    // Tirage de la rareté ICI — avant sauvegarde et affichage
    const rarity = pickRarity(card.docType);
    card.rarity      = rarity.label;  // ex: "LÉGENDAIRE"
    card.rarityShort = rarity.short;  // ex: "LR"
    card.rarityColor = rarity.color;  // ex: "#c8a200"
    saveHero(card);
    showModal(card, rarity);
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
    card.theme       = theme.label;
    console.log("✅ Carte :", card.title, "-", theme.label);
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
    arkId: item.ark, title: item.title, year: item.year, docType: item.type, page,
    imgUrl:      buildImgUrl(item.ark, page),
    imgFallback: buildImgFallback(item.ark, page),
    itemUrl:     `https://gallica.bnf.fr/ark:/12148/${item.ark}/f${page}`,
    theme:       "Archives",
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
  manuscrit: "📜 Manuscrit", revue: "📖 Revue", image: "🖼️ Image",
  "image fixe": "🖼️ Image", document: "📄 Document", estampe: "🎨 Estampe",
};

// ---- MODALE ----
function showModal(card, rarity) {
  document.querySelector('.gallica-overlay')?.remove();
  const typeLabel = TYPE_LABELS[card.docType] || "📄 Document";
  const yearLabel = card.year || "Date inconnue";

  const div = document.createElement('div');
  div.className = 'gallica-overlay';
  div.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.88);
    display:flex;align-items:center;justify-content:center;
    z-index:9999;font-family:'Georgia',serif;animation:gfadeIn .3s ease;
  `;

  // Effet brillance uniquement pour les raretés > COMMUN
  const isShiny = rarity.label !== "COMMUN";
  const shineAnim = isShiny ? `
    @keyframes shine {
      0%   { background-position: -200% center; }
      100% { background-position: 200% center; }
    }` : '';
  const shineBorder = isShiny ? `
    @keyframes glowPulse {
      0%, 100% { box-shadow: 0 0 30px ${rarity.color}66, 0 0 60px ${rarity.color}33; }
      50%       { box-shadow: 0 0 60px ${rarity.color}aa, 0 0 100px ${rarity.color}55; }
    }` : '';

  div.innerHTML = `
    <style>
      @keyframes gfadeIn { from{opacity:0;transform:scale(.9)} to{opacity:1;transform:scale(1)} }
      ${shineAnim}
      ${shineBorder}

      .gc {
        background: #faf6ee;
        width: min(420px, 92vw);
        border-radius: 8px;
        overflow: hidden;
        border: 3px solid ${rarity.color};
        ${isShiny
          ? `animation: glowPulse 2s ease-in-out infinite;`
          : `box-shadow: 0 0 30px ${rarity.color}44;`}
      }

      /* En-tête : juste la rareté en grand */
      .gc-head {
        background: #1a1a2e;
        padding: 14px 16px 12px;
        border-bottom: 2px solid ${rarity.color};
        text-align: center;
      }
      .gc-rarity-label {
        font-size: 22px;
        font-weight: bold;
        letter-spacing: 4px;
        color: ${rarity.color};
        ${isShiny ? `
          background: linear-gradient(90deg,
            ${rarity.color} 0%,
            #fff 40%,
            ${rarity.color} 60%,
            ${rarity.color} 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shine 2.5s linear infinite;
        ` : ''}
      }
      .gc-rarity-short {
        font-size: 11px;
        color: ${rarity.color}99;
        letter-spacing: 3px;
        margin-top: 3px;
      }

      .gc-img { background: #1a1a2e; padding: 16px; text-align: center; }
      .gc-img img {
        width: min(340px, 80vw);
        height: min(420px, 52vh);
        object-fit: cover;
        border: 2px solid ${rarity.color};
        display: block; margin: 0 auto;
        cursor: pointer; transition: opacity .2s;
        ${isShiny ? `box-shadow: 0 0 20px ${rarity.color}66;` : ''}
      }
      .gc-img img:hover { opacity: .85; }
      .gc-hint { color: #d4af37; font-size: 10px; margin-top: 8px; letter-spacing: 1px; opacity: .6; }

      .gc-body { padding: 14px 16px 4px; text-align: center; }
      .gc-title { font-size: 15px; font-weight: bold; color: #1a1a2e; margin: 0 0 6px; line-height: 1.4; }
      .gc-meta { font-size: 11px; color: #666; margin: 3px 0; }

      .gc-footer {
        margin: 12px 0 0; background: #1a1a2e;
        padding: 16px; text-align: center; cursor: pointer;
      }
      .gc-footer p { color: #d4af37; font-size: 13px; font-weight: bold; letter-spacing: 2px; margin: 0; }
      .gc-footer span { display: block; color: #888; font-size: 10px; letter-spacing: 1px; margin-top: 4px; }
    </style>
    <div class="gc">
      <div class="gc-head">
        <div class="gc-rarity-label">${rarity.label}</div>
        <div class="gc-rarity-short">${rarity.short} · BIBLIOTHÈQUE NATIONALE DE FRANCE</div>
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

// ---- SAUVEGARDE — rareté incluse ----
function saveHero(card) {
  try {
    const coll = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    const isDupe = coll.some(c => c.arkId === card.arkId && c.page === card.page);
    if (!isDupe) {
      coll.unshift({
        // Champs compatibilité
        name: card.title,
        img:  card.imgUrl,
        url:  card.itemUrl,
        // Tous les champs nouveaux dont rarity
        ...card,
        collectedAt: new Date().toISOString(),
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(coll.slice(0, 500)));
    }
  } catch (e) { console.warn("LocalStorage :", e); }
}

// ---- COLLECTION (pour showCollection appelé depuis collection.html) ----
function showCollection() {
  // collection.html gère son propre rendu — cette fonction est gardée pour compatibilité
  if (typeof renderCollection === 'function') renderCollection();
}

document.addEventListener('DOMContentLoaded', () => {
  const pack = document.getElementById('mainPack');
  if (pack) pack.addEventListener('click', openPack);
});

window.openPack    = openPack;
window.showCollection = showCollection;
