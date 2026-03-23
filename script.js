console.log("Script Gallica V8 - Version Victoire !");

const STORAGE_KEY = "gallica_collection_v1";

async function openPack() {
    const pack = document.getElementById('mainPack');
    const status = document.getElementById('packStatus');
    
    if (!pack || pack.classList.contains('shake')) return;

    pack.classList.add('shake');
    status.innerText = "ACCÈS AUX ARCHIVES...";

    // On pioche une année et un numéro de résultat au hasard
    const year = Math.floor(Math.random() * (1914 - 1850) + 1850);
    const startRecord = Math.floor(Math.random() * 100) + 1;

    try {
        // REQUÊTE LARGE : On demande n'importe quel document de l'année X
        const query = 'date adj "' + year + '"';
        const urlBNF = "https://gallica.bnf.fr/SRU?operation=searchRetrieve&version=1.2&query=" + encodeURIComponent(query) + "&maximumRecords=1&startRecord=" + startRecord;
        
        const finalUrl = "https://corsproxy.io/?" + encodeURIComponent(urlBNF);
        
        console.log("Recherche d'un trésor de " + year + "...");
        
        const response = await fetch(finalUrl);
        if (!response.ok) throw new Error("Proxy occupé");
        
        const xmlText = await response.text();

        // On cherche l'ARK (identifiant) de manière ultra-souple
        const idMatch = xmlText.match(/ark:\/[^<\s?]+/);

        if (!idMatch) {
            console.log("Rien dans ce casier, on cherche à côté...");
            pack.classList.remove('shake');
            return openPack(); 
        }

        const ark = idMatch[0].trim();
        const titleMatch = xmlText.match(/<dc:title>(.*?)<\/dc:title>/);
        const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").substring(0, 65) : "Document précieux";

        const img = "https://gallica.bnf.fr/" + ark + ".thumbnail";
        const link = "https://gallica.bnf.fr/" + ark;

        console.log("TROUVÉ : " + title);
        showModal(title, "Archive de l'année " + year, img, link);
        saveHero({ name: title, img: img, url: link });

    } catch (e) {
        console.error("ERREUR :", e);
        alert("Le bibliothécaire a trébuché. Réessaie !");
    } finally {
        pack.classList.remove('shake');
        status.innerText = "CLIQUER POUR CHERCHER";
    }
}

function showModal(name, desc, img, link) {
    const div = document.createElement('div');
    div.className = "overlay";
    div.style = "position:fixed; inset:0; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:1000;";
    div.innerHTML = `
        <div style="background:#fffaf0; padding:25px; border-radius:15px; width:300px; text-align:center; border:5px solid #d4af37; box-shadow: 0 0 20px rgba(0,0,0,0.5);">
            <h2 style="color:#8b4513; margin-top:0;">📜 DÉCOUVERTE</h2>
            <div style="background:#fff; padding:10px; border:1px solid #ddd; min-height:150px; display:flex; align-items:center;">
                <img src="${img}" style="width:100%;" onerror="this.src='https://via.placeholder.com/150x200?text=Image+en+cours...'">
            </div>
            <h3 style="font-size:15px; margin:15px 0;">${name}</h3>
            <p style="font-size:13px; color:#555;">${desc}</p>
            <a href="${link}" target="_blank" style="display:block; margin:15px 0; color:#0066cc; font-weight:bold;">Ouvrir dans Gallica ↗</a>
            <button onclick="this.parentElement.parentElement.remove()" style="width:100%; padding:12px; background:#4a3423; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">COLLECTIONNER</button>
        </div>
    `;
    document.body.appendChild(div);
}

function saveHero(h) {
    let coll = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    coll.push(h);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coll));
}
