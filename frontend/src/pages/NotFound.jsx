import { Link } from "react-router";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center tf-bg-app px-6">
      <div className="w-full max-w-md rounded-2xl tf-card-elevated p-8 text-center sm:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.2em] tf-text-accent">
          404
        </p>
        <h1 className="mt-3 text-3xl font-bold tf-text">Page not found</h1>
        <p className="mt-3 text-sm leading-6 tf-text-muted">
          The page you requested does not exist or may have moved.
        </p>
        <Link to="/" className="tf-btn-base tf-btn-primary mt-7">
          Go to Home
        </Link>
      </div>
    </main>
  );
}
