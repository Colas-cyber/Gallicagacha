console.log("Script Gallica V6 - Ultime !");

const STORAGE_KEY = "gallica_collection_v1";

async function openPack() {
    const pack = document.getElementById('mainPack');
    const status = document.getElementById('packStatus');
    
    if (!pack || pack.classList.contains('shake')) return;

    pack.classList.add('shake');
    status.innerText = "INVENTAIRE EN COURS...";

    // On choisit une année au hasard entre 1800 et 1914
    const year = Math.floor(Math.random() * (1914 - 1800) + 1800);
    // On prend un index au hasard entre 1 et 50 pour varier les plaisirs
    const startRecord = Math.floor(Math.random() * 50) + 1;

    try {
        // Requête super simplifiée : On demande juste ce qu'il y a en ligne pour cette année
        const query = 'date adj "' + year + '" and (dc.type all "image" or dc.type all "presse")';
        const urlBNF = "https://gallica.bnf.fr/SRU?operation=searchRetrieve&version=1.2&query=" + encodeURIComponent(query) + "&maximumRecords=1&startRecord=" + startRecord;
        
        // On repasse sur un proxy plus rapide pour le texte brut
        const finalUrl = "https://api.allorigins.win/get?url=" + encodeURIComponent(urlBNF);
        
        console.log("Recherche dans l'année " + year + "...");
        
        const response = await fetch(finalUrl);
        const data = await response.json();
        
        if (!data || !data.contents) throw new Error("Proxy muet");

        const xmlText = data.contents;

        // On cherche l'identifiant unique (ARK)
        const idMatch = xmlText.match(/<dc:identifier>(.*?)<\/dc:identifier>/);

        if (!idMatch || !idMatch[1].includes('ark:/')) {
            console.log("Année " + year + " vide ou protégée, on change...");
            pack.classList.remove('shake');
            return setTimeout(openPack, 300); 
        }

        // Extraction de l'ARK (on nettoie tout ce qui dépasse)
        const ark = idMatch[1].split('ark:/')[1].split('?')[0].replace('</dc:identifier>', '').trim();
        
        // Extraction du titre
        const titleMatch = xmlText.match(/<dc:title>(.*?)<\/dc:title>/);
        const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").substring(0, 70) + "..." : "Document d'époque";

        // Construction des liens
        const img = "https://gallica.bnf.fr/ark:/" + ark + ".thumbnail";
        const link = "https://gallica.bnf.fr/ark:/" + ark;

        console.log("TROUVÉ ! ARK : " + ark);

        showModal(title, "Archive de l'an " + year, img, link);
        saveHero({ name: title, img: img, url: link });

    } catch (e) {
        console.error("ERREUR :", e);
        status.innerText = "ERREUR RÉSEAU... RECLIQUE !";
    } finally {
        pack.classList.remove('shake');
        if (status.innerText !== "ERREUR RÉSEAU... RECLIQUE !") {
            status.innerText = "CLIQUER POUR CHERCHER";
        }
    }
}

function showModal(name, desc, img, link) {
    const div = document.createElement('div');
    div.className = "overlay";
    div.style = "position:fixed; inset:0; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px;";
    div.innerHTML = `
        <div class="card" style="background:#fff4e0; color:#4a3423; padding:25px; border-radius:15px; width:300px; text-align:center; border:5px solid #b8860b; box-shadow: 0 0 30px rgba(255,215,0,0.3);">
            <h2 style="margin:0 0 15px 0; font-size:18px; font-family:serif;">📜 DÉCOUVERTE</h2>
            <div style="background:white; padding:10px; border:1px solid #ddd; margin-bottom:15px;">
                <img src="${img}" style="width:100%; height:auto;" onerror="this.src='https://via.placeholder.com/150x200?text=Archive'">
            </div>
            <h3 style="font-size:14px; margin-bottom:10px;">${name}</h3>
            <p style="font-size:13px; font-weight:bold; color:#8b4513;">${desc}</p>
            <a href="${link}" target="_blank" style="display:inline-block; margin:15px 0; color:#0066cc; font-weight:bold; text-decoration:underline;">Consulter sur Gallica ↗</a>
            <button onclick="this.parentElement.parentElement.remove()" style="width:100%; padding:12px; background:#4a3423; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold; font-size:16px;">ARCHIVER</button>
        </div>
    `;
    document.body.appendChild(div);
}

function saveHero(h) {
    let coll = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    coll.push(h);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coll));
}

function renderCollection() {
    const grid = document.getElementById('collectionGrid');
    if (!grid) return;
    const coll = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    grid.innerHTML = coll.map(h => `
        <div class="mini-card" style="background:#fff; padding:10px; border-radius:8px; border:1px solid #ddd; text-align:center;">
            <img src="${h.img}" style="width:100%; border-radius:4px;">
            <p style="font-size:10px; color:#333; margin-top:5px; height:24px; overflow:hidden;">${h.name}</p>
        </div>
    `).join('');
}
