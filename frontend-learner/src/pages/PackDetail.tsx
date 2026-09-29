import { useParams } from "react-router-dom";
import { PackDetailContainer } from "../containers/PackDetail.container";
import { Protected } from "../components/Protected";

export default function PackDetail() {
  const { id } = useParams<{ id: string }>();
  return (
    <Protected>
      <PackDetailContainer packId={id ?? ""} />
    </Protected>
  );
}
