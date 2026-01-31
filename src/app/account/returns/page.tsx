'use client';

export const runtime = "edge";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ReturnRequest {
  id: string;
  orderId: string;
  productName: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  date: string;
  reason: string;
}

export default function ReturnsPage() {
  const [returns, setReturns] = React.useState<ReturnRequest[]>([]);
  const [newReturn, setNewReturn] = React.useState({
    orderId: '',
    reason: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement actual return request submission
    console.log('Submitting return request:', newReturn);
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">My Returns</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Request a New Return</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orderId">Order ID</Label>
              <Input
                id="orderId"
                value={newReturn.orderId}
                onChange={(e) => setNewReturn({ ...newReturn, orderId: e.target.value })}
                placeholder="Enter your order ID"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Return</Label>
              <Textarea
                id="reason"
                value={newReturn.reason}
                onChange={(e) => setNewReturn({ ...newReturn, reason: e.target.value })}
                placeholder="Please explain why you want to return this item"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              Submit Return Request
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Past Returns</CardTitle>
        </CardHeader>
        <CardContent>
          {returns.length === 0 ? (
            <p className="text-gray-600">You have no past returns.</p>
          ) : (
            <div className="space-y-4">
              {returns.map((returnRequest) => (
                <div
                  key={returnRequest.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{returnRequest.productName}</h3>
                      <p className="text-sm text-gray-600">Order ID: {returnRequest.orderId}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-sm ${
                      returnRequest.status === 'approved' ? 'bg-green-100 text-green-800' :
                      returnRequest.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      returnRequest.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {returnRequest.status.charAt(0).toUpperCase() + returnRequest.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Date: {returnRequest.date}</p>
                  <p className="text-sm">{returnRequest.reason}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
