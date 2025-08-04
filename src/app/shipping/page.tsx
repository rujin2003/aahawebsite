'use client'

import { useState } from 'react'
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Clock, MapPin, Phone, Mail, Package, Globe, Shield } from 'lucide-react'

export default function ShippingAndDeliveryPage() {
  return (
    <div className="flex min-h-screen flex-col pt-20">
      <SiteHeader />

      <main className="flex-1 py-12">
        <div className="container max-w-4xl">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-medium mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Shipping & Delivery
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Thank you for shopping at aahafelt.com. We are dedicated to delivering your handcrafted products 
              in a timely and efficient manner.
            </p>
          </div>

          {/* Main Information Card */}
          <Card className="shadow-lg border-0 rounded-2xl overflow-hidden mb-8">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-primary/5 border-b border-blue-100/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Truck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">Delivery Information</CardTitle>
                  <p className="text-sm text-muted-foreground">Fast and reliable worldwide shipping</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-8">
                {/* Delivery Timeframe */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Delivery Timeframe</h3>
                    <p className="text-muted-foreground mb-3">
                      We aim to dispatch your order and complete delivery within <span className="font-semibold text-primary">25 days</span> from the date of your purchase.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Please note that delivery times may vary depending on the destination, customs clearance (if applicable), 
                      and other factors beyond our control.
                    </p>
                  </div>
                </div>

                {/* Shipping Charges */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Shipping Charges</h3>
                    <p className="text-muted-foreground mb-3">
                      Shipping charges are calculated at checkout based on your delivery location and the size/weight of your order.
                    </p>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-800 font-medium">
                        <Shield className="w-4 h-4 inline mr-2" />
                        Guarantee: In the event that we are unable to deliver your order within the promised 25-day timeframe, 
                        the shipping fee for that specific order will be waived or refunded to you.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Order Processing */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Globe className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Order Processing</h3>
                    <p className="text-muted-foreground mb-3">
                      Our team will contact you at most within <span className="font-semibold">3 business days</span> of receiving your order 
                      to confirm details and provide an initial update on your order status.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      All orders are processed and shipped from our facilities in <span className="font-medium">Nepal and India</span>.
                    </p>
                  </div>
                </div>

                {/* Tracking */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-2">Tracking Your Order</h3>
                    <p className="text-muted-foreground">
                      Once your order is shipped, we will provide you with a tracking number and a link to track your package's journey.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Email Support</h3>
                    <p className="text-sm text-muted-foreground">Get in touch via email</p>
                  </div>
                </div>
                <p className="text-lg font-medium text-primary">aahafelt.com</p>
                <p className="text-sm text-muted-foreground mt-2">
                  For any questions regarding your order's shipping or delivery
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-r from-green-50 to-primary/5">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Phone Support</h3>
                    <p className="text-sm text-muted-foreground">Call us directly</p>
                  </div>
                </div>
                <p className="text-lg font-medium text-primary">+977-9809204784</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Available for urgent shipping and delivery inquiries
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Information */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-medium mb-2">25 Days</h3>
                <p className="text-sm text-muted-foreground">
                  Standard delivery timeframe
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Globe className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-medium mb-2">Worldwide</h3>
                <p className="text-sm text-muted-foreground">
                  Shipping to all countries
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="font-medium mb-2">Guaranteed</h3>
                <p className="text-sm text-muted-foreground">
                  Shipping fee refund if delayed
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Important Notice */}
          <div className="mt-8">
            <Card className="border-0 shadow-sm bg-gradient-to-r from-yellow-50 to-orange-50">
              <CardContent className="p-6">
                <h3 className="font-medium mb-3 text-orange-800">Important Notice</h3>
                <p className="text-sm text-muted-foreground">
                  For any questions regarding your order's shipping or delivery, please contact our customer support team. 
                  We're here to help ensure your handcrafted felt products reach you safely and on time.
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <Truck className="w-4 h-4" />
                  <span>Handcrafted with care, delivered with love from Nepal</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
} 