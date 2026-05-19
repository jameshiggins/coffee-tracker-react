import { NavLink, Routes, Route, Link, Navigate, useParams } from 'react-router-dom';
import MapPage from './pages/MapPage.jsx';
import RoastersPage from './pages/RoastersPage.jsx';
import BeansPage from './pages/BeansPage.jsx';
import TastingPermalink from './pages/TastingPermalink.jsx';
import UserProfile from './pages/UserProfile.jsx';
import AuthCallback from './pages/AuthCallback.jsx';
import MyTastings from './pages/MyTastings.jsx';
import Wishlist from './pages/Wishlist.jsx';
import SignIn from './pages/SignIn.jsx';
import SignUp from './pages/SignUp.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import ResetPassword from './pages/ResetPassword.jsx';
import Verified from './pages/Verified.jsx';
import Privacy from './pages/Privacy.jsx';
import Terms from './pages/Terms.jsx';
import { AuthProvider, useAuth } from './auth.jsx';
import { WishlistProvider } from './hooks/useWishlist.jsx';
import LocationChip from './components/LocationChip.jsx';
import EmailVerificationBanner from './components/EmailVerificationBanner.jsx';
import Logo from './components/Logo.jsx';

export default function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
      {/* Global a11y polish.
          - focus-visible: keyboard users get a 2px amber ring; mouse clicks don't.
          - skip-link: hidden until focused, jumps past the nav.
          - prefers-reduced-motion: kills card-expand transitions and animations
            for users who've requested less motion (vestibular sensitivity).
          - forced-colors: high-contrast / Windows-contrast modes get a
            visible system-color outline instead of our amber custom color
            (which the OS would override anyway). */}
      <style>{`
        *:focus-visible {
          outline: 2px solid #b45309;
          outline-offset: 2px;
          border-radius: 4px;
        }
        @media (forced-colors: active) {
          *:focus-visible {
            outline: 2px solid Highlight;
            outline-offset: 2px;
          }
        }
        .skip-link {
          position: absolute; left: -9999px; top: 0; z-index: 100;
          background: #78350f; color: white; padding: 8px 16px;
          border-radius: 0 0 8px 0; text-decoration: none; font-weight: 600;
        }
        .skip-link:focus { left: 0; }
        /* iOS safe-area: keep the full-bleed phone shell clear of the
           notch / Dynamic Island and the home-indicator gesture bar.
           Desktop (no insets) is unaffected — env() resolves to 0. */
        .app-shell {
          padding-left: env(safe-area-inset-left);
          padding-right: env(safe-area-inset-right);
        }
        .app-safe-top { padding-top: env(safe-area-inset-top); }
        .app-safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
        /* Map page: on phones the map must be the hero, not collapsed by
           flex-basis or a desktop-tuned magic number. Explicit tall height
           with a vh→dvh progressive enhancement (dvh tracks the shrinking
           mobile URL bar). Reset entirely at md:+ so the desktop
           sidebar+map row keeps its original calc() height. */
        .map-hero { height: 68vh; min-height: 380px; }
        @supports (height: 100dvh) {
          .map-hero { height: 72dvh; }
        }
        @media (min-width: 768px) {
          .map-hero { height: auto; min-height: 0; }
        }
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
      {/* Full-bleed on phone (no outer padding / no card chrome) so it
          reads as a native app, not a shrunk desktop site. The boxed
          1400px card + rounding + shadow returns at sm:+ unchanged. */}
      <div className="app-shell sm:p-5">
        <div className="max-w-[1400px] mx-auto bg-white sm:rounded-2xl sm:shadow-2xl overflow-hidden">
          <header
            className="app-safe-top text-white px-4 py-5 sm:p-6 md:p-8"
            style={{ background: 'linear-gradient(135deg, #6F4E37 0%, #8B4513 100%)' }}
          >
            <div className="flex justify-between items-center gap-2 mb-3 sm:mb-4">
              <LocationChip />
              <AuthCorner />
            </div>
            <div className="text-center">
              <Link to="/" className="inline-block hover:opacity-90 transition-opacity">
                {/* Smaller wordmark on phone so the header doesn't dominate
                    the first screen; full size returns at sm:. */}
                <span className="sm:hidden"><Logo dark size="md" /></span>
                <span className="hidden sm:inline-flex"><Logo dark size="lg" /></span>
              </Link>
              <p className="text-xs sm:text-sm md:text-base opacity-80 mt-1.5 sm:mt-2">
                The map of Canadian specialty coffee.
              </p>
            </div>
            {/* Mobile: horizontal scroll strip (no ragged wrap, no clipping);
                sm:+ keeps the original centered wrap layout. */}
            <nav
              className="mt-4 sm:mt-5 flex gap-2 justify-start sm:justify-center
                         flex-nowrap sm:flex-wrap overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0
                         [-ms-overflow-style:none] [scrollbar-width:none]
                         [&::-webkit-scrollbar]:hidden"
            >
              <NavTab to="/" end>Map</NavTab>
              <NavTab to="/roasters">Roasters</NavTab>
              <NavTab to="/beans">Beans</NavTab>
              <SignedInNavTab to="/me">My Tastings</SignedInNavTab>
              <SignedInNavTab to="/me/wishlist">Wishlist</SignedInNavTab>
            </nav>
          </header>

          <EmailVerificationBanner />

          <main id="main">
          <Routes>
            <Route path="/" element={<MapPage />} />
            <Route path="/roasters" element={<RoastersPage />} />
            <Route path="/beans" element={<BeansPage />} />
            {/* Old detail/roaster pages are gone — both redirect into the unified
                /beans card UI with appropriate query state. */}
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
          </main>

          <footer className="app-safe-bottom border-t border-amber-100 mt-6 px-4 sm:px-6 py-4 text-xs text-amber-600 flex justify-between items-center flex-wrap gap-2">
            <span>© 2026 Roastmap</span>
            <span className="flex gap-2">
              <Link to="/privacy" className="hover:text-amber-800 hover:underline px-2 py-1.5 -my-1.5">Privacy</Link>
              <Link to="/terms" className="hover:text-amber-800 hover:underline px-2 py-1.5 -my-1.5">Terms</Link>
            </span>
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
        {user.avatar_url && <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full border border-white/30 flex-shrink-0" />}
        {/* Name is the flexible part — truncate instead of pushing the
            sign-out control off-screen on a narrow phone. Hidden below
            xs-ish widths where the avatar alone identifies the user. */}
        <span className="text-white/90 truncate max-w-[7rem] sm:max-w-none hidden min-[420px]:inline">
          {user.display_name || user.email}
        </span>
        <button
          onClick={logout}
          className="text-white/70 hover:text-white text-xs underline flex-shrink-0 px-1 py-1.5"
        >
          Sign out
        </button>
      </div>
    );
  }
  return (
    <div className="flex gap-2 text-sm flex-shrink-0">
      <Link to="/sign-in"
            className="bg-white text-amber-900 hover:bg-white/90 px-3 py-2 rounded-md transition-colors">
        Sign in
      </Link>
      <Link to="/sign-up"
            className="text-white/90 hover:text-white px-3 py-2 rounded-md border border-white/30 transition-colors hidden min-[400px]:inline-block">
        Sign up
      </Link>
    </div>
  );
}

function NavTab({ to, end, children }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `text-sm px-4 py-2.5 sm:py-1.5 rounded-md transition-colors whitespace-nowrap flex-shrink-0 ${
          isActive ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/15 hover:text-white'
        }`
      }
    >
      {children}
    </NavLink>
  );
}

function SignedInNavTab({ to, children }) {
  const { user } = useAuth();
  if (!user) return null;
  return <NavTab to={to}>{children}</NavTab>;
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
