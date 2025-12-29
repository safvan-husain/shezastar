import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Our Story | Sheza Star",
  description: "Learn about SHEZA STAR CAR ACCESSORIES SPS LLC and our journey.",
};

export default function AboutUsPage() {
  return (
    <div className="container mx-auto px-4 py-12 mt-24 max-w-4xl">
      <h1 className="text-3xl font-bold text-[var(--storefront-text-primary)]">
        Our Story
      </h1>

      <div className="mt-6 space-y-4 text-[var(--storefront-text-secondary)] leading-relaxed">
        <p>
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
          ENTERPRISES FZE’s extensive network and experience, SHEZA STAR expanded
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

        <p>
          Our online platform{" "}
          <Link
            href="https://www.shezastar.com"
            className="text-[var(--storefront-text-primary)] underline underline-offset-4 hover:opacity-80"
          >
            www.shezastar.com
          </Link>
          , is a testament to our dedication to convenience and customer
          satisfaction. Designed to be user-friendly, our website allows
          customers to easily browse and purchase the car accessories they need
          from the comfort of their homes, using their phones, tablets, or
          computers. We offer multiple payment options, including credit card
          payments and cash on delivery, to cater to the diverse preferences of
          our clientele.
        </p>

        <p>
          In addition to our vast range of car accessories, SHEZA STAR also
          provides professional auto services. Our skilled technicians and
          state-of-the-art facilities ensure that your vehicle receives the best
          care possible, whether it’s routine maintenance, detailing, or
          installation of accessories.
        </p>

        <p>
          Our commitment to excellence and customer satisfaction has earned us a
          reputation as one of the most comprehensive and reliable online stores
          for car accessories in the region. We are proud to be part of the
          SHEZA ENTERPRISES FZE and continue to uphold its legacy of quality and
          innovation.
        </p>

        <p>
          Join us at SHEZA STAR and experience the difference that passion,
          quality, and dedication can make in your driving experience. No matter
          where you are in the world, we are here to serve you with the best in
          car accessories and services.
        </p>
      </div>
    </div>
  );
}

