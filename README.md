# Emoji Wheel

**English** · [Русский](#русский) · [Українська](#українська)

---

## English

Every emoji under your cursor. Emoji Wheel is a Chrome extension that opens a radial menu right where you click: move toward a category, then toward an emoji, and click to insert it into the text field you are typing in.

![The wheel and the emoji panel](screenshots/screenshot-1-wheel.png)
![Settings](screenshots/screenshot-4-settings.png)


### Features

- **16 sectors:** Favorites at the top plus 15 themed categories (happy faces, feelings, creatures, gestures, people & clothing, hearts & love, signs, animals, plants & weather, food, drinks, sports, party & music, travel & places, objects & work)
- **5×5 panel** for every category and a thin **outer ring** that opens up to 200 more emoji, on hover or on click (your choice)
- **Recent emoji:** the outer ring above Favorites shows your last 25
- **Left click inserts, right click copies.** Hold Shift or use the middle button to insert several emoji in a row
- **Open it your way:** presets for Windows, Linux/macOS and laptops, or your own combination of keys and mouse buttons. Choose between "click to choose" and "release to choose"
- Fully editable categories, adjustable wheel size, 14 interface languages, settings export and import
- No data collection, no analytics, no remote code

### Opening combinations

| Combination | Best for |
| --- | --- |
| Right + left button | Windows with a mouse |
| Shift + right button | Linux and macOS |
| Alt + left button | Laptops and touchpads |
| Custom | Any key or mouse button pairing |

### Install

- **Chrome Web Store:** [Emoji Wheel](https://chromewebstore.google.com/detail/jeolamolbcgmnkogkmoagkjojfjfmnfe?utm_source=item-share-cb)
- **From source:** download or clone this repository, open `chrome://extensions`, turn on *Developer mode*, click *Load unpacked* and select the folder that contains `manifest.json`.

### Good to know

- Chrome does not allow extensions on `chrome://` pages, the Chrome Web Store and the built-in PDF viewer, so the menu cannot open there.
- How emoji look depends on your operating system. The newest ones may appear as a box on older systems.
- On macOS and Linux, combinations that start with the right button show the system context menu at once. Use Shift + right button there.

### Privacy

Emoji Wheel does not collect, transmit or sell any data and does not read page content. Settings are stored in Chrome (and synced through your Google account if Chrome sync is on); recently used emoji stay on your device. See the [privacy policy](https://nicksneit.github.io/emoji-wheel/privacy-policy.html).

### Development

Plain JavaScript (Manifest V3), no build step. `content.js` is the menu, `options.html` and `options.js` the settings page, `defaults.js` the emoji lists and the settings model, `i18n.js` the translations.

---

## Русский

Все эмодзи под курсором. Emoji Wheel — расширение для Chrome, которое открывает круговое меню прямо там, где вы щёлкнули: ведите курсор к категории, затем к эмодзи и щёлкните, чтобы вставить его в поле, в котором вы печатаете.

![Колесо и панель эмодзи](screenshots/screenshot-1-wheel.png)
![Settings](screenshots/screenshot-4-settings.png)

### Возможности

- **16 секторов:** сверху избранное и 15 тематических категорий (улыбки, эмоции, персонажи, жесты, люди и одежда, сердца и любовь, знаки, животные, растения и погода, еда, напитки, спорт, праздник и музыка, транспорт и места, предметы и работа)
- **Панель 5×5** для каждой категории и тонкое **внешнее кольцо**, которое открывает до 200 дополнительных эмодзи при наведении или по щелчку (на ваш выбор)
- **Недавние эмодзи:** внешнее кольцо над избранным показывает последние 25
- **Левый клик вставляет, правый копирует.** Удерживайте Shift или используйте среднюю кнопку, чтобы вставить несколько эмодзи подряд
- **Откройте так, как удобно:** готовые комбинации для Windows, Linux/macOS и ноутбуков или своя комбинация клавиш и кнопок мыши. Выбор «кликом» или «отпусканием»
- Полностью редактируемые категории, регулируемый размер колеса, 14 языков интерфейса, экспорт и импорт настроек
- Никакого сбора данных, аналитики и удалённого кода

### Комбинации вызова

| Комбинация | Лучше для |
| --- | --- |
| Правая + левая кнопка | Windows с мышью |
| Shift + правая кнопка | Linux и macOS |
| Alt + левая кнопка | Ноутбуки и тачпады |
| Своя | Любая пара клавиш и кнопок мыши |

### Установка

- **Chrome Web Store:** [Emoji Wheel](https://chromewebstore.google.com/detail/jeolamolbcgmnkogkmoagkjojfjfmnfe?utm_source=item-share-cb)
- **Из исходников:** скачайте или клонируйте репозиторий, откройте `chrome://extensions`, включите *Режим разработчика*, нажмите *Загрузить распакованное расширение* и выберите папку с файлом `manifest.json`.

### Стоит знать

- Chrome не разрешает расширениям работать на страницах `chrome://`, в Chrome Web Store и во встроенном просмотрщике PDF, поэтому там меню не откроется.
- Внешний вид эмодзи зависит от вашей операционной системы. Самые новые на старых системах могут показываться квадратиком.
- На macOS и Linux комбинации, начинающиеся с правой кнопки, сразу показывают системное контекстное меню. Там лучше использовать Shift + правая кнопка.

### Конфиденциальность

Emoji Wheel не собирает, не передаёт и не продаёт никакие данные и не читает содержимое страниц. Настройки хранятся в Chrome (и синхронизируются через аккаунт Google, если включена синхронизация), а недавние эмодзи остаются только на вашем устройстве. Подробнее в [политике конфиденциальности](https://nicksneit.github.io/emoji-wheel/privacy-policy.html).

### Разработка

Чистый JavaScript (Manifest V3), без сборки. `content.js` — меню, `options.html` и `options.js` — страница настроек, `defaults.js` — списки эмодзи и модель настроек, `i18n.js` — переводы.

---

## Українська

Усі емодзі під курсором. Emoji Wheel — розширення для Chrome, яке відкриває кругове меню просто там, де ви клацнули: ведіть курсор до категорії, потім до емодзі й клацніть, щоб вставити його в поле, у якому ви друкуєте.

![Колесо та панель емодзі](screenshots/screenshot-1-wheel.png)
![Settings](screenshots/screenshot-4-settings.png)

### Можливості

- **16 секторів:** угорі обране та 15 тематичних категорій (усмішки, емоції, персонажі, жести, люди й одяг, серця та кохання, знаки, тварини, рослини й погода, їжа, напої, спорт, свято та музика, транспорт і місця, предмети та робота)
- **Панель 5×5** для кожної категорії та тонке **зовнішнє кільце**, що відкриває до 200 додаткових емодзі при наведенні або за кліком (на ваш вибір)
- **Нещодавні емодзі:** зовнішнє кільце над обраним показує останні 25
- **Лівий клік вставляє, правий копіює.** Утримуйте Shift або використовуйте середню кнопку, щоб вставити кілька емодзі поспіль
- **Відкривайте так, як зручно:** готові комбінації для Windows, Linux/macOS та ноутбуків або власна комбінація клавіш і кнопок миші. Вибір «кліком» або «відпусканням»
- Повністю редаговані категорії, регульований розмір колеса, 14 мов інтерфейсу, експорт та імпорт налаштувань
- Жодного збору даних, аналітики та віддаленого коду

### Комбінації виклику

| Комбінація | Краще для |
| --- | --- |
| Права + ліва кнопка | Windows із мишею |
| Shift + права кнопка | Linux і macOS |
| Alt + ліва кнопка | Ноутбуки й тачпади |
| Власна | Будь-яка пара клавіш і кнопок миші |

### Встановлення

- **Chrome Web Store:** [Emoji Wheel](https://chromewebstore.google.com/detail/jeolamolbcgmnkogkmoagkjojfjfmnfe?utm_source=item-share-cb)
- **Із вихідного коду:** завантажте або клонуйте репозиторій, відкрийте `chrome://extensions`, увімкніть *Режим розробника*, натисніть *Завантажити розпаковане розширення* та виберіть теку з файлом `manifest.json`.

### Варто знати

- Chrome не дозволяє розширенням працювати на сторінках `chrome://`, у Chrome Web Store та у вбудованому переглядачі PDF, тому там меню не відкриється.
- Вигляд емодзі залежить від вашої операційної системи. Найновіші на старих системах можуть показуватися квадратиком.
- На macOS і Linux комбінації, що починаються з правої кнопки, одразу показують системне контекстне меню. Там краще використовувати Shift + права кнопка.

### Конфіденційність

Emoji Wheel не збирає, не передає і не продає жодних даних та не читає вміст сторінок. Налаштування зберігаються в Chrome (і синхронізуються через обліковий запис Google, якщо ввімкнена синхронізація), а нещодавні емодзі залишаються лише на вашому пристрої. Докладніше в [політиці конфіденційності](https://nicksneit.github.io/emoji-wheel/privacy-policy.html).

### Розробка

Чистий JavaScript (Manifest V3), без збирання. `content.js` — меню, `options.html` та `options.js` — сторінка налаштувань, `defaults.js` — списки емодзі та модель налаштувань, `i18n.js` — переклади.
