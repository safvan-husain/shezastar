import Link from 'next/link';

export interface BreadcrumbItem {
  id: string;
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className="flex flex-wrap items-center gap-2 text-[var(--text-muted)]">
        <Link
          href={'/'}
          className="text-black transition-colors hover:text-amber-400"
        >Home</Link>
        <span className="text-[var(--text-muted)]">{">"}</span>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.id} className="flex items-center gap-2">

              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-black transition-colors hover:text-amber-400"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="font-medium text-black">{item.label}</span>
              )}
              {!isLast && <span className="text-[var(--text-muted)]">{">"}</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
