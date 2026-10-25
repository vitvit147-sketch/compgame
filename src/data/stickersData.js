// src/data/stickersData.js
// База популярных персонажей для игры «Стикеры» («Кто я?», «Лобстер», «Стикер на лоб»)

export const STICKERS_CATEGORIES = [
  { id: 'all', title: 'Все подряд (Всё включено)', icon: '🎲' },
  { id: 'cinema', title: 'Кино, сериалы и мультфильмы', icon: '🎬' },
  { id: 'real', title: 'Знаменитости и исторические личности', icon: '🌟' },
  { id: 'memes', title: 'Мемы, блогеры и игры', icon: '📱' },
  { id: 'objects', title: 'Предметы, животные и еда', icon: '🍕' }
];

export const STICKERS_DATABASE = [
  // --- КИНО, СЕРИАЛЫ И МУЛЬТФИЛЬМЫ ---
  { name: 'Шрек', category: 'cinema', hint: 'Зелёный огр из болота' },
  { name: 'Гарри Поттер', category: 'cinema', hint: 'Мальчик, который выжил' },
  { name: 'Дарт Вейдер', category: 'cinema', hint: 'Люк, я твой отец' },
  { name: 'Капитан Джек Воробей', category: 'cinema', hint: 'Пират Карибского моря' },
  { name: 'Чебурашка', category: 'cinema', hint: 'Любит апельсины и крокодила Гену' },
  { name: 'Гомер Симпсон', category: 'cinema', hint: 'Любит пончики и пиво' },
  { name: 'Терминатор', category: 'cinema', hint: 'I\'ll be back' },
  { name: 'Губка Боб Квадратные Штаны', category: 'cinema', hint: 'Живёт на дне океана в ананасе' },
  { name: 'Бэтмен', category: 'cinema', hint: 'Тёмный рыцарь Готэма' },
  { name: 'Человек-паук (Питер Паркер)', category: 'cinema', hint: 'С великой силой приходит великая ответственность' },
  { name: 'Винни-Пух', category: 'cinema', hint: 'Медвежонок с опилками в голове' },
  { name: 'Шерлок Холмс', category: 'cinema', hint: 'Великий сыщик с Бейкер-стрит' },
  { name: 'Тони Старк (Железный Человек)', category: 'cinema', hint: 'Гений, миллиардер, плейбой, филантроп' },
  { name: 'Волан-де-Морт', category: 'cinema', hint: 'Тот, чьё имя нельзя называть' },
  { name: 'Джокер', category: 'cinema', hint: 'Почему ты такой серьёзный?' },
  { name: 'Буратино', category: 'cinema', hint: 'Деревянный мальчик с длинным носом' },
  { name: 'Карлсон', category: 'cinema', hint: 'Мужчина в самом расцвете сил с пропеллером' },
  { name: 'Граф Дракула', category: 'cinema', hint: 'Вампир из Трансильвании' },
  { name: 'Миньон', category: 'cinema', hint: 'Жёлтый помощник Грю, любит бананы' },
  { name: 'Барби', category: 'cinema', hint: 'Кукла из розового мира' },
  { name: 'Гринч', category: 'cinema', hint: 'Похититель Рождества' },
  { name: 'Танос', category: 'cinema', hint: 'Щёлкнул пальцами в перчатке бесконечности' },
  { name: 'Дэдпул', category: 'cinema', hint: 'Болтливый наёмник в красном костюме' },
  { name: 'Магистр Йода', category: 'cinema', hint: 'Да пребудет с тобой Сила' },
  { name: 'Остап Бендер', category: 'cinema', hint: 'Великий комбинатор' },
  { name: 'Кот в сапогах', category: 'cinema', hint: 'Делает умильные огромные глаза' },
  { name: 'Незнайка', category: 'cinema', hint: 'Коротышка в большой синей шляпе' },
  { name: 'Супермен', category: 'cinema', hint: 'Пришелец с Криптона' },
  { name: 'Волк из «Ну, погоди!»', category: 'cinema', hint: 'Вечно гоняется за Зайцем' },
  { name: 'Северус Снегг', category: 'cinema', hint: 'Всегда...' },
  { name: 'Фродо Бэггинс', category: 'cinema', hint: 'Нёс Кольцо Всевластья в Мордор' },
  { name: 'Джеймс Бонд (Агент 007)', category: 'cinema', hint: 'Взболтать, но не смешивать' },
  { name: 'Хагрид', category: 'cinema', hint: 'Лесничий в Хогвартсе' },
  { name: 'Морфеус', category: 'cinema', hint: 'Красная или синяя таблетка?' },
  { name: 'Леголас', category: 'cinema', hint: 'Эльф-лучник' },
  { name: 'Олаф', category: 'cinema', hint: 'Снеговик, который любит жаркие объятия' },
  { name: 'Скуби-Ду', category: 'cinema', hint: 'Трусливый пёс-детектив' },
  { name: 'Ганнибал Лектер', category: 'cinema', hint: 'Молчание ягнят' },
  { name: 'Индиана Джонс', category: 'cinema', hint: 'Археолог с хлыстом и в шляпе' },
  { name: 'Уэнсдэй Аддамс', category: 'cinema', hint: 'Танец под Goo Goo Muck' },
  { name: 'Джон Уик', category: 'cinema', hint: 'Не трогайте его собаку' },
  { name: 'Пятачок', category: 'cinema', hint: 'Кажется, дождь собирается...' },
  { name: 'Гена Букин', category: 'cinema', hint: 'Продавец обуви, хет-трик в финале' },
  { name: 'Доктор Хаус', category: 'cinema', hint: 'Все врут' },

  // --- ЗНАМЕНИТОСТИ И ИСТОРИЧЕСКИЕ ЛИЧНОСТИ ---
  { name: 'Илон Маск', category: 'real', hint: 'Tesla, SpaceX и чип в мозгу' },
  { name: 'Альберт Эйнштейн', category: 'real', hint: 'Теория относительности и язык на фото' },
  { name: 'Майкл Джексон', category: 'real', hint: 'Король поп-музыки и лунная походка' },
  { name: 'Леонардо Ди Каприо', category: 'real', hint: 'Долго ждал свой Оскар' },
  { name: 'Лионель Месси', category: 'real', hint: 'Чемпион мира по футболу из Аргентины' },
  { name: 'Криштиану Роналду', category: 'real', hint: 'SIUUUU!' },
  { name: 'Юлий Цезарь', category: 'real', hint: 'И ты, Брут?' },
  { name: 'Наполеон Бонапарт', category: 'real', hint: 'Император Франции и вкусный торт' },
  { name: 'Александр Пушкин', category: 'real', hint: 'Солнце русской поэзии, погиб на дуэли' },
  { name: 'Клеопатра', category: 'real', hint: 'Царица Египта' },
  { name: 'Стив Джобс', category: 'real', hint: 'Основатель Apple в чёрной водолазке' },
  { name: 'Киану Ривз', category: 'real', hint: 'Самый добрый актёр Голливуда' },
  { name: 'Майк Тайсон', category: 'real', hint: 'Откусил ухо Холифилду' },
  { name: 'Брюс Ли', category: 'real', hint: 'Легенда кунг-фу' },
  { name: 'Мэрилин Монро', category: 'real', hint: 'Летящее белое платье' },
  { name: 'Арнольд Шварценеггер', category: 'real', hint: 'Железный Арни и губернатор' },
  { name: 'Гордон Рамзи', category: 'real', hint: 'Оно сырое-е-е!' },
  { name: 'Дональд Трамп', category: 'real', hint: 'Причёска и Make America Great Again' },
  { name: 'Юрий Гагарин', category: 'real', hint: 'Поехали! Первый человек в космосе' },
  { name: 'Уолт Дисней', category: 'real', hint: 'Создатель Микки Мауса' },
  { name: 'Королева Елизавета II', category: 'real', hint: 'Правила Великобританией 70 лет' },
  { name: 'Ван Гог', category: 'real', hint: 'Художник без части уха и «Звёздная ночь»' },
  { name: 'Джеки Чан', category: 'real', hint: 'Все трюки выполняет сам' },
  { name: 'Джонни Депп', category: 'real', hint: 'Суд с Эмбер Хёрд и капитан' },
  { name: 'Уилл Смит', category: 'real', hint: 'Дал пощёчину на Оскаре' },

  // --- МЕМЫ, БЛОГЕРЫ И ИГРЫ ---
  { name: 'Хасбик (Хасбулла)', category: 'memes', hint: 'Клубника-бомба, честно говоря' },
  { name: 'Гигачад (Gigachad)', category: 'memes', hint: 'Идеальный мужчина с квадратной челюстью' },
  { name: 'Ждун', category: 'memes', hint: 'Сидит сложа ручки и ждёт' },
  { name: 'Доге (Собака Сиба-ину)', category: 'memes', hint: 'Вау, такой мем, очень крипта' },
  { name: 'Лягушонок Пепе', category: 'memes', hint: 'Грустная зелёная лягушка' },
  { name: 'Капибара', category: 'memes', hint: 'Самый спокойный зверь в мире' },
  { name: 'Скибиди Туалет', category: 'memes', hint: 'Голова из унитаза поёт песню' },
  { name: 'Рик Эстли (Rickroll)', category: 'memes', hint: 'Never gonna give you up' },
  { name: 'Собака в огне ("This is fine")', category: 'memes', hint: 'Всё в порядке, сидит в горящей комнате' },
  { name: 'MrBeast', category: 'memes', hint: 'Раздаёт миллионы долларов на YouTube' },
  { name: 'Марио', category: 'memes', hint: 'Итальянский водопроводчик спасает принцессу' },
  { name: 'Пикачу', category: 'memes', hint: 'Жёлтый покемон с ударом молнии' },
  { name: 'Соник', category: 'memes', hint: 'Сверхзвуковой синий ёж' },
  { name: 'Стив из Minecraft', category: 'memes', hint: 'Квадратный человечек с киркой' },
  { name: 'Ведьмак (Геральт из Ривии)', category: 'memes', hint: 'Заразы... Чеканная монета' },
  { name: 'Скала (Дуэйн Джонсон)', category: 'memes', hint: 'Фирменный взгляд с поднятой бровью' },
  { name: 'Кот Борис', category: 'memes', hint: 'Любит Китикет' },
  { name: 'Свидетель из Фрязино', category: 'memes', hint: 'В белых штанах и кожаной куртке' },

  // --- ПРЕДМЕТЫ, ЖИВОТНЫЕ И ЕДА ---
  { name: 'Тостер', category: 'objects', hint: 'Выстреливает горячим хлебом' },
  { name: 'Пылесос', category: 'objects', hint: 'Гудит и пугает котов' },
  { name: 'Шаурма', category: 'objects', hint: 'Божественный свиток в лаваше' },
  { name: 'Носок без пары', category: 'objects', hint: 'Потерялся в стиральной машине' },
  { name: 'Банан', category: 'objects', hint: 'Жёлтый фрукт с кожурой' },
  { name: 'Холодильник', category: 'objects', hint: 'Открывают ночью каждые 15 минут' },
  { name: 'Пельмень', category: 'objects', hint: 'Мясо в тесте варится в кастрюле' },
  { name: 'Резиновая уточка', category: 'objects', hint: 'Плавает в ванной и помогает программистам' },
  { name: 'Будильник', category: 'objects', hint: 'Самый ненавистный предмет в 7 утра' },
  { name: 'Микроволновка', category: 'objects', hint: 'Греет тарелку, а не еду' },
  { name: 'Кактус', category: 'objects', hint: 'Колючий цветок возле компьютера' },
  { name: 'Пицца', category: 'objects', hint: 'Круглая, в квадратной коробке, едят треугольниками' },
  { name: 'Утюг', category: 'objects', hint: 'Не забыл ли ты его выключить?' },
  { name: 'Смартфон', category: 'objects', hint: 'Прямо сейчас у тебя в руках' },
  { name: 'Зубная щётка', category: 'objects', hint: 'Чистит зубы утром и вечером' },
  { name: 'Чайник', category: 'objects', hint: 'Свистит, когда закипает' }
];

export function getRandomSticker(category = 'all') {
  let pool = STICKERS_DATABASE;
  if (category && category !== 'all') {
    pool = STICKERS_DATABASE.filter(item => item.category === category);
    if (pool.length === 0) pool = STICKERS_DATABASE;
  }
  const item = pool[Math.floor(Math.random() * pool.length)];
  return item.name;
}

// Вопросы-подсказки для игроков (Шпаргалка)
export const STICKERS_QUESTION_HINTS = [
  { category: 'Базовые', questions: ['Я живое существо?', 'Я человек?', 'Я реальный или вымышленный?'] },
  { category: 'Пол и возраст', questions: ['Я мужчина?', 'Я женщина?', 'Я взрослый или ребёнок/детёныш?'] },
  { category: 'Сфера', questions: ['Я из фильма или мультика?', 'Я певец / музыкант?', 'Я спортсмен?', 'Я политик или учёный?'] },
  { category: 'Внешность', questions: ['У меня есть волосы/шерсть?', 'Я ношу очки или шляпу?', 'Я необычного цвета (зелёный, синий)?'] },
  { category: 'Если предмет', questions: ['Меня можно съесть?', 'Я нахожусь в комнате / доме?', 'Я сделан из металла или пластика?'] }
];
