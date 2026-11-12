const tg = window.Telegram?.WebApp;
if (tg) {
  tg.expand();
  tg.ready();
  tg.setHeaderColor?.('#0b1424');
  tg.setBackgroundColor?.('#0b1424');
}

// ======= ДАННЫЕ =======
const CASES = [
  { id: 'dragon',  name: 'Дракон',   price: 500, img: '🐉', maxDrop: 9466 },
  { id: 'tako',    name: 'Тако',     price: 209, img: '🌮', maxDrop: 2113 },
  { id: 'nubini',  name: 'Нубини',   price: 19,  img: '🧱', maxDrop: 1255 },
  { id: 'lucky',   name: 'Лаки-Блок',price: 259, img: '❓', maxDrop: 15000 },
  { id: 'base',    name: 'Базовый',  price: 27,  img: '📦', maxDrop: 1000 },
  { id: 'og',      name: 'ОГ',       price: 229, img: '👑', maxDrop: 232000 },
  { id: 'sixseven',name: 'Сикс Севен',price: 67, img: '🎨', maxDrop: 2622 },
  { id: 'girsy',   name: 'Гирсы',    price: 17,  img: '🔨', maxDrop: 1259 },
  { id: 'losy',    name: 'Лосы',     price: 139, img: '👻', maxDrop: 18000 },
  { id: 'dls',     name: 'ДЛС',      price: 229, img: '🧇', maxDrop: 8960 },
];

const THEMES = [
  { id: 'ny',       name: 'Новогодний',     price: 179, img: '🎄', maxDrop: 13000 },
  { id: 'sea',      name: 'Морская Братва', price: 119, img: '🦈', maxDrop: 11000 },
  { id: 'summer',   name: 'Летний',         price: 769, img: '🐙', maxDrop: 13000 },
  { id: 'easter',   name: 'Пасхальный',     price: 219, img: '🐰', maxDrop: 9106 },
  { id: 'jubilee',  name: 'Юбилейный',      price: 209, img: '🎂', maxDrop: 6737 },
  { id: 'honey',    name: 'Медовый',        price: 159, img: '🐝', maxDrop: 1774 },
  { id: 'halloween',name: 'Хэллоуинский',   price: 339, img: '🎃', maxDrop: 5461 },
];

const PARTNERS = [
  { id: 'nikil',    name: 'Никил',    price: 49,  img: '👹', maxDrop: 2793 },
  { id: 'lisharty', name: 'Лишарти',  price: 89,  img: '🎩', maxDrop: 3470 },
  { id: 'wizard',   name: 'Визард',   price: 49,  img: '🧙', maxDrop: 2139 },
  { id: 'smorty',   name: 'Сморти',   price: 19,  img: '🧛', maxDrop: 1416 },
  { id: 'falcon',   name: 'Фалкон',   price: 69,  img: '🦅', maxDrop: 1801 },
  { id: 'rakano',   name: 'Ракану',   price: 69,  img: '🔥', maxDrop: 3955 },
  { id: 'dimakris', name: 'Дима Крис',price: 69,  img: '👻', maxDrop: 1604 },
  { id: 'hiro',     name: 'Хиро',     price: 69,  img: '🐲', maxDrop: 3701 },
];

const FREE = [
  { id: 'free',    name: 'Бесплатный',   price: 0,   img: '🎁', maxDrop: 90,    sub: 'через 11ч 49м' },
  { id: 'deposit', name: 'За депозит',   price: 0,   img: '🍀', maxDrop: 25000, sub: 'Осталось Ⓑ 200' },
  { id: 'ref',     name: 'Реферальный',  price: 0,   img: '💰', maxDrop: 1009,  sub: 'Уже забрано' },
  { id: 'crystal', name: 'Кристальный',  price: 109, img: '💎', maxDrop: 325,   sub: 'Ⓑ 109' },
  { id: 'phantom', name: 'Фантомный',    price: 240, img: '👻', maxDrop: 9106,  sub: 'Ⓑ 240' },
  { id: 'stake',   name: 'За стейкинг',  price: 0,   img: '🍔', maxDrop: 336,   sub: 'За успешный стейкинг' },
];

const LOOT = [
  { name:'Griffin',             price:9466, img:'🦅', rare:'#10b981' },
  { name:'Dragon Aquanini',     price:8905, img:'🐲', rare:'#a855f7' },
  { name:'La Supreme Combinasion',price:2304, img:'👥', rare:'#6b7280' },
  { name:'Hydra Dragon Cannelloni',price:2220, img:'🐍', rare:'#ec4899' },
  { name:'Moby Bros',           price:1604, img:'🚢', rare:'#6b7280' },
  { name:'Dragon Cannelloni',   price:1413, img:'🐉', rare:'#f59e0b' },
  { name:'Dragon Cannelloni',   price:1244, img:'🐲', rare:'#ec4899' },
  { name:'Dragon Cannelloni',   price:1005, img:'🐉', rare:'#3b82f6' },
  { name:'Dragon Cannelloni',   price:973,  img:'🐲', rare:'#f59e0b' },
];

// ======= СОСТОЯНИЕ =======
const state = {
  balance: 1000, // стартовый баланс для теста
  currentCase: null,
  qty: 1,
};

// ======= РЕНДЕР =======
const fmt = n => n.toLocaleString('ru-RU');

function renderCases(gridId, list) {
  const grid = document.getElementById(gridId);
  grid.innerHTML = list.map(c => `
    <div class="case-card" data-id="${c.id}">
      <div class="case-img">${c.img}</div>
      <div class="case-name">${c.name}</div>
      <div class="case-maxdrop">до ${fmt(c.maxDrop)}</div>
      <div class="case-price">${c.price > 0 ? `<span class="coin">Ⓑ</span> ${fmt(c.price)}` : (c.sub || 'Бесплатно')}</div>
    </div>
  `).join('');
  grid.querySelectorAll('.case-card').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      const c = [...CASES, ...THEMES, ...PARTNERS, ...FREE].find(x => x.id === id);
      openCaseDetail(c);
    });
  });
}

function renderLoot() {
  document.getElementById('lootGrid').innerHTML = LOOT.map(l => `
    <div class="loot-card">
      <div class="loot-rarity" style="background:${l.rare}"></div>
      <div class="loot-img">${l.img}</div>
      <div class="loot-name">${l.name}</div>
      <div class="loot-price"><span class="coin">Ⓑ</span> ${fmt(l.price)}</div>
    </div>
  `).join('');
}

function updateBalance() {
  document.getElementById('balance').textContent = fmt(state.balance);
  const pb = document.getElementById('profileBalance');
  if (pb) pb.textContent = fmt(state.balance);
}

// ======= НАВИГАЦИЯ =======
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
  window.scrollTo(0, 0);
}

document.querySelectorAll('.nav-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    showScreen(btn.dataset.screen);
  });
});

document.getElementById('backBtn').addEventListener('click', () => {
  showScreen('cases');
  document.querySelector('.nav-item[data-screen="cases"]').classList.add('active');
});

// ======= ДЕТАЛИ КЕЙСА =======
function openCaseDetail(c) {
  state.currentCase = c;
  state.qty = 1;
  document.getElementById('caseHeroImg').textContent = c.img;
  document.getElementById('caseHeroTitle').textContent = c.name;
  document.getElementById('qty1').textContent = fmt(c.price);
  document.getElementById('qty3').textContent = fmt(c.price * 3);
  document.getElementById('qty5').textContent = fmt(c.price * 5);
  document.getElementById('openPrice').textContent = fmt(c.price);
  document.querySelectorAll('.qty-tab').forEach(t => t.classList.toggle('active', t.dataset.qty === '1'));
  showScreen('case');
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
}

document.querySelectorAll('.qty-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.qty-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    state.qty = +tab.dataset.qty;
    const total = state.currentCase.price * state.qty;
    document.getElementById('openPrice').textContent = fmt(total);
  });
});

// ======= ОТКРЫТИЕ КЕЙСА =======
document.getElementById('openBtn').addEventListener('click', () => {
  const total = state.currentCase.price * state.qty;
  if (state.balance < total) {
    tg?.showAlert?.('Недостаточно средств. Пополни баланс.') ?? alert('Недостаточно средств');
    return;
  }
  state.balance -= total;
  updateBalance();

  const modal = document.getElementById('openModal');
  const anim = document.getElementById('openAnim');
  const title = document.getElementById('openTitle');
  const sub = document.getElementById('openSub');
  const close = document.getElementById('closeOpen');

  anim.textContent = state.currentCase.img;
  title.textContent = 'Открываем...';
  sub.textContent = '';
  close.style.display = 'none';
  modal.classList.add('show');
  tg?.HapticFeedback?.impactOccurred?.('medium');

  setTimeout(() => {
    const prize = LOOT[Math.floor(Math.random() * LOOT.length)];
    anim.textContent = prize.img;
    title.textContent = prize.name;
    sub.innerHTML = `Выпало! <span class="coin">Ⓑ</span> ${fmt(prize.price)}`;
    close.style.display = 'block';
    state.balance += prize.price;
    updateBalance();
    tg?.HapticFeedback?.notificationOccurred?.('success');
  }, 1800);
});

document.getElementById('closeOpen').addEventListener('click', () => {
  document.getElementById('openModal').classList.remove('show');
});

// ======= ПОПОЛНЕНИЕ =======
document.getElementById('topupBtn').addEventListener('click', () => {
  document.getElementById('topupModal').classList.add('show');
});
document.getElementById('balanceBtn').addEventListener('click', () => {
  document.getElementById('topupModal').classList.add('show');
});
document.getElementById('closeTopup').addEventListener('click', () => {
  document.getElementById('topupModal').classList.remove('show');
});
document.querySelectorAll('.tt').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.tt').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
  });
});
document.getElementById('createInvoice').addEventListener('click', () => {
  tg?.showAlert?.('Счёт создан (демо). Здесь будет Telegram Stars API.') ?? alert('Демо: оплата');
});

// ======= МЕНЮ ПРОФИЛЯ =======
document.getElementById('menuBtn').addEventListener('click', () => {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.querySelector('.nav-item[data-screen="profile"]').classList.add('active');
  showScreen('profile');
});

// ======= ИНИЦИАЛИЗАЦИЯ =======
renderCases('casesGrid', CASES);
renderCases('themesGrid', THEMES);
renderCases('partnersGrid', PARTNERS);
renderCases('freeGrid', FREE);
renderLoot();
updateBalance();

const user = tg?.initDataUnsafe?.user;
if (user) {
  document.getElementById('profileName').textContent = '@' + (user.username || user.first_name);
}
