import { useEffect } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "./components/ErrorBoundary";
import Activity from "./pages/Activity";
import Assignments from "./pages/Assignments";
import CompleteProfile from "./pages/CompleteProfile";
import CourseDetail from "./pages/CourseDetail";
import Courses from "./pages/Courses";
import Landing from "./pages/Landing";
import Leaderboard from "./pages/Leaderboard";
import Learn from "./pages/Learn";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import { Protected } from "./components/Protected";
import { useAuth } from "./hooks/useAuth";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  { path: "/", element: <Landing /> },
  { path: "/login", element: <Login /> },
  { path: "/complete-profile", element: <CompleteProfile /> },
  { path: "/courses", element: <Protected><Courses /></Protected> },
  { path: "/courses/:id", element: <Protected><CourseDetail /></Protected> },
  { path: "/learn/:id", element: <Protected><Learn /></Protected> },
  { path: "/activity", element: <Protected><Activity /></Protected> },
  { path: "/leaderboard", element: <Protected><Leaderboard /></Protected> },
  { path: "/assignments", element: <Protected><Assignments /></Protected> },
  { path: "/profile", element: <Protected><Profile /></Protected> },
]);

export default function App() {
  const fetchMe = useAuth((s) => s.fetchMe);
  useEffect(() => {
    // clear legacy localStorage keys once
    ["knoova_learner_user","knoova_learner_tokens","knoova_user","enrolled-1","enrolled-5"].forEach((k)=> { try { localStorage.removeItem(k); } catch {} });
    fetchMe();
  }, [fetchMe]);
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </QueryClientProvider>
  );
}
