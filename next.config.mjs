/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  /**
   * The facade route reads facades/<slug>/index.html off disk at request time.
   * Next traces each function's file dependencies statically, and a path built
   * at runtime is invisible to that trace — so the HTML would be left out of
   * the serverless bundle and every facade would 404 in production while
   * working perfectly in dev. Naming it here puts it in the bundle.
   */
  outputFileTracingIncludes: {
    "/capabilities/facade/[slug]": ["./facades/*/index.html"],
  },
};

export default nextConfig;
