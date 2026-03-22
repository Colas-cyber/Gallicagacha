console.log("Le fichier script.js est bien chargé sur GitHub !");

const STORAGE_KEY = "gallica_collection_v1";

async function openPack() {
    console.log("Lancement de la recherche Gallica...");
    const pack = document.getElementById('mainPack');
    const status = document.getElementById('packStatus');
    
    if (!pack || pack.classList.contains('shake')) return;

    // Animation et statut
    pack.classList.add('shake');
    status.innerText = "CONNEXION BNF...";

    // Tirage aléatoire des critères
    const types = ["presse", "image", "map", "monographie"];
    const typeNames = { "presse": "Journal", "image": "Estampe", "map": "Carte", "monographie": "Livre" };
    
    const type = types[Math.floor(Math.random() * types.length)];
    const year = Math.floor(Math.random() * (1920 - 1780) + 1780);
    const offset = Math.floor(Math.random() * 15) + 1;

    try {
        // Construction de la requête SRU Gallica
        const query = "dc.type all '" + type + "' and date >= '" + year + "' and date <= '" + (year + 5) + "'";
        const urlBNF = "https://gallica.bnf.fr/SRU?operation=searchRetrieve&version=1.2&query=" + encodeURIComponent(query) + "&maximumRecords=5&startRecord=" + offset;
        
        // Utilisation du proxy AllOrigins (Indispensable pour le HTTPS)
        const finalUrl = "https://api.allorigins.win/get?url=" + encodeURIComponent(urlBNF);
        
        console.log("Appel du proxy pour : " + type + " (" + year + ")");
        
        const response = await fetch(finalUrl);
        if (!response.ok) throw new Error("Réponse réseau incorrecte");
        
        const data = await response.json();
        const xmlText = data.contents; // Récupération du contenu XML fourni par le proxy

        // Extraction des balises Titre et Identifiant via Regex
        const titleMatch = xmlText.match(/<dc:title>(.*?)<\/dc:title>/);
        const idMatch = xmlText.match(/<dc:identifier>(.*?)<\/dc:identifier>/);

        if (!idMatch) {
            console.log("Aucun document trouvé, nouvel essai automatique...");
            pack.classList.remove('shake');
            return openPack(); 
        }

        // Nettoyage des données
        const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").substring(0, 100) : "Document Anonyme";
        const identifier = idMatch[1].replace(/<\/?dc:identifier>/g, "");
        const ark = identifier.split('ark:/')[1].trim();
        
        // Génération des liens images et Gallica
        const img = "https://gallica.bnf.fr/ark:/" + ark + ".thumbnail";
        const link = "https://gallica.bnf.fr/ark:/" + ark;

        // Sauvegarde locale et affichage de la carte
        saveHero({ name: title, img: img, url: link, type: typeNames[type] });
        showModal(title, typeNames[type] + " (vers " + year + ")", img, link);

    } catch (e) {
        console.error("ERREUR CRITIQUE :", e);
        alert("Le grimoire refuse de s'ouvrir. Vérifie ta connexion ou réessaie !");
    } finally {
        // Fin de l'animation
        pack.classList.remove('shake');
        status.innerText = "CLIQUER POUR CHERCHER";
    }
}

// Affiche la carte trouvée dans une fenêtre "Pop-up"
function showModal(name, desc, img, link) {
    const div = document.createElement('div');
    div.className = "overlay";
    div.innerHTML = '<div class="card">' +
        '<h3 style="font-size:16px; margin-bottom:10px;">' + name + '</h3>' +
        '<img src="' + img + '" onerror="this.src=\'https://via.placeholder.com/150x200?text=Image+Indisponible\'" style="border:1px solid #ccc;">' +
        '<p style="font-size:13px; font-style:italic; color:#555;">' + desc + '</p>' +
        '<a href="' + link + '" target="_blank" style="color:#0066cc; font-size:12px; display:block; margin:15px 0;">Consulter l\'original sur Gallica ↗</a>' +
        '<button onclick="this.parentElement.parentElement.remove()" style="width:100%; padding:12px; background:#4a3423; color:white; border:none; border-radius:5px; cursor:pointer; font-weight:bold;">AJOUTER AUX ARCHIVES</button>' +
    '</div>';
    document.body.appendChild(div);
}

// Sauvegarde dans la mémoire du navigateur (LocalStorage)
function saveHero(h) {
    let coll = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    // On évite les doublons par le nom
    if (!coll.find(function(x) { return x.name === h.name; })) {
        coll.push(h);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(coll));
    }
}

// Affiche les cartes sauvegardées sur la page collection.html
function renderCollection() {
    const grid = document.getElementById('collectionGrid');
    if (!grid) return;
    const coll = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    
    if (coll.length === 0) {
        grid.innerHTML = '<p style="color:gray; grid-column: 1/-1;">Votre registre est vide pour le moment.</p>';
        return;
    }

    grid.innerHTML = coll.map(function(h) {
        return '<div class="mini-card">' +
            '<img src="' + h.img + '" onerror="this.src=\'https://via.placeholder.com/150x200?text=Archive\'">' +
            '<h4 style="font-size:10px; margin:8px 0; height:30px; overflow:hidden;">' + h.name + '</h4>' +
            '<a href="' + h.url + '" target="_blank" style="font-size:10px; color:#b8860b; text-decoration:none; font-weight:bold;">VOIR L\'ORIGINAL</a>' +
        '</div>';
    }).join('');
}