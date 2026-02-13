import { Space_Grotesk } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={spaceGrotesk.className}
        style={{
          margin: 0,
          background:
            'radial-gradient(1200px 600px at 10% -10%, #f5f1ff 0%, #fdf7e8 40%, #f7fbff 70%, #ffffff 100%)',
          color: '#1a1a1a',
        }}
      >
        {children}
      </body>
    </html>
  );
}
