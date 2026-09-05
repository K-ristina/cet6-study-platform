export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Extract query word
  let q = req.query?.q;
  if (!q && req.url) {
    try {
      const parsed = new URL(req.url, 'http://localhost');
      q = parsed.searchParams.get('q');
    } catch {
      // ignore
    }
  }

  if (!q) {
    return res.status(400).json({ error: 'Missing query parameter "q"' });
  }

  try {
    const upstreamUrl = `https://dict.youdao.com/jsonapi?q=${encodeURIComponent(String(q))}`;
    const upstreamRes = await fetch(upstreamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.youdao.com/',
      },
    });

    if (!upstreamRes.ok) {
      return res.status(upstreamRes.status).json({ error: `Upstream error: ${upstreamRes.status}` });
    }

    const data = await upstreamRes.json();
    // Cache for 1 day on Vercel Edge CDN
    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=604800');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err?.message || 'Failed to fetch dictionary data' });
  }
}
