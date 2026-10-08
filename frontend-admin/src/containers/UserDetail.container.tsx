import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { AVATAR_SIZE_MSG, isAvatarSizeAllowed } from "@masterlms/shared";
import { absoluteMediaUrl, api, uploadFile } from "../lib/api";
import type { AdminUser, AdminUserDetail } from "../types/admin";
import { UserDetailView } from "../components/UserDetailView";
import { useAuth } from "../hooks/useAuth";

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
  const { user: me } = useAuth();

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin", "user", uid],
    queryFn: () => api<AdminUserDetail>(`/admin/users/${uid}`),
    enabled: Number.isFinite(uid),
  });

  const onAvatarPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!isAvatarSizeAllowed(f)) {
      setAvatarError(AVATAR_SIZE_MSG);
      setAvatarFile(null);
      setAvatarPreview(null);
      e.target.value = "";
      return;
    }
    setAvatarError(null);
    setAvatarFile(f);
    const r = new FileReader();
    r.onload = () => setAvatarPreview(r.result as string);
    r.readAsDataURL(f);
  };

  const update = useMutation({
    mutationFn: async (values: UserEditValues) => {
      const body: Record<string, unknown> = {
        ...values,
        age: values.age === "" ? null : Number(values.age),
      };
      // avatar is only sent when a new photo was picked; the
      // backend stores it as a URL, so the uploaded file goes
      // through /upload/ first (RAM-49).
      let newAvatar: string | undefined;
      if (avatarFile) {
        const uploaded = await uploadFile(avatarFile, "avatar");
        newAvatar = absoluteMediaUrl(uploaded.url) ?? uploaded.url;
        body.avatar = newAvatar;
      }
      const res = await api<AdminUser>(`/admin/users/${uid}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      return { res, newAvatar };
    },
    onSuccess: ({ res, newAvatar }) => {
      qc.invalidateQueries({ queryKey: ["admin", "user", uid] });
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
      setAvatarPreview(null);
      setAvatarFile(null);
      // Keep the sidebar photo fresh when an admin edits their own account.
      if (newAvatar !== undefined && me?.id != null && res.id === me.id) {
        useAuth.getState().setUser({ ...me, avatar: newAvatar || undefined });
      }
    },
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
      onSave={update.mutateAsync}
      saving={update.isPending}
      saveError={update.isError ? String(update.error ?? "Could not save changes.") : null}
      onDelete={del.mutate}
      deleting={del.isPending}
      avatarPreview={avatarPreview}
      avatarFile={avatarFile}
      avatarError={avatarError}
      onAvatarPicked={onAvatarPicked}
    />
  );
}