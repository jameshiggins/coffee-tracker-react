import { lazy, Suspense } from 'react';
import { NavLink, Routes, Route, Link, Navigate, useParams } from 'react-router-dom';

// Route-level code splitting (perf). The shell (header/footer/providers) is
// eager so the chrome paints immediately; pages stream in behind Suspense.
//
// RoastersPage is the LANDING route ("/") and the product's focus — the
// directory list. It carries no heavy deps, so it's imported EAGERLY for the
// best LCP (the list paints with the shell, no chunk round-trip). The Leaflet
// MAP is now a SECONDARY view at /map, lazy-loaded (and itself defers the
// ~99 KB map vendor behind a facade), so the heavy mapping weight stays off
// the landing entirely.
import RoastersPage from './pages/RoastersPage.jsx';
const MapPage = lazy(() => import('./pages/MapPage.jsx'));
const BeansPage = lazy(() => import('./pages/BeansPage.jsx'));
const TastingPermalink = lazy(() => import('./pages/TastingPermalink.jsx'));
const UserProfile = lazy(() => import('./pages/UserProfile.jsx'));
const AuthCallback = lazy(() => import('./pages/AuthCallback.jsx'));
const MyTastings = lazy(() => import('./pages/MyTastings.jsx'));
const Wishlist = lazy(() => import('./pages/Wishlist.jsx'));
const SignIn = lazy(() => import('./pages/SignIn.jsx'));
const SignUp = lazy(() => import('./pages/SignUp.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));
const Verified = lazy(() => import('./pages/Verified.jsx'));
const Privacy = lazy(() => import('./pages/Privacy.jsx'));
const Terms = lazy(() => import('./pages/Terms.jsx'));
import { AuthProvider, useAuth } from './auth.jsx';
import { WishlistProvider } from './hooks/useWishlist.jsx';
import LocationChip from './components/LocationChip.jsx';
import EmailVerificationBanner from './components/EmailVerificationBanner.jsx';
import Logo from './components/Logo.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import Icon from './components/Icon.jsx';

export default function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
      {/* Global a11y polish.
          - focus-visible: keyboard users get a 2px terracotta ring; mouse clicks don't.
          - skip-link: hidden until focused, jumps past the nav.
          - prefers-reduced-motion: kills card-expand transitions and animations.
          - forced-colors: high-contrast modes get a system-color outline. */}
      <style>{`
        *:focus-visible {
          outline: 2px solid #c2410c;
          outline-offset: 2px;
          border-radius: 4px;
        }
        @media (forced-colors: active) {
          *:focus-visible { outline: 2px solid Highlight; outline-offset: 2px; }
        }
        .skip-link {
          position: absolute; left: -9999px; top: 0; z-index: 100;
          background: #9a3412; color: white; padding: 8px 16px;
          border-radius: 0 0 8px 0; text-decoration: none; font-weight: 600;
        }
        .skip-link:focus { left: 0; }
        /* iOS safe-area: keep the full-bleed phone shell clear of the notch and
           the home-indicator gesture bar. Desktop (no insets) is unaffected. */
        .app-shell {
          padding-left: env(safe-area-inset-left);
          padding-right: env(safe-area-inset-right);
        }
        .app-safe-top { padding-top: env(safe-area-inset-top); }
        .app-safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
        /* Map page (now the secondary /map view): on phones the map is the hero,
           an explicit tall height (vh→dvh) so it isn't collapsed by flex-basis.
           Reset at md:+ so the desktop sidebar+map row keeps its calc() height. */
        .map-hero { height: 68vh; min-height: 380px; }
        @supports (height: 100dvh) { .map-hero { height: 72dvh; } }
        @media (max-width: 767px) and (max-height: 500px) { .map-hero { min-height: 220px; } }
        @media (min-width: 768px) { .map-hero { height: auto; min-height: 0; } }
        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
      <a href="#main" className="skip-link">Skip to main content</a>
      {/* Full-bleed on phone (no outer padding / card chrome) so it reads as a
          native app; the boxed 1400px card returns at sm:+. */}
      <div className="app-shell sm:p-5">
        {/* No overflow-hidden here (previously clipped to the rounded corners) --
            it would break `position: sticky` for any descendant, e.g. the Beans
            page filter bar. Header/footer each round + clip their own corners
            below instead, so the boxed card still looks seamless at sm:+. */}
        <div className="max-w-[1400px] mx-auto bg-surface sm:rounded-2xl sm:shadow-xl sm:border sm:border-border">
          {/* Modern light header: brand bar + scrollable icon nav. Replaces the
              former brown gradient hero so the directory leads, not the chrome. */}
          <header className="app-safe-top bg-surface border-b border-border sm:rounded-t-2xl overflow-hidden">
            <div className="px-4 sm:px-6 md:px-8">
              <div className="flex items-center justify-between gap-2 py-3 sm:py-4">
                <Link to="/" className="inline-flex shrink-0 rounded-lg hover:opacity-80 transition-opacity" aria-label="Roastmap — home">
                  <span className="sm:hidden"><Logo size="sm" /></span>
                  <span className="hidden sm:inline-flex"><Logo size="md" /></span>
                </Link>
                {/* flex-1 + justify-end so the cluster owns the leftover row
                    width; LocationChip is the designated shrinker (min-w-0 +
                    truncate) — without it, flex min-width:auto let the chip
                    refuse to shrink and the signed-in extras (avatar, Sign
                    out) overflowed the viewport on phones. */}
                <div className="flex flex-1 items-center justify-end gap-1 min-w-0">
                  <LocationChip />
                  <ThemeToggle />
                  <AuthCorner />
                </div>
              </div>
              <nav
                aria-label="Primary"
                className="flex gap-1 -mx-4 px-4 sm:mx-0 sm:px-0 pb-2 sm:pb-2.5 overflow-x-auto flex-nowrap
                           [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                <NavTab to="/" end icon="list">Roasters</NavTab>
                <NavTab to="/beans" icon="coffee">Beans</NavTab>
                <NavTab to="/map" icon="map">Map</NavTab>
                <SignedInNavTab to="/me" icon="coffee">My Reviews</SignedInNavTab>
                <SignedInNavTab to="/me/wishlist" icon="heart">Wishlist</SignedInNavTab>
              </nav>
            </div>
          </header>

          <EmailVerificationBanner />

          <main id="main">
          {/* Reserve a tall min-height while a lazy route chunk streams in so the
              footer doesn't paint high then jump down (CLS). */}
          <Suspense fallback={<div className="min-h-[80vh] p-10 text-center text-fg-muted">Loading…</div>}>
          <Routes>
            {/* The roaster directory is the home AND keeps its /roasters URL so
                existing deep links (and the map's "not on map" pills) still work. */}
            <Route path="/" element={<RoastersPage />} />
            <Route path="/roasters" element={<RoastersPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/beans" element={<BeansPage />} />
            {/* Old detail/roaster pages redirect into the unified /beans card UI. */}
            <Route path="/roasters/:slug" element={<RoasterRedirect />} />
            <Route path="/c/:id" element={<CoffeeRedirect />} />
            <Route path="/t/:id" element={<TastingPermalink />} />
            <Route path="/u/:displayName" element={<UserProfile />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verified" element={<Verified />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/me" element={<MyTastings />} />
            <Route path="/me/wishlist" element={<Wishlist />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
          </Routes>
          </Suspense>
          </main>

          <footer className="app-safe-bottom bg-surface border-t border-border mt-6 px-4 sm:px-6 py-6 text-xs text-fg-muted sm:rounded-b-2xl overflow-hidden">
            <div className="max-w-6xl mx-auto flex flex-col gap-5 sm:flex-row sm:justify-between">
              <div className="max-w-xs">
                <Logo size="sm" />
                <p className="mt-2 leading-relaxed text-fg-muted">
                  A directory of Canadian specialty-coffee roasters and the beans they're roasting right now.
                </p>
              </div>
              <div className="flex gap-10">
                <nav aria-label="Explore" className="flex flex-col gap-1">
                  <span className="font-semibold text-fg-subtle uppercase tracking-wide text-[10px]">Explore</span>
                  <Link to="/" className="hover:text-fg hover:underline py-1">Roasters</Link>
                  <Link to="/beans" className="hover:text-fg hover:underline py-1">Beans</Link>
                  <Link to="/map" className="hover:text-fg hover:underline py-1">Map</Link>
                </nav>
                <nav aria-label="About" className="flex flex-col gap-1">
                  <span className="font-semibold text-fg-subtle uppercase tracking-wide text-[10px]">About</span>
                  <Link to="/privacy" className="hover:text-fg hover:underline py-1">Privacy</Link>
                  <Link to="/terms" className="hover:text-fg hover:underline py-1">Terms</Link>
                </nav>
              </div>
            </div>
            <div className="max-w-6xl mx-auto mt-5 pt-4 border-t border-border">
              <span>© 2026 Roastmap</span>
            </div>
          </footer>
        </div>
      </div>
      </WishlistProvider>
    </AuthProvider>
  );
}

function AuthCorner() {
  const { user, logout } = useAuth();
  if (user) {
    return (
      <div className="flex items-center gap-2 text-sm min-w-0">
        {user.avatar_url && <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full border border-border flex-shrink-0" />}
        <span className="text-fg truncate max-w-[7rem] sm:max-w-none hidden min-[420px]:inline">
          {user.display_name || user.email}
        </span>
        <button
          onClick={logout}
          className="text-fg-muted hover:text-fg hover:bg-surface-muted text-xs font-medium flex-shrink-0 px-2 py-2 rounded-lg transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-sm flex-shrink-0">
      <Link to="/sign-in"
            className="text-fg-muted hover:text-fg hover:bg-surface-muted font-medium px-2.5 py-2 rounded-lg transition-colors">
        Sign in
      </Link>
      <Link to="/sign-up"
            className="bg-accent text-accent-fg hover:bg-accent-hover font-medium px-3 py-2 rounded-lg transition-colors hidden min-[400px]:inline-block">
        Sign up
      </Link>
    </div>
  );
}

function NavTab({ to, end, icon, children }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-2.5 rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
          isActive
            ? 'bg-accent text-accent-fg'
            : 'text-fg-muted hover:bg-surface-muted hover:text-fg'
        }`
      }
    >
      {icon && <Icon name={icon} size={18} />}
      {children}
    </NavLink>
  );
}

function SignedInNavTab({ to, icon, children }) {
  const { user } = useAuth();
  if (!user) return null;
  return <NavTab to={to} icon={icon}>{children}</NavTab>;
}

/**
 * Permalink redirects from the old detail-page URL scheme into the new
 * unified /beans page with query state. Keeps shared links working.
 */
function CoffeeRedirect() {
  const { id } = useParams();
  return <Navigate to={`/beans?bean=${id}`} replace />;
}

function RoasterRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/beans?roaster=${slug}`} replace />;
}
