console.log("Script Gallica V12 - Mode Page-Précise");

const STORAGE_KEY = "gallica_collection_v1";

async function openPack() {
    const pack = document.getElementById('mainPack');
    const status = document.getElementById('packStatus');
    
    if (!pack || pack.classList.contains('shake')) return;

    pack.classList.add('shake');
    status.innerText = "FEUILLETAGE DES ARCHIVES...";

    // On cherche dans des documents qui ont beaucoup de pages (type btvb / images)
    const year = Math.floor(Math.random() * (1914 - 1800) + 1800);
    const startRecord = Math.floor(Math.random() * 100) + 1;

    try {
        // On cherche des documents de type "image" ou "fascicule" pour avoir de belles pages
        const query = `date adj "${year}" and (dc.type all "image" or dc.type all "monographie")`;
        const bnfUrl = `https://gallica.bnf.fr/SRU?operation=searchRetrieve&version=1.2&query=${encodeURIComponent(query)}&maximumRecords=1&startRecord=${startRecord}`;
        
        // Proxy CodeTabs (plus stable)
        const finalUrl = `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(bnfUrl)}`;
        
        const response = await fetch(finalUrl);
        const xmlText = await response.text();

        // 1. On extrait l'identifiant (ARK)
        const arkMatch = xmlText.match(/ark:\/[0-9a-z]+\/([a-z0-9]+)/);
        if (!arkMatch) {
            console.log("Pas de page ici, on tourne la feuille...");
            pack.classList.remove('shake');
            return openPack();
        }

        const arkId = arkMatch[1]; // Exemple: btv1b84229574
        
        // 2. On choisit une page au hasard entre 1 et 50
        const pageNum = Math.floor(Math.random() * 50) + 1;
        
        // 3. On extrait le titre
        const titleMatch = xmlText.match(/<dc:title>(.*?)<\/dc:title>/);
        const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").substring(0, 80) : "Document Anonyme";

        // Liens directs vers l'image de la page et la visionneuse
        const imgUrl = `https://gallica.bnf.fr/ark:/12148/${arkId}/f${pageNum}.item.thumbnail`;
        const fullLink = `https://gallica.bnf.fr/ark:/12148/${arkId}/f${pageNum}.item`;

        console.log("TROUVÉ : " + title + " (Page " + pageNum + ")");
        
        showModal(title, year, pageNum, imgUrl, fullLink);
        saveHero({ name: title, img: imgUrl, url: fullLink, year: year });

    } catch (e) {
        console.error("ERREUR :", e);
        status.innerText = "ERREUR RÉSEAU... RECLIQUE !";
    } finally {
        pack.classList.remove('shake');
        if(status.innerText !== "ERREUR RÉSEAU... RECLIQUE !") status.innerText = "CLIQUER POUR CHERCHER";
    }
}

function showModal(title, year, page, img, link) {
    const div = document.createElement('div');
    div.className = "overlay";
    div.style = "position:fixed; inset:0; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:1000; padding:20px;";
    div.innerHTML = `
        <div style="background:#fff; padding:25px; border-radius:4px; width:100%; max-width:380px; text-align:center; border:1px solid #333; box-shadow: 10px 10px 0px #000; font-family: 'Times New Roman', serif;">
            <div style="text-align:left; border-bottom: 2px solid #000; margin-bottom:15px; padding-bottom:5px; font-weight:bold; letter-spacing:1px;">
                ARCHIVE No ${Math.floor(Math.random()*9000)} / ${year}
            </div>
            <h2 style="font-size:20px; margin:0 0 20px 0; line-height:1.2;">${title}</h2>
            <div style="background:#eee; padding:15px; margin-bottom:20px; border:1px solid #ddd;">
                <img src="${img}" style="max-width:100%; box-shadow: 2px 2px 5px rgba(0,0,0,0.2);" onerror="this.src='https://via.placeholder.com/150x200?text=Page+Hors-Texte'">
                <p style="font-size:12px; margin-top:10px; color:#666;">Vue numérisée : Page ${page}</p>
            </div>
            <div style="display:flex; gap:10px;">
                <a href="${link}" target="_blank" style="flex:1; background:#000; color:#fff; text-decoration:none; padding:12px; font-weight:bold; font-size:14px; text-transform:uppercase;">Lire la page</a>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" style="flex:1; background:#fff; border:2px solid #000; cursor:pointer; font-weight:bold; text-transform:uppercase;">Garder</button>
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
