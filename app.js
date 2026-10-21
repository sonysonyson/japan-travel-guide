/* 11월 일본 여행 가이드 - 라우팅 · 상태 · 렌더링 (Vanilla JS) */
(() => {
  const STORAGE_KEY = 'jp-nov-guide-v2';
  const PRESETS = [
    { id: 'mid', label: '중순', start: '2026-11-12' },
    { id: 'late', label: '하순', start: '2026-11-26' },
  ];
  const DEFAULT_STATE = () => ({ startDate: '2026-11-26', done: {}, custom: {}, dayOpt: {}, edits: {}, hidden: {} });
  const WEEK = ['일', '월', '화', '수', '목', '금', '토'];
  const NIGHTS = 3;

  const $ = (s) => document.querySelector(s);
  const app = $('#app');
  let state = load();
  const ui = { dayByRegion: {}, formCat: 'TOUR' };

  /* ───────── 상태 ───────── */
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...DEFAULT_STATE(), ...JSON.parse(raw) };
    } catch (e) { /* 저장소 사용 불가 */ }
    return DEFAULT_STATE();
  }
  /* 이 기기 캐시 (공유 데이터를 못 불러올 때 대비) */
  function cache() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* noop */ }
  }
  /* 저장: 캐시 + 공유 저장소로 전송. 토큰이 없는 기기는 공유되지 않음을 한 번 알림 */
  let warnedReadonly = false;
  function save() {
    cache();
    if (Sync.push(state)) return;
    if (!warnedReadonly) {
      warnedReadonly = true;
      setTimeout(() => toast('보기 전용 기기라 변경이 공유되지 않아요. 새로고침하면 공유 데이터로 돌아갑니다.', { label: '토큰 연결', run: () => openSyncDialog() }), 2100);
    }
  }
  const isDefault = (s) => JSON.stringify({ ...DEFAULT_STATE(), ...s }) === JSON.stringify(DEFAULT_STATE());

  /* ───────── 유틸 ───────── */
  const esc = (s = '') => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const parse = (ymd) => { const [y, m, d] = ymd.split('-').map(Number); return new Date(y, m - 1, d); };
  const ymd = (dt) => `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return ymd(d); };
  const md = (s) => { const d = parse(s); return `${d.getMonth() + 1}/${d.getDate()}`; };
  const mdw = (s) => `${md(s)}(${WEEK[parse(s).getDay()]})`;
  const endDate = () => addDays(state.startDate, NIGHTS);
  const dateOf = (day) => addDays(state.startDate, day - 1);
  const overlaps = (aFrom, aTo, bFrom, bTo) => aFrom <= bTo && bFrom <= aTo;
  const inTrip = (a) => !a.from || overlaps(a.from, a.to, state.startDate, endDate());
  const to12h = (hm) => {
    const [h, m] = hm.split(':').map(Number);
    return { t: `${h % 12 || 12}:${String(m).padStart(2, '0')}`, ap: h < 12 ? 'AM' : 'PM' };
  };
  const region = (id) => REGIONS.find((r) => r.id === id);
  const uid = () => `u${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  /* 일자 계획: 선택형(options) 일자는 사용자가 고른 코스, 없으면 기본 코스 */
  function plan(r, day) {
    const d = r.days[day - 1];
    if (!d.options) return d;
    return d.options.find((o) => o.id === state.dayOpt[`${r.id}-${day}`]) || d.options.find((o) => o.id === d.defaultOption);
  }

  /* 월령(대략값): 기준 신월 2000-01-06 18:14 UTC, 현지 20시 기준 */
  function moon(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const t = Date.UTC(y, m - 1, d, 11, 0);
    const age = (((t - Date.UTC(2000, 0, 6, 18, 14)) / 864e5) % 29.530588853 + 29.530588853) % 29.530588853;
    const names = [[1.8, '신월'], [6.5, '초승달'], [8.5, '상현달'], [13.8, '차오르는 달'], [15.8, '보름달'], [21.2, '기우는 달'], [23.1, '하현달'], [27.7, '그믐달'], [30, '신월']];
    const name = names.find(([lim]) => age < lim)[1];
    const dark = age <= 5 || age >= 19;
    return { age: age.toFixed(1), name, dark };
  }

  /* 날짜별 대체 일정(alts) 적용 */
  function resolve(it, date) {
    const alt = (it.alts || []).find((a) => date >= a.from && date <= a.to);
    if (!alt) return it;
    const { from, to, ...rest } = alt;
    return { ...it, window: undefined, closedRanges: undefined, ...rest, id: it.id, day: it.day };
  }

  /* 사용자 수정 적용: 기본 일정 원본은 두고 state.edits로 덮어쓴다 */
  const EDIT_KEYS = ['time', 'title', 'category', 'desc', 'memo'];
  function applyEdit(it) {
    const e = state.edits[it.id];
    if (!e) return it;
    const out = { ...it, edited: true };
    EDIT_KEYS.forEach((k) => { if (k in e) out[k] = e[k]; });
    if (e.tipRemoved) out.tip = null;
    else if (e.tip) out.tip = { ...(it.tip || {}), ...e.tip, verified: false, userEdited: true };
    return out;
  }
  const hiddenOf = (r, day) => plan(r, day).items.filter((it) => state.hidden[it.id]);

  function itemsOf(r, day) {
    const base = plan(r, day).items.filter((it) => !state.hidden[it.id]).map((it) => applyEdit(resolve(it, dateOf(day))));
    const mine = (state.custom[r.id] || []).filter((c) => c.day === day).map((c) => ({ ...c, mine: true }));
    return [...base, ...mine].sort((a, b) => a.time.localeCompare(b.time));
  }

  function itemFlags(it, date) {
    const flags = [];
    const wd = parse(date).getDay();
    if (it.closedDays && it.closedDays.includes(wd)) flags.push({ cls: 'warn', text: `${WEEK[wd]}요일 휴무 주의` });
    (it.closedRanges || []).forEach((c) => { if (date >= c.from && date <= c.to) flags.push({ cls: 'warn', text: `이 날 ${c.label}` }); });
    let off = false;
    if (it.window) {
      if (date >= it.window.from && date <= it.window.to) flags.push({ cls: 'ok', text: `기간 한정 · ${it.window.label}` });
      else { off = true; flags.push({ cls: 'warn', text: `${it.window.label} 기간 외 (${md(it.window.from)}~)` }); }
    }
    if (it.night) { const m = moon(date); flags.push({ cls: 'moon', text: `🌙 ${m.name} · 월령 ${m.age} · ${m.dark ? '초저녁 어두움' : '달빛 밝음'}` }); }
    return { flags, off };
  }

  /* ───────── 라우팅 ───────── */
  function route(keepScroll) {
    const m = location.hash.match(/^#\/r\/([\w-]+)/);
    const r = m && region(m[1]);
    if (r) renderDetail(r); else renderMain();
    if (!keepScroll) window.scrollTo({ top: 0 });
  }
  window.addEventListener('hashchange', () => route());

  /* ───────── 메인 ───────── */
  function periodBox() {
    const preset = PRESETS.find((p) => p.start === state.startDate);
    return `<div class="period-box">
      <div>
        <div class="label">여행 기간 (3박 4일)</div>
        <div class="period-now">${mdw(state.startDate)} → ${mdw(endDate())}</div>
      </div>
      <div class="grow"></div>
      <div class="seg" role="group" aria-label="기간 선택">
        ${PRESETS.map((p) => `<button data-preset="${p.start}" class="${preset && preset.id === p.id ? 'active' : ''}">${p.label} ${md(p.start)}~</button>`).join('')}
      </div>
      <input type="date" class="date-input" id="startInput" value="${state.startDate}" min="2026-11-01" max="2026-11-27" aria-label="출발일 직접 선택">
    </div>`;
  }

  function noteHtml(a) {
    const active = inTrip(a);
    return `<div class="note ${a.level === 'warn' && active ? 'warn' : ''} ${active ? '' : 'dim'}">
      <span class="ic">${a.level === 'warn' ? '⚠️' : '💡'}</span>
      <span>${esc(a.text)}${a.from ? `<span class="when">${active ? '여행 기간 해당' : '기간 외'}</span>` : ''}
      ${a.link ? ` <a href="${a.link[1]}" target="_blank" rel="noopener">${esc(a.link[0])} ↗</a>` : ''}</span>
    </div>`;
  }

  function renderMain() {
    document.title = '11월 일본 여행 가이드';
    app.innerHTML = `
      <section class="hero">
        <span class="eyebrow">🍁 2026 · NOVEMBER</span>
        <h1>11월, 지역별로 고르는<br><em>3박 4일 일본 여행</em></h1>
        <p class="lead">규슈부터 오키나와 세 섬, 도쿄, 삿포로까지. 여행 날짜를 고르면 그 기간에 열리는 이벤트와 휴무일을 일정에 맞춰 알려드려요.</p>
        ${periodBox()}
        <div class="notes">${COMMON_NOTES.map(noteHtml).join('')}</div>
      </section>
      <div class="section-title"><h2>지역 선택</h2><span>${REGIONS.length}개 지역 · 카드를 눌러 상세 일정 보기</span></div>
      <div class="grid">${REGIONS.map(regionCard).join('')}</div>`;
  }

  function regionCard(r) {
    const active = r.alerts.filter((a) => a.from && inTrip(a));
    const warns = r.alerts.filter((a) => a.level === 'warn' && inTrip(a)).length;
    const events = active.filter((a) => a.level === 'info').length;
    return `<a class="r-card c-${r.color}" href="#/r/${r.id}">
      <span class="emoji" aria-hidden="true">${r.emoji}</span>
      <span class="r-group">${esc(r.group)}</span>
      <h3>${esc(r.name)}</h3>
      <span class="r-sub">${esc(r.sub)}</span>
      <p class="r-tag">${esc(r.tagline)}</p>
      <div class="r-meta">
        <span class="chip">🌡 ${r.weather.low}~${r.weather.high}℃</span>
        <span class="chip">✈ ${r.flights.out.dep} 출발</span>
        ${events ? `<span class="chip event">✨ 기간 이벤트 ${events}</span>` : ''}
        ${warns ? `<span class="chip alert">⚠ 주의 ${warns}</span>` : ''}
        ${r.highlights.slice(0, 2).map((h) => `<span class="chip">${esc(h)}</span>`).join('')}
      </div>
      <span class="go" aria-hidden="true">→</span>
    </a>`;
  }

  /* ───────── 상세 ───────── */
  function renderDetail(r) {
    document.title = `${r.name} · 11월 일본 여행 가이드`;
    const day = ui.dayByRegion[r.id] || 1;
    const all = r.days.flatMap((_, i) => itemsOf(r, i + 1));
    const doneCnt = all.filter((it) => state.done[it.id]).length;
    const pct = Math.round((doneCnt / all.length) * 100);

    app.innerHTML = `
      <a class="crumb" href="#/">← 지역 목록</a>
      <section class="d-hero c-${r.color}">
        <span class="emoji" aria-hidden="true">${r.emoji}</span>
        <span class="r-group">${esc(r.group)} · ${esc(r.nameJa)}</span>
        <h1>${esc(r.name)}<small>${esc(r.sub)}</small></h1>
        <p>${esc(r.tagline)}</p>
        <div class="d-stats">
          <div class="d-stat"><span>여행 기간</span><b>${mdw(state.startDate)} ~ ${mdw(endDate())}</b></div>
          <div class="d-stat"><span>출국 (인천)</span><b>${r.flights.out.dep} 출발</b></div>
          <div class="d-stat"><span>귀국 (인천 도착)</span><b>${r.flights.back.arr}</b></div>
          <div class="d-stat"><span>11월 기온</span><b>${r.weather.low}~${r.weather.high}℃</b></div>
          <div class="d-stat"><span>일몰</span><b>약 ${r.weather.sunset}</b></div>
          <div class="d-stat"><span>체크 완료</span><b>${doneCnt}/${all.length}</b></div>
        </div>
        <p class="d-weather-note">${esc(r.weather.note)}</p>
      </section>

      <div class="d-layout">
        <section>
          <nav class="day-tabs" role="tablist" aria-label="일자 선택">
            ${r.days.map((d, i) => {
              const date = dateOf(i + 1);
              const flagged = itemsOf(r, i + 1).some((it) => itemFlags(it, date).flags.some((f) => f.cls === 'warn'));
              return `<button class="day-tab ${day === i + 1 ? 'active' : ''}" role="tab" aria-selected="${day === i + 1}" data-day="${i + 1}">
                <b>Day ${i + 1}${flagged ? '<span class="flag" title="확인 필요 항목 있음"></span>' : ''}</b><span>${mdw(date)} · ${esc(plan(r, i + 1).area)}</span></button>`;
            }).join('')}
          </nav>
          <div class="day-head">
            <div><h2>${esc(plan(r, day).title)}</h2><p>${mdw(dateOf(day))} · ${esc(plan(r, day).area)}</p></div>
            <div class="day-head-actions">
              ${hiddenOf(r, day).length ? `<button class="link-btn" id="btnHidden">삭제한 일정 ${hiddenOf(r, day).length}개 · 복원</button>` : ''}
              <a class="link-btn" href="${routeLink(r, day)}" target="_blank" rel="noopener">🗺 오늘 동선 구글 지도</a>
            </div>
          </div>
          ${optionPicker(r, day)}
          <ol class="timeline">${timelineHtml(r, day)}</ol>
        </section>

        <aside class="side">
          <div class="panel">
            <h3>여행 기간 체크</h3>
            <div class="notes" style="margin-top:0">${r.alerts.map(noteHtml).join('')}</div>
          </div>
          <div class="panel">
            <h3>추천 항공편 <span class="muted" style="font-weight:500">· 인천공항 기준</span></h3>
            ${flightRow('출국', r.flights.out, '인천', r.flights.out.arr)}
            ${flightRow('귀국', r.flights.back, r.flights.back.dep, `인천 ${r.flights.back.arr}`)}
            <p class="muted">2026 동계 시간표 기준이 아닌 자료가 섞여 있어요. 예약 시 다시 확인하세요. 귀국 후 공항버스 6101(마들역) 막차 21:10.</p>
          </div>
          <div class="panel">
            <h3>추천 숙소 위치</h3>
            <div class="stays">${r.stays.map((st) => `
              <div class="stay">
                <span class="stay-n">${esc(st.nights)}</span>
                <b>${esc(st.area)}</b>
                <p>${esc(st.why)}</p>
                ${st.tips && st.tips.length ? `<ul>${st.tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}
                <a class="link-btn" href="${GM(st.map)}" target="_blank" rel="noopener">숙소 지도 ↗</a>
              </div>`).join('')}
            </div>
          </div>
          <div class="panel">
            <h3>현지 이동 팁</h3>
            <ul>${r.access.map((a) => `<li>${esc(a)}</li>`).join('')}</ul>
          </div>
          <div class="panel">
            <h3>내 일정 추가 <span class="muted" style="font-weight:500">· Day ${day}</span></h3>
            <form id="addForm" novalidate>
              <div class="field"><label for="fTime">시간</label><input type="time" id="fTime" value="12:00"></div>
              <div class="field"><label for="fTitle">장소/활동명</label><input type="text" id="fTitle" maxlength="40" placeholder="예) 편의점 간식 쇼핑">
                <p class="err hidden" id="fErr">장소/활동명을 입력해 주세요.</p></div>
              <div class="field"><label>카테고리</label><div class="cat-pick" id="fCat">${catPick()}</div></div>
              <button class="btn primary" type="submit" style="width:100%">일정에 추가</button>
            </form>
          </div>
          <div class="panel">
            <h3>진행률</h3>
            <div class="progress"><i style="width:${pct}%"></i></div>
            <p class="muted">${pct}% · 다녀온 곳은 카드의 체크박스로 표시하세요.</p>
          </div>
        </aside>
      </div>`;
    app.dataset.region = r.id;
  }

  function optionPicker(r, day) {
    const d = r.days[day - 1];
    if (!d.options) return '';
    const cur = plan(r, day).id;
    return `<div class="opt-pick c-${r.color}" role="radiogroup" aria-label="Day ${day} 코스 선택">
      <p class="opt-pick-label">이 날 코스 선택 · 당일치기 소도시 또는 도쿄 시내</p>
      <div class="opt-grid">${d.options.map((o) => `
        <button class="opt ${o.id === cur ? 'active' : ''}" role="radio" aria-checked="${o.id === cur}" data-opt="${o.id}">
          <span class="opt-emoji" aria-hidden="true">${o.emoji}</span><b>${esc(o.label)}</b><small>${esc(o.note)}</small>
        </button>`).join('')}
      </div>
    </div>`;
  }

  function flightRow(label, f, dep, arr) {
    return `<div class="flight">
      <span class="f-label">${label}</span>
      <div class="f-main"><b>${esc(f.airline)} ${esc(f.code)}</b><span>${label === '출국' ? `인천 ${f.dep} → 현지 ${f.arr}` : `현지 ${f.dep} → ${esc(arr)}`}</span></div>
      ${f.verified ? '<span class="tag ok">✓ 확인</span>' : '<span class="tag" style="--cat:var(--text-3)">예시</span>'}
    </div>`;
  }

  function catPick() {
    return Object.entries(CATEGORIES).map(([k, c]) =>
      `<button type="button" class="cat-${k} ${ui.formCat === k ? 'active' : ''}" data-cat="${k}">${c.icon} ${c.label}</button>`).join('');
  }

  function timelineHtml(r, day) {
    const items = itemsOf(r, day);
    if (!items.length) return '<li class="empty">등록된 일정이 없습니다.</li>';
    const date = dateOf(day);
    return items.map((it) => {
      const c = CATEGORIES[it.category];
      const t = to12h(it.time);
      const { flags, off } = it.mine ? { flags: [], off: false } : itemFlags(it, date);
      const done = !!state.done[it.id];
      return `<li class="t-row cat-${it.category}">
        <div class="t-time"><b>${t.t}</b><span>${t.ap}</span></div>
        <div class="t-dot"><i></i></div>
        <article class="card cat-${it.category} ${done ? 'done' : ''} ${off ? 'off' : ''}" data-id="${it.id}">
          <div class="card-top">
            <div class="card-main">
              <div class="tags">
                <span class="tag">${c.icon} ${c.label}</span>
                ${it.mine ? '<span class="tag mine">내 일정</span>' : ''}
                ${it.edited ? '<span class="tag mine">수정됨</span>' : ''}
                ${flags.map((f) => `<span class="tag ${f.cls}">${esc(f.text)}</span>`).join('')}
              </div>
              <h4>${esc(it.title)}</h4>
              ${it.desc ? `<p class="desc">${esc(it.desc)}</p>` : ''}
              ${it.memo ? `<ul class="memo-list" aria-label="할 수 있는 것">${it.memo.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>` : ''}
            </div>
            <input type="checkbox" class="check" data-act="done" ${done ? 'checked' : ''} aria-label="다녀옴 체크">
          </div>
          <div class="card-actions">
            ${it.tip
              ? '<button class="tip-btn" data-act="tip">TIP</button>'
              : '<button class="link-btn" data-act="edit" data-focus="tip">+ TIP</button>'}
            <a class="link-btn" href="${GM((it.tip && it.tip.map) || it.title)}" target="_blank" rel="noopener">지도 ↗</a>
            <span class="grow"></span>
            <button class="link-btn" data-act="edit">수정</button>
            <button class="link-btn danger" data-act="del">삭제</button>
          </div>
        </article>
      </li>`;
    }).join('');
  }

  function routeLink(r, day) {
    const qs = [];
    itemsOf(r, day).filter((it) => !it.mine).forEach((it) => { const q = it.tip && it.tip.map; if (q && q !== qs[qs.length - 1]) qs.push(q); });
    if (qs.length < 2) return GM(qs[0] || r.nameJa);
    const enc = encodeURIComponent;
    const mid = qs.slice(1, -1).slice(0, 9).map(enc).join('%7C');
    return `https://www.google.com/maps/dir/?api=1&origin=${enc(qs[0])}&destination=${enc(qs[qs.length - 1])}${mid ? `&waypoints=${mid}` : ''}`;
  }

  /* ───────── 레이어 팝업 ───────── */
  let lastFocus = null;
  function openLayer(title, html, wide) {
    lastFocus = document.activeElement;
    $('#layerTitle').textContent = title;
    $('#layerBody').innerHTML = html;
    $('#layerCard').classList.toggle('wide', !!wide);
    $('#layer').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    $('#layerClose').focus();
  }
  function closeLayer() {
    $('#layer').classList.add('hidden');
    document.body.style.overflow = '';
    if (lastFocus) lastFocus.focus();
  }

  function openTip(r, it) {
    const tip = it.tip || {};
    const c = CATEGORIES[it.category];
    const date = dateOf(it.day);
    const { flags } = itemFlags(it, date);
    const t = to12h(it.time);
    const rows = [];
    if (it.desc) rows.push(['한 줄 소개', `<p>${esc(it.desc)}</p>`]);
    if (it.memo) rows.push(['이곳에서 할 수 있는 것', `<ul>${it.memo.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`, 'memo']);
    if (tip.hours) rows.push(['영업 시간', `<p>${esc(tip.hours)}</p>`]);
    if (tip.closed) rows.push(['휴무일', `<p>${esc(tip.closed)}</p>`]);
    if (tip.cautions && tip.cautions.length) rows.push(['주의할 점', `<ul>${tip.cautions.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`, 'warn']);
    if (tip.notes && tip.notes.length) rows.push(['참고하면 좋은 점', `<ul>${tip.notes.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`]);
    if (it.night) { const m = moon(date); rows.push(['밤하늘', `<p>${mdw(date)} 밤은 ${m.name}(월령 ${m.age}) — ${m.dark ? '초저녁 하늘이 어두워 별 보기 좋은 편' : '달빛이 밝아 은하수는 보기 어려운 편'}입니다. (계산값)</p>`]); }
    if (!rows.length) rows.push(['안내', '<p>추가 정보가 없습니다. 지도 링크로 위치를 확인하세요.</p>']);

    openLayer(it.title, `
      <div class="tip-sub cat-${it.category}">
        <span class="tag">${c.icon} ${c.label}</span>
        <span class="tag" style="--cat:var(--text-2)">Day ${it.day} · ${mdw(date)} · ${t.t} ${t.ap}</span>
        ${flags.map((f) => `<span class="tag ${f.cls}">${esc(f.text)}</span>`).join('')}
      </div>
      <div class="tip-grid">${rows.map(([h, b, cls]) => `<div class="tip-row ${cls || ''}"><h5>${h}</h5>${b}</div>`).join('')}</div>
      <div class="tip-links">
        <a class="btn primary" href="${GM(tip.map || it.title)}" target="_blank" rel="noopener">구글 지도에서 보기 ↗</a>
        ${(tip.links || []).map(([l, u]) => `<a class="btn line" href="${u}" target="_blank" rel="noopener">${esc(l)} ↗</a>`).join('')}
      </div>
      <div class="verify ${tip.verified ? 'verify-ok' : 'verify-todo'}">${tip.verified ? `✓ ${CHECKED_AT} 기준 웹 검색으로 확인한 정보입니다.` : tip.userEdited ? '✎ 직접 수정한 내용이 포함되어 있습니다.' : 'ⓘ 영업시간·휴무는 방문 전 공식 정보를 확인하세요.'}</div>
      <div class="tip-manage">
        <button class="btn line" data-tip-edit>✎ TIP 수정</button>
        <button class="btn line danger" data-tip-del>TIP 삭제</button>
      </div>`);
    ui.ctx = { rid: r.id, id: it.id };
  }

  /* ───────── 일정·TIP 수정 ───────── */
  const lines = (v) => v.split('\n').map((x) => x.trim()).filter(Boolean);
  const findItem = (r, id) => itemsOf(r, ui.dayByRegion[r.id] || 1).find((x) => x.id === id);
  const customRec = (r, id) => (state.custom[r.id] || []).find((c) => c.id === id);

  function openEditor(r, it, focusTip) {
    ui.ctx = { rid: r.id, id: it.id };
    ui.editCat = it.category;
    const tip = it.tip || {};
    const ta = (id, label, val, hint) => `<div class="field"><label for="${id}">${label}${hint ? ` <span class="muted">· ${hint}</span>` : ''}</label><textarea id="${id}" rows="3">${esc((val || []).join('\n'))}</textarea></div>`;
    const inp = (id, label, val, ph) => `<div class="field"><label for="${id}">${label}</label><input type="text" id="${id}" value="${esc(val || '')}" placeholder="${esc(ph || '')}"></div>`;
    openLayer(it.mine ? '내 일정 수정' : '일정 수정', `
      <form id="editForm" novalidate>
        <div class="edit-grid">
          <div class="field"><label for="eTime">시간</label><input type="time" id="eTime" value="${it.time}"></div>
          <div class="field"><label for="eTitle">장소/활동명</label><input type="text" id="eTitle" maxlength="60" value="${esc(it.title)}">
            <p class="err hidden" id="eErr">장소/활동명을 입력해 주세요.</p></div>
        </div>
        <div class="field"><label>카테고리</label><div class="cat-pick" id="eCat">${editCatPick()}</div></div>
        ${inp('eDesc', '한 줄 소개', it.desc, '예) 오션뷰 카페')}
        ${ta('eMemo', '할 수 있는 것', it.memo, '한 줄에 하나씩')}
        <fieldset class="edit-tip" id="eTipSet">
          <legend>TIP 정보</legend>
          ${inp('eHours', '영업 시간', tip.hours, '예) 10:00~18:00')}
          ${inp('eClosed', '휴무일', tip.closed, '예) 수요일')}
          ${ta('eCautions', '주의할 점', tip.cautions, '한 줄에 하나씩')}
          ${ta('eNotes', '참고하면 좋은 점', tip.notes, '한 줄에 하나씩')}
          ${inp('eMap', '구글 지도 검색어', tip.map, '예) 万座毛')}
        </fieldset>
        <div class="edit-actions">
          ${it.edited ? '<button type="button" class="btn ghost" data-edit-reset>원래대로</button>' : ''}
          <span class="grow"></span>
          <button type="button" class="btn ghost" data-edit-cancel>취소</button>
          <button type="submit" class="btn primary">저장</button>
        </div>
      </form>`);
    if (focusTip) { $('#eTipSet').scrollIntoView({ block: 'start' }); $('#eHours').focus(); }
    else $('#eTitle').focus();
  }

  function editCatPick() {
    return Object.entries(CATEGORIES).map(([k, c]) =>
      `<button type="button" class="cat-${k} ${ui.editCat === k ? 'active' : ''}" data-ecat="${k}">${c.icon} ${c.label}</button>`).join('');
  }

  function saveEditor() {
    const title = $('#eTitle').value.trim();
    if (!title) { $('#eErr').classList.remove('hidden'); $('#eTitle').classList.add('invalid'); $('#eTitle').focus(); return; }
    const r = region(ui.ctx.rid);
    const tip = { hours: $('#eHours').value.trim(), closed: $('#eClosed').value.trim(), cautions: lines($('#eCautions').value), notes: lines($('#eNotes').value), map: $('#eMap').value.trim() };
    const tipEmpty = !tip.hours && !tip.closed && !tip.cautions.length && !tip.notes.length && !tip.map;
    const data = { time: $('#eTime').value || '12:00', title, category: ui.editCat, desc: $('#eDesc').value.trim(), memo: lines($('#eMemo').value) };
    const rec = customRec(r, ui.ctx.id);
    if (rec) {
      Object.assign(rec, data, { tip: tipEmpty ? null : tip });
    } else {
      const prev = state.edits[ui.ctx.id] || {};
      state.edits[ui.ctx.id] = { ...data, tip, tipRemoved: !!prev.tipRemoved && tipEmpty };
    }
    save(); closeLayer(); renderDetail(r); toast(`"${title}" 수정 완료`);
  }

  function removeTip() {
    const r = region(ui.ctx.rid);
    if (!confirm('이 일정의 TIP 정보를 삭제할까요? (일정은 유지됩니다)')) return;
    const rec = customRec(r, ui.ctx.id);
    if (rec) rec.tip = null;
    else state.edits[ui.ctx.id] = { ...(state.edits[ui.ctx.id] || {}), tipRemoved: true };
    save(); closeLayer(); renderDetail(r); toast('TIP을 삭제했습니다. 카드의 "+ TIP"으로 다시 추가할 수 있어요.');
  }

  function deleteItem(r, id) {
    const rec = customRec(r, id);
    if (rec) {
      state.custom[r.id] = state.custom[r.id].filter((c) => c !== rec);
      save(); renderDetail(r);
      toast(`"${rec.title}" 삭제`, { label: '되돌리기', run: () => { state.custom[r.id].push(rec); save(); renderDetail(r); } });
    } else {
      const it = findItem(r, id);
      state.hidden[id] = true;
      save(); renderDetail(r);
      toast(`"${it.title}" 삭제`, { label: '되돌리기', run: () => { delete state.hidden[id]; save(); renderDetail(r); } });
    }
  }

  function openHidden(r) {
    const day = ui.dayByRegion[r.id] || 1;
    ui.ctx = { rid: r.id };
    openLayer(`Day ${day} 삭제한 일정`, `
      <ul class="hidden-list">${hiddenOf(r, day).map((it) => { const x = applyEdit(resolve(it, dateOf(day))); return `
        <li><span>${x.time} · ${esc(x.title)}</span><button class="btn line" data-restore="${it.id}">복원</button></li>`; }).join('')}
      </ul>
      <div class="edit-actions"><span class="grow"></span><button class="btn primary" data-restore-all>모두 복원</button></div>`);
  }

  function openSummary() {
    const cur = app.dataset.region && location.hash.startsWith('#/r/') ? app.dataset.region : null;
    const list = cur ? [region(cur), ...REGIONS.filter((r) => r.id !== cur)] : REGIONS;
    openLayer(`전체 일정 요약 · ${mdw(state.startDate)} ~ ${mdw(endDate())}`, list.map((r) => `
      <div class="sum-region">
        <h4>${r.emoji} ${esc(r.name)} <span class="muted">${esc(r.sub)}</span><a href="#/r/${r.id}" data-close>상세 보기 →</a></h4>
        <div class="sum-days">${r.days.map((d, i) => `
          <div class="sum-day"><b>Day ${i + 1} · ${mdw(dateOf(i + 1))}${d.options ? ` · ${plan(r, i + 1).emoji} ${esc(plan(r, i + 1).label)}` : ''}</b>
            <ol>${itemsOf(r, i + 1).filter((it) => it.category !== 'MOVE').map((it) => `<li class="${state.done[it.id] ? 'done' : ''}">${it.time} ${esc(it.title)}</li>`).join('')}</ol>
          </div>`).join('')}
        </div>
      </div>`).join(''), true);
  }

  /* ───────── 토스트 ───────── */
  let toastTimer;
  function toast(msg, action) {
    const el = $('#toast');
    el.innerHTML = esc(msg) + (action ? ` <button class="toast-act">${esc(action.label)}</button>` : '');
    el.style.pointerEvents = action ? 'auto' : 'none';
    el.classList.add('show');
    if (action) el.querySelector('.toast-act').onclick = () => { el.classList.remove('show'); action.run(); };
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), action ? 5000 : 2000);
  }

  /* ───────── 이벤트 ───────── */
  function setStart(s) {
    state.startDate = s;
    save();
    route();
    toast(`여행 기간: ${mdw(s)} ~ ${mdw(endDate())}`);
  }

  app.addEventListener('click', (e) => {
    const preset = e.target.closest('[data-preset]');
    if (preset) { setStart(preset.dataset.preset); return; }

    const opt = e.target.closest('[data-opt]');
    if (opt) {
      const r = region(app.dataset.region);
      const day = ui.dayByRegion[r.id] || 1;
      state.dayOpt[`${r.id}-${day}`] = opt.dataset.opt;
      save(); renderDetail(r);
      toast(`Day ${day} 코스: ${plan(r, day).label}`);
      return;
    }

    const tab = e.target.closest('.day-tab');
    if (tab) { ui.dayByRegion[app.dataset.region] = Number(tab.dataset.day); route(); return; }

    if (e.target.closest('#btnHidden')) { openHidden(region(app.dataset.region)); return; }

    const cat = e.target.closest('#fCat [data-cat]');
    if (cat) { ui.formCat = cat.dataset.cat; $('#fCat').innerHTML = catPick(); return; }

    const act = e.target.closest('[data-act]');
    if (!act) return;
    const card = act.closest('.card');
    const r = region(app.dataset.region);
    const id = card.dataset.id;
    if (act.dataset.act === 'tip') {
      openTip(r, findItem(r, id));
    } else if (act.dataset.act === 'edit') {
      openEditor(r, findItem(r, id), act.dataset.focus === 'tip');
    } else if (act.dataset.act === 'done') {
      if (act.checked) state.done[id] = true; else delete state.done[id];
      save(); renderDetail(r);
    } else if (act.dataset.act === 'del') {
      deleteItem(r, id);
    }
  });

  app.addEventListener('change', (e) => {
    if (e.target.id === 'startInput' && e.target.value) setStart(e.target.value);
  });

  app.addEventListener('submit', (e) => {
    if (e.target.id !== 'addForm') return;
    e.preventDefault();
    const title = $('#fTitle').value.trim();
    if (!title) { $('#fErr').classList.remove('hidden'); $('#fTitle').classList.add('invalid'); $('#fTitle').focus(); return; }
    const r = region(app.dataset.region);
    const day = ui.dayByRegion[r.id] || 1;
    (state.custom[r.id] = state.custom[r.id] || []).push({ id: uid(), day, time: $('#fTime').value || '12:00', title, category: ui.formCat });
    save(); renderDetail(r); toast(`Day ${day}에 "${title}" 추가`);
  });

  app.addEventListener('input', (e) => {
    if (e.target.id === 'fTitle' && e.target.value.trim()) { $('#fErr').classList.add('hidden'); e.target.classList.remove('invalid'); }
  });

  $('#btnSummary').addEventListener('click', openSummary);
  $('#btnReset').addEventListener('click', () => {
    if (!Sync.token()) { openSyncDialog('초기화는 모든 기기의 공유 데이터를 원래대로 되돌리는 작업이라, 토큰이 연결된 기기에서만 할 수 있어요.'); return; }
    if (!confirm('공유 데이터(여행 기간·코스 선택·체크·내 일정·수정·삭제)를 모두 지우고 원래 데이터로 되돌릴까요? 모든 기기에 반영됩니다.')) return;
    state = DEFAULT_STATE();
    ui.dayByRegion = {};
    save(); route(); toast('원래 데이터로 초기화했습니다. 모든 기기에 반영됩니다.');
  });

  /* ───────── 공유 데이터 동기화 ───────── */
  const SYNC_LABEL = {
    idle: ['☁', '공유'], loading: ['⟳', '불러오는 중'], readonly: ['👁', '보기 전용'], pending: ['…', '저장 대기'],
    saving: ['⟳', '저장 중'], synced: ['✓', '공유 저장됨'], error: ['!', '저장 오류'], offline: ['!', '연결 안 됨'],
  };
  function renderSyncBtn(st, msg) {
    const [ic, label] = SYNC_LABEL[st] || SYNC_LABEL.idle;
    const b = $('#btnSync');
    b.dataset.state = st;
    b.innerHTML = `<span class="sync-ic" aria-hidden="true">${ic}</span><span class="sync-label">${label}</span>`;
    b.title = msg || label;
    b.setAttribute('aria-label', `공유 데이터: ${label}`);
    if (st === 'error') toast(msg || '저장에 실패했습니다.', { label: '자세히', run: () => openSyncDialog(msg) });
  }
  Sync.on(renderSyncBtn);

  async function pullShared(silent) {
    try {
      const remote = await Sync.pull();
      if (remote) state = { ...DEFAULT_STATE(), ...remote };
      else if (Sync.token() && !isDefault(state)) Sync.push(state, 0); // 공유 파일이 없으면 이 기기 데이터로 처음 생성
      else state = DEFAULT_STATE();
      cache();
      route(true);
    } catch (e) {
      if (!silent) toast('공유 데이터를 불러오지 못해 이 기기에 저장된 내용을 보여줍니다.');
    }
  }

  function openSyncDialog(reason) {
    const C = Sync.CONF;
    const [, label] = SYNC_LABEL[Sync.status] || SYNC_LABEL.idle;
    const has = !!Sync.token();
    openLayer('공유 데이터 · 동기화', `
      ${reason ? `<div class="note warn" style="margin-bottom:12px"><span class="ic">⚠️</span><span>${esc(reason)}</span></div>` : ''}
      <div class="tip-grid">
        <div class="tip-row"><h5>현재 상태</h5>
          <p>${esc(label)} · ${has ? '이 기기는 <b>수정 가능</b>' : '이 기기는 <b>보기 전용</b>'}</p>
          <p class="muted" style="margin-top:4px">저장 위치: <a href="${Sync.fileUrl}" target="_blank" rel="noopener">${esc(C.owner)}/${esc(C.repo)} · ${esc(C.branch)} 브랜치 · ${esc(C.path)}</a></p>
        </div>
        <div class="tip-row"><h5>어떻게 동작하나요</h5><ul>
          <li>수정·삭제·내 일정·체크·여행 기간·코스 선택은 GitHub 저장소에 저장되어 <b>모든 기기에서 같은 내용</b>으로 보입니다.</li>
          <li>쿠키·사이트 데이터를 지워도 공유 데이터는 그대로입니다. 수정하려면 토큰만 다시 입력하세요.</li>
          <li>상단 "초기화"는 공유 데이터를 원래 데이터로 되돌립니다.</li>
        </ul></div>
        <div class="tip-row memo"><h5>${has ? '토큰 바꾸기' : '이 기기에서 수정하려면: GitHub 토큰 연결'}</h5><ol class="steps">
          <li><a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">GitHub 토큰 만들기 페이지</a> 열기 (Settings → Developer settings → Fine-grained tokens)</li>
          <li>Repository access: <b>Only select repositories</b> → <b>${esc(C.repo)}</b></li>
          <li>Permissions → Repository permissions → <b>Contents: Read and write</b></li>
          <li>만료일(Expiration)을 여행 이후로 정하고 Generate → 토큰을 복사해 아래에 붙여넣기</li>
        </ol>
        <form id="tokenForm" class="token-form" novalidate>
          <input type="password" id="tokenInput" placeholder="github_pat_..." autocomplete="off" spellcheck="false" aria-label="GitHub 토큰">
          <button type="submit" class="btn primary">연결</button>
        </form>
        <p class="err hidden" id="tokenErr"></p></div>
      </div>
      <p class="muted" style="margin-top:12px">⚠ 토큰은 이 브라우저에만 저장됩니다. 공용 PC에서는 쓰지 마세요. 토큰이 있으면 저장소 코드도 바꿀 수 있으니, 함께 수정할 믿을 수 있는 사람에게만 따로 전달하세요.</p>
      <div class="edit-actions">
        ${has ? '<button type="button" class="btn ghost" data-token-clear>이 기기에서 토큰 해제</button>' : ''}
        <span class="grow"></span>
        <button type="button" class="btn line" data-sync-pull>지금 다시 불러오기</button>
      </div>`);
  }

  $('#btnSync').addEventListener('click', () => openSyncDialog());
  document.addEventListener('visibilitychange', () => {
    // 다른 기기에서 바꾼 내용을 탭으로 돌아올 때 반영 (편집 중이 아닐 때만)
    if (document.visibilityState === 'visible' && !Sync.busy && Date.now() - Sync.lastPull > 30000 && $('#layer').classList.contains('hidden')) pullShared(true);
  });
  $('#layerClose').addEventListener('click', closeLayer);
  $('#layer').addEventListener('click', (e) => {
    if (e.target.id === 'layer' || e.target.closest('[data-close]')) { closeLayer(); return; }
    const r = ui.ctx && region(ui.ctx.rid);
    const ecat = e.target.closest('[data-ecat]');
    if (ecat) { ui.editCat = ecat.dataset.ecat; $('#eCat').innerHTML = editCatPick(); return; }
    if (e.target.closest('[data-edit-cancel]')) { closeLayer(); return; }
    if (e.target.closest('[data-edit-reset]')) {
      if (!confirm('수정한 내용을 지우고 원래 일정으로 되돌릴까요?')) return;
      delete state.edits[ui.ctx.id];
      save(); closeLayer(); renderDetail(r); toast('원래 일정으로 되돌렸습니다.');
      return;
    }
    if (e.target.closest('[data-token-clear]')) {
      Sync.setToken('');
      renderSyncBtn('readonly');
      closeLayer(); toast('이 기기에서 토큰을 해제했습니다. 보기 전용으로 바뀝니다.');
      return;
    }
    if (e.target.closest('[data-sync-pull]')) { closeLayer(); pullShared().then(() => toast('공유 데이터를 다시 불러왔습니다.')); return; }
    if (e.target.closest('[data-tip-edit]')) { openEditor(r, findItem(r, ui.ctx.id), true); return; }
    if (e.target.closest('[data-tip-del]')) { removeTip(); return; }
    const one = e.target.closest('[data-restore]');
    if (one || e.target.closest('[data-restore-all]')) {
      const day = ui.dayByRegion[r.id] || 1;
      (one ? [one.dataset.restore] : hiddenOf(r, day).map((it) => it.id)).forEach((id) => delete state.hidden[id]);
      save(); renderDetail(r);
      if (hiddenOf(r, day).length) openHidden(r); else closeLayer();
      toast('일정을 복원했습니다.');
    }
  });
  $('#layer').addEventListener('submit', async (e) => {
    if (e.target.id === 'editForm') { e.preventDefault(); saveEditor(); return; }
    if (e.target.id !== 'tokenForm') return;
    e.preventDefault();
    const t = $('#tokenInput').value.trim();
    const err = $('#tokenErr');
    if (!t) { err.textContent = '토큰을 붙여넣어 주세요.'; err.classList.remove('hidden'); return; }
    err.textContent = '확인 중…'; err.classList.remove('hidden');
    try {
      await Sync.verify(t);
      Sync.setToken(t);
      closeLayer();
      toast('토큰을 연결했습니다. 이제 이 기기의 수정이 모든 기기에 공유됩니다.');
      await pullShared();
    } catch (ex) {
      err.textContent = ex.message;
    }
  });
  $('#layer').addEventListener('input', (e) => {
    if (e.target.id === 'eTitle' && e.target.value.trim()) { $('#eErr').classList.add('hidden'); e.target.classList.remove('invalid'); }
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#layer').classList.contains('hidden')) closeLayer(); });

  function syncThemeIcon() {
    const dark = document.documentElement.dataset.theme === 'dark';
    $('#btnTheme').textContent = dark ? '☀️' : '🌙';
    $('#btnTheme').setAttribute('aria-label', dark ? '라이트 모드 전환' : '다크 모드 전환');
  }
  $('#btnTheme').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('jp-nov-theme', next); } catch (e) { /* noop */ }
    syncThemeIcon();
  });
  syncThemeIcon();

  $('#checkedAt').textContent = CHECKED_AT;
  route();
  renderSyncBtn(Sync.token() ? 'idle' : 'readonly');
  pullShared();
})();
