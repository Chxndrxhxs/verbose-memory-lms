import { useEffect } from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Activity from "./pages/Activity";
import Analytics from "./pages/Analytics";
import AssignmentCreate from "./pages/AssignmentCreate";
import AssignmentEdit from "./pages/AssignmentEdit";
import AssignmentPreviewPage from "./pages/AssignmentPreviewPage";
import Assignments from "./pages/Assignments";
import CompleteProfile from "./pages/CompleteProfile";
import Leaderboard from "./pages/Leaderboard";
import CourseCreate from "./pages/CourseCreate";
import CourseEdit from "./pages/CourseEdit";
import Courses from "./pages/Courses";
import Dashboard from "./pages/Dashboard";
import InstructorLanding from "./pages/InstructorLanding";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import { Protected } from "./components/Protected";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { RouteError } from "./components/RouteError";
import { useAuth } from "./hooks/useAuth";

const qc = new QueryClient();
const router = createBrowserRouter([
  { path: "/", element: <InstructorLanding /> },
  { path: "/login", element: <Login /> },
  { path: "/complete-profile", element: <CompleteProfile /> },
  { path: "/dashboard", element: <Protected><Dashboard /></Protected> },
  { path: "/courses",
    children: [
      { index: true, element: <Protected><Courses /></Protected> },
      // single creation flow — /new redirects to canonical /create
      { path: "new", element: <Navigate to="/courses/create" replace /> },
      { path: "create", element: <Protected><CourseCreate /></Protected> },
      { path: ":id", element: <Protected><CourseEdit /></Protected> },
    ],
  },
  { path: "/activity", element: <Protected><Activity /></Protected> },
  { path: "/leaderboard", element: <Protected><Leaderboard /></Protected> },
  { path: "/analytics", element: <Protected><Analytics /></Protected> },
  { path: "/assignments",
    errorElement: <RouteError />,
    children: [
      { index: true, element: <Protected><Assignments /></Protected> },
      { path: "new", element: <Protected><AssignmentCreate /></Protected> },
      { path: ":id/edit", element: <Protected><AssignmentEdit /></Protected> },
      { path: ":id/preview", element: <Protected><AssignmentPreviewPage /></Protected> },
    ],
  },
  { path: "/profile", element: <Protected><Profile /></Protected> },
], { basename: "/teach" });

export default function App() {
  const fetchMe = useAuth((s) => s.fetchMe);
  useEffect(() => {
    ["knoova_instructor_user","knoova_instructor_tokens","knoova_user"].forEach((k)=> { try { localStorage.removeItem(k); } catch {} });
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
