import Image from "next/image";
import Link from "next/link";
import type { CustomCard } from "@/lib/app-settings/app-settings.schema";

type CardViewProps = {
  cards: CustomCard[];
};

export function CardView({ cards }: CardViewProps) {
  if (cards.length === 0) return null;

  // Single card layout - horizontal full width
  if (cards.length === 1) {
    return (
      <div className="w-full">
        <CardItem card={cards[0]} layout="horizontal" />
      </div>
    );
  }

  // Two cards layout - even split
  if (cards.length === 2) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CardItem card={cards[0]} layout="vertical" />
        <CardItem card={cards[1]} layout="vertical" />
      </div>
    );
  }

  // Three cards layout - 30% vertical + 70% two horizontal stacked
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[30%_70%] gap-4">
      <CardItem card={cards[0]} layout="vertical" />
      <div className="grid grid-cols-1 gap-4">
        <CardItem card={cards[1]} layout="horizontal" />
        <CardItem card={cards[2]} layout="horizontal" />
      </div>
    </div>
  );
}

type CardItemProps = {
  card: CustomCard;
  layout: "horizontal" | "vertical";
};

function CardItem({ card, layout }: CardItemProps) {
  const isHorizontal = layout === "horizontal";

  return (
    <Link
      href={card.urlLink}
      className={`
        group relative overflow-hidden rounded-lg 
        border border-[var(--storefront-border)] hover:shadow-lg transition-all
        ${isHorizontal ? "min-h-[250px]" : "min-h-[400px]"}
      `}
    >
      {/* Background Image */}
      <Image
        src={card.imagePath}
        alt={card.title}
        fill
        className="object-cover group-hover:scale-105 transition-transform duration-300"
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />

      {/* Content Section */}
      <div className="relative h-full flex flex-col justify-end p-6 text-white">
        {/* Offer Label */}
        <span className="inline-block w-fit px-3 py-1 mb-3 text-xs font-semibold bg-yellow-400 text-black rounded">
          {card.offerLabel}
        </span>

        {/* Title */}
        <h3 className="text-xl md:text-2xl font-bold mb-2">
          {card.title}
        </h3>

        {/* Subtitle */}
        <p className="text-sm text-gray-200 mb-4">
          {card.subtitle}
        </p>

        {/* CTA */}
        <div className="flex items-center text-sm font-semibold group-hover:text-yellow-400 transition-colors">
          Shop Now
          <svg
            className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
