// SEE https://vercel.com/docs/frameworks/nextjs?package-manager=npm#open-graph-images

import { ImageResponse } from 'next/og';
// App router includes @vercel/og.
// No need to install it.

export async function GET(/*request: Request*/) {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          textAlign: 'center',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Hello world!
      </div>
    ),
    {
      width: 1200,
      height: 600,
    },
  );
}
