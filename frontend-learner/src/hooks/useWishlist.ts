import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addWishlistItem, getWishlist, removeWishlistItem } from "@masterlms/shared";

async function fetchWishlist(): Promise<number[]> {
  try {
    const items = await getWishlist();
    return items.map((i) => i.course.id);
  } catch {
    return [];
  }
}

// Single owner of the ["me", "wishlist"] cache: consumers derive what they
// need (Set, membership checks) instead of each refetching the list.
export function useWishlistIds() {
  return useQuery({ queryKey: ["me", "wishlist"], queryFn: fetchWishlist });
}

type ToggleVars = { courseId: number; wishlisted: boolean };
type ToggleContext = { previous: number[] };

export function useToggleWishlist() {
  const queryClient = useQueryClient();
  return useMutation<boolean, unknown, ToggleVars, ToggleContext>({
    mutationFn: async ({ courseId, wishlisted }) => {
      if (wishlisted) await removeWishlistItem(courseId);
      else await addWishlistItem(courseId);
      return !wishlisted;
    },
    onMutate: async ({ courseId, wishlisted }) => {
      await queryClient.cancelQueries({ queryKey: ["me", "wishlist"] });
      const previous = queryClient.getQueryData<number[]>(["me", "wishlist"]) ?? [];
      queryClient.setQueryData<number[]>(["me", "wishlist"], (current = previous) =>
        wishlisted ? current.filter((id) => id !== courseId) : [...current, courseId],
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context) queryClient.setQueryData(["me", "wishlist"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["me", "wishlist"] });
    },
  });
}
