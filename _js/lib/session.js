// sessionStorage / localStorage that never throw (blocked storage, private mode).

function safe(storage, fallback) {
  return (action) => {
    try {
      return action(storage());
    } catch {
      return fallback;
    }
  };
}

const session = safe(() => window.sessionStorage, null);
const local = safe(() => window.localStorage, null);

export const readSession = (key) => session((s) => s.getItem(key));
export const writeSession = (key, value) => session((s) => s.setItem(key, value));
export const removeSession = (key) => session((s) => s.removeItem(key));

export const readLocal = (key) => local((s) => s.getItem(key));
export const writeLocal = (key, value) => local((s) => s.setItem(key, value));
