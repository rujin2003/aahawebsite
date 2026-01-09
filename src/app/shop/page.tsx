import { Suspense } from 'react'
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Loading } from "@/components/ui/loading"
import ShopClient from './ShopClient'

function ShopLoadingFallback() {
  return (
    <div className="flex min-h-screen flex-col pt-20">
      <SiteHeader />
      <main className="flex-1 py-12">
        <div className="container">
          <div className="flex items-center justify-center h-96">
            <div className="text-center space-y-4">
              <Loading className="w-12 h-12 mx-auto" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Loading products...</p>
                <p className="text-sm text-muted-foreground">Please wait while we prepare our collection for you</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopLoadingFallback />}>
      <ShopClient />
    </Suspense>
  )
}