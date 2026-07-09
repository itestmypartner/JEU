import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage.js';
import { LoginPage } from './pages/LoginPage.js';
import { AppLayout } from './layouts/AppLayout.js';
import { PageLoader } from './components/Spinner.js';

const CreateGroupPage = lazy(() =>
  import('./pages/CreateGroupPage.js').then((m) => ({ default: m.CreateGroupPage })),
);
const JoinGroupPage = lazy(() =>
  import('./pages/JoinGroupPage.js').then((m) => ({ default: m.JoinGroupPage })),
);
const SelectGroupPage = lazy(() =>
  import('./pages/SelectGroupPage.js').then((m) => ({ default: m.SelectGroupPage })),
);
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage.js').then((m) => ({ default: m.DashboardPage })),
);
const RecordMatchPage = lazy(() =>
  import('./pages/RecordMatchPage.js').then((m) => ({ default: m.RecordMatchPage })),
);
const PlayersPage = lazy(() =>
  import('./pages/PlayersPage.js').then((m) => ({ default: m.PlayersPage })),
);
const PlayerProfilePage = lazy(() =>
  import('./pages/PlayerProfilePage.js').then((m) => ({ default: m.PlayerProfilePage })),
);
const HistoryPage = lazy(() =>
  import('./pages/HistoryPage.js').then((m) => ({ default: m.HistoryPage })),
);
const RankingsPage = lazy(() =>
  import('./pages/RankingsPage.js').then((m) => ({ default: m.RankingsPage })),
);
const HeadToHeadPage = lazy(() =>
  import('./pages/HeadToHeadPage.js').then((m) => ({ default: m.HeadToHeadPage })),
);
const NotificationsPage = lazy(() =>
  import('./pages/NotificationsPage.js').then((m) => ({ default: m.NotificationsPage })),
);
const AdminPage = lazy(() =>
  import('./pages/AdminPage.js').then((m) => ({ default: m.AdminPage })),
);
const GuidePage = lazy(() =>
  import('./pages/GuidePage.js').then((m) => ({ default: m.GuidePage })),
);
const AboutPage = lazy(() =>
  import('./pages/AboutPage.js').then((m) => ({ default: m.AboutPage })),
);

export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/create-group" element={<CreateGroupPage />} />
          <Route path="/join-group" element={<JoinGroupPage />} />
          <Route path="/select-group" element={<SelectGroupPage />} />

          <Route path="/g/:groupId" element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="record" element={<RecordMatchPage />} />
            <Route path="players" element={<PlayersPage />} />
            <Route path="players/:membershipId" element={<PlayerProfilePage />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="rankings" element={<RankingsPage />} />
            <Route path="head-to-head" element={<HeadToHeadPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="guide" element={<GuidePage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="admin" element={<AdminPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
