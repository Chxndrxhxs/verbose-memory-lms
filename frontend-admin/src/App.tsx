import { useEffect } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Protected } from "./components/Protected";
import { AdminLayout } from "./components/AdminLayout";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import UserDetail from "./pages/UserDetail";
import Courses from "./pages/Courses";
import CourseDetail from "./pages/CourseDetail";
import Enrollments from "./pages/Enrollments";
import Payments from "./pages/Payments";
import Login from "./pages/Login";
import Assignments from "./pages/Assignments";
import Categories from "./pages/Categories";
import { useAuth } from "./hooks/useAuth";

const qc = new QueryClient();

const router = createBrowserRouter([
  { path: "/login", element: <Login /> },
  {
    path: "/",
    element: (
      <Protected>
        <AdminLayout />
      </Protected>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: "users", element: <Users /> },
      { path: "users/:id", element: <UserDetail /> },
      { path: "courses", element: <Courses /> },
      { path: "courses/:id", element: <CourseDetail /> },
      { path: "enrollments", element: <Enrollments /> },
      { path: "payments", element: <Payments /> },
      { path: "assignments", element: <Assignments /> },
      { path: "categories", element: <Categories /> },
    ],
  },
], { basename: "/admin" });

export default function App() {
  const fetchMe = useAuth((s) => s.fetchMe);
  useEffect(() => {
    ["knoova_admin_user", "knoova_admin_tokens"].forEach((k) => {
      try { localStorage.removeItem(k); } catch {}
    });
    fetchMe();
  }, [fetchMe]);
  return (
    <QueryClientProvider client={qc}>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </QueryClientProvider>
  );
}