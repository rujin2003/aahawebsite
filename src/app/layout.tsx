import type { Metadata } from "next";
import localFont from 'next/font/local';
import { Montserrat, Playfair_Display } from "next/font/google";
import "./globals.css";
import ClientBody from "./ClientBody";
import { ThemeProvider } from "@/components/theme-provider";
import { CartProvider } from "@/components/cart-provider";
import { Toaster } from "sonner";

// Google fonts for a more aesthetic look
const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

// Custom fonts similar to Luminous Labs
const sans = localFont({
  src: [
    {
      path: '../../public/fonts/Switzer-Variable.woff2',
      weight: '100 900',
      style: 'normal',
    },
  ],
  variable: '--font-sans',
  display: 'swap',
});

const saans = localFont({
  src: [
    {
      path: '../../public/fonts/Saans-Medium.woff2',
      weight: '500',
      style: 'normal',
    },
  ],
  variable: '--font-saans',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Felt Artistry - Handcrafted Felt Products",
    template: "%s | Felt Artistry",
  },
  description: "Beautiful handmade felt handicraft products. Discover our collection of sustainable, eco-friendly felt decor, accessories, and gifts.",
  keywords: ["felt handicraft", "handmade felt", "felt products", "sustainable crafts", "eco-friendly decor", "wool felt", "artisan crafts"],
  applicationName: "Aaha Felt",
  authors: [{ name: "Rudra Devkota" }],
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Felt Artistry - Handcrafted Felt Products",
    description: "Beautiful handmade felt handicrafts made sustainably by artisans.",
    siteName: "Felt Artistry",
    images: [
      {
        url: "/hero-bg.jpg",
        width: 1200,
        height: 630,
        alt: "Felt Artistry Hero",
      },
    ],
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Felt Artistry - Handcrafted Felt Products",
    description: "Beautiful handmade felt handicrafts made sustainably by artisans.",
    images: ["/hero-bg.jpg"],
    creator: "@FeltArtistry",
  },
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: "/logo.svg",
  },
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${saans.variable} ${montserrat.variable} ${playfair.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="canonical" href={siteUrl} />
        <script
          type="application/ld+json"
         
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Aaha Felt",
              url: siteUrl,
              logo: `${siteUrl}/logo.svg`,
              sameAs: [
                // Add your social profiles when available
              ],
            }),
          }}
        />
      </head>
      <ClientBody>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <CartProvider>
            
            {children}
            <Toaster position="bottom-right" />
          </CartProvider>
        </ThemeProvider>
      </ClientBody>
    </html>
  );
}
export const runtime = 'edge';