/** @type {import('next').NextConfig} */

const webpack = require("webpack");

module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { isServer }) => {
    // Telescope 2.x's @interchainjs/crypto pulls in libsodium-sumo which
    // imports `node:fs` etc. via the `node:` URI scheme. Webpack 5 does
    // not handle `node:` URIs out of the box, so we rewrite them to bare
    // module specifiers and let the fallback below resolve them to
    // empty stubs in the browser bundle.
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
        resource.request = resource.request.replace(/^node:/, "");
      }),
    );

    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
      };
    }

    return config;
  },
};
