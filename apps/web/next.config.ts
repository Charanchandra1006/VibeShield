import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Disabled cacheComponents for MVP stability: the app uses useParams/usePathname
  // in client components which requires Suspense boundaries under PPR. Our pages
  // already use Suspense, but disabling avoids further prerender edge-cases.
};

export default nextConfig;
