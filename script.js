console.log("Script Gallica V9 - Mode Wiki-Gacha");

const STORAGE_KEY = "gallica_collection_v1";

// Fonction pour faire une pause et éviter les blocages
const wait = ms => new Promise(res => setTimeout(res, ms));

async function openPack() {
    const pack = document.getElementById('mainPack');
    const status = document.getElementById('packStatus');
    
    if (!pack || pack.classList.contains('shake')) return;

    pack.classList.add('shake');
    status.innerText = "RECHERCHE DANS LES ARCHIVES...";

    // On choisit une année et on varie l'index
    const year = Math.floor(Math.random() * (1910 - 1830) + 1830);
    const startRecord = Math.floor(Math.random() * 100) + 1;

    try {
        // REQUÊTE CIBLÉE : On cherche des documents qui ont une image/illustration
        const query = `date adj "${year}" and dc.description any "illustré"`;
        const urlBNF = `https://gallica.bnf.fr/SRU?operation=searchRetrieve&version=1.2&query=${encodeURIComponent(query)}&maximumRecords=1&startRecord=${startRecord}`;
        
        // On utilise AllOrigins qui est plus souple sur les gros volumes de texte
        const finalUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(urlBNF)}`;
        
        const response = await fetch(finalUrl);
        const data = await response.json();
        const xmlText = data.contents;

        // Extraction de l'identifiant ARK
        const idMatch = xmlText.match(/ark:\/[^<\s?]+/);

        if (!idMatch) {
            console.log("Casier vide pour " + year + ", nouvelle tentative...");
            await wait(1000); // On attend 1 seconde pour ne pas spammer le proxy
            pack.classList.remove('shake');
            return openPack(); 
        }

        const ark = idMatch[0].replace('</dc:identifier>', '').trim();
        
        // Extraction du titre et de la description (pour le côté Wiki)
        const titleMatch = xmlText.match(/<dc:title>(.*?)<\/dc:title>/);
        const descMatch = xmlText.match(/<dc:description>(.*?)<\/dc:description>/);
        
        const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").substring(0, 100) : "Document d'époque";
        const description = descMatch ? descMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").substring(0, 200) + "..." : "Cet article provient des archives de la BNF.";

        const img = `https://gallica.bnf.fr/${ark}.thumbnail`;
        const link = `https://gallica.bnf.fr/${ark}`;

        showModal(title, description, year, img, link);
        saveHero({ name: title, img: img, url: link, year: year });

    } catch (e) {
        console.error("ERREUR :", e);
        status.innerText = "PROXY FATIGUÉ... RÉESSAIE";
    } finally {
        pack.classList.remove('shake');
        if(status.innerText !== "PROXY FATIGUÉ... RÉESSAIE") status.innerText = "CLIQUER POUR CHERCHER";
    }
}

function showModal(name, desc, year, img, link) {
    const div = document.createElement('div');
    div.className = "overlay";
    div.style = "position:fixed; inset:0; background:rgba(0,0,0,0.85); display:flex; align-items:center; justify-content:center; z-index:1000; font-family: 'Georgia', serif;";
    div.innerHTML = `
        <div style="background:#fff; color:#111; padding:25px; border-radius:2px; width:350px; border-top: 10px solid #a40000; box-shadow: 0 10px 30px rgba(0,0,0,0.5); position:relative;">
            <div style="text-transform:uppercase; color:#a40000; font-weight:bold; font-size:12px; margin-bottom:10px;">Archives de l'an ${year}</div>
            <h2 style="margin:0 0 15px 0; font-size:22px; line-height:1.2;">${name}</h2>
            <div style="background:#f8f9fa; padding:10px; border:1px solid #c8ccd1; margin-bottom:15px; text-align:center;">
                <img src="${img}" style="max-width:100%; border:1px solid #a2a9b1;" onerror="this.src='https://via.placeholder.com/150x200?text=Image+indisponible'">
            </div>
            <p style="font-size:14px; line-height:1.5; color:#202122; margin-bottom:20px;">${desc}</p>
            <div style="display:flex; gap:10px;">
                <a href="${link}" target="_blank" style="flex:1; background:#3366cc; color:white; text-decoration:none; padding:10px; text-align:center; font-weight:bold; font-size:14px; border-radius:2px;">LIRE SUR GALLICA</a>
                <button onclick="this.parentElement.parentElement.parentElement.remove()" style="flex:1; background:#eaecf0; border:1px solid #a2a9b1; cursor:pointer; font-weight:bold;">FERMER</button>
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
