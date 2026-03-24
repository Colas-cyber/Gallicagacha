// api/gallica.js — Proxy Gallica BnF pour Vercel
// Gère deux modes : ?query=... (recherche SRU) et ?img=... (proxy image IIIF)

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  // ---- MODE IMAGE : /api/gallica?img=ark:/12148/XXX/f5 ----
  if (req.query.img) {
    return proxyImage(req, res);
  }

  // ---- MODE RECHERCHE SRU ----
  const { query, maximumRecords = "1", startRecord = "1" } = req.query;
  if (!query) return res.status(400).json({ error: "Paramètre 'query' manquant" });

  const gallicaUrl =
    `https://gallica.bnf.fr/SRU?operation=searchRetrieve&version=1.2` +
    `&query=${encodeURIComponent(query)}` +
    `&maximumRecords=${maximumRecords}` +
    `&startRecord=${startRecord}`;

  try {
    const response = await fetch(gallicaUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 GallicaGacha/2.0 (educational game)",
        "Accept": "application/xml, text/xml, */*",
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: `Gallica SRU a répondu ${response.status}`,
      });
    }

    const xml = await response.text();
    const card = parseGallicaXML(xml);
    if (!card) return res.status(404).json({ error: "Aucun document trouvé" });

    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
    return res.status(200).json(card);

  } catch (err) {
    console.error("Erreur SRU :", err);
    return res.status(500).json({ error: "Impossible de contacter Gallica", detail: err.message });
  }
};

// ---- PROXY IMAGE IIIF ----
async function proxyImage(req, res) {
  // req.query.img = "ark:/12148/btv1b.../f5"
  const arkPath = req.query.img;
  const iiifUrl = `https://gallica.bnf.fr/iiif/${arkPath}/full/1200,/0/native.jpg`;

  try {
    const response = await fetch(iiifUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 GallicaGacha/2.0 (educational game)",
        "Referer": "https://gallica.bnf.fr/",
        "Accept": "image/jpeg,image/*,*/*",
      },
    });

    if (!response.ok) {
      // Fallback sur thumbnail si IIIF échoue
      const [, arkId] = arkPath.match(/ark:\/12148\/([^/]+)/) || [];
      const thumbUrl = `https://gallica.bnf.fr/ark:/12148/${arkId}.thumbnail`;
      const thumb = await fetch(thumbUrl, {
        headers: { "User-Agent": "Mozilla/5.0 GallicaGacha/2.0" },
      });
      if (!thumb.ok) return res.status(404).send("Image non trouvée");
      const buf = await thumb.arrayBuffer();
      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader("Cache-Control", "public, max-age=3600");
      return res.send(Buffer.from(buf));
    }

    const buf = await response.arrayBuffer();
    res.setHeader("Content-Type", "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.send(Buffer.from(buf));

  } catch (err) {
    console.error("Erreur image :", err);
    return res.status(500).send("Erreur image");
  }
}

// ---- PARSE XML SRU ----
function parseGallicaXML(xml) {
  // Filtrer les ARKs "cb..." (notices catalogue, pas des documents numérisés)
  const arkMatches = [...xml.matchAll(/ark:\/12148\/([a-zA-Z0-9]+)/g)];
  const validArk = arkMatches.find(m => !m[1].startsWith('cb'));
  if (!validArk) return null;
  const arkId = validArk[1];

  const titleMatch = xml.match(/<dc:title[^>]*>([\s\S]*?)<\/dc:title>/);
  const title = titleMatch
    ? titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, "").trim().substring(0, 100)
    : "Document Gallica";

  const dateMatch = xml.match(/<dc:date[^>]*>([\d\/\-]+)/);
  let year = null;
  let dateLabel = null;
  if (dateMatch) {
    const raw = dateMatch[1].trim();
    const fullDate = raw.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/);
    if (fullDate) {
      year = fullDate[1];
      const months = ["janv.","févr.","mars","avr.","mai","juin",
                      "juil.","août","sept.","oct.","nov.","déc."];
      const m = parseInt(fullDate[2]) - 1;
      const d = parseInt(fullDate[3]);
      dateLabel = `${d} ${months[m]} ${year}`;
    } else {
      year = raw.substring(0, 4);
      dateLabel = year;
    }
  }

  const typeMatch = xml.match(/<dc:type[^>]*>([\s\S]*?)<\/dc:type>/);
  const docType = typeMatch
    ? typeMatch[1].replace(/<[^>]+>/g, "").trim().toLowerCase()
    : "document";

  const pagesMatch = xml.match(/<nbtotalpages>(\d+)<\/nbtotalpages>/);
  const totalPages = pagesMatch ? parseInt(pagesMatch[1]) : 10;
  const page = Math.max(1, Math.floor(Math.random() * Math.min(totalPages, 30)) + 1);

  const BASE = "https://gallicagacha.vercel.app/api/gallica";
  const arkPath = `ark:/12148/${arkId}/f${page}`;

  return {
    arkId,
    title,
    year,
    dateLabel,
    docType,
    totalPages,
    page,
    imgUrl:   `${BASE}?img=${encodeURIComponent(arkPath)}`,
    itemUrl:  `https://gallica.bnf.fr/ark:/12148/${arkId}/f1`,
    coverUrl: `${BASE}?img=${encodeURIComponent(`ark:/12148/${arkId}/f1`)}`,
  };
}
