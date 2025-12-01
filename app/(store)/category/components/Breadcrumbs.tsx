import Link from 'next/link';

export interface BreadcrumbItem {
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
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)] hover:underline underline-offset-4"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="font-medium text-[var(--text-primary)]">{item.label}</span>
              )}
              {!isLast && <span className="text-[var(--text-muted)]">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
