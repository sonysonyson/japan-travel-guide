/* 11월 일본 여행 가이드 - 라우팅 · 상태 · 렌더링 (Vanilla JS) */
(() => {
  const STORAGE_KEY = 'jp-nov-guide-v2';
  const PRESETS = [
    { id: 'mid', label: '중순', start: '2026-11-12' },
    { id: 'late', label: '하순', start: '2026-11-26' },
  ];
  const DEFAULT_STATE = () => ({ startDate: '2026-11-26', done: {}, custom: {}, dayOpt: {} });
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
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) { /* noop */ }
  }

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
  const allItems = (r) => r.days.flatMap((d) => (d.options ? d.options.flatMap((o) => o.items) : d.items));

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

  function itemsOf(r, day) {
    const base = plan(r, day).items.map((it) => resolve(it, dateOf(day)));
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
  function route() {
    const m = location.hash.match(/^#\/r\/([\w-]+)/);
    const r = m && region(m[1]);
    if (r) renderDetail(r); else renderMain();
    window.scrollTo({ top: 0 });
  }
  window.addEventListener('hashchange', route);

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
    const all = r.days.flatMap((_, i) => plan(r, i + 1).items);
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
            <a class="link-btn" href="${routeLink(r, day)}" target="_blank" rel="noopener">🗺 오늘 동선 구글 지도</a>
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
                ${flags.map((f) => `<span class="tag ${f.cls}">${esc(f.text)}</span>`).join('')}
              </div>
              <h4>${esc(it.title)}</h4>
              ${it.desc ? `<p class="desc">${esc(it.desc)}</p>` : ''}
            </div>
            <input type="checkbox" class="check" data-act="done" ${done ? 'checked' : ''} aria-label="다녀옴 체크">
          </div>
          <div class="card-actions">
            ${it.mine
              ? `<a class="link-btn" href="${GM(it.title)}" target="_blank" rel="noopener">지도</a><button class="link-btn" data-act="del">삭제</button>`
              : `<button class="tip-btn" data-act="tip">TIP</button><a class="link-btn" href="${GM(it.tip.map || it.title)}" target="_blank" rel="noopener">지도 ↗</a>`}
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
      <div class="verify ${tip.verified ? 'ok' : 'check'}">${tip.verified ? `✓ ${CHECKED_AT} 기준 웹 검색으로 확인한 정보입니다.` : 'ⓘ 영업시간·휴무는 방문 전 공식 정보를 확인하세요.'}</div>`);
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
  function toast(msg) {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2000);
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

    const cat = e.target.closest('#fCat [data-cat]');
    if (cat) { ui.formCat = cat.dataset.cat; $('#fCat').innerHTML = catPick(); return; }

    const act = e.target.closest('[data-act]');
    if (!act) return;
    const card = act.closest('.card');
    const r = region(app.dataset.region);
    const id = card.dataset.id;
    if (act.dataset.act === 'tip') {
      const raw = allItems(r).find((x) => x.id === id);
      openTip(r, resolve(raw, dateOf(raw.day)));
    } else if (act.dataset.act === 'done') {
      if (act.checked) state.done[id] = true; else delete state.done[id];
      save(); renderDetail(r);
    } else if (act.dataset.act === 'del') {
      state.custom[r.id] = (state.custom[r.id] || []).filter((c) => c.id !== id);
      delete state.done[id];
      save(); renderDetail(r); toast('내 일정을 삭제했습니다.');
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
    if (!confirm('여행 기간·체크·내 일정을 모두 지우고 기본 샘플로 되돌릴까요?')) return;
    state = DEFAULT_STATE();
    ui.dayByRegion = {};
    save(); route(); toast('기본 샘플 데이터로 초기화했습니다.');
  });
  $('#layerClose').addEventListener('click', closeLayer);
  $('#layer').addEventListener('click', (e) => { if (e.target.id === 'layer' || e.target.closest('[data-close]')) closeLayer(); });
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
})();
