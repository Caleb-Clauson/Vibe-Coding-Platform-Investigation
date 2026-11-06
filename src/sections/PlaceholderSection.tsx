interface PlaceholderSectionProps {
  title: string;
  description: string;
  readingCount: number;
}

export function PlaceholderSection({ title, description, readingCount }: PlaceholderSectionProps) {
  return (
    <section className="placeholder-card" aria-labelledby="placeholder-heading">
      <span className="badge">Coming in a later version</span>
      <h2 id="placeholder-heading">{title}</h2>
      <p>{description}</p>
      <p className="placeholder-note">
        This section can already access the {readingCount} reading{readingCount === 1 ? '' : 's'} in
        the shared survey data.
      </p>
    </section>
  );
}
