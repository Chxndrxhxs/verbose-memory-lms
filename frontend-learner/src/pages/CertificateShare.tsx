import { useParams } from "react-router-dom";
import { CertificateShareContainer } from "../containers/CertificateShare.container";

export default function CertificateShare() {
  const { certificateId } = useParams<{ certificateId: string }>();
  return <CertificateShareContainer certificateId={certificateId ?? ""} />;
}
