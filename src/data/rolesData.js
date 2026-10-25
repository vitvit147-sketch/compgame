// База данных ролей Мафии для ведущего

export const FACTIONS = {
  CITY: {
    id: 'city',
    name: 'Город (Мирные)',
    color: '#3b82f6',
    bgColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: '#2563eb',
    badge: '🕊'
  },
  MAFIA: {
    id: 'mafia',
    name: 'Мафия (Синдикат)',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#dc2626',
    badge: '🕵️'
  },
  RENEGADE: {
    id: 'renegade',
    name: 'Отщепенцы (Нейтралы)',
    color: '#a855f7',
    bgColor: 'rgba(168, 85, 247, 0.15)',
    borderColor: '#9333ea',
    badge: '⚔️'
  }
};

export const ROLES = {
  // === ГОРОД ===
  citizen: {
    id: 'citizen',
    name: 'Мирный житель',
    faction: 'city',
    icon: 'User',
    shortDesc: 'Обычный гражданин, ночью спит, днем голосует.',
    description: 'Основа города. Ночью не просыпается. Днем ищет противоречия, подозреваемых и голосует за изгнание мафии.',
    nightOrder: 99, // не просыпается
    hasNightAction: false,
    defaultCount: 4
  },
  sheriff: {
    id: 'sheriff',
    name: 'Комиссар (Шериф)',
    faction: 'city',
    icon: 'ShieldAlert',
    shortDesc: 'Проверяет статус игрока (Мирный или Мафия).',
    description: 'Ночью просыпается и указывает на одного подозреваемого. Ведущий жестом показывает «Мирный» (палец вверх/зеленый) или «Мафия» (палец вниз/красный). Адвокат может скрыть мафиози.',
    nightOrder: 80,
    hasNightAction: true,
    speechNight: 'Город засыпает. Просыпается Шериф. Шериф ищет преступников...',
    speechMorning: 'Шериф сделал свой выбор и засыпает.',
    actionType: 'check_faction',
    targetCount: 1,
    canTargetSelf: false
  },
  sergeant: {
    id: 'sergeant',
    name: 'Сержант',
    faction: 'city',
    icon: 'BadgeHelp',
    shortDesc: 'Помощник шерифа. Занимает его место после гибели.',
    description: 'Знает, кто Шериф (просыпается в первую ночь с ним). Пока Шериф жив — просто спит. Если Шерифа убивают, Сержант получает право ночных проверок.',
    nightOrder: 81,
    hasNightAction: false, // активно только если Шериф погиб
    conditionalAction: 'sheriff_dead'
  },
  doctor: {
    id: 'doctor',
    name: 'Доктор (Лекарь)',
    faction: 'city',
    icon: 'HeartPulse',
    shortDesc: 'Спасает от 1 смертельного выстрела за ночь.',
    description: 'Ночью выбирает одного жителя для лечения. Если в эту жертву стреляли — она выживает. Не может лечить одного и того же человека две ночи подряд.',
    nightOrder: 30,
    hasNightAction: true,
    speechNight: 'Город засыпает. Просыпается Доктор. Кого вы сегодня вылечите?',
    speechMorning: 'Доктор оказал помощь и засыпает.',
    actionType: 'heal',
    targetCount: 1,
    canTargetSelf: true,
    repeatTargetRestricted: true
  },
  bodyguard: {
    id: 'bodyguard',
    name: 'Телохранитель',
    faction: 'city',
    icon: 'Shield',
    shortDesc: 'Принимает удар на себя ради спасения цели.',
    description: 'Выбирает игрока. Если на подопечного нападают, подопечный выживает, а Телохранитель принимает пулю на себя.',
    nightOrder: 35,
    hasNightAction: true,
    speechNight: 'Просыпается Телохранитель. Кого вы берете под охрану?',
    speechMorning: 'Телохранитель заступает на дежурство и засыпает.',
    actionType: 'protect',
    targetCount: 1,
    canTargetSelf: false
  },
  lucky: {
    id: 'lucky',
    name: 'Счастливчик',
    faction: 'city',
    icon: 'Sparkles',
    shortDesc: 'Пассивно переживает ПЕРВОЕ покушение на свою жизнь.',
    description: 'Мирный житель с уникальной удачей. При первом нападении (мафии или маньяка) чудом остается жив — пуля рикошетит. Щит тратится, второе покушение станет смертельным. Ночью спит.',
    nightOrder: 99,
    hasNightAction: false,
    passiveShield: 1
  },
  putana: {
    id: 'putana',
    name: 'Путана (Любовница)',
    faction: 'city', // или нейтрал, чаще мирная
    icon: 'Flame',
    shortDesc: 'Блокирует ночную способность выбранного игрока.',
    description: 'Просыпается САМОЙ ПЕРВОЙ ночью. Игрок, к которому она пришла, теряет возможность применить ночное действие (выстрел, проверка, лечение блокируются).',
    nightOrder: 10,
    hasNightAction: true,
    speechNight: 'Город засыпает. Просыпается прекрасная Путана. К кому вы идете в гости?',
    speechMorning: 'Путана уходит до рассвета, унося чужие тайны.',
    actionType: 'block',
    targetCount: 1,
    canTargetSelf: false
  },
  witness: {
    id: 'witness',
    name: 'Свидетель (Бомж)',
    faction: 'city',
    icon: 'Eye',
    shortDesc: 'Следит за домом и видит, кто приходил к цели.',
    description: 'Выбирает игрока для слежки. Утром ведущий шепотом или жестом сообщает ему номер игрока, который совершил визит к цели этой ночью.',
    nightOrder: 90,
    hasNightAction: true,
    speechNight: 'Просыпается Свидетель. За чьим окном вы наблюдаете?',
    speechMorning: 'Свидетель запомнил увиденное и засыпает.',
    actionType: 'spy',
    targetCount: 1,
    canTargetSelf: false
  },
  journalist: {
    id: 'journalist',
    name: 'Журналист',
    faction: 'city',
    icon: 'Newspaper',
    shortDesc: 'Сравнивает двоих игроков: в одной команде или в разных.',
    description: 'Выбирает двоих игроков. Ведущий показывает, из одной они группировки (например, оба мафия или оба мирные) или из разных.',
    nightOrder: 85,
    hasNightAction: true,
    speechNight: 'Просыпается Журналист для расследования. Укажите двух подозреваемых.',
    speechMorning: 'Журналист записал заметки и засыпает.',
    actionType: 'compare',
    targetCount: 2,
    canTargetSelf: false
  },
  priest: {
    id: 'priest',
    name: 'Священник (Исповедник)',
    faction: 'city',
    icon: 'Cross',
    shortDesc: 'Принимает исповедь: узнает точную роль игрока.',
    description: 'Выбирает игрока, ведущий показывает священнику его точную карточку роли. Но тайна исповеди священна!',
    nightOrder: 88,
    hasNightAction: true,
    speechNight: 'Просыпается Священник. К кому вы приходите на исповедь?',
    speechMorning: 'Исповедь принята. Священник засыпает.',
    actionType: 'reveal_role',
    targetCount: 1,
    canTargetSelf: false
  },
  mayor: {
    id: 'mayor',
    name: 'Мэр',
    faction: 'city',
    icon: 'Crown',
    shortDesc: 'Днем его голос при голосовании считается за 2.',
    description: 'Уважаемый глава города. Ночью спит. Днем на голосовании ведущий засчитывает его поднятую руку как два полноценных голоса.',
    nightOrder: 99,
    hasNightAction: false,
    dayBonusVotes: 1
  },

  // === МАФИЯ ===
  don: {
    id: 'don',
    name: 'Дон Мафии',
    faction: 'mafia',
    icon: 'Skull',
    shortDesc: 'Глава мафии, решает исход выстрела, ищет Шерифа.',
    description: 'Просыпается вместе со всей мафией на общий выстрел, а затем отдельно — на поиск Шерифа. При проверке Шерифа может отображаться мирным (по договоренности).',
    nightOrder: 50,
    hasNightAction: true,
    speechNight: 'Мафия засыпает. Просыпается Дон. Дон ищет Шерифа города...',
    speechMorning: 'Дон сделал вывод и засыпает.',
    actionType: 'check_sheriff',
    targetCount: 1,
    canTargetSelf: false
  },
  mafioso: {
    id: 'mafioso',
    name: 'Мафиози (Боец)',
    faction: 'mafia',
    icon: 'Crosshair',
    shortDesc: 'Член мафии, голосует за жертву ночного убийства.',
    description: 'Просыпается ночью вместе с Доном и остальными членами синдиката. Согласованно выбирают одну жертву для устранения.',
    nightOrder: 45, // коллективный выстрел мафии
    hasNightAction: true,
    speechNight: 'Город засыпает. Просыпается Мафия в полном составе! Выберите жертву.',
    speechMorning: 'Мафия сделала свое черное дело и засыпает.',
    actionType: 'kill',
    targetCount: 1,
    isTeamAction: true
  },
  lawyer: {
    id: 'lawyer',
    name: 'Адвокат Мафии',
    faction: 'mafia',
    icon: 'Briefcase',
    shortDesc: 'Защищает члена мафии от проверки Шерифа.',
    description: 'Ночью указывает на одного игрока мафии (или себя). Если Шериф этой ночью проверяет его — ведущий соврет, что этот игрок «Мирный».',
    nightOrder: 25,
    hasNightAction: true,
    speechNight: 'Просыпается Адвокат. Кого из мафии вы прикрываете алиби?',
    speechMorning: 'Адвокат подготовил бумаги и засыпает.',
    actionType: 'cover',
    targetCount: 1,
    canTargetSelf: true
  },
  thief: {
    id: 'thief',
    name: 'Вор',
    faction: 'mafia',
    icon: 'Scissors',
    shortDesc: 'Крадет способность или меняет цели местами.',
    description: 'Просыпается в начале ночи. Может своровать действие игрока или запутать ведущего.',
    nightOrder: 20,
    hasNightAction: true,
    speechNight: 'Просыпается Вор. У кого вы крадете ночную способность?',
    speechMorning: 'Вор скрывается во тьме.',
    actionType: 'steal',
    targetCount: 1,
    canTargetSelf: false
  },
  werewolf: {
    id: 'werewolf',
    name: 'Оборотень',
    faction: 'mafia',
    icon: 'Moon',
    shortDesc: 'Спит как мирный, но становится Доном при гибели мафии.',
    description: 'Для Шерифа проверяется как мирный житель. Если вся активная мафия погибает — Оборотень активируется и начинает стрелять каждую ночь.',
    nightOrder: 99,
    hasNightAction: false
  },

  // === ОТЩЕПЕНЦЫ (НЕЙТРАЛЫ) ===
  revolutionary: {
    id: 'revolutionary',
    name: 'Революционер',
    faction: 'renegade',
    icon: 'Flame',
    shortDesc: 'Отщепенец-вербовщик. Каждую ночь вербует сторонников.',
    description: 'Третья сила в городе! Ночью выбирает игрока для вербовки в Ячейку Революции. Если цель — мирный житель, он присоединяется к революционерам. Побеждает, если численность Революции сравняется с остальными жителями!',
    nightOrder: 70,
    hasNightAction: true,
    speechNight: 'Просыпается Революционер. Кого вы призываете под знамена восстания?',
    speechMorning: 'Революционер скрывается в подполье.',
    actionType: 'recruit',
    targetCount: 1,
    canTargetSelf: false
  },
  maniac: {
    id: 'maniac',
    name: 'Маньяк (Одиночка)',
    faction: 'renegade',
    icon: 'Knife',
    shortDesc: 'Каждую ночь совершает одиночное убийство. Сам за себя.',
    description: 'Опаснейший отщепенец. Убивает одного игрока каждую ночь независимо от мафии. Побеждает, только если останется единственным выжившим в городе.',
    nightOrder: 60,
    hasNightAction: true,
    speechNight: 'Город засыпает. На охоту выходит Маньяк... Выберите жертву.',
    speechMorning: 'Маньяк заметает кровавые следы и засыпает.',
    actionType: 'kill_maniac',
    targetCount: 1,
    canTargetSelf: false
  },
  kamikaze: {
    id: 'kamikaze',
    name: 'Камикадзе (Шут)',
    faction: 'renegade',
    icon: 'Bomb',
    shortDesc: 'Побеждает, если город казнит его на дневном суде.',
    description: 'Сумасшедший нейтрал. Его цель — спровоцировать город и быть повешенным днем на голосовании. Если его казнят — он немедленно забирает победу. Если его убивают ночью — проигрывает.',
    nightOrder: 99,
    hasNightAction: false
  },
  cardsharp: {
    id: 'cardsharp',
    name: 'Шулер',
    faction: 'renegade',
    icon: 'Shuffle',
    shortDesc: 'Меняет местами двоих игроков на эту ночь.',
    description: 'Выбирает двоих игроков. Все ночные действия, направленные на Игрока А, перенаправляются на Игрока Б, и наоборот!',
    nightOrder: 15,
    hasNightAction: true,
    speechNight: 'Просыпается Шулер. Каких двоих игроков вы меняете местами?',
    speechMorning: 'Шулер перетасовал карты и засыпает.',
    actionType: 'swap',
    targetCount: 2,
    canTargetSelf: true
  }
};

export const PRESETS = [
  {
    id: 'small_7_classic',
    name: 'Камерная классика (7 игроков)',
    description: 'Идеальный баланс: Дон, Мафиози, Шериф, Доктор, Счастливчик и 2 Мирных. Без риска быстрого вылета!',
    playerCount: 7,
    roles: {
      don: 1,
      mafioso: 1,
      sheriff: 1,
      doctor: 1,
      lucky: 1,
      citizen: 2
    }
  },
  {
    id: 'small_7_rev',
    name: 'Камерная + Революционер (7 игроков)',
    description: '1 Дон, 1 Революционер (вербовка вместо убийства), Шериф, Доктор, Счастливчик и 2 Мирных. 3 фракции!',
    playerCount: 7,
    roles: {
      don: 1,
      revolutionary: 1,
      sheriff: 1,
      doctor: 1,
      lucky: 1,
      citizen: 2
    }
  },
  {
    id: 'classic_10',
    name: 'Классика (10 игроков)',
    description: 'Шериф, Доктор, Дон, 2 Мафии и 5 Мирных',
    playerCount: 10,
    roles: {
      sheriff: 1,
      doctor: 1,
      don: 1,
      mafioso: 2,
      citizen: 5
    }
  },
  {
    id: 'expanded_12',
    name: 'Расширенная + Отщепенцы (12 игроков)',
    description: 'Дон, 2 Мафии, Шериф, Доктор, Путана, Счастливчик, Революционер, 4 Мирных',
    playerCount: 12,
    roles: {
      don: 1,
      mafioso: 2,
      sheriff: 1,
      doctor: 1,
      putana: 1,
      lucky: 1,
      revolutionary: 1,
      citizen: 4
    }
  },
  {
    id: 'big_chaos_16',
    name: 'Большой Синдикат (16 игроков)',
    description: 'Полный боекомплект: Дон, 2 Мафии, Адвокат, Маньяк, Революционер, Счастливчик, Шериф, Сержант, Доктор, Путана, Свидетель и Мирные',
    playerCount: 16,
    roles: {
      don: 1,
      mafioso: 2,
      lawyer: 1,
      sheriff: 1,
      sergeant: 1,
      doctor: 1,
      putana: 1,
      witness: 1,
      lucky: 1,
      revolutionary: 1,
      maniac: 1,
      citizen: 4
    }
  }
];
