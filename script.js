console.log("Script Gallica V4 - Chargé !"); // Vérifie bien ce message dans la console

const STORAGE_KEY = "gallica_collection_v1";

async function openPack() {
    console.log("Lancement de la recherche...");
    const pack = document.getElementById('mainPack');
    const status = document.getElementById('packStatus');
    
    if (!pack || pack.classList.contains('shake')) return;

    pack.classList.add('shake');
    status.innerText = "ACCÈS AUX RÉSERVES...";

    const types = ["presse", "image", "map", "monographie"];
    const type = types[Math.floor(Math.random() * types.length)];
    const year = Math.floor(Math.random() * (1914 - 1780) + 1780);
    const offset = Math.floor(Math.random() * 5) + 1;

    try {
        const query = "dc.type all '" + type + "' and date adj '" + year + "'";
        const urlBNF = "https://gallica.bnf.fr/SRU?operation=searchRetrieve&version=1.2&query=" + encodeURIComponent(query) + "&maximumRecords=1&startRecord=" + offset;
        
        // NOUVEAU PROXY : Plus rapide et sans limite
        const finalUrl = "https://api.allorigins.win/get?url=" + encodeURIComponent(urlBNF);
        
        console.log("Appel via AllOrigins pour : " + type + " " + year);
        
        const response = await fetch(finalUrl);
        const data = await response.json();
        const xmlText = data.contents;

        const idMatch = xmlText.match(/<dc:identifier>(.*?)<\/dc:identifier>/);

        if (!idMatch) {
            console.log("Rien trouvé, nouvel essai...");
            pack.classList.remove('shake');
            return openPack();
        }

        const ark = idMatch[1].split('ark:/')[1].trim();
        const titleMatch = xmlText.match(/<dc:title>(.*?)<\/dc:title>/);
        const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").substring(0, 80) : "Archive Gallica";

        const img = "https://gallica.bnf.fr/ark:/" + ark + ".thumbnail";
        const link = "https://gallica.bnf.fr/ark:/" + ark;

        showModal(title, type + " (" + year + ")", img, link);
        saveHero({ name: title, img: img, url: link });

    } catch (e) {
        console.error("ERREUR :", e);
        alert("Le bibliothécaire est un peu lent. Reclique dans 3 secondes !");
    } finally {
        pack.classList.remove('shake');
        status.innerText = "CLIQUER POUR CHERCHER";
    }
}

function showModal(name, desc, img, link) {
    const div = document.createElement('div');
    div.className = "overlay";
    div.innerHTML = '<div class="card" style="background:white; color:black; padding:20px; border-radius:10px; width:280px; box-shadow: 0 0 20px gold;">' +
        '<h3>' + name + '</h3>' +
        '<img src="' + img + '" style="width:100%; border:1px solid #ddd; margin:10px 0;">' +
        '<p style="font-style:italic;">' + desc + '</p>' +
        '<a href="' + link + '" target="_blank" style="display:block; margin:15px 0; color: blue;">Voir l\'original ↗</a>' +
        '<button onclick="this.parentElement.parentElement.remove()" style="width:100%; padding:10px; cursor:pointer; background:#333; color:white; border:none; border-radius:5px;">ARCHIVER</button>' +
    '</div>';
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
    grid.innerHTML = coll.map(h => '<div class="mini-card" style="background:white; color:black; padding:10px; border-radius:5px;"><img src="' + h.img + '" style="width:100%;"><p style="font-size:10px;">' + h.name + '</p></div>').join('');
}
