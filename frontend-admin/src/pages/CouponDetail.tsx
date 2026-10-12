import { useParams } from "react-router-dom";
import { CouponFormContainer } from "../containers/CouponForm.container";

export default function CouponDetail() {
  const { id } = useParams<{ id: string }>();
  return <CouponFormContainer existingId={id ?? ""} />;
}
