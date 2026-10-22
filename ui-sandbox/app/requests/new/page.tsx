import Link from 'next/link';
import NewRequestForm from '@/components/NewRequestForm';

export default function NewRequestPage() {
  return (
    <div className="page">
      <Link className="back-link" href="/">
        ← All requests
      </Link>

      <div className="page-head">
        <div>
          <p className="eyebrow">New request</p>
          <h1>Create a spend request</h1>
          <p className="lede">
            All fields are validated on the client for convenience and validated again by the
            server. The requester is derived from the verified identity, never from this form.
          </p>
        </div>
      </div>

      <div className="sandbox-note">
        <strong>Sandbox behaviour.</strong> The fixture adapter appends the request to an
        in-memory store and returns a new id. A full page reload resets that store to the
        fixtures. No data leaves the browser.
      </div>

      <NewRequestForm />
    </div>
  );
}
