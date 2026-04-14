import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'InvestPro | AI-Powered Investment Crowdfunding',
    short_name: 'InvestPro',
    description: 'The leading crowdfunding platform in Vietnam with AI financial insights.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#002B5B',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
