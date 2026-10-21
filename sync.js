/* 공유 데이터 동기화
 * 저장 위치: GitHub 저장소의 travel-data 브랜치 / data/state.json
 *  - 읽기: 토큰 없이 누구나 (GitHub API, 공개 저장소)
 *  - 쓰기: 이 저장소 Contents 쓰기 권한이 있는 토큰을 입력한 기기만
 *  - main 브랜치가 아니라서 저장해도 Pages 재배포가 일어나지 않음
 */
const Sync = (() => {
  const CONF = { owner: 'sonysonyson', repo: 'japan-travel-guide', branch: 'travel-data', base: 'main', path: 'data/state.json' };
  // github.io에서 열면 주소로 저장소를 판별 (저장소 이름이 바뀌어도 동작)
  if (/\.github\.io$/.test(location.hostname)) {
    CONF.owner = location.hostname.split('.')[0];
    const seg = location.pathname.split('/').filter(Boolean)[0];
    if (seg) CONF.repo = seg;
  }
  const TOKEN_KEY = 'jp-nov-gh-token';
  const API = `https://api.github.com/repos/${CONF.owner}/${CONF.repo}`;
  const listeners = [];
  let sha = null;
  let branchReady = false;
  let timer = null;
  let status = 'idle';
  let lastPull = 0;

  const token = () => { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; } };
  const setToken = (t) => { try { if (t) localStorage.setItem(TOKEN_KEY, t); else localStorage.removeItem(TOKEN_KEY); } catch (e) { /* noop */ } };
  const headers = (t = token()) => {
    const h = { Accept: 'application/vnd.github+json' };
    if (t) h.Authorization = `Bearer ${t}`;
    return h;
  };
  // UTF-8 안전한 base64
  const enc = (str) => { let bin = ''; new TextEncoder().encode(str).forEach((b) => { bin += String.fromCharCode(b); }); return btoa(bin); };
  const dec = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), (c) => c.charCodeAt(0)));

  function emit(s, msg) {
    status = s;
    listeners.forEach((fn) => fn(s, msg));
  }

  async function failMsg(res, what) {
    let detail = '';
    try { detail = (await res.json()).message || ''; } catch (e) { /* noop */ }
    if (res.status === 401) return `${what} 실패: 토큰이 올바르지 않거나 만료되었습니다.`;
    if (res.status === 403) return `${what} 실패: 권한이 없거나 요청 한도를 넘었습니다. ${detail}`;
    return `${what} 실패 (${res.status}) ${detail}`;
  }

  /* 공유 데이터 읽기. 파일이 아직 없으면 null */
  async function pull() {
    emit('loading');
    try {
      const res = await fetch(`${API}/contents/${CONF.path}?ref=${CONF.branch}&t=${Date.now()}`, { headers: headers(), cache: 'no-store' });
      lastPull = Date.now();
      if (res.status === 404) { sha = null; emit(token() ? 'synced' : 'readonly'); return null; }
      if (!res.ok) throw new Error(await failMsg(res, '불러오기'));
      const j = await res.json();
      sha = j.sha;
      branchReady = true;
      emit(token() ? 'synced' : 'readonly');
      return JSON.parse(dec(j.content));
    } catch (e) {
      emit('offline', e.message);
      throw e;
    }
  }

  async function ensureBranch() {
    if (branchReady) return;
    const r = await fetch(`${API}/git/ref/heads/${CONF.branch}`, { headers: headers() });
    if (!r.ok) {
      const base = await fetch(`${API}/git/ref/heads/${CONF.base}`, { headers: headers() });
      if (!base.ok) throw new Error(await failMsg(base, '기준 브랜치 확인'));
      const baseSha = (await base.json()).object.sha;
      const c = await fetch(`${API}/git/refs`, { method: 'POST', headers: headers(), body: JSON.stringify({ ref: `refs/heads/${CONF.branch}`, sha: baseSha }) });
      if (!c.ok) throw new Error(await failMsg(c, '데이터 브랜치 생성'));
    }
    branchReady = true;
  }

  async function put(data, retry = true) {
    await ensureBranch();
    const body = { message: 'Update shared travel data (web)', content: enc(JSON.stringify(data, null, 1)), branch: CONF.branch };
    if (sha) body.sha = sha;
    const res = await fetch(`${API}/contents/${CONF.path}`, { method: 'PUT', headers: headers(), body: JSON.stringify(body) });
    if ((res.status === 409 || res.status === 422) && retry) {
      // 다른 기기가 먼저 저장해 sha가 바뀐 경우: 최신 sha를 받아 이 기기의 내용으로 저장 (마지막 저장 우선)
      await pull().catch(() => {});
      return put(data, false);
    }
    if (!res.ok) throw new Error(await failMsg(res, '저장'));
    sha = (await res.json()).content.sha;
  }

  /* 변경 저장 (연속 변경은 묶어서 한 번에). 토큰이 없으면 false */
  function push(data, delay = 1200) {
    if (!token()) { emit('readonly'); return false; }
    emit('pending');
    clearTimeout(timer);
    const snapshot = JSON.parse(JSON.stringify(data));
    timer = setTimeout(async () => {
      timer = null;
      emit('saving');
      try { await put(snapshot); emit('synced'); } catch (e) { emit('error', e.message); }
    }, delay);
    return true;
  }

  /* 토큰 확인: 이 저장소에 쓰기 권한이 있는지 */
  async function verify(t) {
    const r = await fetch(API, { headers: headers(t) });
    if (!r.ok) throw new Error(await failMsg(r, '토큰 확인'));
    const j = await r.json();
    if (!j.permissions || !j.permissions.push) throw new Error('이 저장소에 쓰기 권한이 없는 토큰입니다. Contents 권한을 "Read and write"로 만들어 주세요.');
    return true;
  }

  return {
    CONF, pull, push, verify, token, setToken,
    on: (fn) => listeners.push(fn),
    get status() { return status; },
    get busy() { return !!timer || status === 'saving'; },
    get lastPull() { return lastPull; },
    fileUrl: `https://github.com/${CONF.owner}/${CONF.repo}/blob/${CONF.branch}/${CONF.path}`,
  };
})();
