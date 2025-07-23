import { Authenticated, Refine } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import {
  AuthPage,
  ErrorComponent,
  ThemedLayoutV2,
  ThemedSiderV2,
  useNotificationProvider,
} from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";

import routerBindings, {
  CatchAllNavigate,
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router-v6";
import { dataProvider, liveProvider } from "@refinedev/supabase";
import { App as AntdApp, Button } from "antd";
import { BrowserRouter, Outlet, Route, Routes } from "react-router-dom";
import authProvider from "./authProvider";
import { AppIcon } from "./components/app-icon";
import { Header } from "./components/header";
import { ColorModeContextProvider } from "./contexts/color-mode";
import { supabaseClient } from "./utility";
import { OrdersList } from "./pages/order/orderList";
import { FliiinkerLists } from "./pages/fliiinker/fliiinkerList";
import { CustomersLists } from "./pages/customer/customerPage";
import ClaimList from "./pages/claim/claimsList";
import { GalleryPage } from "./pages/phototeque/photoPage";

// Import des icônes Ant Design
import {
  DashboardOutlined,
  UserOutlined,
  ShoppingCartOutlined,
  SolutionOutlined,
  CalendarOutlined,
  PictureOutlined,
  CreditCardOutlined,
} from "@ant-design/icons";
import { AuthCallback } from "./components/auth/AuthCallback";
import { Navigate } from "react-router-dom";
import { Spin } from "antd";
import { useQuery } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { lazy, Suspense, useEffect } from "react";
import { useInitialLoad } from "./hooks/useInitialLoad";
import { ApiMonitor } from "./components/ApiMonitor";
import PerformanceMonitor from "./components/PerformanceMonitor";
// import SupabasePerformanceMonitor from './components/SupabasePerformanceMonitor';
import "antd/dist/reset.css";
import { App as AntApp } from "antd";

// Register service worker for caching
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        console.log("SW registered: ", registration);
      })
      .catch((registrationError) => {
        console.log("SW registration failed: ", registrationError);
      });
  });
}

// Optimized lazy loading with preloading hints
const HomePageLazy = lazy(() =>
  import(/* webpackChunkName: "home" */ "./pages/home/home").then((module) => ({
    default: module.HomePage,
  })),
);
const FliiinkerProfilePageLazy = lazy(() =>
  import(
    /* webpackChunkName: "fliiinker" */ "./pages/fliiinker/fliiinkerList"
  ).then((module) => ({ default: module.FliiinkerLists })),
);
const CustomersPageLazy = lazy(() =>
  import(
    /* webpackChunkName: "customers" */ "./pages/customer/customerPage"
  ).then((module) => ({ default: module.CustomersLists })),
);
const OrdersListLazy = lazy(() =>
  import(/* webpackChunkName: "orders" */ "./pages/order/orderList").then(
    (module) => ({ default: module.OrdersList }),
  ),
);
const PaymentHistoryPageLazy = lazy(() =>
  import(
    /* webpackChunkName: "payments" */ "./pages/paymentHistory/paymentHistoryPage"
  ).then((module) => ({ default: module.PaymentHistoryPage })),
);
const ClaimListLazy = lazy(() =>
  import(/* webpackChunkName: "claims" */ "./pages/claim/claimsList").then(
    (module) => ({ default: ClaimList }),
  ),
);
const WeeklyCalendarPageLazy = lazy(() =>
  import(
    /* webpackChunkName: "calendar" */ "./pages/calendar/calendarPage"
  ).then((module) => ({ default: module.default })),
);
const GalleryPageLazy = lazy(() =>
  import(/* webpackChunkName: "gallery" */ "./pages/phototeque/photoPage").then(
    (module) => ({ default: module.GalleryPage }),
  ),
);

function App() {
  return (
    <AntApp>
      <Provider store={store}>
        <BrowserRouter>
          <RefineKbarProvider>
            <ColorModeContextProvider>
              <AntdApp>
                <Suspense fallback={<Spin />}>
                  <DevtoolsProvider>
                    <AppContent />
                  </DevtoolsProvider>
                </Suspense>
              </AntdApp>
            </ColorModeContextProvider>
          </RefineKbarProvider>
        </BrowserRouter>
      </Provider>
    </AntApp>
  );
}

/*
Pour configurer les roles pour accéder à notre dashboard, il faut aller dans la table auth.users et ajouter le role dans la colonne role.
 */

// Nouveau composant pour gérer le chargement initial
const AppContent: React.FC = () => {
  useInitialLoad();

  const ProtectedRoute: React.FC<{
    path: string;
    children: React.ReactNode;
  }> = ({ path, children }) => {
    const { data: permissions, isLoading } = useQuery(
      ["routePermissions", path],
      () => authProvider.getRoutePermissions(path),
    );

    if (isLoading) {
      return <Spin />;
    }

    if (!permissions) {
      return <Navigate to="/unauthorized" replace />;
    }

    return <>{children}</>;
  };

  const UnauthorizedPage: React.FC = () => {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        <h2>Accès Non Autorisé</h2>
        <p>
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </p>
        <Button
          type="primary"
          onClick={() => window.history.back()}
          style={{ marginTop: "20px" }}
        >
          Retour
        </Button>
      </div>
    );
  };

  return (
    <Refine
      dataProvider={dataProvider(supabaseClient)}
      liveProvider={liveProvider(supabaseClient)}
      authProvider={authProvider}
      routerProvider={routerBindings}
      notificationProvider={useNotificationProvider}
      resources={[
        {
          name: "Home",
          list: "/home",
          meta: {
            label: "Home",
            icon: <DashboardOutlined />,
          },
        },
        {
          name: "fliiinker_profile",
          list: "/fliiinker_profile",
          meta: {
            label: "Prestataires",
            icon: <UserOutlined />,
          },
        },
        {
          name: "customers",
          list: "/customers",
          meta: {
            label: "Clients",
            icon: <UserOutlined />,
          },
        },
        {
          name: "order",
          list: "/orders",
          meta: {
            label: "Commandes",
            icon: <ShoppingCartOutlined />,
          },
        },
        {
          name: "paymentHistory",
          list: "/paymentHistory",
          meta: {
            label: "Historique des paiements",
            icon: <CreditCardOutlined />,
          },
        },
        {
          name: "claim",
          list: "/claim",
          meta: {
            label: "Réclamations",
            icon: <SolutionOutlined />,
          },
        },
        {
          name: "calendar",
          list: "/calendar",
          meta: {
            label: "Calendrier",
            icon: <CalendarOutlined />,
          },
        },
        {
          name: "phototeque",
          list: "/phototeque",
          meta: {
            label: "Photothèque",
            icon: <PictureOutlined />,
          },
        },
      ]}
      options={{
        syncWithLocation: true,
        warnWhenUnsavedChanges: true,
        useNewQueryKeys: true,
        projectId: "P59ifl-o96fp4-BBMBQ9",
        title: {
          text: "Plum dashbaord",
          icon: <AppIcon onClick={() => (window.location.href = "/home")} />,
        },
      }}
    >
      <Routes>
        <Route
          element={
            <Authenticated
              key="authenticated-inner"
              fallback={<CatchAllNavigate to="/login" />}
            >
              <ThemedLayoutV2
                Header={Header}
                Sider={(props: any) => <ThemedSiderV2 {...props} fixed />}
              >
                <Outlet />
              </ThemedLayoutV2>
            </Authenticated>
          }
        >
          <Route index element={<NavigateToResource resource="home" />} />
          <Route path="/fliiinker_profile">
            <Route
              index
              element={
                <ProtectedRoute path="/fliiinker_profile">
                  <Suspense fallback={<Spin tip="Chargement..." />}>
                    <FliiinkerProfilePageLazy />
                  </Suspense>
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="/customers">
            <Route
              index
              element={
                <ProtectedRoute path="/customers">
                  <Suspense fallback={<Spin tip="Chargement..." />}>
                    <CustomersPageLazy />
                  </Suspense>
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="/orders">
            <Route
              index
              element={
                <ProtectedRoute path="/orders">
                  <Suspense fallback={<Spin tip="Chargement..." />}>
                    <OrdersListLazy />
                  </Suspense>
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="/paymentHistory">
            <Route
              index
              element={
                <ProtectedRoute path="/paymentHistory">
                  <Suspense fallback={<Spin tip="Chargement..." />}>
                    <PaymentHistoryPageLazy />
                  </Suspense>
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="/claim">
            <Route
              index
              element={
                <ProtectedRoute path="/claim">
                  <Suspense fallback={<Spin tip="Chargement..." />}>
                    <ClaimListLazy />
                  </Suspense>
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="/calendar">
            <Route
              index
              element={
                <ProtectedRoute path="/calendar">
                  <Suspense fallback={<Spin tip="Chargement..." />}>
                    <WeeklyCalendarPageLazy />
                  </Suspense>
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="/phototeque">
            <Route
              index
              element={
                <ProtectedRoute path="/phototeque">
                  <Suspense fallback={<Spin tip="Chargement..." />}>
                    <GalleryPageLazy />
                  </Suspense>
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="/home">
            <Route
              index
              element={
                <ProtectedRoute path="/home">
                  <Suspense fallback={<Spin tip="Chargement..." />}>
                    <HomePageLazy />
                  </Suspense>
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<ErrorComponent />} />
        </Route>
        <Route
          element={
            <Authenticated key="authenticated-outer" fallback={<Outlet />}>
              <NavigateToResource />
            </Authenticated>
          }
        >
          <Route
            path="/login"
            element={
              <AuthPage
                type="login"
                formProps={{
                  initialValues: {
                    email: "ain.raph01@gmail.com",
                    password: "tototo",
                  },
                }}
              />
            }
          />
          <Route path="/register" element={<AuthPage type="register" />} />
          <Route
            path="/forgot-password"
            element={<AuthPage type="forgotPassword" />}
          />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/update-password"
            element={<AuthPage type="updatePassword" />}
          />
        </Route>
      </Routes>

      <RefineKbar />
      <UnsavedChangesNotifier />
      <DocumentTitleHandler />
      {/* <ApiMonitor /> */}
      {/* <PerformanceMonitor /> */}
      {/* <SupabasePerformanceMonitor /> */}
    </Refine>
  );
};

export default App;
