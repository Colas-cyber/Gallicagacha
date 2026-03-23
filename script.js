console.log("Script Gallica V15 - SOLUTION STABLE");

const STORAGE_KEY = "gallica_collection_v1";

async function openPack() {
    const pack = document.getElementById('mainPack');
    const status = document.getElementById('packStatus');
    
    if (!pack || pack.classList.contains('shake')) return;

    pack.classList.add('shake');
    status.innerText = "ACCÈS AUX ARCHIVES...";

    const years = [1870, 1889, 1900, 1914, 1848, 1830];
    const year = years[Math.floor(Math.random() * years.length)];
    const randomStart = Math.floor(Math.random() * 30) + 1;

    try {
        // REQUÊTE : On cherche un document image
        const query = `dc.type all "image" and date adj "${year}"`;
        const bnfUrl = `https://gallica.bnf.fr/SRU?operation=searchRetrieve&version=1.2&query=${encodeURIComponent(query)}&maximumRecords=1&startRecord=${randomStart}`;
        
        // ON UTILISE UN PROXY DIFFÉRENT (plus robuste)
        const proxyUrl = "https://api.allorigins.win/raw?url=" + encodeURIComponent(bnfUrl);
        
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error("Serveur occupé");
        
        const xmlText = await response.text();

        // Extraction ARK
        const arkMatch = xmlText.match(/ark:\/12148\/([a-z0-9]+)/i);
        if (!arkMatch) {
            console.log("Archive vide, on réessaie...");
            pack.classList.remove('shake');
            return openPack();
        }

        const arkId = arkMatch[1];
        const page = Math.floor(Math.random() * 10) + 1;
        
        const titleMatch = xmlText.match(/<dc:title>(.*?)<\/dc:title>/);
        const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").substring(0, 60) : "Image Historique";

        const img = `https://gallica.bnf.fr/ark:/12148/${arkId}/f${page}.item.thumbnail`;
        const link = `https://gallica.bnf.fr/ark:/12148/${arkId}/f${page}.item`;

        showModal(title, year, page, img, link);
        saveHero({ name: title, img: img, url: link });

    } catch (e) {
        console.error("ERREUR :", e);
        // Si AllOrigins échoue, on tente une DERNIÈRE CHANCE avec un proxy de secours
        status.innerText = "BNF SATURÉE, RÉESSAIE...";
    } finally {
        pack.classList.remove('shake');
        setTimeout(() => { status.innerText = "CLIQUER POUR CHERCHER"; }, 2000);
    }
}

function showModal(title, year, page, img, link) {
    const div = document.createElement('div');
    div.className = "overlay";
    div.style = "position:fixed; inset:0; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:1000;";
    div.innerHTML = `
        <div style="background:#fff; padding:20px; border-radius:4px; width:300px; text-align:center; border:2px solid #000; font-family:serif;">
            <div style="font-size:12px; border-bottom:1px solid #000; margin-bottom:10px;">ARCHIVE ${year}</div>
            <h3 style="margin:10px 0;">${title}</h3>
            <img src="${img}" style="width:180px; border:1px solid #ccc; background:#eee;" onerror="this.src='https://via.placeholder.com/150x200?text=Page+${page}'">
            <p style="font-size:12px;">Vue de la page ${page}</p>
            <a href="${link}" target="_blank" style="display:block; margin:15px 0; color:blue; font-weight:bold;">VOIR L'ORIGINAL</a>
            <button onclick="this.parentElement.parentElement.remove()" style="width:100%; padding:10px; cursor:pointer; background:#000; color:#fff; border:none;">COLLECTIONNER</button>
        </div>
    `;
    document.body.appendChild(div);
}

function saveHero(h) {
    let coll = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    coll.push(h);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coll));
}
