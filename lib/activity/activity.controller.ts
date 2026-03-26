import { catchError } from '@/lib/errors/app-error';
import { ActivityListQuerySchema } from './activity.schema';
import { getActivityLogById, getDashboardAnalytics, listActivityLogs } from './activity.service';

export async function handleListActivityLogs(query: unknown) {
    try {
        const parsed = ActivityListQuerySchema.parse(query);
        const activities = await listActivityLogs(parsed);
        return { status: 200, body: { activities } };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleGetActivityLog(id: string) {
    try {
        const activity = await getActivityLogById(id);
        return { status: 200, body: activity };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleGetDashboardAnalytics() {
    try {
        const analytics = await getDashboardAnalytics();
        return { status: 200, body: analytics };
    } catch (err) {
        return catchError(err);
    }
}
