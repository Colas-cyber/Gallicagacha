console.log("Script Gallica V10 - FINAL");

const STORAGE_KEY = "gallica_collection_v1";

async function openPack() {
    const pack = document.getElementById('mainPack');
    const status = document.getElementById('packStatus');
    
    if (!pack || pack.classList.contains('shake')) return;

    pack.classList.add('shake');
    status.innerText = "ACCÈS AUX ARCHIVES...";

    // On pioche une date aléatoire (jour/mois) pour faire "Almanach"
    const years = [1870, 1889, 1900, 1914, 1848, 1830];
    const year = years[Math.floor(Math.random() * years.length)];
    const randomStart = Math.floor(Math.random() * 50) + 1;

    try {
        // REQUÊTE : On cherche des documents avec image de l'année choisie
        const query = `dc.type all "image" and date adj "${year}"`;
        const bnfUrl = `https://gallica.bnf.fr/SRU?operation=searchRetrieve&version=1.2&query=${encodeURIComponent(query)}&maximumRecords=1&startRecord=${randomStart}`;
        
        // PROXY DE SECOURS (plus stable pour les petits projets)
        const finalUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(bnfUrl)}`;
        
        const response = await fetch(finalUrl);
        const xmlText = await response.text();

        // Extraction de l'ARK
        const arkMatch = xmlText.match(/ark:\/[^<\s?]+/);
        if (!arkMatch) {
            console.log("Relance pour trouver un meilleur document...");
            pack.classList.remove('shake');
            return openPack();
        }

        const ark = arkMatch[0].replace('</dc:identifier>', '').trim();
        const titleMatch = xmlText.match(/<dc:title>(.*?)<\/dc:title>/);
        const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").substring(0, 80) : "Document Historique";

        const img = `https://gallica.bnf.fr/${ark}.thumbnail`;
        const link = `https://gallica.bnf.fr/${ark}`;

        showModal(title, year, img, link);
        saveHero({ name: title, img: img, url: link, year: year });

    } catch (e) {
        console.error("ERREUR :", e);
        alert("Les archives sont momentanément fermées. Réessaie dans 5 secondes !");
    } finally {
        pack.classList.remove('shake');
        status.innerText = "CLIQUER POUR CHERCHER";
    }
}

function showModal(title, year, img, link) {
    const div = document.createElement('div');
    div.className = "overlay";
    div.style = "position:fixed; inset:0; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:1000;";
    div.innerHTML = `
        <div style="background:#fff; color:#000; padding:20px; border-radius:4px; width:320px; font-family:serif; border:1px solid #aaa; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
            <div style="border-bottom:1px solid #a2a9b1; margin-bottom:10px; padding-bottom:5px; font-size:12px; color:#555;">
                EXTRAIT DES ARCHIVES DE L'AN ${year}
            </div>
            <h2 style="margin:0 0 15px 0; font-size:20px;">${title}</h2>
            <div style="text-align:center; background:#f8f9fa; border:1px solid #c8ccd1; padding:10px; margin-bottom:15px;">
                <img src="${img}" style="max-width:100%; border:1px solid #777;">
            </div>
            <p style="font-size:14px; line-height:1.4;">Ce document original fait partie de la collection nationale conservée à la Bibliothèque Nationale de France.</p>
            <div style="margin-top:20px; display:flex; gap:10px;">
                <a href="${link}" target="_blank" style="flex:1; background:#36c; color:#fff; text-decoration:none; padding:10px; text-align:center; font-weight:bold; border-radius:2px;">CONSULTER</a>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" style="flex:1; cursor:pointer; border:1px solid #a2a9b1;">FERMER</button>
            </div>
        </div>
    `;
    document.body.appendChild(div);
}

function saveHero(h) {
    let coll = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    coll.push(h);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coll));
}
