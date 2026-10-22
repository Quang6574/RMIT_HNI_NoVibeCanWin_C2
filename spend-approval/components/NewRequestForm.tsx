'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useSpendApi } from '@/lib-ui/use-spend-api';
import type { ApiFailure } from '@/lib-ui/api-client';
import ApiErrorNotice from './ApiErrorNotice';
import { parseAmountToMinor } from '@/lib-ui/amount';
import { useDemoSession } from './SessionProvider';

export default function NewRequestForm() {
  const demo = useDemoSession();
  const api = useSpendApi();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [businessReason, setBusinessReason] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [apiError, setApiError] = useState<ApiFailure | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setApiError(null);

    const nextErrors: string[] = [];
    const trimmedTitle = title.trim();
    const trimmedCategory = category.trim();
    const trimmedReason = businessReason.trim();
    const amountMinor = parseAmountToMinor(amount);

    if (!trimmedTitle) nextErrors.push('Title is required.');
    else if (trimmedTitle.length > 120) nextErrors.push('Title must be 120 characters or fewer.');

    if (!amount.trim()) nextErrors.push('Amount is required.');
    else if (amountMinor === null) {
      nextErrors.push(
        'Amount must be between $0.01 and $1,000,000.00, with at most two decimal places (for example 1250.00).',
      );
    }

    if (!trimmedCategory) nextErrors.push('Category is required.');
    else if (trimmedCategory.length > 60) {
      nextErrors.push('Category must be 60 characters or fewer.');
    }

    if (!trimmedReason) nextErrors.push('Business reason is required.');
    else if (trimmedReason.length > 500) {
      nextErrors.push('Business reason must be 500 characters or fewer.');
    }

    if (nextErrors.length > 0 || amountMinor === null) {
      setErrors(nextErrors);
      return;
    }

    setErrors([]);
    setSubmitting(true);

    const result = await api.createRequest({
      title: trimmedTitle,
      amountMinor,
      currency: 'USD',
      category: trimmedCategory,
      businessReason: trimmedReason,
    });

    setSubmitting(false);

    if (result.ok) {
      router.push(`/requests/${encodeURIComponent(result.data.id)}`);
      return;
    }

    setApiError(result);
  }

  return (
    <form className="new-request-form" onSubmit={(event) => void onSubmit(event)} noValidate>
      {apiError ? <ApiErrorNotice error={apiError} context="Create request" /> : null}

      {errors.length > 0 ? (
        <div className="form-errors" role="alert">
          <strong>Check these fields:</strong>
          <ul>
            {errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="form-grid">
        <label className="form-field form-field-wide" htmlFor="request-title">
          Title
          <input
            id="request-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={120}
            placeholder="Laptop replacement for the design team"
            aria-invalid={errors.some((error) => error.startsWith('Title'))}
          />
          <span className="field-hint">{title.length}/120</span>
        </label>

        <label className="form-field" htmlFor="request-amount">
          Amount (USD)
          <input
            id="request-amount"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            placeholder="1250.00"
            aria-invalid={errors.some((error) => error.startsWith('Amount'))}
          />
          <span className="field-hint">Between $0.01 and $1,000,000.00</span>
        </label>

        <label className="form-field" htmlFor="request-currency">
          Currency
          <select id="request-currency" value="USD" disabled>
            <option value="USD">USD</option>
          </select>
          <span className="field-hint">USD only</span>
        </label>

        <label className="form-field" htmlFor="request-category">
          Category
          <input
            id="request-category"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            maxLength={60}
            placeholder="Equipment"
            aria-invalid={errors.some((error) => error.startsWith('Category'))}
          />
          <span className="field-hint">{category.length}/60</span>
        </label>

        <label className="form-field form-field-wide" htmlFor="request-reason">
          Business reason
          <textarea
            id="request-reason"
            value={businessReason}
            onChange={(event) => setBusinessReason(event.target.value)}
            rows={5}
            maxLength={500}
            placeholder="Explain why this spend is needed and what happens without it."
            aria-invalid={errors.some((error) => error.startsWith('Business reason'))}
          />
          <span className="field-hint">{businessReason.length}/500</span>
        </label>
      </div>

      <div className="form-requester-note">
        <strong>Requester is not editable.</strong> The API assigns the requester from your{' '}
        {demo ? 'selected demo identity' : 'verified Tide identity'}. After submission, the amount, reason and reviewers are fixed.
      </div>

      <div className="form-actions">
        <button className="btn btn-primary" type="submit" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create request'}
        </button>
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() => router.push('/')}
          disabled={submitting}
        >
          Cancel
        </button>
        <span className="form-note">
          All three reviewers must approve.
        </span>
      </div>
    </form>
  );
}
