import AdminLoginForm from './components/AdminLoginForm';

export default function AdminLoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--bg-base)] text-[var(--text-primary)]">
            <div className="w-full max-w-md rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-8 shadow-lg">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold">Admin login</h1>
                    <p className="text-[var(--text-secondary)]">
                        Use the seeded admin password to continue. Only the password is required.
                    </p>
                </div>
                <AdminLoginForm />
            </div>
        </div>
    );
}
