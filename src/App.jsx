import { NavLink, Routes, Route, Link } from 'react-router-dom';
import IndexPage from './pages/IndexPage.jsx';
import BeansPage from './pages/BeansPage.jsx';
import RoasterShow from './pages/RoasterShow.jsx';
import CoffeeShow from './pages/CoffeeShow.jsx';
import TastingPermalink from './pages/TastingPermalink.jsx';
import UserProfile from './pages/UserProfile.jsx';
import AuthCallback from './pages/AuthCallback.jsx';
import MyTastings from './pages/MyTastings.jsx';
import Wishlist from './pages/Wishlist.jsx';
import SignIn from './pages/SignIn.jsx';
import SignUp from './pages/SignUp.jsx';
import { AuthProvider, useAuth } from './auth.jsx';
import { WishlistProvider } from './hooks/useWishlist.jsx';
import LocationChip from './components/LocationChip.jsx';

export default function App() {
  return (
    <AuthProvider>
      <WishlistProvider>
      <div className="p-5">
        <div className="max-w-[1400px] mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
          <header
            className="text-white p-8 text-center"
            style={{ background: 'linear-gradient(135deg, #6F4E37 0%, #8B4513 100%)' }}
          >
            <div className="flex justify-between items-center mb-2 gap-2">
              <LocationChip />
              <AuthCorner />
            </div>
            <h1 className="text-4xl font-bold drop-shadow">☕ Specialty Coffee Roasters</h1>
            <p className="text-lg opacity-90 mt-2">
              Track specialty coffee prices across Canadian roasters
            </p>
            <nav className="mt-4 flex gap-2 justify-center flex-wrap">
              <NavTab to="/" end>By Roaster</NavTab>
              <NavTab to="/beans">By Bean</NavTab>
              <SignedInNavTab to="/me">My Tastings</SignedInNavTab>
              <SignedInNavTab to="/me/wishlist">Wishlist</SignedInNavTab>
            </nav>
          </header>

          <Routes>
            <Route path="/" element={<IndexPage />} />
            <Route path="/beans" element={<BeansPage />} />
            <Route path="/roasters/:slug" element={<RoasterShow />} />
            <Route path="/c/:id" element={<CoffeeShow />} />
            <Route path="/t/:id" element={<TastingPermalink />} />
            <Route path="/u/:displayName" element={<UserProfile />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/me" element={<MyTastings />} />
            <Route path="/me/wishlist" element={<Wishlist />} />
          </Routes>
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
      <div className="flex items-center gap-2 text-sm">
        {user.avatar_url && <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full border border-white/30" />}
        <span className="text-white/90">{user.display_name || user.email}</span>
        <button onClick={logout} className="text-white/70 hover:text-white text-xs underline ml-1">Sign out</button>
      </div>
    );
  }
  return (
    <div className="flex gap-2 text-sm">
      <Link to="/sign-in"
            className="bg-white text-amber-900 hover:bg-white/90 px-3 py-1.5 rounded-md transition-colors">
        Sign in
      </Link>
      <Link to="/sign-up"
            className="text-white/90 hover:text-white px-3 py-1.5 rounded-md border border-white/30 transition-colors">
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
        `text-sm px-4 py-1.5 rounded-md transition-colors ${
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
