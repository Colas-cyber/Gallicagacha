// =============================================================
// api/gallica.js — Fonction serverless Vercel
// Proxy vers l'API SRU de Gallica BnF (contourne le CORS)
//
// DÉPLOIEMENT :
//   1. Placer ce fichier dans le dossier /api/ de votre repo
//   2. Déployer sur Vercel (vercel.com, gratuit)
//   3. L'URL du proxy sera : https://votre-projet.vercel.app/api/gallica
// =============================================================

export default async function handler(req, res) {
  // --- CORS : autoriser votre frontend (adapter l'origine si besoin) ---
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Répondre immédiatement aux preflight OPTIONS
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // --- Paramètres acceptés depuis le frontend ---
  const {
    query,          // ex: dc.type adj "image" and dc.date.issued any "1900"
    maximumRecords = "1",
    startRecord = "1",
  } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Paramètre 'query' manquant" });
  }

  // --- Construction de l'URL Gallica SRU ---
  const gallicaUrl = new URL("https://gallica.bnf.fr/SRU");
  gallicaUrl.searchParams.set("operation", "searchRetrieve");
  gallicaUrl.searchParams.set("version", "1.2");
  gallicaUrl.searchParams.set("query", query);
  gallicaUrl.searchParams.set("maximumRecords", maximumRecords);
  gallicaUrl.searchParams.set("startRecord", startRecord);

  try {
    const response = await fetch(gallicaUrl.toString(), {
      headers: {
        // Se présenter comme un navigateur pour éviter les blocages
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

    // --- Parser le XML côté serveur et renvoyer du JSON propre ---
    const card = parseGallicaXML(xml);

    if (!card) {
      return res.status(404).json({ error: "Aucun document trouvé pour cette requête" });
    }

    // Cache 5 minutes (les résultats Gallica ne changent pas souvent)
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
    return res.status(200).json(card);

  } catch (err) {
    console.error("Erreur proxy Gallica :", err);
    return res.status(500).json({ error: "Impossible de contacter Gallica", detail: err.message });
  }
}

// --- Parsing XML SRU → objet JSON ---
function parseGallicaXML(xml) {
  // ARK
  const arkMatch = xml.match(/ark:\/12148\/([a-zA-Z0-9]+)/);
  if (!arkMatch) return null;
  const arkId = arkMatch[1];

  // Titre (nettoyer CDATA et balises)
  const titleMatch = xml.match(/<dc:title[^>]*>([\s\S]*?)<\/dc:title>/);
  const title = titleMatch
    ? titleMatch[1]
        .replace(/<!\[CDATA\[|\]\]>/g, "")
        .replace(/<[^>]+>/g, "")
        .trim()
        .substring(0, 100)
    : "Document Gallica";

  // Date
  const dateMatch = xml.match(/<dc:date[^>]*>(\d{4})/);
  const year = dateMatch ? dateMatch[1] : null;

  // Type
  const typeMatch = xml.match(/<dc:type[^>]*>([\s\S]*?)<\/dc:type>/);
  const docType = typeMatch
    ? typeMatch[1].replace(/<[^>]+>/g, "").trim().toLowerCase()
    : "document";

  // Description courte
  const descMatch = xml.match(/<dc:description[^>]*>([\s\S]*?)<\/dc:description>/);
  const description = descMatch
    ? descMatch[1].replace(/<!\[CDATA\[|\]\]>/g, "").replace(/<[^>]+>/g, "").trim().substring(0, 200)
    : null;

  // Nombre de pages
  const pagesMatch = xml.match(/<nbtotalpages>(\d+)<\/nbtotalpages>/);
  const totalPages = pagesMatch ? parseInt(pagesMatch[1]) : 10;

  // Choisir une page aléatoire (max 30 pour éviter les fins de docs)
  const page = Math.max(1, Math.floor(Math.random() * Math.min(totalPages, 30)) + 1);

  return {
    arkId,
    title,
    year,
    docType,
    description,
    totalPages,
    page,
    // URLs construites côté serveur — le frontend n'a plus à les deviner
    imgUrl: `https://gallica.bnf.fr/ark:/12148/${arkId}/f${page}.thumbnail`,
    itemUrl: `https://gallica.bnf.fr/ark:/12148/${arkId}/f${page}.item`,
    coverUrl: `https://gallica.bnf.fr/ark:/12148/${arkId}.thumbnail`,
  };
}
