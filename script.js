console.log("Script Gallica V3 chargé !");

const STORAGE_KEY = "gallica_collection_v1";

async function openPack() {
    const pack = document.getElementById('mainPack');
    const status = document.getElementById('packStatus');
    
    if (!pack || pack.classList.contains('shake')) return;

    pack.classList.add('shake');
    status.innerText = "OUVERTURE DU GRIMOIRE...";

    // Paramètres aléatoires
    const types = ["presse", "image", "map", "monographie"];
    const type = types[Math.floor(Math.random() * types.length)];
    const year = Math.floor(Math.random() * (1914 - 1780) + 1780);
    const offset = Math.floor(Math.random() * 10) + 1;

    try {
        const query = "dc.type all '" + type + "' and date adj '" + year + "'";
        const urlBNF = "https://gallica.bnf.fr/SRU?operation=searchRetrieve&version=1.2&query=" + encodeURIComponent(query) + "&maximumRecords=1&startRecord=" + offset;
        
      try {
        const query = "dc.type all '" + type + "' and date adj '" + year + "'";
        const urlBNF = "https://gallica.bnf.fr/SRU?operation=searchRetrieve&version=1.2&query=" + encodeURIComponent(query) + "&maximumRecords=1&startRecord=" + offset;
        
        // NOUVEAU PROXY : Plus libre et direct
        const finalUrl = "https://thingproxy.freeboard.io/fetch/" + urlBNF;
        
        console.log("Tentative sur : " + finalUrl);
        
        const response = await fetch(finalUrl);
        if (!response.ok) throw new Error("Erreur proxy");
        
        const xmlText = await response.text();

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
        // Si ThingProxy fatigue, on tente une dernière fois sans proxy au cas où
        alert("Le grimoire résiste... Reclique une fois !");
    } finally {
        pack.classList.remove('shake');
        status.innerText = "CLIQUER POUR CHERCHER";
    }

        // On cherche l'identifiant (ARK)
        const idMatch = xmlText.match(/<dc:identifier>(.*?)<\/dc:identifier>/);

        if (!idMatch) {
            console.log("Rien trouvé, on réessaie...");
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
        alert("Le proxy est surchargé. Attend 3 secondes et reclique !");
    } finally {
        pack.classList.remove('shake');
        status.innerText = "CLIQUER POUR CHERCHER";
    }
}

function showModal(name, desc, img, link) {
    const div = document.createElement('div');
    div.className = "overlay";
    div.innerHTML = '<div class="card" style="background:white; color:black; padding:20px; border-radius:10px; width:280px;">' +
        '<h3>' + name + '</h3>' +
        '<img src="' + img + '" style="width:100%; margin:10px 0;">' +
        '<p>' + desc + '</p>' +
        '<a href="' + link + '" target="_blank" style="display:block; margin:10px;">Voir l\'original ↗</a>' +
        '<button onclick="this.parentElement.parentElement.remove()" style="width:100%; padding:10px; cursor:pointer;">FERMER</button>' +
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
    grid.innerHTML = coll.map(h => '<div class="mini-card"><img src="' + h.img + '"><p>' + h.name + '</p></div>').join('');
}
