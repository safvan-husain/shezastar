const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const RETURN_WINDOW_DAYS = 7;

function parseDateInput(value?: Date | string): Date | null {
    if (!value) {
        return null;
    }

    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value;
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function resolveReturnDeliveryDate(input: {
    status?: string;
    shipping?: { lastTrackedAt?: Date | string };
    updatedAt?: Date | string;
}): Date | null {
    const trackedAt = parseDateInput(input.shipping?.lastTrackedAt);
    if (trackedAt) {
        return trackedAt;
    }

    if (input.status === 'DL') {
        return parseDateInput(input.updatedAt);
    }

    return null;
}

export function getReturnWindowState(
    deliveredAtInput?: Date | string | null,
    nowInput: Date | string = new Date(),
) {
    const deliveredAt = parseDateInput(deliveredAtInput ?? undefined);
    const now = parseDateInput(nowInput) ?? new Date();

    if (!deliveredAt) {
        return {
            deliveredAt: null,
            deadlineAt: null,
            daysRemaining: 0,
            isExpired: true,
            canRequestReturn: false,
        };
    }

    const deadlineAt = new Date(deliveredAt.getTime() + RETURN_WINDOW_DAYS * MS_PER_DAY);
    const remainingMs = deadlineAt.getTime() - now.getTime();
    const canRequestReturn = remainingMs > 0;
    const daysRemaining = canRequestReturn
        ? Math.max(1, Math.ceil(remainingMs / MS_PER_DAY))
        : 0;

    return {
        deliveredAt,
        deadlineAt,
        daysRemaining,
        isExpired: !canRequestReturn,
        canRequestReturn,
    };
}
