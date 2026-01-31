"use client";

export const runtime = "edge";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loading } from "@/components/ui/loading";

export default function TestMailingPage() {
  const [loading, setLoading] = useState(false);
  const [testType, setTestType] = useState<'contact' | 'order'>('contact');

  const handleTestMailing = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/test-mailing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Test failed');
      }

      toast.success(`Test ${testType} email sent successfully!`);
      console.log('Test result:', data);
    } catch (error) {
      console.error('Test mailing error:', error);
      toast.error(error instanceof Error ? error.message : 'Test failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-12 max-w-2xl">
      <h1 className="text-3xl font-bold mb-8">Mailing Service Test</h1>
      
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Test Mailing Service Integration</h2>
            <p className="text-muted-foreground mb-4">
              This page allows you to test the mailing service integration with the Go microservice.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Test Type</label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="contact"
                    checked={testType === 'contact'}
                    onChange={(e) => setTestType(e.target.value as 'contact' | 'order')}
                    className="rounded"
                  />
                  <span>Contact Form Email</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="order"
                    checked={testType === 'order'}
                    onChange={(e) => setTestType(e.target.value as 'contact' | 'order')}
                    className="rounded"
                  />
                  <span>Order Confirmation Email</span>
                </label>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">Test Details:</h3>
              {testType === 'contact' ? (
                <ul className="text-sm space-y-1">
                  <li>• Sends a test contact form email to admin</li>
                  <li>• Tests the /api/mail/contact endpoint</li>
                  <li>• Uses test data: test@example.com</li>
                </ul>
              ) : (
                <ul className="text-sm space-y-1">
                  <li>• Sends a test order confirmation email</li>
                  <li>• Tests the /api/mail/order endpoint</li>
                  <li>• Uses test order data with sample products</li>
                </ul>
              )}
            </div>

            <Button
              onClick={handleTestMailing}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loading className="w-4 h-4 mr-2" />
                  Testing...
                </>
              ) : (
                `Test ${testType === 'contact' ? 'Contact' : 'Order'} Email`
              )}
            </Button>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-medium mb-2">Mailing Service Status:</h3>
            <div className="text-sm space-y-1">
              <p>• Base URL: http://144.24.133.155:8081</p>
              <p>• Contact endpoint: /api/mail/contact</p>
              <p>• Order endpoint: /api/mail/order</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
