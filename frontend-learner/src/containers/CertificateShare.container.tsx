import { useQuery } from "@tanstack/react-query";
import { CertificateView } from "../components/CertificateView";
import { api } from "../lib/api";

type Certificate = {
  certificate_id: string;
  learner_name: string;
  course: { title: string };
  enrolled_at: string;
  issued_at: string;
};

async function fetchCertificate(certificateId: string): Promise<Certificate> {
  return api<Certificate>(`/certificates/${certificateId}/`, { auth: false });
}

export function CertificateShareContainer({ certificateId }: { certificateId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["certificate-share", certificateId],
    queryFn: () => fetchCertificate(certificateId),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-room">
        <p className="text-sm text-ink-muted">Loading certificate…</p>
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-room px-4">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold text-ink">Certificate not found</h1>
          <p className="mt-3 text-sm text-ink-muted">
            This link may be mistyped, or the certificate it points to no longer
            exists.
          </p>
        </div>
      </div>
    );
  }

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  return (
    <div className="min-h-screen bg-room px-4 py-10">
      <CertificateView
        standalone
        learnerName={data.learner_name}
        courseTitle={data.course.title}
        enrolledLabel={fmt(data.enrolled_at)}
        issuedLabel={fmt(data.issued_at)}
        certificateId={data.certificate_id}
        onClose={() => undefined}
      />
    </div>
  );
}
