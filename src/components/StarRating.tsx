interface Props {
  score: number | null;
  reviews: number | null;
}

function formatReviews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export default function StarRating({ score, reviews }: Props) {
  if (score === null) {
    return <span className="text-slate-400 text-sm">—</span>;
  }

  const filled = Math.round(score);

  return (
    <div className="flex flex-col items-start gap-0.5">
      <div className="flex items-center gap-0.5" aria-label={`${score} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <svg
            key={i}
            className={`w-4 h-4 ${i <= filled ? "text-green-500" : "text-slate-200"}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="text-sm font-semibold text-slate-700 ml-1">{score.toFixed(1)}</span>
      </div>
      {reviews !== null && (
        <span className="text-xs text-slate-400">{formatReviews(reviews)} reviews</span>
      )}
    </div>
  );
}
