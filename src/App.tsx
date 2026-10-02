import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { MainLayout } from './components/layout/MainLayout';
import { ReportModal, ToastContainer } from './components/ui/CommonUI';
import {
  ForgotPasswordPage,
  LandingPage,
  LoginPage,
  RegisterPage,
} from './pages/LandingAndAuth';
import {
  CategoryPage,
  ExplorePage,
  HomePage,
  MyTopicsPage,
  SearchResultsPage,
  TopicDetailPage,
  TopicFormPage,
} from './pages/ForumPages';
import {
  EditProfilePage,
  FriendsPage,
  MessagesPage,
  NotificationsPage,
  UserProfilePage,
} from './pages/SocialAndChatPages';
import { AdminDashboardPage, SettingsPage } from './pages/SettingsAndAdminPages';

const AppRouter: React.FC = () => {
  const { route } = useApp();

  if (route.screen === 'landing') {
    return <LandingPage />;
  }
  if (route.screen === 'login') {
    return <LoginPage />;
  }
  if (route.screen === 'register') {
    return <RegisterPage />;
  }
  if (route.screen === 'forgot-password') {
    return <ForgotPasswordPage />;
  }

  const hideRightSidebar =
    route.screen === 'messages' ||
    route.screen === 'chat-detail' ||
    route.screen === 'admin' ||
    route.screen === 'reports';

  return (
    <MainLayout hideRightSidebar={hideRightSidebar}>
      {route.screen === 'home' && <HomePage />}
      {route.screen === 'explore' && <ExplorePage />}
      {route.screen === 'my-topics' && <MyTopicsPage />}
      {route.screen === 'topic-detail' && <TopicDetailPage />}
      {route.screen === 'create-topic' && <TopicFormPage mode="create" />}
      {route.screen === 'edit-topic' && <TopicFormPage mode="edit" />}
      {route.screen === 'profile' && <UserProfilePage />}
      {route.screen === 'edit-profile' && <EditProfilePage />}
      {route.screen === 'friends' && <FriendsPage initialTab="friends" />}
      {route.screen === 'friend-requests' && <FriendsPage initialTab="requests" />}
      {(route.screen === 'messages' || route.screen === 'chat-detail') && <MessagesPage />}
      {route.screen === 'notifications' && <NotificationsPage />}
      {route.screen === 'search' && <SearchResultsPage />}
      {route.screen === 'category' && <CategoryPage />}
      {route.screen === 'settings' && <SettingsPage />}
      {route.screen === 'admin' && <AdminDashboardPage initialSection="users" />}
      {route.screen === 'reports' && <AdminDashboardPage initialSection="reports" />}
    </MainLayout>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppRouter />
      <ReportModal />
      <ToastContainer />
    </AppProvider>
  );
}
