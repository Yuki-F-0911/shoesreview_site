/**
 * robots.txt生成
 * AIクローラー対応強化: GPTBot, Claude, Perplexity, Google-Extended等を許可
 */

import { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://shoe-review.jp'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // 一般的なクローラー
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/developer/',
          '/_next/',
          '/private/',
        ],
      },
      // 検索エンジン
      {
        userAgent: 'Googlebot',
        allow: '/',
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
      },
      // OpenAI
      {
        userAgent: 'GPTBot',
        allow: '/',
      },
      {
        userAgent: 'ChatGPT-User',
        allow: '/',
      },
      // Anthropic (Claude)
      {
        userAgent: 'anthropic-ai',
        allow: '/',
      },
      {
        userAgent: 'Claude-Web',
        allow: '/',
      },
      {
        userAgent: 'ClaudeBot',
        allow: '/',
      },
      // Google AI (Gemini, AI Overview)
      {
        userAgent: 'Google-Extended',
        allow: '/',
      },
      // Perplexity
      {
        userAgent: 'PerplexityBot',
        allow: '/',
      },
      // Common Crawl (LLM学習データソース)
      {
        userAgent: 'CCBot',
        allow: '/',
      },
      // Cohere
      {
        userAgent: 'cohere-ai',
        allow: '/',
      },
      // Meta AI
      {
        userAgent: 'FacebookBot',
        allow: '/',
      },
      // Apple (Siri)
      {
        userAgent: 'Applebot',
        allow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}

