import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import Image from "next/image";
import { Separator } from "@/components/ui/separator";

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-secondary py-16">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl font-bold mb-6">Our Story</h1>
                <p className="text-lg text-muted-foreground">
                  Felt Artistry was born from a passion for traditional crafts
                  and a desire to create beautiful, sustainable products that bring
                  warmth and character to homes around the world.
                </p>
              </div>
              <div className="relative h-96 rounded-lg overflow-hidden bg-white p-12 flex items-center justify-center">
                <Image
                  src="/product1.svg"
                  alt="Person crafting felt products"
                  width={300}
                  height={300}
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Our Mission */}
        <section className="py-16">
          <div className="container">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl font-bold mb-6">Our Mission</h2>
              <p className="text-lg text-muted-foreground">
                At Felt Artistry, we're dedicated to preserving and celebrating the art of feltmaking.
                We create handcrafted products that honor traditions while embracing modern design sensibilities.
                Every item in our collection is made with care, using sustainable materials and environmentally
                friendly practices.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-secondary p-8 rounded-lg text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                    <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium mb-3">Quality Craftsmanship</h3>
                <p className="text-muted-foreground">
                  Each piece is carefully handcrafted using traditional techniques and only the finest materials.
                </p>
              </div>

              <div className="bg-secondary p-8 rounded-lg text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <path d="M6 3h12l4 6-10 13L2 9Z" />
                    <path d="M11 3 8 9l4 13 5-13-3-6" />
                    <path d="M2 9h20" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium mb-3">Sustainable Practices</h3>
                <p className="text-muted-foreground">
                  We use responsibly sourced wool and eco-friendly dyes to create products with minimal environmental impact.
                </p>
              </div>

              <div className="bg-secondary p-8 rounded-lg text-center">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-primary"
                  >
                    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                    <path d="m9 12 2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium mb-3">Unique Designs</h3>
                <p className="text-muted-foreground">
                  Our designs blend timeless aesthetics with contemporary styles to create pieces that are both beautiful and functional.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Meet the Team */}
        <section className="py-16 bg-muted">
          <div className="container">
            <h2 className="text-3xl font-bold mb-12 text-center">Meet Our Artisans</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-background p-6 rounded-lg shadow text-center">
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full bg-neutral-200"></div>
                </div>
                <h3 className="text-xl font-medium mb-2">Emma Thompson</h3>
                <p className="text-primary font-medium mb-4">Founder & Lead Designer</p>
                <p className="text-muted-foreground text-sm">
                  Emma has been working with felt for over 15 years and founded Felt Artistry in 2018.
                  She oversees all design and production.
                </p>
              </div>

              <div className="bg-background p-6 rounded-lg shadow text-center">
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full bg-neutral-200"></div>
                </div>
                <h3 className="text-xl font-medium mb-2">James Wilson</h3>
                <p className="text-primary font-medium mb-4">Master Craftsman</p>
                <p className="text-muted-foreground text-sm">
                  James specializes in intricate feltwork and brings his expertise in traditional craft techniques to every piece.
                </p>
              </div>

              <div className="bg-background p-6 rounded-lg shadow text-center">
                <div className="relative w-32 h-32 mx-auto mb-6">
                  <div className="absolute inset-0 rounded-full bg-neutral-200"></div>
                </div>
                <h3 className="text-xl font-medium mb-2">Sophia Chen</h3>
                <p className="text-primary font-medium mb-4">Textile Artist</p>
                <p className="text-muted-foreground text-sm">
                  Sophia's background in fine arts brings a fresh perspective to our designs, creating unique patterns and color combinations.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Process */}
        <section className="py-16">
          <div className="container">
            <h2 className="text-3xl font-bold mb-12 text-center">Our Process</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-16">
              <div className="order-2 md:order-1">
                <h3 className="text-2xl font-medium mb-4">Material Selection</h3>
                <p className="text-muted-foreground mb-6">
                  We source the highest quality wool from responsible farmers who prioritize animal welfare.
                  Our felt is made from 100% wool or wool blended with other natural fibers for specific
                  applications. We use natural, eco-friendly dyes to create our vibrant color palette.
                </p>
                <p className="text-muted-foreground">
                  Each batch of material is carefully inspected to ensure it meets our standards before
                  it becomes part of our beautiful creations.
                </p>
              </div>
              <div className="relative h-80 rounded-lg overflow-hidden order-1 md:order-2 bg-white p-12 flex items-center justify-center">
                <Image
                  src="/product2.svg"
                  alt="Material selection process"
                  width={250}
                  height={250}
                  className="object-contain"
                />
              </div>
            </div>

            <Separator className="my-16" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="relative h-80 rounded-lg overflow-hidden bg-white p-12 flex items-center justify-center">
                <Image
                  src="/product3.svg"
                  alt="Feltmaking process"
                  width={250}
                  height={250}
                  className="object-contain"
                />
              </div>
              <div>
                <h3 className="text-2xl font-medium mb-4">Crafting Process</h3>
                <p className="text-muted-foreground mb-6">
                  Each piece begins with careful planning and design. We then use a combination of traditional
                  wet felting and needle felting techniques to transform the raw wool into beautiful, durable
                  products. This process involves patience, skill, and attention to detail.
                </p>
                <p className="text-muted-foreground">
                  Our artisans add personal touches to each item, ensuring that no two pieces are exactly alike.
                  This handcrafted approach results in products with character and soul.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
