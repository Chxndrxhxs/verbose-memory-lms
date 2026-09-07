import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import type { AdminUser, AdminUserDetail } from "../types/admin";
import { UserDetailView } from "../components/UserDetailView";

export type UserEditValues = {
  first_name: string;
  last_name: string;
  email: string;
  role: AdminUser["role"];
  city: string;
  age: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  is_mobile_verified: boolean;
};

function toForm(u: AdminUser): UserEditValues {
  return {
    first_name: u.first_name,
    last_name: u.last_name,
    email: u.email,
    role: u.role,
    city: u.city,
    age: u.age === null ? "" : String(u.age),
    is_active: u.is_active,
    is_staff: u.is_staff,
    is_superuser: u.is_superuser,
    is_mobile_verified: u.is_mobile_verified,
  };
}

export function UserDetailContainer() {
  const { id } = useParams();
  const qc = useQueryClient();
  const nav = useNavigate();
  const uid = Number(id);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin", "user", uid],
    queryFn: () => api<AdminUserDetail>(`/admin/users/${uid}`),
    enabled: Number.isFinite(uid),
  });

  const update = useMutation({
    mutationFn: (values: UserEditValues) =>
      api<AdminUser>(`/admin/users/${uid}`, {
        method: "PATCH",
        body: JSON.stringify({ ...values, age: values.age === "" ? null : Number(values.age) }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "user", uid] }),
  });

  const del = useMutation({
    mutationFn: () => api<null>(`/admin/users/${uid}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      nav("/users");
    },
  });

  return (
    <UserDetailView
      data={data}
      loading={isLoading}
      error={isError || !data ? String(error ?? new Error("Failed to load user")) : null}
      initial={data ? toForm(data.user) : undefined}
      onSave={update.mutate}
      saving={update.isPending}
      saveError={update.isError ? "Could not save changes." : null}
      onDelete={del.mutate}
      deleting={del.isPending}
    />
  );
}