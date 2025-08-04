'use client'

import { useState } from 'react'
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, X, FileText } from 'lucide-react'

export default function PrivacyPolicyPage() {
  const [showPdf, setShowPdf] = useState(false)

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = '/Privacy Policy for aahafelt.pdf'
    link.download = 'Privacy Policy for aahafelt.pdf'
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
              Privacy Policy
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We are committed to protecting your privacy and ensuring the security of your personal information. 
              Read our comprehensive privacy policy to understand how we collect, use, and protect your data.
            </p>
          </div>

          {/* PDF Viewer Card */}
          <Card className="shadow-lg border-0 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-primary/5 border-b border-blue-100/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Privacy Policy Document</CardTitle>
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
                    <FileText className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Privacy Policy Document</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Click the button above to view or download our complete privacy policy document.
                  </p>
                  <Button
                    onClick={() => setShowPdf(true)}
                    className="gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Open Privacy Policy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Points */}
          <div className="mt-12 grid md:grid-cols-2 gap-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-medium mb-3">Data Collection</h3>
                <p className="text-sm text-muted-foreground">
                  We collect information you provide directly to us, such as when you create an account, 
                  make a purchase, or contact our support team.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-medium mb-3">Data Usage</h3>
                <p className="text-sm text-muted-foreground">
                  We use your information to process orders, provide customer support, 
                  and improve our services and user experience.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-medium mb-3">Data Protection</h3>
                <p className="text-sm text-muted-foreground">
                  We implement appropriate security measures to protect your personal information 
                  against unauthorized access, alteration, or destruction.
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <h3 className="font-medium mb-3">Your Rights</h3>
                <p className="text-sm text-muted-foreground">
                  You have the right to access, correct, or delete your personal information. 
                  Contact us to exercise these rights.
                </p>
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
              <h3 className="text-lg font-medium">Privacy Policy</h3>
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
                src="/Privacy Policy for aahafelt.pdf"
                className="w-full h-full rounded-lg border"
                title="Privacy Policy PDF"
              />
            </div>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  )
} 