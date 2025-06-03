"use client";

import { useState, useRef, useEffect } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Mail, Phone, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Loading } from "@/components/ui/loading";
import { ContactForm } from "@/components/contact-form";

const contactOptions = [
  {
    title: "General Inquiries",
    description: "Questions about our products, shipping, or returns",
    icon: <MessageCircle className="w-5 h-5" />,
    color: "bg-blue-500/10",
    textColor: "text-blue-500"
  },
  {
    title: "Custom Orders",
    description: "Discuss custom felt creations for your home or special occasions",
    icon: <Mail className="w-5 h-5" />,
    color: "bg-amber-500/10",
    textColor: "text-amber-500"
  },
  {
    title: "Wholesale",
    description: "Partnership opportunities for retailers and businesses",
    icon: <Phone className="w-5 h-5" />,
    color: "bg-emerald-500/10",
    textColor: "text-emerald-500"
  }
];

export default function ContactPage() {
  const [activeCategory, setActiveCategory] = useState("General Inquiries");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time for contact page
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Handle mouse movement for gradient effect
  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePosition({ x, y });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col pt-20">
        <SiteHeader />
        <main className="flex-1 py-12">
          <div className="container">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loading className="w-12 h-12" />
                <p className="text-muted-foreground mt-4">Loading contact information...</p>
              </div>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col pt-20">
      <SiteHeader />

      <main className="flex-1 py-12">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <h1 className="text-4xl font-medium mb-4 animate-fade-up">Get in Touch</h1>
            <p className="text-foreground/70 animate-fade-up animate-delay-100">
              We'd love to hear from you. Whether you have a question about our products, custom orders,
              or anything else, our team is ready to assist you.
            </p>
          </div>

          {isSubmitted ? (
            <div className="max-w-md mx-auto bg-gradient-to-r from-blue-500/20 to-primary/10 p-10 rounded-3xl text-center animate-fade-up relative overflow-hidden">
              <div className="absolute inset-0 z-0">
                <div className="absolute top-[-30%] right-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/20 blur-[80px]"></div>
                <div className="absolute bottom-[-20%] left-[5%] w-[30%] h-[30%] rounded-full bg-primary/10 blur-[50px]"></div>
              </div>
              <div className="relative z-10">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-medium mb-4">Message Sent!</h2>
                <p className="text-foreground/70 mb-6">
                  Thank you for reaching out. We've received your message and will get back to you shortly.
                </p>
                <Button
                  className="rounded-full"
                  onClick={() => setIsSubmitted(false)}
                >
                  Send Another Message
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              <div
                ref={containerRef}
                className="bg-card rounded-3xl p-1 overflow-hidden relative shadow-sm"
                onMouseMove={handleMouseMove}
              >
                <div
                  className="absolute inset-0 bg-gradient-to-r from-blue-400/5 via-primary/5 to-blue-400/5 opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{
                    background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(var(--primary), 0.1), transparent 40%)`,
                  }}
                ></div>

                <div className="bg-card rounded-[calc(1.5rem-4px)] p-8 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
                    {contactOptions.map((option) => (
                      <button
                        key={option.title}
                        type="button"
                        className={cn(
                          "p-4 rounded-xl text-left card-hover-effect transition-all",
                          activeCategory === option.title
                            ? `${option.color} border-2 border-primary/20`
                            : "bg-muted/50 hover:bg-muted"
                        )}
                        onClick={() => setActiveCategory(option.title)}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center mb-3",
                          option.color
                        )}>
                          <div className={option.textColor}>
                            {option.icon}
                          </div>
                        </div>
                        <h3 className="text-base font-medium">{option.title}</h3>
                        <p className="text-foreground/60 text-sm mt-1">{option.description}</p>
                      </button>
                    ))}
                  </div>

                  <ContactForm onSuccess={() => setIsSubmitted(true)} />
                </div>
              </div>

              <div className="relative">
                <div className="sticky top-24 space-y-10">
                  <div className="space-y-8 bg-card rounded-3xl p-8 shadow-sm animate-fade-left">
                    <h2 className="text-2xl font-medium">Visit Our Studio</h2>
                    <div className="space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">Address</h3>
                          <p className="text-foreground/70 mt-1">
                           Tokha Saraswati<br />
                            Kathmandu,44600<br />
                            Nepal
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Mail className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">Email</h3>
                          <p className="text-foreground/70 mt-1">
                            aahaflet@gmail.com<br />
                            support@aahafeltcraft.com
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Phone className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-medium">Phone</h3>
                          <p className="text-foreground/70 mt-1">
                            +977-9809204784<br />
                            Mon-Fri, 9am-6pm PST
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
