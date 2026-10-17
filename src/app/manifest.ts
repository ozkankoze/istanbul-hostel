import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Istanbul Hostel — Guest guide",
    short_name: "Istanbul Hostel",
    start_url: "/guest",
    display: "standalone",
    background_color: "#efece6",
    theme_color: "#1f3c7a",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
