console.log("Script Gallica V7 - Force Brute !");

const STORAGE_KEY = "gallica_collection_v1";

async function openPack() {
    const pack = document.getElementById('mainPack');
    const status = document.getElementById('packStatus');
    
    if (!pack || pack.classList.contains('shake')) return;

    pack.classList.add('shake');
    status.innerText = "FORCAGE DES PORTES...";

    const year = Math.floor(Math.random() * (1914 - 1850) + 1850);
    const startRecord = Math.floor(Math.random() * 20) + 1;

    try {
        // On cible uniquement la Presse (plus facile à charger)
        const query = 'dc.type all "presse" and date adj "' + year + '"';
        const urlBNF = "https://gallica.bnf.fr/SRU?operation=searchRetrieve&version=1.2&query=" + encodeURIComponent(query) + "&maximumRecords=1&startRecord=" + startRecord;
        
        // NOUVEAU PROXY : Plus direct
        const finalUrl = "https://corsproxy.io/?" + urlBNF;
        
        console.log("Tentative V7 sur l'année " + year);
        
        const response = await fetch(finalUrl);
        if (!response.ok) throw new Error("Proxy encombré");
        
        const xmlText = await response.text();

        // Recherche de l'ARK
        const idMatch = xmlText.match(/<dc:identifier>(ark:\/.*?)<\/dc:identifier>/);

        if (!idMatch) {
            console.log("Rien trouvé, on change d'année...");
            pack.classList.remove('shake');
            return openPack(); 
        }

        const ark = idMatch[1].split('?')[0].trim();
        const titleMatch = xmlText.match(/<dc:title>(.*?)<\/dc:title>/);
        const title = titleMatch ? titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").substring(0, 60) : "Journal d'époque";

        const img = "https://gallica.bnf.fr/" + ark + ".thumbnail";
        const link = "https://gallica.bnf.fr/" + ark;

        showModal(title, "Journal de l'an " + year, img, link);
        saveHero({ name: title, img: img, url: link });

    } catch (e) {
        console.error("ERREUR :", e);
        alert("La BNF est sous pression. Clique sur OK et réessaie une fois !");
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
        <div style="background:#fff; padding:20px; border-radius:10px; width:280px; text-align:center; border:5px solid gold;">
            <h2>✨ TROUVÉ !</h2>
            <img src="${img}" style="width:100%; margin:10px 0; border:1px solid #ccc;">
            <h3>${name}</h3>
            <p>${desc}</p>
            <a href="${link}" target="_blank" style="display:block; margin:10px; color:blue;">Lire le journal ↗</a>
            <button onclick="this.parentElement.parentElement.remove()" style="width:100%; padding:10px; background:#333; color:#fff; cursor:pointer;">ARCHIVER</button>
        </div>
    `;
    document.body.appendChild(div);
}

function saveHero(h) {
    let coll = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    coll.push(h);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coll));
}
