import type { Metadata } from "next";

const WHATSAPP_E164 = "971504311624";
const WHATSAPP_DISPLAY = "+971 50 431 1624";

export const metadata: Metadata = {
  title: "Contact Us | Sheza Star",
  description:
    "Get in touch with Sheza Star support, headquarters, and branch contact details.",
};

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
      <div className="text-sm font-semibold text-[var(--storefront-text-primary)] sm:w-28">
        {label}
      </div>
      <div className="text-sm text-[var(--storefront-text-secondary)]">
        {children}
      </div>
    </div>
  );
}

function ContactCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-[var(--storefront-border)] bg-[var(--storefront-bg)] p-6 shadow-[var(--storefront-shadow-sm)]">
      <h2 className="text-lg font-semibold text-[var(--storefront-text-primary)]">
        {title}
      </h2>
      <div className="mt-4 space-y-3">{children}</div>
    </section>
  );
}

export default function ContactUsPage() {
  return (
    <div className="container mx-auto px-4 py-12 mt-24 max-w-5xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[var(--storefront-text-primary)]">
            Contact Us
          </h1>
          <p className="mt-2 text-[var(--storefront-text-secondary)]">
            We’re here to help. Reach us by WhatsApp, email, or phone.
          </p>
        </div>

        <a
          href={`https://wa.me/${WHATSAPP_E164}?text=${encodeURIComponent(
            "Hello Sheza Star Support"
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-md bg-[var(--storefront-button-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--storefront-button-primary-hover)] transition-colors"
          aria-label={`Chat on WhatsApp: ${WHATSAPP_DISPLAY}`}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            aria-hidden="true"
            fill="currentColor"
          >
            <path d="M20.52 3.48A11.82 11.82 0 0 0 12.04 0C5.45 0 .09 5.36.09 11.95c0 2.1.55 4.15 1.6 5.96L0 24l6.27-1.64a11.9 11.9 0 0 0 5.77 1.47h.01c6.59 0 11.95-5.36 11.95-11.95 0-3.19-1.24-6.19-3.48-8.4zM12.05 21.7h-.01a9.88 9.88 0 0 1-5.04-1.38l-.36-.21-3.72.97.99-3.63-.23-.37a9.85 9.85 0 0 1-1.52-5.22c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.9 6.99c0 5.46-4.44 9.89-9.9 9.89zm5.74-7.85c-.31-.16-1.84-.91-2.12-1.01-.28-.1-.49-.16-.7.16-.21.31-.8 1.01-.98 1.22-.18.21-.36.23-.67.08-.31-.16-1.31-.48-2.49-1.54-.92-.82-1.54-1.84-1.72-2.15-.18-.31-.02-.48.14-.64.14-.14.31-.36.47-.54.16-.18.21-.31.31-.52.1-.21.05-.39-.03-.54-.08-.16-.7-1.68-.95-2.3-.25-.6-.5-.52-.7-.52h-.6c-.21 0-.54.08-.83.39-.29.31-1.09 1.07-1.09 2.61s1.12 3.03 1.28 3.24c.16.21 2.2 3.35 5.33 4.7.74.32 1.32.51 1.77.65.74.23 1.41.2 1.94.12.59-.09 1.84-.75 2.1-1.48.26-.73.26-1.36.18-1.48-.08-.12-.28-.2-.59-.36z" />
          </svg>
          WhatsApp Chat
        </a>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <ContactCard title="Support">
          <DetailRow label="Email">
            <a
              href="mailto:support@shezastar.com"
              className="underline underline-offset-4 hover:opacity-80"
            >
              support@shezastar.com
            </a>
          </DetailRow>
          <DetailRow label="Mobile">
            <a
              href="tel:+971504311624"
              className="underline underline-offset-4 hover:opacity-80"
            >
              {WHATSAPP_DISPLAY}
            </a>
          </DetailRow>
          <DetailRow label="Landline">
            <a
              href="tel:+97165208398"
              className="underline underline-offset-4 hover:opacity-80"
            >
              +971 6 520 8398
            </a>
          </DetailRow>
        </ContactCard>

        <ContactCard title="Headquarters">
          <DetailRow label="Company">
            <span className="font-semibold text-[var(--storefront-text-primary)]">
              SHEZA ENTERPRISES FZE
            </span>
          </DetailRow>
          <DetailRow label="Address">
            <div>
              Block B B16-157
              <br />
              Sharjah Research Technology and Innovation Park Free Zone Authority
              <br />
              Sharjah, United Arab Emirates
            </div>
          </DetailRow>
          <DetailRow label="Phone">
            <a
              href="tel:+971504311624"
              className="underline underline-offset-4 hover:opacity-80"
            >
              {WHATSAPP_DISPLAY}
            </a>
          </DetailRow>
          <DetailRow label="Email">
            <a
              href="mailto:shezaenterprises786@gmail.com"
              className="underline underline-offset-4 hover:opacity-80"
            >
              shezaenterprises786@gmail.com
            </a>
          </DetailRow>
        </ContactCard>
      </div>

      <div className="mt-6">
        <ContactCard title="Branches">
          <div className="space-y-5">
            <div className="space-y-3">
              <div className="text-sm font-semibold text-[var(--storefront-text-primary)]">
                SHEZA STAR CAR ACCESSORIES SPS LLC
              </div>
              <DetailRow label="Address">
                Sheikh Ammar Road, Al Mwaihat 2, Ajman, UAE
              </DetailRow>
              <DetailRow label="Email">
                <a
                  href="mailto:support@shezastar.com"
                  className="underline underline-offset-4 hover:opacity-80"
                >
                  support@shezastar.com
                </a>
              </DetailRow>
              <DetailRow label="Mobile">
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  <a
                    href="tel:+971502122464"
                    className="underline underline-offset-4 hover:opacity-80"
                  >
                    +971 50 212 2464
                  </a>
                  <span className="text-[var(--storefront-text-muted)]">/</span>
                  <a
                    href="tel:+971504311624"
                    className="underline underline-offset-4 hover:opacity-80"
                  >
                    {WHATSAPP_DISPLAY}
                  </a>
                </div>
              </DetailRow>
              <DetailRow label="Landline">
                <a
                  href="tel:+97165208398"
                  className="underline underline-offset-4 hover:opacity-80"
                >
                  06 520 8398
                </a>
              </DetailRow>
              <DetailRow label="Map">
                <a
                  href="https://google.com/maps?rlz=1C1KNTJ_enAE1059AE1059&sca_esv=c6588870a110159b&um=1&ie=UTF-8&fb=1&gl=ae&sa=X&geocode=KdMIQDFj9_U-MSZ4bqXN_ikE&daddr=Al+Mwaihat+2+-+Ajman"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:opacity-80"
                >
                  Open in Google Maps
                </a>
              </DetailRow>
            </div>
          </div>
        </ContactCard>
      </div>
    </div>
  );
}

