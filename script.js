console.log("Le fichier script.js est bien chargé !");

const STORAGE_KEY = "gallica_collection_v1";

// Fonction pour attendre (évite le blocage 429)
const sleep = ms => new Promise(res => setTimeout(res, ms));

async function openPack() {
    console.log("Lancement de la recherche Gallica...");
    const pack = document.getElementById('mainPack');
    const status = document.getElementById('packStatus');
    
    if (!pack || pack.classList.contains('shake')) return;

    pack.classList.add('shake');
    status.innerText = "CONNEXION BNF...";

    const types = ["presse", "image", "map", "monographie"];
    const typeNames = { "presse": "Journal", "image": "Estampe", "map": "Carte", "monographie": "Livre" };
    
    const type = types[Math.floor(Math.random() * types.length)];
    const year = Math.floor(Math.random() * (1914 - 1780) + 1780);
    const offset = Math.floor(Math.random() * 10) + 1;

    try {
        const query = "dc.type all '" + type + "' and date >= '" + year + "' and date <= '" + (year + 5) + "'";
        const urlBNF = "https://gallica.bnf.fr/SRU?operation=searchRetrieve&version=1.2&query=" + encodeURIComponent(query) + "&maximumRecords=1&startRecord=" + offset;
        
        // NOUVEAU PROXY PLUS SOLIDE
        const finalUrl = "https://corsproxy.io/?" + encodeURIComponent(urlBNF);
        
        const response = await fetch(finalUrl);
        if (!response.ok) throw new Error("Le serveur est occupé (Code " + response.status + ")");
        
        const xmlText = await response.text();

        // Extraction
        const titleMatch = xmlText.match(/<dc:title>(.*?)<\/dc:title>/);
        const idMatch = xmlText.match(/<dc:identifier>(.*?)<\/dc:identifier>/);

        if (!idMatch) {
            console.log("Rien trouvé ici, nouvel essai dans 1 seconde...");
            await sleep(1000); 
            pack.classList.remove('shake');
            return openPack(); 
        }

        const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").substring(0, 100) : "Document Anonyme";
        const identifier = idMatch[1].replace(/<\/?dc:identifier>/g, "");
        const ark = identifier.split('ark:/')[1].trim();
        
        const img = "https://gallica.bnf.fr/ark:/" + ark + ".thumbnail";
        const link = "https://gallica.bnf.fr/ark:/" + ark;

        saveHero({ name: title, img: img, url: link, type: typeNames[type] });
        showModal(title, typeNames[type] + " (vers " + year + ")", img, link);

    } catch (e) {
        console.error("ERREUR :", e);
        alert("Le bibliothécaire est essoufflé. Attends 5 secondes et reclique !");
    } finally {
        pack.classList.remove('shake');
        status.innerText = "CLIQUER POUR CHERCHER";
    }
}

function showModal(name, desc, img, link) {
    const div = document.createElement('div');
    div.className = "overlay";
    div.innerHTML = '<div class="card">' +
        '<h3 style="font-size:16px; margin-bottom:10px;">' + name + '</h3>' +
        '<img src="' + img + '" onerror="this.src=\'https://via.placeholder.com/150x200?text=Archive+BNF\'">' +
        '<p style="font-size:13px; font-style:italic;">' + desc + '</p>' +
        '<a href="' + link + '" target="_blank" style="color:#0066cc; font-size:12px; display:block; margin:15px 0;">Voir sur Gallica ↗</a>' +
        '<button onclick="this.parentElement.parentElement.remove()" style="width:100%; padding:12px; background:#4a3423; color:white; border:none; cursor:pointer; font-weight:bold; border-radius:5px;">ARCHIVER</button>' +
    '</div>';
    document.body.appendChild(div);
}

function saveHero(h) {
    let coll = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    if (!coll.find(function(x) { return x.name === h.name; })) {
        coll.push(h);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(coll));
    }
}

function renderCollection() {
    const grid = document.getElementById('collectionGrid');
    if (!grid) return;
    const coll = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    if (coll.length === 0) {
        grid.innerHTML = '<p style="color:gray;">Votre registre est vide.</p>';
        return;
    }
    grid.innerHTML = coll.map(function(h) {
        return '<div class="mini-card">' +
            '<img src="' + h.img + '" onerror="this.src=\'https://via.placeholder.com/150x200?text=Archive\'">' +
            '<h4 style="font-size:10px; margin:5px 0;">' + h.name.substring(0,40) + '...</h4>' +
            '<a href="' + h.url + '" target="_blank" style="font-size:9px; color:#b8860b;">Original ↗</a>' +
        '</div>';
    }).join('');
}
