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
            Describe the expense and why it is needed. It will be submitted under your
            signed-in identity to the three assigned reviewers.
          </p>
        </div>
      </div>

      <div className="sandbox-note">
        All three assigned reviewers must approve. One rejection is final.
        This is a demonstration using fictional expenses; no money moves.
      </div>

      <NewRequestForm />
    </div>
  );
}
