export interface SeedContext {
    dryRun: boolean;
    verbose?: boolean;
    filter?: string;
}

export interface ParsedSeedArgs {
    ctx: SeedContext;
    rest: string[];
    help: boolean;
}

export function parseSeedArgs(argv: string[] = process.argv.slice(2)): ParsedSeedArgs {
    const rest: string[] = [];
    let dryRun = false;
    let verbose = false;
    let help = false;
    let filter: string | undefined;

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];

        if (arg === '--help' || arg === '-h') {
            help = true;
            continue;
        }

        if (arg === '--dry-run' || arg === '--dry' || arg === '-n') {
            dryRun = true;
            continue;
        }

        if (arg === '--verbose' || arg === '-v') {
            verbose = true;
            continue;
        }

        if (arg === '--filter' || arg === '-f') {
            const value = argv[i + 1];
            if (!value || value.startsWith('-')) {
                throw new Error(`Missing value for ${arg}`);
            }
            filter = value;
            i++;
            continue;
        }

        if (arg.startsWith('--filter=')) {
            filter = arg.slice('--filter='.length);
            continue;
        }

        rest.push(arg);
    }

    const normalizedFilter = (filter ?? '').trim();
    return {
        ctx: {
            dryRun,
            verbose,
            filter: normalizedFilter ? normalizedFilter : undefined,
        },
        rest,
        help,
    };
}

export function matchesSeedFilter(ctx: SeedContext, label: string): boolean {
    const filter = (ctx.filter ?? '').trim();
    if (!filter) {
        return true;
    }

    return label.toLowerCase().includes(filter.toLowerCase());
}

type Awaitable<T> = T | Promise<T>;

export async function executeWithLogging<
    TFn extends (...args: any[]) => Promise<any>
>(
    ctx: SeedContext,
    fn: TFn,
    args: Parameters<TFn>,
    options?: {
        formatLog?: (...args: Parameters<TFn>) => string;
        dryRunFallback?: (
            ...args: Parameters<TFn>
        ) => Awaitable<Awaited<ReturnType<TFn>>>;
        logResult?: (
            result: Awaited<ReturnType<TFn>>,
            ...args: Parameters<TFn>
        ) => string;
        logger?: Pick<Console, 'log'>;
    }
): Promise<Awaited<ReturnType<TFn>>> {
    const logger = options?.logger ?? console;
    const message = options?.formatLog?.(...args);

    if (message) {
        logger.log(ctx.dryRun ? `[DRY RUN] ${message}` : message);
    }

    if (ctx.dryRun) {
        if (options?.dryRunFallback) {
            return await options.dryRunFallback(...args);
        }

        return undefined as Awaited<ReturnType<TFn>>;
    }

    try {
        const result = await fn(...args);

        if (ctx.verbose && options?.logResult) {
            const resultMessage = options.logResult(result, ...args);
            if (resultMessage) {
                logger.log(resultMessage);
            }
        }

        return result;
    } catch (error) {
        if (message) {
            throw new Error(`Seed operation failed: ${message}`, { cause: error });
        }
        throw error;
    }
}

function formatDurationMs(ms: number) {
    if (ms < 1000) {
        return `${ms}ms`;
    }

    const seconds = ms / 1000;
    if (seconds < 60) {
        return `${seconds.toFixed(1)}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainderSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainderSeconds}s`;
}

export function printSeedHelp(options?: { scriptName?: string }) {
    const scriptName = options?.scriptName ?? 'seed script';
    console.log(`${scriptName}

Usage:
  npx tsx <script-path> [options]

Options:
  --dry-run, --dry, -n     Preview changes without side effects
  --verbose, -v            Print extra details (optional)
  --filter, -f <value>     Only process matching items (optional)
  --help, -h               Show this help message
`);
}

export function runSeeder(
    name: string,
    seeder: (ctx: SeedContext, rest: string[]) => Promise<void>,
    options?: { argv?: string[]; scriptName?: string }
): void {
    const argv = options?.argv ?? process.argv.slice(2);
    let parsed: ParsedSeedArgs;

    try {
        parsed = parseSeedArgs(argv);
    } catch (error) {
        console.error(error);
        printSeedHelp({ scriptName: options?.scriptName ?? name });
        process.exit(1);
        return;
    }

    const { ctx, rest, help } = parsed;

    if (help) {
        printSeedHelp({ scriptName: options?.scriptName ?? name });
        process.exit(0);
        return;
    }

    const startedAt = Date.now();
    const modeLabel = ctx.dryRun ? ' (dry run)' : '';

    console.log(`Starting ${name}${modeLabel}...`);
    if (ctx.filter) {
        console.log(`Filter: ${ctx.filter}`);
    }

    Promise.resolve()
        .then(() => seeder(ctx, rest))
        .then(() => {
            const duration = formatDurationMs(Date.now() - startedAt);
            console.log(`\n${name} complete (${duration}).`);
            process.exit(0);
        })
        .catch(error => {
            const duration = formatDurationMs(Date.now() - startedAt);
            console.error(`\n${name} failed (${duration}).`);
            console.error(error);
            process.exit(1);
        });
}
