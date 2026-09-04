import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { absoluteMediaUrl, api, uploadFile } from "../lib/api";
import type { SharedInstructorCourse as InstructorCourse } from "@masterlms/shared";
import { ProfileView } from "../components/ProfileView";

export function ProfileContainer() {
  const { user, setUser, logout } = useAuth();
  const nav = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [age, setAge] = useState<string>(user?.age?.toString() ?? "");
  const [avatar, setAvatar] = useState<string | null>(user?.avatar ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const coursesQuery = useQuery({
    queryKey: ["instructor-courses"],
    queryFn: async () => {
      const res = await api<InstructorCourse[] | { results: InstructorCourse[] }>("/courses/mine/");
      return Array.isArray(res) ? res : (res.results ?? []);
    },
    enabled: !!user,
  });
  const courses = coursesQuery.data ?? [];
  const loading = coursesQuery.isLoading;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      let avatarUrl = avatar || "";
      if (avatarFile) {
        const uploaded = await uploadFile(avatarFile);
        avatarUrl = absoluteMediaUrl(uploaded.url) ?? uploaded.url;
        setAvatar(avatarUrl);
      } else if (avatar && avatar.startsWith("data:")) {
        avatarUrl = user?.avatar ?? "";
      }
      return api<{ name: string; email: string; mobile: string; age: number; avatar: string }>(
        "/auth/complete-profile",
        {
          method: "PATCH",
          body: JSON.stringify({
            name,
            email,
            age: age ? Number(age) : undefined,
            avatar: avatarUrl,
          }),
        },
      );
    },
    onSuccess: (updated) => {
      setUser({
        ...(user as { name: string; email: string; mobile: string }),
        ...updated,
        avatar: updated.avatar || avatar || undefined,
      });
      setToast("Profile updated");
      setEditing(false);
      setTimeout(() => setToast(null), 1800);
    },
    onError: (e) => showToast(String(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api<{ message: string }>("/users/me", { method: "DELETE" }),
    onSuccess: async () => {
      await logout();
      nav("/login");
    },
    onError: (e) => {
      showToast(String(e));
      setTimeout(() => setToast(null), 2200);
    },
  });

  const onAvatarPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    const r = new FileReader();
    r.onload = () => setAvatar(r.result as string);
    r.readAsDataURL(f);
  };

  if (!user) return null;

  return (
    <ProfileView
      user={user}
      editing={editing}
      confirmDelete={confirmDelete}
      deleteConfirmText={deleteConfirmText}
      name={name}
      email={email}
      age={age}
      avatar={avatar}
      avatarUploading={saveMutation.isPending && !!avatarFile}
      saving={saveMutation.isPending}
      deleting={deleteMutation.isPending}
      toast={toast}
      courses={courses}
      loading={loading}
      onToggleEditing={() => setEditing((v) => !v)}
      onCancelEditing={() => setEditing(false)}
      onConfirmDeleteOpen={() => setConfirmDelete(true)}
      onConfirmDeleteClose={() => { setConfirmDelete(false); setDeleteConfirmText(""); }}
      onDeleteConfirmText={setDeleteConfirmText}
      onName={setName}
      onEmail={setEmail}
      onAge={setAge}
      onAvatarPicked={onAvatarPicked}
      onSave={() => saveMutation.mutate()}
      onDelete={() => deleteMutation.mutate()}
      onInvalidateCourses={() => queryClient.invalidateQueries({ queryKey: ["instructor-courses"] })}
    />
  );
}
