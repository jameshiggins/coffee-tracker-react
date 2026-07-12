// Storage access that never throws. Touching window.localStorage /
// sessionStorage raises a SecurityError in Chrome/Edge with "Block all cookies"
// on, and in some embedded webviews — so a bare `localStorage.getItem(...)` at
// the app root (AuthProvider) would white-screen those users. Every getter
// dereferences the storage object INSIDE the try (the property access itself is
// what throws), and every setter swallows quota/security errors. Behaviour
// degrades to in-memory-only, which is the right failure mode.
function make(kind) {
  return {
    get(key) {
      try {
        return window[kind].getItem(key);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        window[kind].setItem(key, value);
        return true;
      } catch {
        return false;
      }
    },
    remove(key) {
      try {
        window[kind].removeItem(key);
      } catch {
        /* ignore */
      }
    },
  };
}

export const safeLocal = make('localStorage');
export const safeSession = make('sessionStorage');
