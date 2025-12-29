const WHATSAPP_E164 = "971504311624";
const WHATSAPP_DISPLAY = "+971 50 431 1624";

export function WhatsAppFloatingButton() {
  return (
    <a
      href={`https://wa.me/${WHATSAPP_E164}?text=${encodeURIComponent(
        "Hello Sheza Star Support"
      )}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-[110] inline-flex h-14 w-14 items-center justify-center rounded-full bg-[var(--storefront-button-primary)] text-white shadow-[var(--storefront-shadow-lg)] hover:bg-[var(--storefront-button-primary-hover)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--storefront-text-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--storefront-bg)]"
      aria-label={`Chat on WhatsApp: ${WHATSAPP_DISPLAY}`}
      title="Chat on WhatsApp"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-7 w-7"
        aria-hidden="true"
        fill="currentColor"
      >
        <path d="M20.52 3.48A11.82 11.82 0 0 0 12.04 0C5.45 0 .09 5.36.09 11.95c0 2.1.55 4.15 1.6 5.96L0 24l6.27-1.64a11.9 11.9 0 0 0 5.77 1.47h.01c6.59 0 11.95-5.36 11.95-11.95 0-3.19-1.24-6.19-3.48-8.4zM12.05 21.7h-.01a9.88 9.88 0 0 1-5.04-1.38l-.36-.21-3.72.97.99-3.63-.23-.37a9.85 9.85 0 0 1-1.52-5.22c0-5.45 4.44-9.89 9.9-9.89 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.9 6.99c0 5.46-4.44 9.89-9.9 9.89zm5.74-7.85c-.31-.16-1.84-.91-2.12-1.01-.28-.1-.49-.16-.7.16-.21.31-.8 1.01-.98 1.22-.18.21-.36.23-.67.08-.31-.16-1.31-.48-2.49-1.54-.92-.82-1.54-1.84-1.72-2.15-.18-.31-.02-.48.14-.64.14-.14.31-.36.47-.54.16-.18.21-.31.31-.52.1-.21.05-.39-.03-.54-.08-.16-.7-1.68-.95-2.3-.25-.6-.5-.52-.7-.52h-.6c-.21 0-.54.08-.83.39-.29.31-1.09 1.07-1.09 2.61s1.12 3.03 1.28 3.24c.16.21 2.2 3.35 5.33 4.7.74.32 1.32.51 1.77.65.74.23 1.41.2 1.94.12.59-.09 1.84-.75 2.1-1.48.26-.73.26-1.36.18-1.48-.08-.12-.28-.2-.59-.36z" />
      </svg>
    </a>
  );
}

