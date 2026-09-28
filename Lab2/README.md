# Image Info

Веб-приложение на Next.js для просмотра параметров JPG, GIF, TIFF, BMP, PNG и PCX.

## Запуск

```bash
npm install
npm run dev
```

Для production: `npm run build && npm start`.

## Архитектура

- `src/components` — интерфейс.
- `src/core` — сканирование и типы.
- `src/parsers` — побайтовые парсеры форматов.
- `src/workers` — фоновые обработчики.

Файлы читаются диапазонами через File API, а разбор выполняется в Web Workers.
