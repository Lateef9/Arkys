type PatientPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PatientPage({ params }: PatientPageProps) {
  const { id } = await params;

  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold">Patient</h2>
      <p className="text-[var(--muted)]">
        Phase 1 placeholder for patient <code>{id}</code>. Full clinical view
        arrives in Phase 8.
      </p>
    </section>
  );
}
