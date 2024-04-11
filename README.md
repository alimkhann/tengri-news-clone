# tengri-news-clone

Первый опыт создания сайта.

Клон сайта https://tengrinews.kz. Повторяет UI сайта на главной странице и получает информацию с помощью веб-скраппера Puppeteer.

Сделано с помощью HTML, SCSS, JS, Gulp, Puppeteer.

Частично реализован Responsive Design.

## Этапы разработки

Level 1:

- Базовая функция списка новостей для отображения списка новостных статей на фронтенде с данными с бэкенда.
- Можно просматривать детальную информацию по статье. (Переход на сайт tengrinews)

Level 2:

- Функция для сортировки новостных статей по дате публикации и по количеству просмотров.

Level 3:

- Использование библиотеки веб-скрапинга Puppeteer для динамического парсинга контента новостей с сайта Tengri News, обеспечивая поступление актуальных новостных статей.

## Установка

```
git clone https://github.com/alimkhann/tengri-news-clone.git
```
```
npm install gulp-cli -g
```
```
npm install @babel/core @babel/preset-env autoprefixer postcss puppeteer browser-sync cssnano dart-sass sass gulp gulp-babel gulp-postcss gulp-sass gulp-terser express
```

## Проблемы

Не вышло сделать переход с главной страницы на свой сайт с детальной информацией.
Также не всегда выходит спарсить всю детальную информацию со статей.
