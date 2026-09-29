import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  ApiError,
  claimFreePack,
  createPaymentOrder,
  getPackDetail,
  startPackAttempt,
  verifyPayment,
  type ExamModule,
} from "@masterlms/shared";
import { useAuth } from "../hooks/useAuth";
import { loadRazorpayScript } from "../lib/razorpay";
import { PackDetailView } from "../components/PackDetailView";

function isPurchaseRequired(error: unknown): error is ApiError {
  return (
    error instanceof ApiError &&
    typeof error.payload === "object" &&
    error.payload !== null &&
    (error.payload as { error?: { code?: string } }).error?.code === "purchase_required"
  );
}

export function PackDetailContainer({ packId }: { packId: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuth((s) => s.user);
  const [selectedModule, setSelectedModule] = useState<ExamModule>("mock");
  const [needsPurchase, setNeedsPurchase] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["pack-detail", packId],
    queryFn: () => getPackDetail(Number(packId)),
  });
  const pack = query.data;
  const module: ExamModule =
    pack?.modules.some((m) => m.code === selectedModule) === true
      ? selectedModule
      : (pack?.modules[0]?.code ?? "mock");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["pack-detail", packId] });
    queryClient.invalidateQueries({ queryKey: ["packs"] });
    queryClient.invalidateQueries({ queryKey: ["my-packs"] });
  };

  const start = useMutation({
    mutationFn: () => startPackAttempt(Number(packId), module),
    onSuccess: (result) => {
      setNeedsPurchase(false);
      queryClient.setQueryData(["assignment-attempt", result.attempt.id], result);
      navigate(`/assignments/take/${result.attempt.id}`);
    },
    onError: (e) => {
      if (isPurchaseRequired(e)) {
        setNeedsPurchase(true);
        showToast("Buy this package to start.");
        return;
      }
      const payload = (e as ApiError).payload as { error?: { code?: string } } | undefined;
      showToast(
        payload?.error?.code === "attempts_exhausted"
          ? "No attempts left in this package."
          : String(e),
      );
    },
  });

  const claim = useMutation({
    mutationFn: () => claimFreePack(Number(packId)),
    onSuccess: () => {
      refresh();
      showToast("Package added! Pick a module and start.");
    },
    onError: (e) => showToast(String(e)),
  });

  const mockVerify = useMutation({
    mutationFn: (orderId: string) =>
      verifyPayment({
        razorpay_order_id: orderId,
        razorpay_payment_id: `pay_mock_${Date.now()}`,
        razorpay_signature: "mock_signature",
        pack_id: Number(packId),
      }),
    onSuccess: () => {
      refresh();
      showToast("Payment successful! Pick a module and start.");
    },
    onError: (e) => showToast(String(e)),
  });

  const buying = mockVerify.isPending;

  const handleBuy = async () => {
    if (!pack || buying) return;
    try {
      const order = await createPaymentOrder({ pack_id: Number(packId) });
      if (order.free || order.owned || order.already_owned) {
        refresh();
        showToast(order.already_owned ? "Already owned." : "Package added!");
        return;
      }
      const loaded = await loadRazorpayScript();
      if (!loaded) throw new Error("Failed to load Razorpay");
      if (order.mock) {
        showToast("Test mode: confirming payment…");
        mockVerify.mutate(order.order_id);
        return;
      }
      await new Promise<void>((resolve, reject) => {
        const rzp = new window.Razorpay({
          key: order.key_id,
          amount: order.amount,
          currency: order.currency,
          name: "QTNXT",
          description: pack.title,
          order_id: order.order_id,
          handler: async (res) => {
            try {
              await verifyPayment({ ...res, pack_id: Number(packId) });
              refresh();
              showToast("Payment successful! Pick a module and start.");
              resolve();
            } catch (e) {
              showToast(String(e));
              reject(e);
            }
          },
          prefill: {
            name: user?.name || "",
            email: user?.email || "",
            contact: user?.mobile || "",
          },
          theme: { color: "#0f172a" },
          modal: {
            ondismiss: () => {
              showToast("Payment cancelled");
              reject(new Error("Payment cancelled"));
            },
          },
        });
        rzp.open();
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg !== "Payment cancelled") showToast(msg);
    }
  };

  return (
    <PackDetailView
      pack={pack}
      isLoading={query.isLoading}
      error={query.error as Error | null}
      selectedModule={module}
      onSelectModule={setSelectedModule}
      onClaim={() => claim.mutate()}
      onBuy={handleBuy}
      onStart={() => start.mutate()}
      claiming={claim.isPending}
      buying={buying}
      starting={start.isPending}
      needsPurchase={needsPurchase}
      toast={toast}
    />
  );
}
