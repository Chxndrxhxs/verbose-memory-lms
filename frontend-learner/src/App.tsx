import { useEffect } from "react";
import { createBrowserRouter, Outlet, RouterProvider, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "./components/ErrorBoundary";
import About from "./pages/About";
import Activity from "./pages/Activity";
import Assignments from "./pages/Assignments";
import CertificateShare from "./pages/CertificateShare";
import CompleteProfile from "./pages/CompleteProfile";
import CourseDetail from "./pages/CourseDetail";
import Courses from "./pages/Courses";
import Landing from "./pages/Landing";
import Leaderboard from "./pages/Leaderboard";
import Learn from "./pages/Learn";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import PackDetail from "./pages/PackDetail";
import AssignmentDetail from "./pages/AssignmentDetail";
import AssignmentResult from "./pages/AssignmentResult";
import AssignmentTake from "./pages/AssignmentTake";
import Wishlist from "./pages/Wishlist";
import { Protected } from "./components/Protected";
import { useAuth } from "./hooks/useAuth";

const queryClient = new QueryClient();

/* Client-side navigation changes the screen and tells nobody; the
   document title is how a screen-reader user hears the new page. */
const ROUTE_TITLES: [RegExp, string][] = [
  [/^\/$/, "QTNXT — Learn the thing, properly"],
  [/^\/login$/, "Sign in · QTNXT"],
  [/^\/complete-profile$/, "Complete your profile · QTNXT"],
  [/^\/courses$/, "All courses · QTNXT"],
  [/^\/courses\/\d+$/, "Course · QTNXT"],
  [/^\/wishlist$/, "Wishlist · QTNXT"],
  [/^\/learn\/\d+$/, "Lesson player · QTNXT"],
  [/^\/activity$/, "Activity · QTNXT"],
  [/^\/leaderboard$/, "Leaderboard · QTNXT"],
  [/^\/assignments$/, "Assignments · QTNXT"],
  [/^\/assignments\/take\//, "Take test · QTNXT"],
  [/^\/assignments\/transcript\//, "Test transcript · QTNXT"],
  [/^\/assignments\/\d+$/, "Test · QTNXT"],
  [/^\/packs\/\d+$/, "Test package · QTNXT"],
  [/^\/profile$/, "Profile · QTNXT"],
  [/^\/about$/, "About · QTNXT"],
  [/^\/certificates\//, "Certificate · QTNXT"],
];

function DocumentTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = ROUTE_TITLES.find(([re]) => re.test(pathname))?.[1] ?? "QTNXT";
  }, [pathname]);
  return null;
}

function RootLayout() {
  return (
    <>
      <DocumentTitle />
      <Outlet />
    </>
  );
}

function RouteError() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-room px-4">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold text-ink">Something went wrong</h1>
        <p className="mt-3 text-sm text-ink-muted">
          This page hit an unexpected error. Head back home and try again.
        </p>
      </div>
    </div>
  );
}

const router = createBrowserRouter(
  [
    {
      element: <RootLayout />,
      errorElement: <RouteError />,
      children: [
        { path: "/", element: <Landing /> },
        { path: "/login", element: <Login /> },
        { path: "/complete-profile", element: <CompleteProfile /> },
        { path: "/courses", element: <Courses /> },
        { path: "/courses/:id", element: <CourseDetail /> },
        { path: "/wishlist", element: <Protected><Wishlist /></Protected> },
        { path: "/learn/:id", element: <Protected><Learn /></Protected> },
        { path: "/activity", element: <Protected><Activity /></Protected> },
        { path: "/leaderboard", element: <Protected><Leaderboard /></Protected> },
        { path: "/assignments", element: <Protected><Assignments /></Protected> },
        { path: "/packs/:id", element: <PackDetail /> },
        { path: "/assignments/:id", element: <Protected><AssignmentDetail /></Protected> },
        { path: "/assignments/take/:attemptId", element: <Protected><AssignmentTake /></Protected> },
        { path: "/assignments/transcript/:assignmentId", element: <Protected><AssignmentResult /></Protected> },
        { path: "/profile", element: <Protected><Profile /></Protected> },
        { path: "/about", element: <About /> },
        { path: "/certificates/:certificateId", element: <CertificateShare /> },
        { path: "*", element: <NotFound /> },
      ],
    },
  ],
  { basename: "/" },
);

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
