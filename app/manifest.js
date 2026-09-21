export default function manifest() {
  return {
    name: "Rumble Harbor",
    short_name: "Rumble Harbor",
    description:
      "Rumble Harbor builds software systems that hold under pressure — across web, mobile, and cloud.",
    start_url: "/",
    display: "standalone",
    background_color: "#171a19",
    theme_color: "#171a19",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
