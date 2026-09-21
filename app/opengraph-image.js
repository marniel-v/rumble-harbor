import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#171a19",
          color: "#f2e9dc",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            backgroundColor: "#f25f57",
            marginBottom: 40,
          }}
        />
        <div style={{ fontSize: 72, fontWeight: 600, letterSpacing: -1 }}>
          Rumble Harbor
        </div>
        <div style={{ fontSize: 32, color: "#a5aaa7", marginTop: 20 }}>
          From signal to system
        </div>
      </div>
    ),
    { ...size }
  );
}
