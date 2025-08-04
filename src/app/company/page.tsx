"use client";

import { useEffect, useState } from 'react'
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Heart,
  Leaf,
  PackageOpen,
  Users,
  Award,
  Globe,
  BadgeCheck,
  ArrowRight
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Loading } from "@/components/ui/loading"
import { TeamMember } from '@/lib/supabase'
import { useInView } from 'react-intersection-observer'
import { motion, useAnimation } from 'framer-motion'

// Values data
const ourValues = [
  {
    title: "Artisanal Craftsmanship",
    description: "Each piece is meticulously handcrafted by our skilled artisans using traditional needle felting techniques.",
    icon: <Heart className="w-6 h-6 text-primary" />
  },
  {
    title: "Sustainable Materials",
    description: "We source 100% natural wool from farms that prioritize animal welfare and sustainable farming practices.",
    icon: <Leaf className="w-6 h-6 text-primary" />
  },
  {
    title: "Quality Assurance",
    description: "Every product undergoes thorough quality checks to ensure exceptional durability and aesthetic appeal.",
    icon: <BadgeCheck className="w-6 h-6 text-primary" />
  },
  {
    title: "Community Impact",
    description: "We invest in artisan communities, providing fair wages and supporting traditional craft preservation.",
    icon: <Users className="w-6 h-6 text-primary" />
  }
];

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / 2000, 1);
      
      setCount(Math.floor(progress * value));
      
      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value]);

  return <span>{count}{suffix}</span>;
}

function StatisticsSection() {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const controls = useAnimation();

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  const stats = [
    { value: 15, suffix: '+', label: 'Master Artisans' },
    { value: 100, suffix: '%', label: 'Natural Materials' },
    { value: 5000, suffix: '+', label: 'Happy Customers' },
    { value: 8, suffix: '', label: 'Years of Excellence' },
  ];

  return (
    <section ref={ref} className="py-20 bg-gradient-to-r from-blue-500/5 to-primary/5">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial="hidden"
              animate={controls}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: {
                    duration: 0.5,
                    delay: index * 0.1,
                  },
                },
              }}
              className="text-center"
            >
              <div className="text-4xl font-bold text-primary mb-2">
                <Counter value={stat.value} suffix={stat.suffix} />
              </div>
              <p className="text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function CompanyPage() {
  const [loading, setLoading] = useState(true)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await fetch('/api/team')
        const data = await response.json()
        setTeamMembers(data)
      } catch (error) {
        console.error('Error fetching team members:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTeamMembers()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col pt-20">
        <SiteHeader />
        <main className="flex-1 py-12">
          <div className="container">
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <Loading className="w-12 h-12" />
                <p className="text-muted-foreground mt-4">Loading team information...</p>
              </div>
            </div>
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col pt-20">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-r from-blue-500/20 to-primary/10 py-20 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-[-20%] left-[10%] w-[50%] h-[50%] rounded-full bg-blue-500/20 blur-[80px]"></div>
            <div className="absolute bottom-[-10%] right-[5%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[70px]"></div>
          </div>

          <div className="container relative z-10">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-4xl font-medium mb-6 animate-fade-up">Crafting Sustainable Beauty & Preserving Traditions</h1>
              <p className="text-foreground/70 text-lg mb-8 animate-fade-up animate-delay-100">
                Since 2001, Aaha Felt has been creating premium handcrafted felt products that combine traditional techniques with contemporary designs. Our mission is to preserve heritage craftsmanship while offering sustainable, high-quality pieces for the modern home, soul.
              </p>
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="py-20">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="animate-fade-right">
                <h2 className="text-3xl font-medium mb-6">Our Story</h2>
                <p className="text-foreground/70 mb-6">
                Aaha Felt began in 2001 with a small investment and a big dream—to bring Nepalese felt craftsmanship to the world. As one of the first companies in Nepal to export felt products, we pioneered a path that many would later follow. What started with a few handmade items has now grown into a trusted global brand, with customers across Europe, America, Australia, and Asia.
                </p>
                <p className="text-foreground/70 mb-6">
                From modest beginnings, we've expanded into a full-scale factory employing over 120 skilled staff. More than a workplace, Aaha Felt is a community—providing opportunity, stability, and independence to many women and families. While our reach has grown, our values remain rooted in quality craftsmanship, community empowerment, and a deep respect for the art of felting.
                </p>
                <p className="text-foreground/70">
                  Every piece in our collection tells a story – of heritage techniques passed down through generations, of sustainable materials thoughtfully sourced, and of the skilled hands that transform simple wool into objects of beauty and meaning.
                </p>
              </div>

              <div className="rounded-3xl overflow-hidden h-[500px] w-[500px] relative animate-fade-left ml-auto pl-5">
                <div className="absolute inset-12 z-0 bg-blue-500/10 rounded-2xl blur-[60px]"></div>
                <div className="h-full w-full rounded-3xl overflow-hidden relative z-10 bg-muted/50">
                  <Image
                    src="/leader.webp"
                    alt="our leader"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="py-20 bg-muted">
          <div className="container">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl font-medium mb-6">Our Values</h2>
              <p className="text-foreground/70">
                These core principles guide every aspect of our work – from material sourcing to final production – ensuring that each Felt Artistry piece embodies our commitment to quality, sustainability, and craftsmanship.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {ourValues.map((value, index) => (
                <div
                  key={value.title}
                  className="bg-background rounded-3xl p-8 shadow-sm card-hover-effect animate-fade-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-medium mb-3">{value.title}</h3>
                  <p className="text-foreground/70">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Key Stats */}
        <StatisticsSection />

        {/* Meet the Team */}
        <section id="team" className="py-20">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-medium mb-4">Meet Our Team</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our talented team of artisans and craftspeople bring years of experience and passion to every piece we create.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.map((member) => (
                <div key={member.id} className="bg-card rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                  <div className="relative w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden">
                    <Image
                      src={member.image_url}
                      alt={member.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-medium mb-2">{member.name}</h3>
                    <p className="text-primary mb-4">{member.role}</p>
                    <p className="text-muted-foreground mb-6">{member.bio}</p>
                    {member.social_links && (
                      <div className="flex justify-center space-x-4">
                        {member.social_links.linkedin && (
                          <a href={member.social_links.linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                            </svg>
                          </a>
                        )}
                        {member.social_links.twitter && (
                          <a href={member.social_links.twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                            </svg>
                          </a>
                        )}
                        {member.social_links.instagram && (
                          <a href={member.social_links.instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                            </svg>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Join Our Mission CTA */}
        <section className="py-20 bg-gradient-to-r from-blue-500/20 to-primary/10 rounded-3xl mx-4 sm:mx-8 lg:mx-12 mb-16 overflow-hidden relative">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-[-20%] left-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/20 blur-[60px]"></div>
            <div className="absolute bottom-[-10%] right-[5%] w-[30%] h-[30%] rounded-full bg-primary/20 blur-[50px]"></div>
          </div>

          <div className="container relative z-10">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-3xl font-medium mb-6">Join Our Mission</h2>
              <p className="text-foreground/70 mb-8">
                Whether you're a customer, aspiring artisan, or partner organization, there are many ways to be part of our journey to preserve traditional crafts and promote sustainable living.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button className="rounded-full" asChild>
                  <Link href="/shop">
                    Shop Our Collections
                  </Link>
                </Button>
                <Button variant="outline" className="rounded-full" asChild>
                  <Link href="/contact">
                    <span className="flex items-center">
                      Contact Us <ArrowRight className="ml-2 w-4 h-4" />
                    </span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
