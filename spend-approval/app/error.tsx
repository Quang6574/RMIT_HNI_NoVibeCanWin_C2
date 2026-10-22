'use client';
export default function ErrorPage({ retry }: { retry: () => void }) {
  return <div className="page" role="alert"><h1>This page could not load</h1>
    <p>Your saved requests remain on the server. Retry, or return to the request list.</p>
    <button className="btn btn-primary" onClick={retry}>Try again</button>{' '}
    <a className="text-link" href="/">All requests</a>
  </div>;
}
