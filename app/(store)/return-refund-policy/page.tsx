import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Return & Refund Policy | Sheza Star",
  description: "Review return, refund, and exchange policies for Sheza Star.",
};

export default function ReturnRefundPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 mt-24 max-w-4xl">
      <h1 className="text-3xl font-bold text-[var(--storefront-text-primary)]">
        Return &amp; Refund Policy
      </h1>

      <div className="mt-6 space-y-6 text-[var(--storefront-text-secondary)] leading-relaxed">
        <p>
          Items shipped from Shezastar.com within the UAE can be returned within
          7 days of receipt of shipment in most cases. Some products have
          different policies or requirements associated with them.
        </p>
        <p>
          For any electronic item with installation once installed can&#39;t
          change or return if device working as well. For fixing window film for
          car, home or office, in case customer decide to remove after it was
          installed on that case customer cannot refund the payment back.
        </p>
        <p>
          After the courier has received your item, it can take time to process
          the return. After the return is processed it may take 5 to 7 business
          days for the refund to show on your payment card statement.
        </p>
        <p>
          In most cases, items shipped from shezastar.com outside UAE can be
          returned within 15 to 30 days of receipt of shipment in most cases.
          Some products have different policies or requirements associated with
          them.
        </p>
        <p>
          International shipment items can take two to four weeks for an item to
          reach us once you return it. Once we received the item, allow for up
          to two business days for us to process your return. After the return
          is processed it may take 5 to 7 business days for the refund to show
          up depending on the refund method you chose. The amount will be
          refunded in your bank statement.
        </p>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-[var(--storefront-text-primary)]">
            Wrong Product Issues
          </h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>
              Send E-mail to our Customer Service{" "}
              <a
                href="mailto:info@shezastar.com"
                className="text-[var(--storefront-text-primary)] underline underline-offset-4 hover:opacity-80"
              >
                info@shezastar.com
              </a>
              .
            </li>
            <li>Upload your product picture or video to further describe the problem.</li>
            <li>Our Customer Service confirms.</li>
            <li>Provide you with the best solution.</li>
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-[var(--storefront-text-primary)]">
            Policy Exclusions
          </h2>
          <p>Products are not covered by our 30 day return and refund policy if:</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>The product is not distributed by SHEZA STAR CAR ACCESSORIES SPS LLC.</li>
            <li>The product has been worn, damaged or contaminated.</li>
            <li>The product has been stored or exposed to extreme environments.</li>
            <li>
              Unauthorized repair, misuse, negligence, abuse, accident,
              alteration or improper installation.
            </li>
            <li>Partial goods of a complete sets are be returned.</li>
            <li>The claim is made more than 30 days after your received the item.</li>
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-[var(--storefront-text-primary)]">
            Return Process
          </h2>
          <ol className="list-decimal pl-6 space-y-4">
            <li className="space-y-2">
              <p>Please include the following information in the return package:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Order number and Name of the Product that you want to return.</li>
                <li>Shipping label (outside the package).</li>
                <li>Reasons for return.</li>
              </ul>
              <p>
                Note: As for the reasons for return, please send E-mail and show
                the item problems to us, for example, show the pictures or
                videos of the item(s) quality-related issue to us by E-mail. We
                will refund you after we have received your package, inspected
                and confirmed it.
              </p>
            </li>
            <li className="space-y-2">
              <p>Return fee</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  If the return is caused by the consumer, consumer should be
                  responsible for the shipping fee. The specific fee should be
                  based on the express company you choose.
                </li>
                <li>
                  If due to our reasons, the goods received are damaged or not
                  correct, the consumer is not required to bear the shipping fee
                  for this reason.
                </li>
                <li>No restocking fee to be charged to the consumers for the return of a product.</li>
              </ul>
            </li>
            <li>
              <p>
                Return Address: Please contact us before returning any item for
                a refund. We will not accept items sent back unless you have
                already been arranged to return it to us. Before you ship the
                item back to us, please E-mail our Customer Service to confirm
                the correct address.
              </p>
            </li>
          </ol>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-[var(--storefront-text-primary)]">
            Wrong Product Issues (Support)
          </h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>
              Send E-mail to our Customer Service{" "}
              <a
                href="mailto:info@shezastar.com"
                className="text-[var(--storefront-text-primary)] underline underline-offset-4 hover:opacity-80"
              >
                info@shezastar.com
              </a>
              .
            </li>
            <li>Upload your product picture or video to further describe the problem.</li>
            <li>Our Customer Service confirms.</li>
            <li>Provide you with the best solution.</li>
          </ol>
          <p>
            Therefore in terms of customer support and technical support for
            products, we will try our best to offer as much help to you as we
            can. While as for technical questions, it may simply be a matter of
            replaying our information to you, and satisfaction guaranteed.
          </p>
        </section>
      </div>
    </div>
  );
}
