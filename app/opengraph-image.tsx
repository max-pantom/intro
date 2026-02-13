import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

function getSiteBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return "http://localhost:3000";
  return /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
}

export default function OpenGraphImage() {
  const imageUrl = `${getSiteBaseUrl()}/og/custom-og.png`;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#111111",
        }}
      >
        <img
          src={imageUrl}
          alt="Pantom"
          width={1200}
          height={630}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </div>
    ),
    {
      ...size,
    },
  );
}
