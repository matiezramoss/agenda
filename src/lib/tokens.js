// Token público para que el usuario vea "mis solicitudes" sin login.
// Se guarda en localStorage y se manda en cada solicitud para poder consultarlas.
const KEY = "public_request_token_v1";

export function getOrCreatePublicToken() {
  let t = localStorage.getItem(KEY);
  if (!t) {
    t = cryptoRandomToken();
    localStorage.setItem(KEY, t);
  }
  return t;
}

function cryptoRandomToken() {
  // 24 bytes -> 48 hex
  const arr = new Uint8Array(24);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}
