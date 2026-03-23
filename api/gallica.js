// api/gallica.js — Proxy Gallica BnF pour Vercel
// Syntaxe CommonJS (module.exports) — compatible toutes versions Node.js

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { query, maximumRecords = "1", startRecord = "1" } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Paramètre 'query' manquant" });
  }

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
        error: `Gallica a répondu avec le statut ${response.status}`,
      });
    }

    const xml = await response.text();
    const card = parseGallicaXML(xml);

    if (!card) {
      return res.status(404).json({ error: "Aucun document trouvé" });
    }

    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
    return res.status(200).json(card);

  } catch (err) {
    console.error("Erreur proxy Gallica :", err);
    return res.status(500).json({ error: "Impossible de contacter Gallica", detail: err.message });
  }
};

function parseGallicaXML(xml) {
  const arkMatch = xml.match(/ark:\/12148\/([a-zA-Z0-9]+)/);
  if (!arkMatch) return null;
  const arkId = arkMatch[1];

  const titleMatch = xml.match(/<dc:title[^>]*>([\s\S]*?)<\/dc:title>/);
  const title = titleMatch
    ? titleMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, "").trim().substring(0, 100)
    : "Document Gallica";

  const dateMatch = xml.match(/<dc:date[^>]*>(\d{4})/);
  const year = dateMatch ? dateMatch[1] : null;

  const typeMatch = xml.match(/<dc:type[^>]*>([\s\S]*?)<\/dc:type>/);
  const docType = typeMatch
    ? typeMatch[1].replace(/<[^>]+>/g, "").trim().toLowerCase()
    : "document";

  const pagesMatch = xml.match(/<nbtotalpages>(\d+)<\/nbtotalpages>/);
  const totalPages = pagesMatch ? parseInt(pagesMatch[1]) : 10;
  const page = Math.max(1, Math.floor(Math.random() * Math.min(totalPages, 30)) + 1);

  return {
    arkId,
    title,
    year,
    docType,
    totalPages,
    page,
    imgUrl:   `https://gallica.bnf.fr/iiif/ark:/12148/${arkId}/f${page}/full/600,/0/native.jpg`,
    itemUrl:  `https://gallica.bnf.fr/ark:/12148/${arkId}/f${page}.item`,
    coverUrl: `https://gallica.bnf.fr/ark:/12148/${arkId}/f1.thumbnail`,
  };
}
