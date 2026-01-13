import * as cheerio from 'cheerio'

export async function extractOgpImage(url: string): Promise<string | null> {
    try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout

        const response = await fetch(url, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; ShoesReviewBot/1.0; +http://example.com)'
            }
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
            return null
        }

        const html = await response.text()
        const $ = cheerio.load(html)

        // Try standard og:image
        let imageUrl = $('meta[property="og:image"]').attr('content')

        // Fallback to twitter:image
        if (!imageUrl) {
            imageUrl = $('meta[name="twitter:image"]').attr('content')
        }

        // Fallback to first large image (simple heuristic)
        if (!imageUrl) {
            // This is risky, might get icons. Skip for now to be safe.
        }

        if (imageUrl && !imageUrl.startsWith('http')) {
            // Handle relative URLs if necessary (though og:image is usually absolute)
            try {
                imageUrl = new URL(imageUrl, url).toString()
            } catch (e) {
                return null
            }
        }

        return imageUrl || null
    } catch (error) {
        // console.error(`Failed to fetch OGP for ${url}:`, error)
        return null
    }
}
