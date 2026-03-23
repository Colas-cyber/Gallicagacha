console.log("Script Gallica V14 - Moteur Data.BNF");

const STORAGE_KEY = "gallica_collection_v1";

async function openPack() {
    const pack = document.getElementById('mainPack');
    const status = document.getElementById('packStatus');
    
    if (!pack || pack.classList.contains('shake')) return;

    pack.classList.add('shake');
    status.innerText = "INTERROGATION DE LA BASE...";

    // Requête SPARQL : on demande une image au hasard des années 1800
    // C'est l'équivalent de Wikibase pour la BNF
    const sparqlQuery = `
        PREFIX dc: <http://purl.org/dc/elements/1.1/>
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT ?ark ?title WHERE {
          ?ark dc:type "image" .
          ?ark dc:title ?title .
          ?ark dc:date "${Math.floor(Math.random() * (1900 - 1850) + 1850)}" .
        } LIMIT 1 OFFSET ${Math.floor(Math.random() * 100)}
    `;

    const url = "https://data.bnf.fr/sparql?query=" + encodeURIComponent(sparqlQuery) + "&format=json";

    try {
        // On utilise un proxy car data.bnf.fr bloque aussi le CORS direct
        const finalUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        
        const response = await fetch(finalUrl);
        const json = await response.json();
        const data = JSON.parse(json.contents);

        if (!data.results.bindings.length) {
            console.log("Base muette, on relance...");
            pack.classList.remove('shake');
            return openPack();
        }

        // Récupération de l'ARK et du Titre
        const result = data.results.bindings[0];
        const fullArk = result.ark.value; // URL complète
        const title = result.title.value;
        
        // On transforme l'URL data.bnf.fr en URL Gallica
        const arkId = fullArk.match(/12148\/(.+)/)[1];
        const page = Math.floor(Math.random() * 5) + 1; // Souvent les images sont en page 1 ou 2

        const imgUrl = `https://gallica.bnf.fr/ark:/12148/${arkId}/f${page}.item.thumbnail`;
        const link = `https://gallica.bnf.fr/ark:/12148/${arkId}/f${page}.item`;

        console.log("TROUVÉ VIA DATA.BNF :", title);
        showModal(title, arkId, imgUrl, link);
        saveHero({ name: title, img: imgUrl, url: link });

    } catch (e) {
        console.error("ERREUR BASE :", e);
        status.innerText = "BASE OCCUPÉE...";
    } finally {
        pack.classList.remove('shake');
        if(status.innerText === "INTERROGATION DE LA BASE...") status.innerText = "CLIQUER POUR CHERCHER";
    }
}

function showModal(name, id, img, link) {
    const div = document.createElement('div');
    div.className = "overlay";
    div.style = "position:fixed; inset:0; background:rgba(0,0,0,0.8); display:flex; align-items:center; justify-content:center; z-index:1000;";
    div.innerHTML = `
        <div style="background:#fff; padding:20px; border-radius:10px; width:320px; text-align:center; border:3px solid #666;">
            <div style="font-size:10px; color:red; font-weight:bold;">DATA.BNF RECORD</div>
            <h2 style="font-size:18px; font-family:serif;">${name}</h2>
            <img src="${img}" style="width:200px; margin:15px 0; border:1px solid #ccc;">
            <p style="font-size:12px; color:#555;">ID : ${id}</p>
            <a href="${link}" target="_blank" style="display:block; margin-bottom:15px; color:blue;">VOIR SUR GALLICA</a>
            <button onclick="this.parentElement.parentElement.remove()" style="width:100%; padding:10px; cursor:pointer;">FERMER</button>
        </div>
    `;
    document.body.appendChild(div);
}

function saveHero(h) {
    let coll = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    coll.push(h);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coll));
}
