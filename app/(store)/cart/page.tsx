import { ErrorToastHandler, type ToastErrorPayload } from "@/components/ErrorToastHandler";
import { CartPageContent } from "./components/CartPageContent";
import { getCartForCurrentSession } from "@/lib/cart";
import { getProduct } from "@/lib/product/product.service";
import type { Product } from "@/lib/product/model/product.model";
import { AppError } from "@/lib/errors/app-error";

type ProductsById = Record<string, Product | null>;

function buildErrorPayload(error: unknown, overrides?: Partial<ToastErrorPayload>): ToastErrorPayload {
  if (error instanceof AppError) {
    return {
      message: error.message || error.code,
      status: error.status,
      body: { code: error.code, details: error.details },
      method: overrides?.method ?? "GET",
      url: overrides?.url,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      status: overrides?.status ?? 500,
      body: { stack: error.stack },
      method: overrides?.method ?? "GET",
      url: overrides?.url,
    };
  }

  return {
    message: "Unknown error while loading cart",
    status: overrides?.status ?? 500,
    body: { error },
    method: overrides?.method ?? "GET",
    url: overrides?.url,
  };
}

export default async function CartPage() {
  let cartError: ToastErrorPayload | null = null;
  const productErrors: ToastErrorPayload[] = [];
  let productsById: ProductsById = {};

  const cart = await getCartForCurrentSession().catch((error) => {
    cartError = buildErrorPayload(error, {
      method: "GET",
      url: "service:cart:getCartForCurrentSession",
    });
    return null;
  });

  if (cart && cart.items.length > 0) {
    const uniqueProductIds = Array.from(new Set(cart.items.map((item) => item.productId)));

    const entries = await Promise.all(
      uniqueProductIds.map(async (productId) => {
        try {
          const product = await getProduct(productId);
          return [productId, product] as const;
        } catch (error) {
          productErrors.push(
            buildErrorPayload(error, {
              method: "GET",
              url: `service:product:getProduct:${productId}`,
            })
          );
          return [productId, null] as const;
        }
      })
    );

    productsById = Object.fromEntries(entries);
  }

  return (
    <div className="container mx-auto px-4 py-12 mt-24 max-w-5xl">
      {cartError && <ErrorToastHandler error={cartError} />}
      {productErrors.map((error, index) => (
        <ErrorToastHandler key={index} error={error} />
      ))}

      <h1 className="text-3xl font-bold text-[var(--storefront-text-primary)] mb-6">
        Your Cart
      </h1>

      <CartPageContent initialCart={cart} productsById={productsById} />
    </div>
  );
}

