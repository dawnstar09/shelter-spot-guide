/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [],
  },
  reactStrictMode: false, // React.StrictMode 비활성화로 중복 렌더링 방지
}

module.exports = nextConfig
