import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://www.fixit-log.co.uk/",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: "https://www.fixit-log.co.uk/home-maintenance-checklist",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: "https://www.fixit-log.co.uk/home-maintenance-schedule",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
        {
      url: "https://www.fixit-log.co.uk/how-to-stop-condensation-on-windows",
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}