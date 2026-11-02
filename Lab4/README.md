# Лабораторная работа 4

Веб-приложение по растровым алгоритмам и отдельный файл отчёта.

## Структура

```text
Lab4/
├── index.html
├── README.md
├── Отчет_Лабораторная_4.docx
├── css/
│   └── styles.css
└── js/
    ├── algorithms.js
    ├── benchmark.js
    ├── main.js
    └── renderer.js
```

`algorithms.js` содержит растеризаторы. `renderer.js` рисует сетку и растр. `benchmark.js` запускает измерения и строит графики. `main.js` связывает элементы страницы с алгоритмами.

Для локального запуска из корня репозитория выполните `python3 -m http.server 8000 --directory Lab4` и откройте `http://localhost:8000`.
