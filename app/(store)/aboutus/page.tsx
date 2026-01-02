import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Our Story | Sheza Star",
  description: "Learn about SHEZA STAR CAR ACCESSORIES SPS LLC and our journey.",
};

export default function AboutUsPage() {
  return (
    <div className="container mx-auto px-4 py-12 mt-24 max-w-6xl">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-[var(--storefront-text-primary)] mb-4">
          Our Story
        </h1>
        <div className="w-24 h-1 bg-[var(--storefront-text-primary)] mx-auto"></div>
      </div>

      {/* First Section - 3 paragraphs with image on right */}
      <div className="mb-16">
        {/* Desktop layout - side by side */}
        <div className="hidden md:grid md:grid-cols-2 gap-8 items-start">
          <div className="space-y-6 text-[var(--storefront-text-secondary)] leading-relaxed">
            <p className="text-lg">
              SHEZA STAR CAR ACCESSORIES SPS LLC, one of the leading companies in the
              car accessories trading industry, was founded with a clear vision: to
              provide top-quality car accessories and auto services that enhance the
              driving experience. Established under the umbrella of the SHEZA
              ENTERPRISES FZE, which has been a pioneer in various fields since 2022,
              SHEZA STAR quickly grew to become a trusted name in the market.
            </p>
            <p>
              Our journey began in the vibrant city of Sharjah, United Arab Emirates,
              where we set up our headquarters. With the support of SHEZA
              ENTERPRISES FZE's extensive network and experience, SHEZA STAR expanded
              its operations rapidly. Today, we have established a significant
              presence across the region and now sell our products globally,
              delivering exceptional products and services to our valued customers
              worldwide.
            </p>
            <p>
              At SHEZA STAR, we are passionate about cars and committed to offering
              an extensive range of car accessories. Our product lineup includes car
              multimedia systems, parking sensors, interior and exterior accessories,
              care products, and a myriad of other car-related items. We continuously
              strive to source and provide the latest and most innovative products
              to help our customers maintain and enhance their vehicles.
            </p>
          </div>
          <div className="rounded-lg overflow-hidden shadow-[var(--storefront-shadow-lg)]">
            <Image
              src="/about-images/storefront.jpeg"
              alt="SHEZA STAR Storefront"
              width={600}
              height={400}
              className="w-full h-auto object-contain"
            />
          </div>
        </div>

        {/* Mobile layout - stacked with image after first paragraph */}
        <div className="md:hidden space-y-6">
          <p className="text-lg text-[var(--storefront-text-secondary)] leading-relaxed">
            SHEZA STAR CAR ACCESSORIES SPS LLC, one of the leading companies in the
            car accessories trading industry, was founded with a clear vision: to
            provide top-quality car accessories and auto services that enhance the
            driving experience. Established under the umbrella of the SHEZA
            ENTERPRISES FZE, which has been a pioneer in various fields since 2022,
            SHEZA STAR quickly grew to become a trusted name in the market.
          </p>
          
          <div className="rounded-lg overflow-hidden shadow-[var(--storefront-shadow-lg)]">
            <Image
              src="/about-images/storefront.jpeg"
              alt="SHEZA STAR Storefront"
              width={600}
              height={400}
              className="w-full h-auto object-contain"
            />
          </div>

          <div className="space-y-6 text-[var(--storefront-text-secondary)] leading-relaxed">
            <p>
              Our journey began in the vibrant city of Sharjah, United Arab Emirates,
              where we set up our headquarters. With the support of SHEZA
              ENTERPRISES FZE's extensive network and experience, SHEZA STAR expanded
              its operations rapidly. Today, we have established a significant
              presence across the region and now sell our products globally,
              delivering exceptional products and services to our valued customers
              worldwide.
            </p>
            <p>
              At SHEZA STAR, we are passionate about cars and committed to offering
              an extensive range of car accessories. Our product lineup includes car
              multimedia systems, parking sensors, interior and exterior accessories,
              care products, and a myriad of other car-related items. We continuously
              strive to source and provide the latest and most innovative products
              to help our customers maintain and enhance their vehicles.
            </p>
          </div>
        </div>
      </div>

      {/* Second Section - 3 paragraphs with image on left */}
      <div className="grid md:grid-cols-2 gap-8 items-start mb-16">
        <div className="rounded-lg overflow-hidden shadow-[var(--storefront-shadow-lg)] order-2 md:order-1">
          <Image
            src="/about-images/product-showcase-1.jpeg"
            alt="Car Accessories Showcase"
            width={600}
            height={400}
            className="w-full h-80 object-cover"
          />
        </div>
        <div className="space-y-6 text-[var(--storefront-text-secondary)] leading-relaxed order-1 md:order-2">
          <p>
            Our online platform{" "}
            <Link
              href="https://www.shezastar.com"
              className="text-[var(--storefront-text-primary)] underline underline-offset-4 hover:opacity-80 font-medium"
            >
              www.shezastar.com
            </Link>
            , is a testament to our dedication to convenience and customer
            satisfaction. Designed to be user-friendly, our website allows
            customers to easily browse and purchase the car accessories they need
            from the comfort of their homes, using their phones, tablets, or
            computers.
          </p>
          <p>
            We offer multiple payment options, including credit card
            payments and cash on delivery, to cater to the diverse preferences of
            our clientele. Our commitment to providing flexible and secure payment
            methods ensures that customers from all backgrounds can easily access
            our products and services.
          </p>
          <p>
            In addition to our vast range of car accessories, SHEZA STAR also
            provides professional auto services. Our skilled technicians and
            state-of-the-art facilities ensure that your vehicle receives the best
            care possible, whether it's routine maintenance, detailing, or
            installation of accessories.
          </p>
        </div>
      </div>

      {/* Third Section - 2 paragraphs with image on right */}
      <div className="grid md:grid-cols-2 gap-8 items-start mb-16">
        <div className="space-y-6 text-[var(--storefront-text-secondary)] leading-relaxed">
          <p>
            Our commitment to excellence and customer satisfaction has earned us a
            reputation as one of the most comprehensive and reliable online stores
            for car accessories in the region. We are proud to be part of the
            SHEZA ENTERPRISES FZE and continue to uphold its legacy of quality and
            innovation.
          </p>
          <p className="text-lg font-medium text-[var(--storefront-text-primary)]">
            Join us at SHEZA STAR and experience the difference that passion,
            quality, and dedication can make in your driving experience. No matter
            where you are in the world, we are here to serve you with the best in
            car accessories and services.
          </p>
        </div>
        <div className="rounded-lg overflow-hidden shadow-[var(--storefront-shadow-lg)]">
          <Image
            src="/about-images/product-showcase-2.jpeg"
            alt="Premium Car Accessories"
            width={600}
            height={400}
            className="w-full h-80 object-cover"
          />
        </div>
      </div>

      {/* Certificate Section */}
      <div className="pt-12 border-t border-[var(--storefront-border)]">
        <div className="text-center">
          <h3 className="text-2xl font-semibold text-[var(--storefront-text-primary)] mb-8">
            Our Certification
          </h3>
          <div className="flex justify-center">
            <div className="bg-[var(--storefront-bg)] p-6 rounded-lg shadow-[var(--storefront-shadow-lg)] max-w-2xl">
              <Image
                src="/about-images/certificate.png"
                alt="SHEZA STAR Business Certificate"
                width={800}
                height={600}
                className="w-full h-auto rounded-md"
              />
            </div>
          </div>
          <p className="mt-4 text-[var(--storefront-text-secondary)] text-sm">
            Official business certification and licensing documentation
          </p>
        </div>
      </div>
    </div>
  );
}