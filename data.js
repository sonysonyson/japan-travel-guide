/* 일본 11월 지역별 3박 4일 여행 가이드 데이터
 *
 * Region
 *   id, name, nameJa, group, emoji, color(파스텔 키 컬러), tagline, highlights[]
 *   weather { high, low, sunset, note }   // 11월 평년 기준 대략값
 *   access[]                               // 한국 출발 기준 이동 팁
 *   alerts[] { level: info|warn, text, from?, to?, link? }  // 기간 지정 시 여행 날짜와 겹칠 때만 강조
 *   days[] { title, area, items[] }
 * Item
 *   time 'HH:mm', category FOOD|TOUR|HOTEL|MOVE, title, desc
 *   tip { hours, closed, cautions[], notes[], map, links[[label, url]], verified }
 *   closedDays [0~6]      // 정기 휴무 요일 (0=일) → 해당 날짜면 카드에 경고
 *   closedRanges [{from,to,label}]
 *   window {from,to,label} // 기간 한정 (기간 밖이면 '기간 외' 표시)
 *   night true             // 별 관측 등 → 달의 위상 표시
 *
 * verified: 2026-10-21 웹 검색으로 확인한 항목. 그 외는 '방문 전 확인' 표시.
 */

const CHECKED_AT = '2026-10-21';

const CATEGORIES = {
  FOOD:  { label: '식사', icon: '🍽' },
  TOUR:  { label: '관광', icon: '📍' },
  HOTEL: { label: '숙소', icon: '🛏' },
  MOVE:  { label: '이동', icon: '🚆' },
};

const COMMON_NOTES = [
  { level: 'warn', text: '2026년 11월 1일 구매분부터 면세가 "환급(리펀드) 방식"으로 바뀝니다. 구매 시 세금 포함 결제 → 출국 시 공항 키오스크에서 여권으로 세관 확인 후 환급. 짐을 맡기기 전에 세관 확인을 먼저 하세요.', link: ['관광청 안내', 'https://www.mlit.go.jp/kankocho/tax-free/page01_000001_00021.html'] },
  { level: 'info', text: '11/23(월)은 일본 공휴일(근로감사의 날)로 11/21~23 3연휴입니다. 인기 관광지·숙소가 붐빕니다.', from: '2026-11-21', to: '2026-11-23' },
];

const GM = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

const REGIONS = [
  /* ───────────────────────── 규슈 ───────────────────────── */
  {
    id: 'kyushu', name: '규슈', sub: '다자이후 · 유후인 · 벳푸', nameJa: '九州', group: '규슈', emoji: '🍁',
    color: 'peach',
    tagline: '단풍 든 온천 마을에서 쉬어가는 3박 4일',
    highlights: ['유후인 긴린코 아침 안개', '벳푸 지옥 순례', '츠루미다케 단풍'],
    weather: { high: 17, low: 8, sunset: '17:15', note: '유후인은 분지라 아침 5℃ 안팎까지 내려갑니다. 얇은 패딩 권장.' },
    access: [
      '인천 → 후쿠오카 공항(약 1시간 20분). 요구사항에 따라 후쿠오카 시내 일정은 제외했습니다.',
      '공항 → 유후인: 고속버스 "유후인호"(주말 만석 잦음, 사전 예약) 또는 JR 특급 "유후인노모리"(1개월 전 10시 발매).',
      '렌터카가 가장 편하고, 대중교통이면 SUNQ 패스(북큐슈) 검토.',
    ],
    alerts: [
      { level: 'warn', text: '2026년 7월 28일 구마모토 지진(최대 진도 7) 이후 구마모토 일대는 복구 중입니다. 이 코스는 구마모토를 제외했습니다. 큐슈 신칸센은 10/14 전 구간 재개(일부 서행).', link: ['구마모토 관련 보도', 'https://kumanichi.com/articles/2024825'] },
      { level: 'info', text: '유후인 긴린코 단풍은 예년 11월 상순~중순, 츠루미다케는 11월 중순 전후가 절정입니다.' },
    ],
    days: [
      { title: '도착 · 다자이후 → 유후인', area: '다자이후 / 유후인', items: [
        { time: '11:30', category: 'MOVE', title: '후쿠오카 공항 도착 → 다자이후', desc: '국제선 터미널에서 다자이후행 직행버스(약 30~40분)',
          tip: { cautions: ['후쿠오카 시내는 거치지 않고 바로 다자이후로 이동'], notes: ['버스 시간표·요금은 니시테츠 버스 사이트에서 확인'], map: '福岡空港 国際線ターミナル' } },
        { time: '12:30', category: 'FOOD', title: '다자이후 참배길 점심 & 우메가에모치', desc: '참배길 노포에서 소바·우동, 명물 찹쌀떡 우메가에모치',
          tip: { hours: '가게마다 다름 (대체로 9:00~17:00대)', notes: ['구마 켄고가 설계한 스타벅스 다자이후 오모테산도점도 이 거리에 있음', '매월 특정일(17일·25일 등)에 한정 우메가에모치가 나온다는 정보가 있으니 확인'], map: '太宰府天満宮 参道' } },
        { time: '13:30', category: 'TOUR', title: '다자이후 텐만구', desc: '학문의 신 스가와라노 미치자네를 모신 신사',
          tip: { cautions: ['본전이 대규모 보수(2023~) 중이라 임시 본전에서 참배할 수 있음 — 진행 상황 확인'], notes: ['주말·연휴는 참배길이 매우 혼잡'], map: '太宰府天満宮', links: [['공식', 'https://www.dazaifutenmangu.or.jp/']] } },
        { time: '14:30', category: 'TOUR', title: '큐슈 국립박물관', desc: '텐만구에서 무빙워크로 연결되는 거대한 유리 건물',
          tip: { hours: '9:30~17:00 (입관 16:30까지)', closed: '월요일 (공휴일이면 다음 날)', notes: ['특별전 기간 금·토 야간 개관 여부는 전시마다 다름'], map: '九州国立博物館', links: [['공식', 'https://www.kyuhaku.jp/']], verified: true },
          closedDays: [1] },
        { time: '16:00', category: 'MOVE', title: '다자이후 → 유후인 이동', desc: '렌터카 약 1시간 30분 / 대중교통은 JR 경유 2시간 이상',
          tip: { cautions: ['산길이 어두워지기 전에 이동 권장'], notes: ['대중교통: 니시테츠 후츠카이치 → JR 구루메 → 규다이선(유후인노모리/유후 특급)'], map: '由布院駅' } },
        { time: '18:00', category: 'HOTEL', title: '유후인 료칸 체크인', desc: '노천탕이 있는 료칸에서 1박',
          tip: { notes: ['체크인 시간을 넘기면 석식이 취소될 수 있어 늦을 경우 미리 연락'], map: '由布院温泉' } },
        { time: '19:00', category: 'FOOD', title: '료칸 가이세키 석식', desc: '분고규·제철 산채를 쓰는 코스 요리',
          tip: { notes: ['알레르기·못 먹는 음식은 예약 시 전달'], map: '由布院温泉' } },
      ] },
      { title: '유후인 아침 → 벳푸 지옥', area: '유후인 / 벳푸 칸나와', items: [
        { time: '07:00', category: 'TOUR', title: '긴린코 아침 안개 산책', desc: '쌀쌀하고 맑은 아침, 호수 위로 피어오르는 안개',
          tip: { hours: '상시 개방', cautions: ['안개는 기온·날씨에 따라 못 볼 수도 있음 (보장 아님)'], notes: ['5~8시 무렵이 촬영하기 좋은 시간대로 알려짐', '단풍 절정은 예년 11월 상순~중순'], map: '金鱗湖', verified: true } },
        { time: '08:30', category: 'FOOD', title: '료칸 조식', desc: '' , tip: { map: '由布院温泉' } },
        { time: '09:30', category: 'TOUR', title: '유노츠보 거리 산책', desc: '긴린코에서 역까지 이어지는 상점가 (고로케·롤케이크·잡화)',
          tip: { hours: '가게마다 다름 (대체로 10:00~17:00)', notes: ['B-speak 롤케이크는 오전에 품절되는 경우가 많음'], map: '湯の坪街道' } },
        { time: '12:00', category: 'FOOD', title: '분고규 점심', desc: '유후인 명물 분고규 덮밥이나 유후마부시',
          tip: { cautions: ['인기점은 대기 30분 이상 — 오픈 직후 방문 권장'], map: '由布院 豊後牛 ランチ' } },
        { time: '13:30', category: 'MOVE', title: '유후인 → 벳푸 이동', desc: '노선버스 약 1시간 / 렌터카 약 40분',
          tip: { notes: ['벳푸 칸나와 지구로 바로 가면 지옥 순례 동선이 짧음'], map: '鉄輪温泉' } },
        { time: '14:30', category: 'TOUR', title: '벳푸 지옥 순례 (칸나와 지구)', desc: '바다지옥·가마도지옥 등 색과 모양이 다른 원천들',
          tip: { hours: '8:00~17:00, 연중무휴', cautions: ['공통 관람권 가격은 자료마다 2,000~2,400엔으로 달라 현장 확인'], notes: ['칸나와 5곳은 도보권, 피의 연못·회오리 지옥은 시바세키 지구(버스 이동)'], map: '別府地獄めぐり 海地獄', links: [['벳푸 지옥 조합', 'https://www.beppu-jigoku.com/']], verified: true } },
        { time: '17:30', category: 'FOOD', title: '지옥찜 저녁', desc: '온천 증기로 해산물·채소를 쪄 먹는 칸나와 명물',
          tip: { cautions: ['영업시간·마감 시간 방문 전 확인'], map: '地獄蒸し工房 鉄輪' } },
        { time: '19:00', category: 'HOTEL', title: '벳푸 온천 숙소 체크인', desc: '칸나와 또는 벳푸역 주변',
          tip: { notes: ['칸나와는 온천 거리 분위기, 역 주변은 이동 편리'], map: '別府駅' } },
      ] },
      { title: '벳푸 하루 · 단풍과 모래찜질', area: '벳푸', items: [
        { time: '08:30', category: 'FOOD', title: '숙소 조식', desc: '', tip: { map: '別府駅' } },
        { time: '10:00', category: 'TOUR', title: '벳푸 로프웨이 · 츠루미다케 단풍', desc: '해발 약 1,300m 정상에서 벳푸만과 단풍 조망',
          tip: { cautions: ['정상은 시내보다 10℃ 가까이 낮을 수 있음 — 방풍 외투', '강풍 시 운휴'], notes: ['단풍은 11월 중순 전후 절정'], map: '別府ロープウェイ' } },
        { time: '12:30', category: 'FOOD', title: '토리텐(닭튀김) 점심', desc: '오이타 명물 닭 튀김, 원조로 알려진 가게도 있음',
          tip: { cautions: ['정기 휴무일 방문 전 확인'], map: '別府 とり天' } },
        { time: '14:00', category: 'TOUR', title: '시바세키 지옥 (피의 연못·회오리)', desc: '붉은 연못과 간헐천, 칸나와에서 버스로 이동',
          tip: { hours: '8:00~17:00', notes: ['회오리 지옥은 분출 간격이 정해져 있어 대기 필요'], map: '血の池地獄', verified: true } },
        { time: '16:30', category: 'TOUR', title: '다케가와라 온천 모래찜질', desc: '메이지 시대 목조 건물의 공동탕, 모래찜질 체험',
          tip: { cautions: ['모래찜질은 마감 시간이 이르고 대기 발생 — 현장 확인'], map: '竹瓦温泉' } },
        { time: '19:00', category: 'FOOD', title: '벳푸 시내 저녁', desc: '세키아지·세키사바(고등어·전갱이 회) 이자카야 또는 벳푸 냉면',
          tip: { map: '別府駅 居酒屋' } },
      ] },
      { title: '벳푸 → 귀국', area: '벳푸 / 후쿠오카 공항', items: [
        { time: '08:00', category: 'FOOD', title: '조식 & 체크아웃', desc: '', tip: { map: '別府駅' } },
        { time: '09:30', category: 'TOUR', title: '벳푸역 기념품', desc: '카보스 과자·유자 후추 등 오이타 특산품',
          tip: { cautions: ['면세는 환급 방식 — 영수증·여권·구매품 지참'], map: '別府駅' } },
        { time: '10:30', category: 'MOVE', title: '벳푸 → 후쿠오카 공항', desc: '특급 소닉으로 하카타(약 2시간) → 지하철 공항선 / 또는 고속버스',
          tip: { notes: ['후쿠오카 시내 관광은 이 코스에서 제외 — 하카타역은 환승만'], map: '福岡空港 国際線' } },
        { time: '13:30', category: 'MOVE', title: '후쿠오카 공항 국제선 출국', desc: '출발 2시간 전 도착 · 면세 세관 확인 → 수하물 위탁',
          tip: { cautions: ['새 면세 제도 시행 초기라 키오스크 대기 가능성'], map: '福岡空港 国際線ターミナル' } },
      ] },
    ],
  },

  /* ───────────────────────── 오키나와 본섬 ───────────────────────── */
  {
    id: 'okinawa', name: '오키나와 본섬', sub: '나하 · 북부 · 남부', nameJa: '沖縄本島', group: '오키나와', emoji: '🐠',
    color: 'mint',
    tagline: '새로 지은 슈리성과 츄라우미, 드라이브로 즐기는 섬',
    highlights: ['슈리성 정전 공개 (11/23~)', '츄라우미 수족관', '코우리 대교 드라이브'],
    weather: { high: 24, low: 19, sunset: '17:40', note: '반팔 + 얇은 겉옷. 바다는 수영보다 해변 산책 위주, 북동풍이 강한 날이 많음.' },
    access: [
      '인천 → 나하 공항(약 2시간 20분), 직항 다수.',
      '렌터카 필수에 가깝습니다. 공항 렌터카 셔틀·수속에 1시간 이상 걸릴 수 있음.',
      '나하 시내는 모노레일(유이레일)로도 이동 가능.',
    ],
    alerts: [
      { level: 'info', text: '슈리성 정전 복원 완공식 11/22(일), 일반 공개 11/23(월·공휴일) 정오부터. 입장료 개정·사전 예약제 도입 예정.', from: '2026-11-22', to: '2026-12-31', link: ['슈리성 공원', 'https://oki-park.jp/shurijo/'] },
      { level: 'warn', text: '세화우타키는 11/9(월)~11/11(수) 휴식일로 출입 불가 (음력 10월 1~3일).', from: '2026-11-09', to: '2026-11-11', link: ['세화우타키 공식', 'https://okinawa-nanjo.jp/sefa/openinghours/'] },
    ],
    days: [
      { title: '도착 · 슈리성과 국제거리', area: '나하', items: [
        { time: '11:30', category: 'MOVE', title: '나하 공항 도착 · 렌터카 인수', desc: '영업소 셔틀로 이동 후 수속',
          tip: { cautions: ['공항 주변 렌터카 영업소 혼잡 — 1시간 이상 여유'], map: '那覇空港' } },
        { time: '13:00', category: 'FOOD', title: '오키나와 소바 점심', desc: '돼지갈비(소키)를 올린 오키나와식 면 요리',
          tip: { map: '那覇 沖縄そば' } },
        { time: '14:30', category: 'TOUR', title: '슈리성 공원', desc: '2019년 화재 후 다시 지은 정전, 11/23부터 일반 공개',
          tip: { cautions: ['11/22 완공식 당일은 관람 제한 가능', '정전 공개 이후 입장료 개정·사전 예약제 도입 예정 — 공식 사이트 확인'], notes: ['공개 이전에는 복원 현장 견학 형태'], map: '首里城公園', links: [['슈리성 공원', 'https://oki-park.jp/shurijo/']], verified: true },
          window: { from: '2026-11-23', to: '2026-12-31', label: '정전 공개' } },
        { time: '17:00', category: 'TOUR', title: '국제거리 & 제1마키시 공설시장', desc: '1층에서 고른 해산물을 2층 식당에서 조리해 먹는 "모치아게"',
          tip: { hours: '대체로 8:00~22:00 (점포마다 다름)', closed: '넷째 주 일요일 휴업 정보 있음', map: '第一牧志公設市場', links: [['공식', 'https://makishi-public-market.jp/']], verified: true },
          closedRanges: [{ from: '2026-11-22', to: '2026-11-22', label: '넷째 주 일요일' }] },
        { time: '18:30', category: 'FOOD', title: '시장 2층 해산물 저녁', desc: '이라부차(파랑비늘돔)·야광조개 등 오키나와 해산물',
          tip: { map: '第一牧志公設市場' } },
        { time: '20:00', category: 'HOTEL', title: '나하 숙소', desc: '국제거리 주변', tip: { map: '国際通り' } },
      ] },
      { title: '북부 드라이브 · 츄라우미', area: '모토부 / 나키진', items: [
        { time: '08:30', category: 'MOVE', title: '오키나와 자동차도로 북부로', desc: '나하 → 모토부 약 2시간', tip: { map: '許田IC' } },
        { time: '09:30', category: 'TOUR', title: '만좌모', desc: '코끼리 코 모양 해안 절벽', tip: { cautions: ['입장료·운영 시간 현장 확인'], map: '万座毛' } },
        { time: '11:00', category: 'TOUR', title: '츄라우미 수족관', desc: '고래상어가 헤엄치는 대형 수조 "쿠로시오의 바다"',
          tip: { hours: '10~2월 8:30~18:30 (입관 17:30까지)', closed: '매년 12월 첫째 수요일과 다음 날', notes: ['오키짱 극장(돌고래 쇼)은 시간표 별도'], map: '沖縄美ら海水族館', links: [['공식', 'https://churaumi.okinawa/']], verified: true } },
        { time: '13:00', category: 'FOOD', title: '모토부 소바 점심', desc: '모토부 일대 노포 소바 가게들', tip: { map: '本部町 そば' } },
        { time: '14:30', category: 'TOUR', title: '비세 후쿠기 가로수길', desc: '후쿠기 나무 터널 속 마을 산책', tip: { notes: ['주민 생활 공간 — 조용히 산책'], map: '備瀬のフクギ並木' } },
        { time: '16:00', category: 'TOUR', title: '코우리 대교 · 코우리섬', desc: '에메랄드빛 바다 위 다리, 하트 바위', tip: { notes: ['일몰 약 17:40'], map: '古宇利大橋' } },
        { time: '18:30', category: 'FOOD', title: '아구 돼지 샤부샤부', desc: '오키나와 재래 돼지 아구', tip: { map: '名護 アグー しゃぶしゃぶ' } },
        { time: '20:30', category: 'HOTEL', title: '나고·온나 리조트 숙박', desc: '다음 날 남부 이동 고려 시 나하 복귀도 가능',
          tip: { notes: ['2025년 개장한 테마파크 "정글리아 오키나와"(나키진)도 이 근처 — 영업시간 변동제, 공식 확인'], map: '恩納村', links: [['정글리아', 'https://junglia.jp/']] } },
      ] },
      { title: '남부 성지 · 차탄 석양', area: '난조 / 차탄', items: [
        { time: '09:00', category: 'TOUR', title: '세화우타키', desc: '류큐 왕국 최고의 성지, 세계유산',
          tip: { cautions: ['휴식일(2026년 11/9~11/11)에는 출입 불가', '입장권은 인근 "간주 역 난조"에서 구매'], notes: ['신성한 장소 — 노출 적은 복장, 큰 소리 자제'], map: '斎場御嶽', links: [['공식', 'https://okinawa-nanjo.jp/sefa/openinghours/']], verified: true },
          closedRanges: [{ from: '2026-11-09', to: '2026-11-11', label: '휴식일' }] },
        { time: '10:30', category: 'TOUR', title: '니라이카나이 다리', desc: '바다를 내려다보며 내려가는 커브 드라이브', tip: { map: 'ニライカナイ橋' } },
        { time: '12:00', category: 'FOOD', title: '바닷가 카페 점심', desc: '난조 해안의 오션뷰 카페', tip: { cautions: ['인기 카페는 대기 — 영업일 확인'], map: '南城市 海カフェ' } },
        { time: '14:00', category: 'TOUR', title: '오키나와 월드 · 교쿠센도', desc: '약 30만 년 된 석회 동굴', tip: { cautions: ['영업시간·요금 공식 확인'], map: 'おきなわワールド' } },
        { time: '16:30', category: 'TOUR', title: '아메리칸 빌리지 석양', desc: '차탄 선셋 비치에서 일몰', tip: { notes: ['일몰 약 17:40'], map: '美浜アメリカンビレッジ' } },
        { time: '18:30', category: 'FOOD', title: '차탄 스테이크 · 타코라이스', desc: '오키나와식 스테이크 문화', tip: { map: '北谷 ステーキ' } },
        { time: '20:30', category: 'HOTEL', title: '나하 숙소', desc: '', tip: { map: '那覇市' } },
      ] },
      { title: '바다 테라스 → 귀국', area: '세나가지마 / 나하 공항', items: [
        { time: '09:00', category: 'FOOD', title: '조식 & 체크아웃', desc: '', tip: { map: '那覇市' } },
        { time: '10:00', category: 'TOUR', title: '세나가지마 우미카지 테라스', desc: '공항 옆 언덕의 하얀 상점가, 이착륙 비행기 감상', tip: { map: '瀬長島ウミカジテラス' } },
        { time: '11:30', category: 'MOVE', title: '렌터카 반납', desc: '주유 후 반납, 셔틀로 공항', tip: { cautions: ['반납 영업소 혼잡 — 30분 이상 여유'], map: '那覇空港' } },
        { time: '12:30', category: 'MOVE', title: '나하 공항 국제선 출국', desc: '면세 세관 확인 → 수하물 위탁', tip: { map: '那覇空港 国際線' } },
      ] },
    ],
  },

  /* ───────────────────────── 미야코지마 ───────────────────────── */
  {
    id: 'miyako', name: '미야코지마', sub: '이라부 · 이케마 · 쿠리마', nameJa: '宮古島', group: '오키나와', emoji: '🌊',
    color: 'aqua',
    tagline: '세 개의 대교를 건너는 미야코 블루 드라이브',
    highlights: ['이라부 대교', '17END 바다', '요나하 마에하마 비치'],
    weather: { high: 25, low: 21, sunset: '17:55', note: '수온 약 24~25℃. 스노클은 웨트슈트 권장, 북풍이 강한 날은 남쪽 해변으로.' },
    access: [
      '진에어 인천 → 시모지시마 공항(SHI) 직항은 2026년 여름 스케줄까지 확인, 겨울 스케줄(10/25~)은 미확인 — 운항 여부 확인 필요.',
      '대안: 나하 경유 국내선으로 미야코 공항(MMY).',
      '섬 내 대중교통이 적어 렌터카 필수.',
    ],
    alerts: [
      { level: 'warn', text: '한국 직항(진에어 ICN–SHI) 2026 겨울 운항 여부가 확인되지 않았습니다. 예약 전 항공사 확인.', link: ['시모지시마 공항', 'https://shimojishima.jp/'] },
    ],
    days: [
      { title: '도착 · 이라부와 시모지', area: '이라부섬 / 시모지섬', items: [
        { time: '12:00', category: 'MOVE', title: '시모지시마 공항 도착 · 렌터카', desc: '', tip: { map: 'みやこ下地島空港' } },
        { time: '12:30', category: 'TOUR', title: '17END', desc: '활주로 끝 투명한 바다, 간조 때 드러나는 모래톱',
          tip: { cautions: ['출입 제한 구역·안내 표지 준수', '모래톱은 간조 시간에만 보임 — 물때표 확인'], map: '17END 下地島' } },
        { time: '13:30', category: 'FOOD', title: '미야코 소바 점심', desc: '고기를 면 아래 숨겨 담는 미야코식 소바', tip: { map: '伊良部島 宮古そば' } },
        { time: '15:00', category: 'TOUR', title: '나카노시마 해변 · 와타리구치 해변', desc: '얕은 산호 해변에서 스노클·산책', tip: { cautions: ['감시원 없는 해변 — 혼자 들어가지 말 것'], map: '中の島ビーチ' } },
        { time: '16:30', category: 'TOUR', title: '이라부 대교 드라이브', desc: '통행료 없는 다리 중 일본 최장급(약 3.5km)', tip: { notes: ['다리 위 정차 금지 — 양 끝 전망 포인트 이용'], map: '伊良部大橋' } },
        { time: '18:00', category: 'HOTEL', title: '히라라 시내 숙소 체크인', desc: '', tip: { map: '宮古島市 平良' } },
        { time: '19:00', category: 'FOOD', title: '미야코규 야키니쿠', desc: '섬 와규', tip: { notes: ['술자리에서 잔을 돌리는 "오토오리" 문화가 있음 — 무리하지 않기'], map: '宮古牛 焼肉' } },
      ] },
      { title: '북부 · 이케마와 소금', area: '이케마섬 / 북부', items: [
        { time: '09:00', category: 'TOUR', title: '이케마 대교 · 이케마섬 일주', desc: '섬 한 바퀴 드라이브 약 30분', tip: { map: '池間大橋' } },
        { time: '10:30', category: 'TOUR', title: '유키시오 뮤지엄', desc: '파우더 소금 "유키시오" 제염소 견학 & 소금 소프트아이스크림',
          tip: { hours: '9~3월 9:00~17:00 (자료마다 차이)', closed: '무휴', notes: ['입장 무료'], map: '雪塩ミュージアム', verified: true } },
        { time: '12:00', category: 'FOOD', title: '섬 카페 점심', desc: '', tip: { map: '宮古島 北部 カフェ' } },
        { time: '13:30', category: 'TOUR', title: '스나야마 비치', desc: '모래 언덕을 넘어가면 나오는 아치형 바위 해변', tip: { cautions: ['모래 언덕 경사 — 샌들보다 운동화'], map: '砂山ビーチ' } },
        { time: '15:00', category: 'TOUR', title: '쿠리마 대교 · 류구조 전망대', desc: '쿠리마섬 언덕 위 전망대', tip: { map: '竜宮城展望台' } },
        { time: '16:30', category: 'TOUR', title: '요나하 마에하마 비치 석양', desc: '7km 백사장, 미야코 대표 해변', tip: { notes: ['일몰 약 17:55'], map: '与那覇前浜ビーチ' } },
        { time: '19:00', category: 'FOOD', title: '히라라 섬 요리 이자카야', desc: '', tip: { map: '宮古島 平良 居酒屋' } },
      ] },
      { title: '남동부 · 곶과 산호', area: '구스쿠베 / 시기라', items: [
        { time: '08:30', category: 'FOOD', title: '조식', desc: '', tip: { map: '宮古島市' } },
        { time: '09:30', category: 'TOUR', title: '히가시헨나자키', desc: '태평양으로 뻗은 2km 곶과 등대', tip: { cautions: ['바람이 매우 강한 곳 — 모자 주의'], map: '東平安名崎' } },
        { time: '11:00', category: 'TOUR', title: '이무기야 마린가든', desc: '파도 잔잔한 만에서 초보자 스노클', tip: { map: 'イムギャーマリンガーデン' } },
        { time: '12:30', category: 'FOOD', title: '남부 점심', desc: '', tip: { map: '宮古島 城辺 ランチ' } },
        { time: '14:00', category: 'TOUR', title: '요시노 해안 스노클', desc: '해안 가까이 넓게 펼쳐진 산호 군락', tip: { cautions: ['주차장 유료·셔틀 운영 여부 현장 확인', '썰물 때 산호 밟지 않기'], map: '吉野海岸' } },
        { time: '16:30', category: 'TOUR', title: '시마노에키 미야코', desc: '농산물·특산품 직판장', tip: { map: '島の駅みやこ' } },
        { time: '19:00', category: 'FOOD', title: '섬 요리 저녁', desc: '', tip: { map: '宮古島 郷土料理' } },
      ] },
      { title: '기념품 → 귀국', area: '히라라', items: [
        { time: '08:30', category: 'FOOD', title: '조식 & 체크아웃', desc: '', tip: { map: '宮古島市' } },
        { time: '10:00', category: 'TOUR', title: '히라라 시내 기념품', desc: '유키시오 과자·미야코 소금 등', tip: { cautions: ['면세 환급 방식 — 영수증 보관'], map: '宮古島 平良 お土産' } },
        { time: '11:00', category: 'MOVE', title: '렌터카 반납', desc: '', tip: { map: 'みやこ下地島空港' } },
        { time: '12:00', category: 'MOVE', title: '공항 출국 수속', desc: '', tip: { map: 'みやこ下地島空港' } },
      ] },
    ],
  },

  /* ───────────────────────── 이시가키지마 ───────────────────────── */
  {
    id: 'ishigaki', name: '이시가키지마', sub: '카비라 · 북부 · 다케토미', nameJa: '石垣島', group: '오키나와', emoji: '⭐',
    color: 'lavender',
    tagline: '별이 쏟아지는 섬과 물소 수레의 다케토미',
    highlights: ['카비라만 글라스보트', '다케토미섬 물소 수레', '별 관측 (밤하늘 보호구역)'],
    weather: { high: 25, low: 21, sunset: '17:55', note: '11월에도 반팔 가능. 북동풍이 강한 날은 배 결항 가능성.' },
    access: [
      '진에어 인천 ↔ 이시가키(ISG) 직항: 2026 여름 스케줄 이시가키 출발 13:30 확인, 겨울 스케줄은 공항 시간표로 확인.',
      '렌터카 권장. 다케토미섬은 이시가키항 리토 터미널에서 고속선 약 10~15분.',
    ],
    alerts: [
      { level: 'info', text: '별 관측은 달이 없는 밤이 좋습니다. 2026년 11월 신월은 9일 무렵, 보름은 24일 무렵 — 하순 일정이면 달이 밝습니다.' },
    ],
    days: [
      { title: '도착 · 시내와 석양', area: '이시가키 시내', items: [
        { time: '12:30', category: 'MOVE', title: '이시가키 공항 도착 · 렌터카', desc: '', tip: { map: '南ぬ島石垣空港' } },
        { time: '13:30', category: 'FOOD', title: '야에야마 소바 점심', desc: '가는 둥근 면의 야에야마식 소바', tip: { map: '石垣島 八重山そば' } },
        { time: '15:00', category: 'TOUR', title: '유글레나몰 · 공설시장', desc: '아케이드 상점가, 기념품 구경', tip: { map: 'ユーグレナモール' } },
        { time: '16:30', category: 'TOUR', title: '바나 공원 전망대', desc: '시내와 바다를 한눈에', tip: { map: 'バンナ公園' } },
        { time: '17:30', category: 'TOUR', title: '칸논자키 석양', desc: '시내에서 가까운 일몰 포인트', tip: { notes: ['일몰 약 17:55'], map: '観音崎 石垣島' } },
        { time: '19:00', category: 'FOOD', title: '이시가키규 야키니쿠', desc: '', tip: { cautions: ['인기점은 예약 필수'], map: '石垣牛 焼肉' } },
        { time: '21:00', category: 'HOTEL', title: '시내 숙소', desc: '', tip: { map: '石垣市' } },
      ] },
      { title: '카비라만 · 북부 드라이브', area: '카비라 / 히라쿠보', items: [
        { time: '08:00', category: 'FOOD', title: '섬 두부 아침 정식', desc: '갓 만든 유시도후', tip: { cautions: ['영업일·품절 확인'], map: 'とうふの比嘉' } },
        { time: '09:30', category: 'TOUR', title: '카비라만 글라스보트', desc: '배 바닥 유리로 산호·열대어 관찰 (약 30분)', tip: { cautions: ['카비라만은 수영 금지'], map: '川平湾' } },
        { time: '12:00', category: 'FOOD', title: '북부 소바 노포 점심', desc: '', tip: { cautions: ['대기 있음'], map: '明石食堂' } },
        { time: '13:30', category: 'TOUR', title: '히라쿠보자키 등대', desc: '섬 최북단 절벽과 등대', tip: { map: '平久保崎灯台' } },
        { time: '15:00', category: 'TOUR', title: '타마토리자키 전망대', desc: '섬의 동서 바다를 동시에', tip: { map: '玉取崎展望台' } },
        { time: '19:00', category: 'FOOD', title: '시내 이자카야', desc: '', tip: { map: '石垣市 居酒屋' } },
        { time: '20:30', category: 'TOUR', title: '별 관측', desc: '이리오모테-이시가키 국립공원은 국제 밤하늘 보호구역', night: true,
          tip: { cautions: ['달이 밝은 날은 은하수가 잘 보이지 않음 (카드의 달 위상 참고)', '가이드 투어는 사전 예약'], notes: ['이시가키섬 천문대는 주말·공휴일 관측회 운영 여부 확인'], map: '石垣島天文台' } },
      ] },
      { title: '다케토미섬 당일치기', area: '다케토미섬', items: [
        { time: '09:00', category: 'MOVE', title: '리토 터미널 → 다케토미 고속선', desc: '약 10~15분', tip: { notes: ['운임·시간표 운항사 확인'], cautions: ['강풍 시 결항'], map: '石垣港離島ターミナル', verified: true } },
        { time: '09:45', category: 'TOUR', title: '물소 수레 마을 관광', desc: '빨간 기와집 사이를 물소 수레로', tip: { notes: ['물소 수레 투어 5,000엔대 (업체별)'], map: '竹富島 水牛車', verified: true } },
        { time: '11:00', category: 'TOUR', title: '콘도이 해변 · 카이지 해변', desc: '별모래 해변과 얕은 에메랄드 바다', tip: { notes: ['자전거 대여로 섬 일주 가능'], map: 'コンドイビーチ' } },
        { time: '12:30', category: 'FOOD', title: '다케토미 소바', desc: '', tip: { map: '竹富島 そば' } },
        { time: '14:30', category: 'MOVE', title: '이시가키 복귀', desc: '', tip: { map: '石垣港離島ターミナル' } },
        { time: '16:00', category: 'TOUR', title: '시내 휴식 · 기념품', desc: '', tip: { map: '石垣市公設市場' } },
        { time: '19:00', category: 'FOOD', title: '시마우타 라이브 이자카야', desc: '산신 연주와 향토 요리', tip: { map: '石垣島 島唄ライブ' } },
      ] },
      { title: '해변 산책 → 귀국', area: '시라호', items: [
        { time: '08:00', category: 'FOOD', title: '야에야마 소바 아침', desc: '', tip: { cautions: ['오전 영업·품절 확인'], map: '来夏世 石垣' } },
        { time: '09:30', category: 'TOUR', title: '시라호 해변', desc: '공항 근처 조용한 산호 해변', tip: { map: '白保海岸' } },
        { time: '11:00', category: 'MOVE', title: '렌터카 반납', desc: '', tip: { map: '南ぬ島石垣空港' } },
        { time: '11:30', category: 'MOVE', title: '이시가키 공항 출국', desc: '출발 2시간 전 · 면세 세관 확인', tip: { map: '南ぬ島石垣空港' } },
      ] },
    ],
  },

  /* ───────────────────────── 도쿄 ───────────────────────── */
  {
    id: 'tokyo', name: '도쿄', sub: '시부야 · 신주쿠 · 근교 당일치기', nameJa: '東京', group: '도쿄', emoji: '🍂',
    color: 'butter',
    tagline: '은행나무 길과 정원 단풍, 하루는 근교 소도시로',
    highlights: ['당일치기 시즈오카·가마쿠라·가와고에', '신궁 외원 은행나무 길', '리쿠기엔 야간 단풍 (11/25~)'],
    weather: { high: 17, low: 9, sunset: '16:30', note: '해가 일찍 집니다. 야외 일정은 오전부터, 저녁은 야경·실내 위주.' },
    access: [
      '인천·김포 → 하네다(시내 30분) 또는 나리타(스카이라이너로 닛포리 약 40분).',
      '교통카드(Suica 등)와 지하철로 충분, 렌터카 불필요.',
    ],
    alerts: [
      { level: 'info', text: '리쿠기엔 "니와모미지 야간 특별 관람" 11/25(수)~12/6(일) 18:00~20:30.', from: '2026-11-25', to: '2026-12-06', link: ['도쿄도 공원협회', 'https://www.tokyo-park.or.jp/park/rikugien/news/2026/rikugiengardens.html'] },
      { level: 'info', text: '신궁 외원 은행나무 길은 예년 11월 중순~하순 절정. "이초 마츠리" 2026년 개최는 미발표.' },
      { level: 'info', text: 'Day 3은 당일치기 코스(시즈오카·가마쿠라·가와고에)나 도쿄 시내 중에서 고를 수 있습니다. 주말·연휴에 가마쿠라는 특히 혼잡합니다.' },
    ],
    days: [
      { title: '도착 · 시부야', area: '시부야', items: [
        { time: '12:00', category: 'MOVE', title: '하네다/나리타 도착 → 시내', desc: '', tip: { map: '渋谷駅' } },
        { time: '13:30', category: 'FOOD', title: '시부야 점심', desc: '', tip: { map: '渋谷 ランチ' } },
        { time: '14:30', category: 'TOUR', title: '스크램블 교차로 · 미야시타 파크', desc: '', tip: { map: 'MIYASHITA PARK' } },
        { time: '16:00', category: 'TOUR', title: '시부야 스카이', desc: '옥상 전망대에서 석양과 야경',
          tip: { hours: '10:00~22:30 (최종 입장 21:20, 자료마다 차이)', cautions: ['석양 시간대 웹 티켓 조기 매진 — 사전 예약'], notes: ['웹 티켓 성인 2,700엔~', '일몰 약 16:30'], map: 'SHIBUYA SKY', links: [['공식', 'https://www.shibuya-scramble-square.com/sky/']], verified: true } },
        { time: '18:30', category: 'FOOD', title: '시부야 요코초 저녁', desc: '야키토리·이자카야 골목', tip: { map: '渋谷横丁' } },
        { time: '20:00', category: 'HOTEL', title: '숙소', desc: '', tip: { map: '渋谷' } },
      ] },
      { title: '단풍 산책 · 신궁과 교엔', area: '하라주쿠 / 아오야마 / 신주쿠', items: [
        { time: '09:00', category: 'TOUR', title: '메이지 신궁', desc: '숲길을 따라 걷는 아침 참배', tip: { cautions: ['개문 시간은 일출·일몰에 맞춰 바뀜'], map: '明治神宮' } },
        { time: '10:30', category: 'TOUR', title: '신궁 외원 은행나무 길', desc: '약 300m 노란 은행나무 터널', tip: { hours: '상시', notes: ['예년 11월 중순~하순 절정', '이초 마츠리 2026 미발표, 주변 재개발 공사 진행'], map: '明治神宮外苑 いちょう並木', verified: true } },
        { time: '12:00', category: 'FOOD', title: '아오야마 · 오모테산도 점심', desc: '', tip: { map: '表参道 ランチ' } },
        { time: '13:30', category: 'TOUR', title: '신주쿠교엔 단풍', desc: '일본·영국·프랑스식 정원',
          tip: { hours: '9:00~16:00 (폐원 16:30)', closed: '월요일 (공휴일이면 다음 평일)', notes: ['일반 500엔'], map: '新宿御苑', links: [['환경성', 'https://www.env.go.jp/garden/shinjukugyoen/']], verified: true },
          closedDays: [1] },
        { time: '17:00', category: 'TOUR', title: '도쿄도청 전망실 야경', desc: '무료 전망대', tip: { cautions: ['남·북 전망실 운영 일정 확인'], map: '東京都庁 展望室' } },
        { time: '18:30', category: 'FOOD', title: '오모이데 요코초 저녁', desc: '좁은 골목의 꼬치 노포', tip: { map: '思い出横丁' } },
      ] },
      /* Day 3: 당일치기 코스 선택 (options 중 하나를 사용자가 고름) */
      { defaultOption: 'shizuoka', options: [
        { id: 'city', label: '도쿄 시내', emoji: '🏮', note: '당일치기 없이 시내', title: '아사쿠사 · 우에노 · 정원 야경', area: '아사쿠사 / 우에노 / 고마고메', items: [
        { time: '08:30', category: 'TOUR', title: '센소지', desc: '이른 아침 붐비기 전 참배', tip: { notes: ['경내는 상시 개방, 본당 개방 시간 별도'], map: '浅草寺' } },
        { time: '10:00', category: 'TOUR', title: '나카미세 거리', desc: '닌교야키·센베이 먹거리', tip: { map: '仲見世通り' } },
        { time: '11:30', category: 'FOOD', title: '아사쿠사 텐동 점심', desc: '', tip: { map: '浅草 天丼' } },
        { time: '13:00', category: 'TOUR', title: '우에노 공원 · 도쿄 국립박물관', desc: '', tip: { closed: '박물관 월요일 휴관 (공휴일 예외)', map: '東京国立博物館' }, closedDays: [1] },
        { time: '15:30', category: 'TOUR', title: '야나카 긴자 산책', desc: '옛 동네 상점가', tip: { map: '谷中銀座' } },
        { time: '18:00', category: 'TOUR', title: '리쿠기엔 야간 단풍', desc: '조명 비친 다이묘 정원',
          tip: { hours: '18:00~20:30 (입장 19:30까지)', notes: ['예매 1,000엔(온라인) · 당일 1,200엔', '기간 외라면 고이시카와 고라쿠엔 라이트업(11/13~24) 검토'], map: '六義園', links: [['공식 공지', 'https://www.tokyo-park.or.jp/park/rikugien/news/2026/rikugiengardens.html']], verified: true },
          window: { from: '2026-11-25', to: '2026-12-06', label: '야간 특별 관람' } },
        { time: '19:45', category: 'FOOD', title: '저녁', desc: '', tip: { map: '駒込駅' } },
        ] },

        { id: 'shizuoka', label: '시즈오카', emoji: '🗻', note: '신칸센 약 1시간', title: '당일치기 · 시즈오카 후지산 뷰', area: '니혼다이라 / 시미즈 / 미호', items: [
          { time: '07:30', category: 'MOVE', title: '도쿄역 → 시즈오카역 (신칸센)', desc: '히카리 약 1시간 · 노조미는 시즈오카에 서지 않음',
            tip: { notes: ['요금 자유석 5,940엔 / 지정석 6,470엔', '히카리는 시간당 1편 정도라 시간표 확인', '돌아올 때 자리가 걱정되면 고다마(약 1시간 20분)'], map: '静岡駅', verified: true } },
          { time: '08:45', category: 'MOVE', title: '시즈오카역 → 니혼다이라', desc: '노선버스 또는 택시 약 30~40분',
            tip: { cautions: ['버스 편수가 적어 시간표 확인 필수'], notes: ['니혼다이라·구노잔·시미즈·미호를 한 번에 돌려면 시즈오카역 렌터카가 가장 편함'], map: '日本平' } },
          { time: '09:15', category: 'TOUR', title: '니혼다이라 유메테라스', desc: '구마 켄고가 설계한 전망 시설, 후지산과 스루가만 조망',
            tip: { hours: '9:00~17:00 (토요일 ~21:00), 전망 회랑은 상시', closed: '둘째 주 화요일 (공휴일이면 다음 평일), 12/26~31', cautions: ['후지산은 맑은 오전에 잘 보임 — 구름 끼면 안 보일 수 있음', '휴관일은 자료가 오래되었을 수 있어 공식 확인'], map: '日本平夢テラス', links: [['공식', 'https://nihondaira-yume-terrace.jp/']], verified: true },
            closedRanges: [{ from: '2026-11-10', to: '2026-11-10', label: '둘째 주 화요일 휴관' }] },
          { time: '10:30', category: 'TOUR', title: '니혼다이라 로프웨이 → 구노잔 도쇼구', desc: '도쿠가와 이에야스를 모신 신사, 국보 사전',
            tip: { cautions: ['로프웨이 운행·배관 시간 공식 확인', '돌아올 때도 로프웨이를 타야 니혼다이라로 복귀 (반대편은 1,159계단)'], map: '久能山東照宮' } },
          { time: '12:30', category: 'FOOD', title: '시미즈항 참치덮밥', desc: '참치로 유명한 시미즈항의 수산 시장 "가시노이치"',
            tip: { cautions: ['휴무일·영업시간 방문 전 확인'], map: '清水魚市場 河岸の市' } },
          { time: '14:00', category: 'TOUR', title: '미호노마쓰바라', desc: '소나무 숲 너머 바다 위 후지산, 세계유산 구성 자산',
            tip: { hours: '해변은 상시 개방 · 방문자 센터 "미호시루베" 9:00~16:30', notes: ['맑은 날, 공기가 깨끗한 시간대일수록 후지산이 선명'], map: '三保松原', verified: true } },
          { time: '16:00', category: 'TOUR', title: '시즈오카역 기념품 · 녹차', desc: '시즈오카 녹차·와사비 절임·장어 파이',
            tip: { cautions: ['면세 환급 방식 — 영수증 보관'], map: '静岡駅 お土産' } },
          { time: '17:00', category: 'FOOD', title: '시즈오카 오뎅 이른 저녁', desc: '검은 국물에 가쓰오 가루를 뿌려 먹는 시즈오카식 오뎅',
            tip: { notes: ['역 근처 아오바 요코초·오뎅 골목', '현지 체인 "사와야카" 햄버그는 시즈오카현에만 있어 인기 — 대기 매우 김'], map: '静岡おでん 青葉横丁' } },
          { time: '18:30', category: 'MOVE', title: '시즈오카 → 도쿄', desc: '히카리 약 1시간 / 고다마 약 1시간 20분', tip: { map: '東京駅' } },
        ] },

        { id: 'kamakura', label: '가마쿠라', emoji: '⛩', note: 'JR 약 1시간', title: '당일치기 · 가마쿠라 & 에노시마', area: '기타카마쿠라 / 하세 / 에노시마', items: [
          { time: '08:00', category: 'MOVE', title: '도쿄역 → 기타카마쿠라', desc: 'JR 요코스카선 약 1시간',
            tip: { cautions: ['주말·연휴는 가마쿠라 전체가 매우 혼잡 — 이른 출발 권장'], map: '北鎌倉駅' } },
          { time: '09:00', category: 'TOUR', title: '엔가쿠지', desc: '역 바로 앞 선종 대사찰, 늦가을 단풍', tip: { cautions: ['배관 시간·요금 현장 확인'], map: '円覚寺' } },
          { time: '10:00', category: 'TOUR', title: '메이게츠인', desc: '둥근 창 너머 단풍으로 유명한 절',
            tip: { notes: ['본당 뒤 정원은 단풍기 한정 공개(예년 11월 말~12/10경, 별도 요금) — 2026년 일정 미확인', '단풍 절정은 예년 11월 하순~12월 상순'], map: '明月院' } },
          { time: '11:15', category: 'TOUR', title: '쓰루가오카 하치만구', desc: '가마쿠라의 상징 신사', tip: { map: '鶴岡八幡宮' } },
          { time: '12:00', category: 'FOOD', title: '고마치도리 시라스동', desc: '잔멸치(시라스) 덮밥, 가마쿠라 명물', tip: { cautions: ['점심 피크는 대기'], map: '小町通り しらす丼' } },
          { time: '13:30', category: 'TOUR', title: '고토쿠인 가마쿠라 대불', desc: '에노덴 하세역에서 도보 약 7분',
            tip: { notes: ['근처 하세데라는 11/21~12/6 야간 단풍 라이트업 예정(자료마다 일정 차이) · 400엔'], map: '高徳院 鎌倉大仏', links: [['하세데라 공지', 'https://www.hasedera.jp/2026/10/23900/']] } },
          { time: '14:45', category: 'TOUR', title: '가마쿠라코코마에 건널목', desc: '에노덴과 바다가 함께 보이는 애니메이션 명소',
            tip: { cautions: ['차도·선로 위 촬영 금지, 주민 생활 공간 — 매너 지키기'], map: '鎌倉高校前駅' } },
          { time: '15:30', category: 'TOUR', title: '에노시마 석양', desc: '맑으면 석양 속 후지산 실루엣',
            tip: { notes: ['일몰 약 16:30', '일루미네이션 "쇼난의 보석"은 2026년 12/1 시작이라 11월에는 해당 없음'], map: '江の島' , verified: true } },
          { time: '17:30', category: 'FOOD', title: '에노시마 해산물 저녁', desc: '시라스·사자에(소라) 구이', tip: { map: '江の島 しらす' } },
          { time: '18:30', category: 'MOVE', title: '도쿄 복귀', desc: '후지사와에서 JR 약 50분 / 오다큐로 신주쿠', tip: { map: '藤沢駅' } },
        ] },

        { id: 'kawagoe', label: '가와고에', emoji: '🍠', note: '전철 약 30분', title: '당일치기 · 가와고에 "작은 에도"', area: '가와고에 / 고마고메', items: [
          { time: '09:00', category: 'MOVE', title: '이케부쿠로 → 가와고에', desc: '도부 도조선 급행 약 30분', tip: { map: '川越駅' } },
          { time: '09:45', category: 'TOUR', title: '기타인 · 오백나한', desc: '표정이 모두 다른 540여 개의 나한상',
            tip: { hours: '대체로 9:00~16:00대 (11/24~ 단축, 자료마다 차이)', notes: ['국화 축제 11/1~11/23', '단풍은 예년 11월 하순~12월 상순'], map: '喜多院', verified: true } },
          { time: '11:00', category: 'TOUR', title: '구라즈쿠리 거리 · 시간의 종', desc: '흙벽 창고 건물이 늘어선 에도풍 거리', tip: { cautions: ['보행로가 좁고 차가 다님 — 주의'], map: '時の鐘 川越' } },
          { time: '12:00', category: 'FOOD', title: '가와고에 장어덮밥', desc: '가와고에 명물 우나주', tip: { cautions: ['인기점은 정리권·대기 — 오픈 직후 권장'], map: '川越 うなぎ' } },
          { time: '13:30', category: 'TOUR', title: '가시야 요코초 · 고구마 간식', desc: '옛 과자 골목과 고구마 디저트', tip: { notes: ['가게 대부분 저녁 전 폐점'], map: '菓子屋横丁' } },
          { time: '14:30', category: 'TOUR', title: '가와고에 히카와 신사', desc: '도미 모양 운세 뽑기(낚시)로 유명', tip: { map: '川越氷川神社' } },
          { time: '16:00', category: 'MOVE', title: '도쿄 복귀 (고마고메 방면)', desc: '이케부쿠로 경유, 야마노테선 고마고메역', tip: { map: '駒込駅' } },
          { time: '18:00', category: 'TOUR', title: '리쿠기엔 야간 단풍', desc: '돌아와서 조명 비친 다이묘 정원',
            tip: { hours: '18:00~20:30 (입장 19:30까지)', notes: ['예매 1,000엔(온라인) · 당일 1,200엔'], map: '六義園', links: [['공식 공지', 'https://www.tokyo-park.or.jp/park/rikugien/news/2026/rikugiengardens.html']], verified: true },
            window: { from: '2026-11-25', to: '2026-12-06', label: '야간 특별 관람' } },
          { time: '19:45', category: 'FOOD', title: '저녁', desc: '', tip: { map: '駒込駅' } },
        ] },
      ] },
      { title: '시장 아침 → 귀국', area: '쓰키지 / 긴자', items: [
        { time: '07:30', category: 'FOOD', title: '쓰키지 장외시장 아침', desc: '해산물 덮밥·계란말이',
          tip: { hours: '가게마다 다름 (대체로 오전 중심)', closed: '일요일·수요일 휴무 가게 많음', map: '築地場外市場' }, closedDays: [0, 3] },
        { time: '09:30', category: 'TOUR', title: '긴자 쇼핑', desc: '', tip: { cautions: ['면세 환급 방식 — 영수증·구매품 지참'], map: '銀座' } },
        { time: '11:00', category: 'MOVE', title: '공항 이동', desc: '하네다 약 30분 / 나리타 1시간 이상', tip: { map: '羽田空港 第3ターミナル' } },
        { time: '12:30', category: 'MOVE', title: '출국 수속', desc: '면세 세관 확인 → 수하물 위탁', tip: { map: '羽田空港 第3ターミナル' } },
      ] },
    ],
  },

  /* ───────────────────────── 삿포로 ───────────────────────── */
  {
    id: 'sapporo', name: '삿포로', sub: '삿포로 · 오타루', nameJa: '札幌', group: '홋카이도', emoji: '❄️',
    color: 'snow',
    tagline: '첫눈과 일루미네이션, 크리스마스 시장이 열리는 계절',
    highlights: ['화이트 일루미네이션 (11/20~)', '오타루 운하', '모이와산 야경'],
    weather: { high: 7, low: 0, sunset: '16:05', note: '하순에는 눈이 내릴 수 있습니다. 미끄럼 방지 신발·장갑 준비.' },
    access: [
      '인천 → 신치토세 공항(약 3시간) → JR 쾌속 에어포트로 삿포로역 약 40분.',
      '시내는 지하철·노면전차, 오타루는 JR로 이동.',
    ],
    alerts: [
      { level: 'info', text: '삿포로 화이트 일루미네이션(오도리 회장) 11/20~12/25, 16:30~22:00 · 뮌헨 크리스마스 시장 11/20~12/25, 11:00~21:00.', from: '2026-11-20', to: '2026-12-25', link: ['공식', 'https://www.sapporo.travel/white-illumination/'] },
      { level: 'info', text: '삿포로 맥주 박물관은 2026년 7월 리뉴얼 후 유료화되었습니다.' },
    ],
    days: [
      { title: '도착 · 오도리 공원', area: '삿포로 중심가', items: [
        { time: '12:30', category: 'MOVE', title: '신치토세 공항 → 삿포로역', desc: 'JR 쾌속 에어포트 약 40분', tip: { map: '新千歳空港' } },
        { time: '14:00', category: 'FOOD', title: '수프카레 점심', desc: '삿포로 대표 음식', tip: { cautions: ['인기점은 대기'], map: '札幌 スープカレー' } },
        { time: '15:30', category: 'TOUR', title: '오도리 공원 · TV 타워', desc: '', tip: { map: 'さっぽろテレビ塔' } },
        { time: '16:30', category: 'TOUR', title: '화이트 일루미네이션 & 크리스마스 시장', desc: '오도리 공원을 밝히는 빛 장식과 독일식 시장',
          tip: { hours: '일루미네이션 16:30~22:00 / 시장 11:00~21:00', notes: ['입장 무료', '기간 외에는 오도리 공원·시계탑 야경으로 대체'], map: '大通公園', links: [['공식', 'https://www.sapporo.travel/white-illumination/']], verified: true },
          window: { from: '2026-11-20', to: '2026-12-25', label: '일루미네이션' } },
        { time: '18:30', category: 'FOOD', title: '징기스칸 저녁', desc: '양고기 철판구이, 스스키노', tip: { cautions: ['인기점 줄 서기'], map: 'すすきの ジンギスカン' } },
        { time: '20:00', category: 'HOTEL', title: '숙소', desc: '삿포로역·오도리 주변', tip: { map: '札幌駅' } },
      ] },
      { title: '오타루 당일치기', area: '오타루', items: [
        { time: '09:00', category: 'MOVE', title: 'JR 삿포로 → 오타루', desc: '쾌속 약 35~45분', tip: { map: '小樽駅' } },
        { time: '09:45', category: 'FOOD', title: '산카쿠 시장 해산물 덮밥', desc: '오타루역 옆 작은 시장', tip: { map: '小樽 三角市場' } },
        { time: '11:00', category: 'TOUR', title: '오타루 운하', desc: '석조 창고와 운하 산책', tip: { map: '小樽運河' } },
        { time: '12:00', category: 'TOUR', title: '사카이마치 거리 · 오르골당', desc: '유리 공예·오르골 상점가', tip: { cautions: ['상점 대부분 17~18시 폐점'], map: '小樽オルゴール堂 本館' } },
        { time: '14:30', category: 'FOOD', title: '르타오 디저트', desc: '더블 프로마주', tip: { map: 'ルタオ 本店' } },
        { time: '16:00', category: 'TOUR', title: '운하 가스등 점등', desc: '해 진 뒤 운하 야경', tip: { notes: ['일몰 약 16:05'], map: '小樽運河 浅草橋' } },
        { time: '17:30', category: 'MOVE', title: '삿포로 복귀', desc: '', tip: { map: '札幌駅' } },
        { time: '19:00', category: 'FOOD', title: '라멘 요코초', desc: '스스키노 미소 라멘 골목', tip: { map: '元祖さっぽろラーメン横丁' } },
      ] },
      { title: '과자 · 맥주 · 야경', area: '미야노사와 / 히가시구 / 모이와산', items: [
        { time: '10:00', category: 'TOUR', title: '시로이 코이비토 파크', desc: '과자 공장 견학과 영국풍 정원', tip: { cautions: ['영업시간·입관료 공식 확인'], map: '白い恋人パーク', links: [['공식', 'https://www.shiroikoibitopark.jp/']] } },
        { time: '12:30', category: 'FOOD', title: '삿포로 맥주원 징기스칸', desc: '붉은 벽돌 건물에서 생맥주와 함께', tip: { map: 'サッポロビール園' } },
        { time: '14:00', category: 'TOUR', title: '삿포로 맥주 박물관', desc: '2026년 7월 리뉴얼, 5개 언어 오디오 가이드(한국어 포함)',
          tip: { hours: '11:00~18:00 (최종 입관 17:30)', notes: ['2026.7.1부터 유료 · 가이드 투어 성인 2,000엔(시음 2잔)'], map: 'サッポロビール博物館', links: [['공식', 'https://sapporo-bier-garten.jp/other/museum/']], verified: true } },
        { time: '16:00', category: 'TOUR', title: '모이와산 로프웨이 야경', desc: '일본 신 3대 야경',
          tip: { hours: '4~11월 10:30~22:00 (상행 마지막 21:30)', cautions: ['악천후 시 운휴', '모이와산 관광도로(차량)는 11/21부터 동절기 통행 금지 — 로프웨이 이용'], map: 'もいわ山ロープウェイ', links: [['공식', 'https://mt-moiwa.jp/guide/']], verified: true } },
        { time: '19:00', category: 'FOOD', title: '스스키노 해산물 이자카야', desc: '게·연어알·홋케', tip: { map: 'すすきの 海鮮 居酒屋' } },
      ] },
      { title: '시장 아침 → 귀국', area: '니조 시장 / 신치토세', items: [
        { time: '07:30', category: 'FOOD', title: '니조 시장 해산물 덮밥', desc: '', tip: { closed: '수·목요일 휴무 가게 많음', map: '二条市場' }, closedDays: [3, 4] },
        { time: '09:30', category: 'TOUR', title: '삿포로 시계탑', desc: '', tip: { map: '札幌市時計台' } },
        { time: '10:30', category: 'MOVE', title: 'JR → 신치토세 공항', desc: '', tip: { map: '新千歳空港' } },
        { time: '11:30', category: 'TOUR', title: '공항 쇼핑 · 로이스 초콜릿 월드', desc: '홋카이도 과자 총집합', tip: { cautions: ['면세 환급 방식 — 세관 확인 후 수하물 위탁'], map: '新千歳空港 国際線' } },
        { time: '13:00', category: 'MOVE', title: '출국 수속', desc: '', tip: { map: '新千歳空港 国際線' } },
      ] },
    ],
  },
];

/* id 부여 */
REGIONS.forEach((r) => r.days.forEach((d, di) => {
  const tag = (items, prefix) => items.forEach((it, ii) => { it.id = `${prefix}-${ii}`; it.day = di + 1; });
  if (d.options) d.options.forEach((o) => tag(o.items, `${r.id}-${di + 1}-${o.id}`));
  else tag(d.items, `${r.id}-${di + 1}`);
}));
