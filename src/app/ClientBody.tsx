"use client";

import { useEffect } from "react";
import { useCountryStore } from "@/lib/countryStore";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  // Remove any extension-added classes during hydration
  useEffect(() => {
    // This runs only on the client after hydration
    document.body.className = "antialiased";
  }, []);

  // Start the country lookup once, app-wide, as soon as we're on the client.
  // Doing it here rather than at module scope keeps the first client render
  // identical to the server HTML.
  useEffect(() => {
    useCountryStore.getState().init();
  }, []);

  return (
    <body className="antialiased" suppressHydrationWarning>
      {children}
    </body>
  );
}