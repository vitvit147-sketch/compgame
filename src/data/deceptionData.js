// src/data/deceptionData.js - Данные для игры «Криминалист: Убийство в Гонконге» (Deception: Murder in Hong Kong)

// ============================================================================
// 1. ОРУДИЯ ПРЕСТУПЛЕНИЯ (СИНИЕ КАРТЫ) - 50 шт
// ============================================================================
export const DECEPTION_MEANS = [
  { id: 'm_knife', title: 'Охотничий нож', icon: '🔪', category: 'Холодное оружие', desc: 'Острое зазубренное лезвие со следами очистки.' },
  { id: 'm_poison', title: 'Яд в бокале', icon: '🧪', category: 'Яды и токсины', desc: 'Бесцветный раствор быстрого нервно-паралитического действия.' },
  { id: 'm_strangle', title: 'Удушение шнуром', icon: '🪢', category: 'Удушение', desc: 'Тонкий капроновый шнур, оставивший глубокую борозду.' },
  { id: 'm_pistol', title: 'Пистолет с глушителем', icon: '🔫', category: 'Огнестрельное', desc: 'Калибр 9мм, глушитель снизил звук выстрела до шепота.' },
  { id: 'm_axe', title: 'Пожарный топор', icon: '🪓', category: 'Холодное оружие', desc: 'Тяжелый топор с красной рукоятью из пожарного щита.' },
  { id: 'm_electricity', title: 'Оголенный провод', icon: '⚡', category: 'Электричество', desc: 'Электрический провод под напряжением, брошенный в воду.' },
  { id: 'm_brick', title: 'Строительный кирпич', icon: '🧱', category: 'Тупой предмет', desc: 'Увесистый красный силикатный кирпич со сколом.' },
  { id: 'm_fire', title: 'Канистра бензина', icon: '🔥', category: 'Поджог', desc: 'Огонь уничтожил улики и скрыл следы на теле.' },
  { id: 'm_car', title: 'Наезд автомобилем', icon: '🚗', category: 'Транспорт', desc: 'Тяжелый внедорожник на высокой скорости сбил жертву.' },
  { id: 'm_sleeping_pills', title: 'Смертельная доза снотворного', icon: '💊', category: 'Медикаменты', desc: 'Смесь барбитуратов в огромной концентрации.' },
  { id: 'm_drowning', title: 'Утопление в ванной', icon: '🛁', category: 'Утопление', desc: 'Вода с мыльной пеной заполнила легкие.' },
  { id: 'm_scissors', title: 'Портновские ножницы', icon: '✂️', category: 'Колюще-режущее', desc: 'Длинные массивные стальные ножницы с острыми концами.' },
  { id: 'm_hammer', title: 'Слесарный молоток', icon: '🔨', category: 'Тупой предмет', desc: 'Чугунный боек нанес сокрушительный удар в висок.' },
  { id: 'm_pillow', title: 'Подушка (удушье)', icon: '🛏️', category: 'Удушение', desc: 'Мягкая перьевая подушка перекрыла доступ кислорода.' },
  { id: 'm_broken_glass', title: 'Осколок разбитого зеркала', icon: '🪞', category: 'Колюще-режущее', desc: 'Острый стеклянный клин с застывшими каплями.' },
  { id: 'm_carbon_monoxide', title: 'Угарный газ', icon: '💨', category: 'Газ', desc: 'Заблокированная вытяжка и заведенный в гараже двигатель.' },
  { id: 'm_insulin', title: 'Передозировка инсулина', icon: '💉', category: 'Медикаменты', desc: 'Шприц-ручка, вызвавшая гипогликемическую кому.' },
  { id: 'm_dumbbell', title: 'Чугунная гантель', icon: '🏋️', category: 'Тупой предмет', desc: 'Тяжелая спортивная гантель весом 10 кг.' },
  { id: 'm_plastic_bag', title: 'Пластиковый пакет', icon: '🛍️', category: 'Удушение', desc: 'Плотный мусорный пакет, надетый на голову жертвы.' },
  { id: 'm_scalpel', title: 'Хирургический скальпель', icon: '🩺', category: 'Колюще-режущее', desc: 'Ювелирный и точный разрез сонной артерии.' },
  { id: 'm_arsenic', title: 'Белый мышьяк', icon: '☠️', category: 'Яды и токсины', desc: 'Порошок без вкуса и запаха, подсыпанный в суп.' },
  { id: 'm_wrench', title: 'Разводной ключ', icon: '🔧', category: 'Тупой предмет', desc: 'Массивный металлический инструмент сантехника.' },
  { id: 'm_crossbow', title: 'Охотничий арбалет', icon: '🏹', category: 'Метательное', desc: 'Короткий болт с трехгранным наконечником.' },
  { id: 'm_chainsaw', title: 'Бензопила', icon: '⚙️', category: 'Механическое', desc: 'Ревущий инструмент, оставивший рваные раны.' },
  { id: 'm_freeze', title: 'Промышленный морозильник', icon: '❄️', category: 'Переохлаждение', desc: 'Жертву заперли на ночь при температуре -25°C.' },
  { id: 'm_candlestick', title: 'Бронзовый подсвечник', icon: '🕯️', category: 'Тупой предмет', desc: 'Антикварный тяжелый подсвечник из гостиной.' },
  { id: 'm_snake_venom', title: 'Змеиный яд', icon: '🐍', category: 'Биологическое', desc: 'Укус ядовитой гадюки, подброшенной в постель.' },
  { id: 'm_elevator_cable', title: 'Подрезанный трос лифта', icon: '🛗', category: 'Диверсия', desc: 'Лифт сорвался в шахту с 15-го этажа.' },
  { id: 'm_radiation', title: 'Радиоактивная капсула', icon: '☢️', category: 'Радиация', desc: 'Изотоп цезия, спрятанный под сиденьем кресла.' },
  { id: 'm_scythe', title: 'Острая коса', icon: '🌾', category: 'Холодное оружие', desc: 'Деревенская коса для травы с длинным лезвием.' },
  { id: 'm_bat', title: 'Бейсбольная бита', icon: '🏏', category: 'Тупой предмет', desc: 'Деревянная бита с автографом спортивной звезды.' },
  { id: 'm_rope', title: 'Петля из каната', icon: '➰', category: 'Удушение', desc: 'Имитация самоубийства на потолочной балке.' },
  { id: 'm_explosive', title: 'Самодельная бомба', icon: '💣', category: 'Взрывчатка', desc: 'Пороховой заряд с таймером от наручных часов.' },
  { id: 'm_acid', title: 'Серная кислота', icon: '🧪', category: 'Химикаты', desc: 'Емкость с концентрированной кислотой из лаборатории.' },
  { id: 'm_push_balcony', title: 'Толчок с балкона', icon: '🏙️', category: 'Падение', desc: 'Падение с большой высоты на асфальт мостовой.' },
  { id: 'm_meat_cleaver', title: 'Тесак для разделки мяса', icon: '🥩', category: 'Холодное оружие', desc: 'Широкое прямоугольное лезвие мясника.' },
  { id: 'm_syringe_air', title: 'Воздушная эмболия', icon: '💉', category: 'Медикаменты', desc: 'Пустой шприц, вызвавший закупорку сосудов воздухом.' },
  { id: 'm_gas_stove', title: 'Утечка бытового газа', icon: '🍳', category: 'Газ', desc: 'Открытые конфорки газовой плиты на запертой кухне.' },
  { id: 'm_iron', title: 'Раскаленный утюг', icon: '👔', category: 'Термическое', desc: 'Ожоги третьей степени и тяжелый удар по голове.' },
  { id: 'm_poison_dart', title: 'Дротик с кураре', icon: '🎯', category: 'Яды и токсины', desc: 'Миниатюрный дротик, выпущенный через духовую трубку.' },
  { id: 'm_guitar_string', title: 'Гитарная струна', icon: '🎸', category: 'Удушение', desc: 'Стальная первая струна срезала кожу при захвате.' },
  { id: 'm_heavy_trophy', title: 'Спортивный кубок', icon: '🏆', category: 'Тупой предмет', desc: 'Массивный металлический кубок чемпиона по боксу.' },
  { id: 'm_quicksand', title: 'Цементный раствор', icon: '🏗️', category: 'Удушье', desc: 'Жертву погрузили в свежий быстротвердеющий бетон.' },
  { id: 'm_stapler', title: 'Строительный степлер', icon: '📎', category: 'Механическое', desc: 'Мощный пистолет со стальными скобами.' },
  { id: 'm_belladonna', title: 'Настой белладонны', icon: '🥀', category: 'Растительные яды', desc: 'Экстракт ядовитых ягод в чашке утреннего чая.' },
  { id: 'm_laser', title: 'Промышленный резак', icon: '🔦', category: 'Высокие технологии', desc: 'Высокотемпературный лазер для резки стали.' },
  { id: 'm_harpoon', title: 'Подводный гарпун', icon: '🔱', category: 'Метательное', desc: 'Оружие для подводной охоты с зазубренной стрелой.' },
  { id: 'm_bowling_ball', title: 'Шар для боулинга', icon: '🎳', category: 'Тупой предмет', desc: 'Тяжелый полированный шар, сброшенный с лестницы.' },
  { id: 'm_razor', title: 'Опасная бритва', icon: '🪒', category: 'Колюще-режущее', desc: 'Классическая складная бритва с лезвием из дамаска.' },
  { id: 'm_ice_pick', title: 'Нож для колки льда', icon: '🧊', category: 'Колюще-режущее', desc: 'Тонкое шило с деревянной ручкой из бара.' }
];

// ============================================================================
// 2. УЛИКИ (КРАСНЫЕ КАРТЫ) - 50 шт
// ============================================================================
export const DECEPTION_CLUES = [
  { id: 'c_blood_drop', title: 'Капли чужой крови', icon: '🩸', desc: 'Несколько засохших капель на дверной ручке.' },
  { id: 'c_leather_glove', title: 'Кожаная перчатка', icon: '🧤', desc: 'Левая перчатка из тонкой итальянской кожи.' },
  { id: 'c_broken_glass', title: 'Осколки бокала', icon: '🍷', desc: 'Тонкое стекло с остатками дорогого мерло.' },
  { id: 'c_gold_ring', title: 'Золотое кольцо с гравировкой', icon: '💍', desc: 'Перстень с инициалами, закатившийся под кровать.' },
  { id: 'c_cigarette_butt', title: 'Окурок сигареты', icon: '🚬', desc: 'Окурок со следами помады редкого вишневого оттенка.' },
  { id: 'c_note', title: 'Записка с угрозой', icon: '📝', desc: 'Слова вырезаны из газетных заголовков.' },
  { id: 'c_lipstick', title: 'След помады на салфетке', icon: '💄', desc: 'Яркий след поцелуя на салфетке ресторана.' },
  { id: 'c_button', title: 'Оторванная перламутровая пуговица', icon: '🔘', desc: 'Пуговица от дорогого дизайнерского пальто.' },
  { id: 'c_perfume', title: 'Запах элитных духов', icon: '🌸', desc: 'Стойкий аромат ванили и пачули в воздухе.' },
  { id: 'c_ash', title: 'Горсть белого пепла', icon: '🌫️', desc: 'Остатки сожженного документа в пепельнице.' },
  { id: 'c_receipt', title: 'Чек из аптеки', icon: '🧾', desc: 'Покупка рецептурных транквилизаторов за 2 часа до гибели.' },
  { id: 'c_mud_boots', title: 'Свежая глина на полу', icon: '👞', desc: 'Следы обуви 43 размера с редким протектором.' },
  { id: 'c_lighter', title: 'Гравированная зажигалка Zippo', icon: '🔥', desc: 'Латунная зажигалка с эмблемой яхт-клуба.' },
  { id: 'c_keycard', title: 'Электронный ключ от отеля', icon: '💳', desc: 'Магнитная карта номера 404 в Гранд-Отеле.' },
  { id: 'c_hair', title: 'Длинный светлый волос', icon: '💇', desc: 'Окрашенный волос, найденный на лацкане пиджака.' },
  { id: 'c_wrist_watch', title: 'Разбитые наручные часы', icon: '⌚', desc: 'Стрелки застыли ровно на 23:42.' },
  { id: 'c_photo', title: 'Разорванная совместная фотография', icon: '🖼️', desc: 'Снимок со свадебной церемонии пятилетней давности.' },
  { id: 'c_flash_drive', title: 'Зашифрованная флешка', icon: '💾', desc: 'Черный USB-накопитель с паролем на 32 символа.' },
  { id: 'c_cufflink', title: 'Серебряная запонка', icon: '✨', desc: 'Запонка в виде головы волка с сапфировыми глазами.' },
  { id: 'c_rare_coin', title: 'Старинная золотая монета', icon: '🪙', desc: 'Дублон XVIII века, выпавший из кармана убийцы.' },
  { id: 'c_smart_phone', title: 'Разбитый смартфон', icon: '📱', desc: 'Экран разбит вдребезги, последнее сообщение удалено.' },
  { id: 'c_ticket', title: 'Билет на поезд в один конец', icon: '🎫', desc: 'Отправление в 06:15 утра на следующий день.' },
  { id: 'c_badge', title: 'Полицейский жетон', icon: '🛡️', desc: 'Металлический значок детектива убойного отдела.' },
  { id: 'c_broken_glasses', title: 'Очки в роговой оправе', icon: '👓', desc: 'Одно стекло треснуло от сильного удара.' },
  { id: 'c_medical_mask', title: 'Использованная маска', icon: '😷', desc: 'Хирургическая маска со следами слюны и ДНК.' },
  { id: 'c_feather', title: 'Черное перо ворона', icon: '🪶', desc: 'Редкое перо, прилипшее к подошве туфли.' },
  { id: 'c_coffee_cup', title: 'Стаканчик из кофейни', icon: '☕', desc: 'На стаканчике написано женское имя «Алиса».' },
  { id: 'c_umbrella', title: 'Мокрый шелковый зонт', icon: '☂️', desc: 'Зонт-трость с деревянной ручкой в виде птицы.' },
  { id: 'c_theatre_ticket', title: 'Программка оперного театра', icon: '🎭', desc: 'Опера «Кармен», места в ложе бельэтажа.' },
  { id: 'c_powder', title: 'Белая пудра для лица', icon: '🪞', desc: 'Рассыпанная пудра на столике возле зеркала.' },
  { id: 'c_diary', title: 'Запертый личный дневник', icon: '📕', desc: 'Последняя страница вырвана с корнем.' },
  { id: 'c_briefcase', title: 'Кожаный дипломат с кодом', icon: '💼', desc: 'Замки взломаны грубым металлическим предметом.' },
  { id: 'c_scarf', title: 'Шелковый синий шарф', icon: '🧣', desc: 'Дорогой аксессуар с пятнами машинного масла.' },
  { id: 'c_dog_collar', title: 'Ошейник породистой собаки', icon: '🐕', desc: 'Медальон с кличкой «Барон» и телефонным номером.' },
  { id: 'c_champagne_cork', title: 'Пробка от шампанского', icon: '🍾', desc: 'Винтаж 2008 года, открыта незадолго до полуночи.' },
  { id: 'c_pawn_ticket', title: 'Квитанция из ломбарда', icon: '🏷️', desc: 'Заложены фамильные бриллиантовые сережки.' },
  { id: 'c_rose', title: 'Увядшая черная роза', icon: '🥀', desc: 'Стебель со срезанными шипами оставлен на груди.' },
  { id: 'c_syringe_needle', title: 'Колпачок от медицинской иглы', icon: '💉', desc: 'Оранжевый пластиковый колпачок от инсулиновой иглы.' },
  { id: 'c_casino_chip', title: 'Фишка казино номиналом $10,000', icon: '🎰', desc: 'Фишка подпольного игорного клуба «Макао».' },
  { id: 'c_playing_card', title: 'Туз пик', icon: '♠️', desc: 'Игральная карта с пятном от чая на рубашке.' },
  { id: 'c_lipstick_mirror', title: 'Надпись помадой на зеркале', icon: '🪞', desc: 'Короткое слово «ПРОСТИ», написанное дрожащей рукой.' },
  { id: 'c_broken_lock', title: 'Взломанный навесной замок', icon: '🔒', desc: 'Дужка перекушена гидравлическими клещами.' },
  { id: 'c_plane_tag', title: 'Багажная бирка рейса Гонконг-Париж', icon: '🏷️', desc: 'Пассажир так и не поднялся на борт самолета.' },
  { id: 'c_bloody_towel', title: 'Влажное махровое полотенце', icon: '🧖', desc: 'Попытка стереть следы с кафельной плитки.' },
  { id: 'c_broken_doll', title: 'Фарфоровая голова куклы', icon: '🎎', desc: 'Старинная японская кукла с треснувшим глазом.' },
  { id: 'c_audio_cassette', title: 'Мини-аудиокассета с диктофона', icon: '📼', desc: 'Запись разговора прерывается на 4-й минуте.' },
  { id: 'c_stained_tie', title: 'Галстук с пятном вина', icon: '👔', desc: 'Шелковый галстук-бабочка известного бренда.' },
  { id: 'c_magnifying_glass', title: 'Ювелирная лупа', icon: '🔍', desc: 'Стекло с пятикратным увеличением для оценки камней.' },
  { id: 'c_matches', title: 'Коробок спичек из ночного клуба', icon: '📦', desc: 'Внутри осталась всего одна сгоревшая спичка.' },
  { id: 'c_chess_piece', title: 'Черный деревянный ферзь', icon: '♟️', desc: 'Тяжелая резная фигура с потайным отсеком внутри.' }
];

// ============================================================================
// 3. ПЛАНШЕТЫ РЕКОНСТРУКЦИИ ПРЕСТУПЛЕНИЯ (SCENE TILES)
// ============================================================================

// 3.1. ДВА ОБЯЗАТЕЛЬНЫХ БАЗОВЫХ ПЛАНШЕТА (Присутствуют всегда в каждой игре)
export const FIXED_SCENE_TILES = [
  {
    id: 'tile_cause_of_death',
    title: 'Причина смерти',
    icon: '💀',
    isFixed: true,
    options: [
      { id: 'suffocation', label: 'Удушье / Асфиксия' },
      { id: 'severe_injury', label: 'Тяжелая травма / Удар' },
      { id: 'blood_loss', label: 'Острая потеря крови' },
      { id: 'poisoning', label: 'Отравление / Интоксикация' },
      { id: 'accident', label: 'Несчастный случай / Падение' },
      { id: 'cardiac_arrest', label: 'Остановка сердца / Шок' }
    ]
  },
  {
    id: 'tile_crime_scene',
    title: 'Место преступления',
    icon: '📍',
    isFixed: true,
    options: [
      { id: 'hotel', label: 'Номер отеля / Гостиница' },
      { id: 'kitchen', label: 'Кухня / Ресторан' },
      { id: 'bedroom', label: 'Спальня / Ванная комната' },
      { id: 'park', label: 'Парк / Лесная аллея' },
      { id: 'office', label: 'Офис / Кабинет шефа' },
      { id: 'street', label: 'Улица / Заброшенный склад' }
    ]
  }
];

// 3.2. СЛУЧАЙНЫЕ ПЛАНШЕТЫ СОБЫТИЙ (Выбираются 4 из колоды на игру)
export const RANDOM_SCENE_TILES = [
  {
    id: 'tile_body_state',
    title: 'Состояние тела',
    icon: '🫀',
    options: [
      { id: 'clothed', label: 'Полностью одето' },
      { id: 'disheveled', label: 'Следы яростной борьбы' },
      { id: 'mutilated', label: 'Обезображено / Раны' },
      { id: 'wrapped', label: 'Завернуто в ткань' },
      { id: 'burned', label: 'Следы ожогов / Гари' },
      { id: 'frozen', label: 'Окоченение / Холодное' }
    ]
  },
  {
    id: 'tile_odor',
    title: 'Запах на месте',
    icon: '👃',
    options: [
      { id: 'acrid', label: 'Едкий химический запах' },
      { id: 'smoke', label: 'Запах гари и пепла' },
      { id: 'perfume', label: 'Стойкий аромат парфюма' },
      { id: 'alcohol', label: 'Запах алкоголя и табака' },
      { id: 'metallic', label: 'Сладковатый запах крови' },
      { id: 'odorless', label: 'Абсолютно без запаха' }
    ]
  },
  {
    id: 'tile_time_of_death',
    title: 'Время преступления',
    icon: '⏳',
    options: [
      { id: 'dawn', label: 'Раннее утро / Рассвет' },
      { id: 'noon', label: 'Полдень / Разгар дня' },
      { id: 'dusk', label: 'Вечерние сумерки' },
      { id: 'midnight', label: 'Глубокая полночь' },
      { id: 'stormy', label: 'Во время грозы / Ливня' },
      { id: 'unknown', label: 'Время тщательно скрыто' }
    ]
  },
  {
    id: 'tile_struggle_traces',
    title: 'Следы борьбы',
    icon: '🥊',
    options: [
      { id: 'broken_furniture', label: 'Опрокинутая мебель' },
      { id: 'broken_glass', label: 'Осколки на полу' },
      { id: 'perfect_order', label: 'Идеальный порядок' },
      { id: 'drag_marks', label: 'Следы волочения тела' },
      { id: 'forced_door', label: 'Выбитый дверной замок' },
      { id: 'scratches', label: 'Царапины на стенах' }
    ]
  },
  {
    id: 'tile_weather',
    title: 'Погода за окном',
    icon: '🌧️',
    options: [
      { id: 'heavy_rain', label: 'Проливной дождь' },
      { id: 'dense_fog', label: 'Непроглядный туман' },
      { id: 'sweltering_heat', label: 'Удушающая жара' },
      { id: 'thunderstorm', label: 'Гроза и молнии' },
      { id: 'freezing_cold', label: 'Ледяной холод' },
      { id: 'clear_sky', label: 'Ясное звездное небо' }
    ]
  },
  {
    id: 'tile_victim_clothing',
    title: 'Одежда жертвы',
    icon: '👔',
    options: [
      { id: 'business_suit', label: 'Строгий деловой костюм' },
      { id: 'casual', label: 'Домашняя одежда / Пижама' },
      { id: 'evening_dress', label: 'Праздничный наряд' },
      { id: 'torn_rags', label: 'Разорванная одежда' },
      { id: 'sportswear', label: 'Спортивный костюм' },
      { id: 'winter_coat', label: 'Теплое верхнее пальто' }
    ]
  },
  {
    id: 'tile_victim_identity',
    title: 'Статус жертвы',
    icon: '👤',
    options: [
      { id: 'wealthy', label: 'Богатый миллионер' },
      { id: 'official', label: 'Влиятельный чиновник' },
      { id: 'student', label: 'Студент / Молодой парень' },
      { id: 'criminal', label: 'Криминальный авторитет' },
      { id: 'celebrity', label: 'Звезда шоу-бизнеса' },
      { id: 'ordinary', label: 'Простой тихий обыватель' }
    ]
  },
  {
    id: 'tile_motive',
    title: 'Мотив преступления',
    icon: '🎯',
    options: [
      { id: 'revenge', label: 'Кровная месть' },
      { id: 'jealousy', label: 'Ревность и страсть' },
      { id: 'robbery', label: 'Ограбление / Долги' },
      { id: 'blackmail', label: 'Шантаж и компромат' },
      { id: 'psychosis', label: 'Внезапный приступ ярости' },
      { id: 'inheritance', label: 'Борьба за наследство' }
    ]
  },
  {
    id: 'tile_noticed_clue',
    title: 'Замеченная зацепка',
    icon: '🔍',
    options: [
      { id: 'footprints', label: 'Четкие следы обуви' },
      { id: 'hair_fibers', label: 'Волосы и нити одежды' },
      { id: 'paper_shreds', label: 'Обрывки документов' },
      { id: 'personal_item', label: 'Забытая личная вещь' },
      { id: 'digital_trace', label: 'Электронный след / Звонок' },
      { id: 'powder_trace', label: 'Странный порошок / Пепел' }
    ]
  },
  {
    id: 'tile_duration',
    title: 'Длительность убийства',
    icon: '⏱️',
    options: [
      { id: 'instant', label: 'Мгновенно (секунды)' },
      { id: 'few_minutes', label: 'Несколько минут' },
      { id: 'long_torment', label: 'Долгие часы мучений' },
      { id: 'prepared', label: 'Тщательно выверено по часам' },
      { id: 'sudden', label: 'Спонтанно и сумбурно' },
      { id: 'night_long', label: 'Продолжалось всю ночь' }
    ]
  },
  {
    id: 'tile_noise_level',
    title: 'Шум на месте',
    icon: '🔊',
    options: [
      { id: 'loud_scream', label: 'Громкий пронзительный крик' },
      { id: 'dull_thud', label: 'Глухой тяжелый удар' },
      { id: 'shattering', label: 'Звон бьющегося стекла' },
      { id: 'dead_silence', label: 'Мертвая тишина' },
      { id: 'heated_argument', label: 'Яростный спор шепотом' },
      { id: 'music_playing', label: 'Громко играла музыка' }
    ]
  },
  {
    id: 'tile_facial_expression',
    title: 'Выражение лица жертвы',
    icon: '😱',
    options: [
      { id: 'sheer_terror', label: 'Леденящий панический ужас' },
      { id: 'peaceful', label: 'Умиротворенное спокойствие' },
      { id: 'disbelief', label: 'Шок и недоверие' },
      { id: 'burning_rage', label: 'Ненависть и ярость' },
      { id: 'intense_pain', label: 'Гримаса сильной боли' },
      { id: 'blank_stare', label: 'Отрешенный пустой взгляд' }
    ]
  }
];

// ============================================================================
// 4. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ГЕНЕРАЦИИ И РАЗДАЧИ
// ============================================================================

// Перемешать массив случайным образом (Fisher-Yates)
export function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Раздать по 4 орудия и 4 улики каждому игроку (кроме Криминалиста)
export function dealCardsToPlayers(players) {
  const shuffledMeans = shuffle(DECEPTION_MEANS);
  const shuffledClues = shuffle(DECEPTION_CLUES);

  let meansIdx = 0;
  let cluesIdx = 0;

  const playerCardMap = {};

  players.forEach(p => {
    // Криминалисту карты не раздаются
    if (p.role === 'scientist') {
      playerCardMap[p.id] = { means: [], clues: [] };
      return;
    }

    const assignedMeans = shuffledMeans.slice(meansIdx, meansIdx + 4);
    meansIdx += 4;

    const assignedClues = shuffledClues.slice(cluesIdx, cluesIdx + 4);
    cluesIdx += 4;

    playerCardMap[p.id] = {
      means: assignedMeans,
      clues: assignedClues
    };
  });

  return playerCardMap;
}

// Выбрать случайные 4 планшета для начального набора сцен
export function selectInitialSceneTiles() {
  const shuffledRandom = shuffle(RANDOM_SCENE_TILES);
  const selected4 = shuffledRandom.slice(0, 4);

  // Возвращаем 2 фиксированных + 4 случайных
  const activeTiles = [
    { ...FIXED_SCENE_TILES[0], selectedOptionId: null },
    { ...FIXED_SCENE_TILES[1], selectedOptionId: null },
    ...selected4.map(tile => ({ ...tile, selectedOptionId: null }))
  ];

  // Оставшиеся случайные планшеты в колоде сброса/добора
  const unusedTiles = shuffledRandom.slice(4);

  return {
    activeTiles,
    unusedTiles
  };
}

// Распределить тайные роли в зависимости от количества игроков
export function assignDeceptionRoles(players, options = {}) {
  const { enableAccomplice = false, enableWitness = false } = options;
  const count = players.length;

  if (count < 4) {
    throw new Error('Для игры «Криминалист» требуется минимум 4 игрока!');
  }

  const shuffledPlayers = shuffle(players);
  const scientist = shuffledPlayers[0];
  const murderer = shuffledPlayers[1];

  let accomplice = null;
  let witness = null;
  let nextIdx = 2;

  // Соучастник и Свидетель доступны при 6+ игроках (или если принудительно включены)
  if (enableAccomplice && count >= 5) {
    accomplice = shuffledPlayers[nextIdx++];
  }

  if (enableWitness && count >= 5 && nextIdx < count) {
    witness = shuffledPlayers[nextIdx++];
  }

  // Назначаем роли
  const roleMap = {};
  players.forEach(p => {
    if (p.id === scientist.id) {
      roleMap[p.id] = {
        role: 'scientist',
        title: 'Судмедэксперт (Криминалист)',
        team: 'investigators',
        badgeRemaining: 0 // Эксперт не обвиняет
      };
    } else if (p.id === murderer.id) {
      roleMap[p.id] = {
        role: 'murderer',
        title: 'Убийца',
        team: 'murderer',
        badgeRemaining: 1 // Убийца может блефовать и тратить значок
      };
    } else if (accomplice && p.id === accomplice.id) {
      roleMap[p.id] = {
        role: 'accomplice',
        title: 'Соучастник',
        team: 'murderer',
        badgeRemaining: 1
      };
    } else if (witness && p.id === witness.id) {
      roleMap[p.id] = {
        role: 'witness',
        title: 'Свидетель',
        team: 'investigators',
        badgeRemaining: 1
      };
    } else {
      roleMap[p.id] = {
        role: 'investigator',
        title: 'Следователь',
        team: 'investigators',
        badgeRemaining: 1
      };
    }
  });

  return {
    roleMap,
    scientistId: scientist.id,
    murdererId: murderer.id,
    accompliceId: accomplice?.id || null,
    witnessId: witness?.id || null
  };
}
