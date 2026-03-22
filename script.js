console.log("Script Gallica V5 - Blindé !");

const STORAGE_KEY = "gallica_collection_v1";

async function openPack() {
    const pack = document.getElementById('mainPack');
    const status = document.getElementById('packStatus');
    
    if (!pack || pack.classList.contains('shake')) return;

    pack.classList.add('shake');
    status.innerText = "EXPLORATION DES ARCHIVES...";

    // On pioche des années où Gallica a beaucoup de contenu
    const types = ["presse", "image", "map", "monographie"];
    const type = types[Math.floor(Math.random() * types.length)];
    const year = Math.floor(Math.random() * (1914 - 1850) + 1850); 
    const offset = Math.floor(Math.random() * 3) + 1;

    try {
        // Requête simplifiée : "type" ET "année"
        const query = "dc.type all '" + type + "' and date adj '" + year + "'";
        const urlBNF = "https://gallica.bnf.fr/SRU?operation=searchRetrieve&version=1.2&query=" + encodeURIComponent(query) + "&maximumRecords=1&startRecord=" + offset;
        const finalUrl = "https://api.allorigins.win/get?url=" + encodeURIComponent(urlBNF);
        
        const response = await fetch(finalUrl);
        const data = await response.json();
        
        // SECURITÉ : Si le proxy renvoie du vide
        if (!data || !data.contents) {
            throw new Error("Réponse vide du proxy");
        }

        const xmlText = data.contents;
        const idMatch = xmlText.match(/<dc:identifier>(.*?)<\/dc:identifier>/);

        if (!idMatch) {
            console.log("Rien trouvé pour " + type + " en " + year + ", on relance...");
            pack.classList.remove('shake');
            return setTimeout(openPack, 500); // Petite pause avant de relancer
        }

        // On extrait l'ARK proprement
        const rawId = idMatch[1];
        if (!rawId.includes('ark:/')) throw new Error("ID non valide");
        
        const ark = rawId.split('ark:/')[1].split('?')[0].trim();
        const titleMatch = xmlText.match(/<dc:title>(.*?)<\/dc:title>/);
        const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").substring(0, 80) : "Archive Gallica";

        const img = "https://gallica.bnf.fr/ark:/" + ark + ".thumbnail";
        const link = "https://gallica.bnf.fr/ark:/" + ark;

        showModal(title, type + " (" + year + ")", img, link);
        saveHero({ name: title, img: img, url: link });

    } catch (e) {
        console.error("ERREUR :", e);
        // Si ça plante, on arrête le tremblement pour que l'utilisateur puisse recliquer
    } finally {
        pack.classList.remove('shake');
        status.innerText = "CLIQUER POUR CHERCHER";
    }
}

function showModal(name, desc, img, link) {
    const div = document.createElement('div');
    div.className = "overlay";
    div.style = "position:fixed; inset:0; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:1000;";
    div.innerHTML = '<div class="card" style="background:#fdf6e3; color:#586e75; padding:20px; border-radius:10px; width:280px; text-align:center; border:4px solid #b8860b;">' +
        '<h3 style="margin:0 0 10px 0; font-size:16px;">' + name + '</h3>' +
        '<img src="' + img + '" style="width:100%; border:1px solid #ccc; margin-bottom:10px;" onerror="this.src=\'https://via.placeholder.com/150x200?text=Pas+d+image\'">' +
        '<p style="font-size:14px; font-weight:bold;">' + desc + '</p>' +
        '<a href="' + link + '" target="_blank" style="display:block; margin:15px 0; color:#0066cc; text-decoration:none;">Ouvrir dans Gallica ↗</a>' +
        '<button onclick="this.parentElement.parentElement.remove()" style="width:100%; padding:12px; background:#b8860b; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold;">ARCHIVER</button>' +
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
    grid.innerHTML = coll.map(h => '<div class="mini-card" style="background:white; padding:10px; border-radius:5px;"><img src="' + h.img + '" style="width:100%;"><p style="font-size:10px; color:black;">' + h.name + '</p></div>').join('');
}
