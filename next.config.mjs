/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enables the Cache Components feature, which unlocks the
  // `use cache`, `use cache: remote`, and `use cache: private` directives
  // along with Partial Prerendering (PPR) as the default rendering model.
  cacheComponents: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
