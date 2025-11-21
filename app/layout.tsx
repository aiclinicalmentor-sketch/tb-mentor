import React from "react";

export const metadata = {
  title: "TB Clinical Mentor",
  description: "Prototype chat interface for the TB Clinical Mentor."
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif"
        }}
      >
        {children}
      </body>
    </html>
  );
}
