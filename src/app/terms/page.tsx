'use client'

import { useState } from 'react'
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, X, FileText, Shield } from 'lucide-react'

export default function TermsAndConditionsPage() {
  const [showPdf, setShowPdf] = useState(false)

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = '/termsandconditions.pdf'
    link.download = 'Terms and Conditions.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="flex min-h-screen flex-col pt-20">
      <SiteHeader />

      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-medium mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Terms & Conditions
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Please read these terms and conditions carefully before using our services. 
              These terms govern your use of our website and the purchase of our products.
            </p>
          </div>

          {/* PDF Viewer Card */}
          <Card className="shadow-lg border-0 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 to-primary/5 border-b border-green-100/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Terms & Conditions Document</CardTitle>
                    <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </Button>
                  <Button
                    onClick={() => setShowPdf(true)}
                    size="sm"
                    className="gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    View PDF
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-6">
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Terms & Conditions Document</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Click the button above to view or download our complete terms and conditions document.
                  </p>
                  <Button
                    onClick={() => setShowPdf(true)}
                    className="gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Open Terms & Conditions
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Points */}
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-medium mb-3">Acceptance of Terms</h3>
                <p className="text-sm text-muted-foreground">
                  By accessing and using our website, you accept and agree to be bound by these terms 
                  and conditions and our privacy policy.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-medium mb-3">Product Information</h3>
                <p className="text-sm text-muted-foreground">
                  We strive to provide accurate product descriptions and images. However, 
                  actual products may vary slightly from the images shown.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-medium mb-3">Order & Payment</h3>
                <p className="text-sm text-muted-foreground">
                  All orders are subject to acceptance and availability. Payment must be made 
                  in full at the time of ordering through our secure payment system.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-medium mb-3">Shipping & Returns</h3>
                <p className="text-sm text-muted-foreground">
                  We offer worldwide shipping with tracking. Returns are accepted within 
                  30 days of delivery for unused items in original packaging.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-medium mb-3">Intellectual Property</h3>
                <p className="text-sm text-muted-foreground">
                  All content on this website, including text, images, and designs, 
                  is protected by copyright and other intellectual property laws.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-medium mb-3">Limitation of Liability</h3>
                <p className="text-sm text-muted-foreground">
                  Our liability is limited to the amount paid for the product. 
                  We are not liable for indirect or consequential damages.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Information */}
          <div className="mt-12">
            <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-primary/5">
              <CardContent className="p-6">
                <h3 className="font-medium mb-3 text-primary">Important Notice</h3>
                <p className="text-sm text-muted-foreground">
                  These terms and conditions are legally binding. By using our services, you acknowledge 
                  that you have read, understood, and agree to be bound by these terms. If you do not agree 
                  with any part of these terms, please do not use our services.
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>For questions about these terms, please contact our support team.</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* PDF Modal */}
      {showPdf && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium">Terms & Conditions</h3>
              <div className="flex gap-2">
                <Button
                  onClick={handleDownload}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button
                  onClick={() => setShowPdf(false)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Close
                </Button>
              </div>
            </div>
            <div className="flex-1 p-4">
              <iframe
                src="/termsandconditions.pdf"
                className="w-full h-full rounded-lg border"
                title="Terms and Conditions PDF"
              />
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  )
} 