import type { Metadata } from "next";
import localFont from 'next/font/local';
import { Montserrat, Playfair_Display } from "next/font/google";
import "./globals.css";
import ClientBody from "./ClientBody";
import { ThemeProvider } from "@/components/theme-provider";
import { CartProvider } from "@/components/cart-provider";
import { WishlistProvider } from "@/contexts/WishlistContext";
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

export const metadata: Metadata = {
  title: "Aaha Felt - Handcrafted Felt Products",
  description: "Beautiful handmade felt handicraft products. Discover our collection of sustainable, eco-friendly felt decor, accessories, and gifts.",
  keywords: ["felt handicraft", "handmade felt", "felt products", "sustainable crafts", "eco-friendly decor"],
  icons: {
    icon: "/logo.svg",  
    shortcut: "/logo.svg",
    apple: "/logo.svg",    
  },
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
      <ClientBody>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <WishlistProvider>
            <CartProvider>
              {children}
              <Toaster position="bottom-right" />
            </CartProvider>
          </WishlistProvider>
        </ThemeProvider>
      </ClientBody>
    </html>
  );
}
