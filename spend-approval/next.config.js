/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: { root: require('node:path').join(__dirname, '..') },
}
module.exports = nextConfig
