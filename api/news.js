export default async function handler(req, res) {
  const apiKey = process.env.NEWS_API_KEY; // stored safely in Vercel
  const { category } = req.query;

  // fallback if no category given
  const selectedCategory = category || "general";

  // build API URL
  const url = `https://newsapi.org/v2/top-headlines?country=us&category=${selectedCategory}&pageSize=20&apiKey=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (response.ok) {
      res.status(200).json(data);
    } else {
      res.status(response.status).json({ error: data.message || "Failed to fetch news" });
    }
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
}
