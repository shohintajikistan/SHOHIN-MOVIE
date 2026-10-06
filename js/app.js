// ============================================================
// SHOHIN MOVIE — MAIN APPLICATION
// SHOHIN BRAND COLORS — НЕ МЕНЯТЬ
// ============================================================

"use strict";

// ============================================================
// ОСНОВНЫЕ НАСТРОЙКИ
// ============================================================

const SHOHIN_MOVIE_YEARS = [];

for (let year = 1980; year <= 2026; year++) {
  SHOHIN_MOVIE_YEARS.push(year);
}

const FAVORITES_KEY = "SHOHIN_MOVIE_FAVORITES";
const RECENT_KEY = "SHOHIN_MOVIE_RECENT";

const MAX_FAVORITES = 500;
const MAX_RECENT = 30;

// ============================================================
// ТЕКУЩЕЕ СОСТОЯНИЕ
// ============================================================

let currentModalItem = null;

let currentSearchQuery = "";

let currentSelectedYear = "all";

let catalogLoading = false;

let catalogLoaded = false;

// ============================================================
// ИНИЦИАЛИЗАЦИЯ SHOHIN_MOVIE
// ============================================================

if (typeof SHOHIN_MOVIE === "undefined") {
  window.SHOHIN_MOVIE = {
    currentType: "movies",
    currentYear: 1980,
    movies: [],
    series: [],

    get currentItems() {
      return this.currentType === "movies"
        ? this.movies
        : this.series;
    }
  };
}

// ============================================================
// DOM READY
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

// ============================================================
// ГЛАВНАЯ ИНИЦИАЛИЗАЦИЯ
// ============================================================

async function initApp() {
  try {
    setupEventListeners();

    initFavoriteButton();

    setupSearch();

    await loadAllCatalogs();

    renderCatalog();

    catalogLoaded = true;

    updateMenuData();

  } catch (error) {
    console.error("SHOHIN MOVIE initialization error:", error);

    showCatalogError(
      "Не удалось загрузить каталог. Проверь структуру папок data/movies и data/series."
    );
  }
}

// ============================================================
// СОБЫТИЯ
// ============================================================

function setupEventListeners() {

  // ----------------------------------------------------------
  // Переключение Фильмы / Сериалы
  // ----------------------------------------------------------

  document.addEventListener("click", (event) => {

    const typeButton = event.target.closest(
      "[data-type], .type-tab, .catalog-tab"
    );

    if (typeButton) {

      const type =
        typeButton.dataset.type ||
        typeButton.dataset.catalog ||
        "";

      if (type === "movies" || type === "series") {

        event.preventDefault();

        setCatalogType(type);

        return;
      }
    }

    // --------------------------------------------------------
    // Кнопки годов
    // --------------------------------------------------------

    const yearButton = event.target.closest("[data-year]");

    if (yearButton) {

      const year = yearButton.dataset.year;

      if (year) {

        event.preventDefault();

        selectYear(year);

        return;
      }
    }

    // --------------------------------------------------------
    // Кнопки стран
    // --------------------------------------------------------

    const countryButton = event.target.closest("[data-country]");

    if (countryButton) {

      const country = countryButton.dataset.country;

      if (country) {

        event.preventDefault();

        filterByCountry(country);

        return;
      }
    }

    // --------------------------------------------------------
    // Кнопки жанров
    // --------------------------------------------------------

    const genreButton = event.target.closest("[data-genre]");

    if (genreButton) {

      const genre = genreButton.dataset.genre;

      if (genre) {

        event.preventDefault();

        filterByGenre(genre);

        return;
      }
    }

    // --------------------------------------------------------
    // Кнопка избранного
    // --------------------------------------------------------

    const favoriteButton = event.target.closest(
      "#favoriteButton"
    );

    if (favoriteButton) {

      event.preventDefault();

      toggleFavorite();

      return;
    }

    // --------------------------------------------------------
    // Карточка фильма
    // --------------------------------------------------------

    const movieCard = event.target.closest(
      "[data-movie-id], [data-item-id]"
    );

    if (movieCard) {

      const itemId =
        movieCard.dataset.movieId ||
        movieCard.dataset.itemId;

      if (itemId) {

        const item = findItemById(itemId);

        if (item) {

          openMovieModal(item);

          return;
        }
      }
    }

    // --------------------------------------------------------
    // Кнопка закрытия модального окна
    // --------------------------------------------------------

    const closeButton = event.target.closest(
      ".modal-close, [data-close-modal]"
    );

    if (closeButton) {

      event.preventDefault();

      closeMovieModal();

      return;
    }

  });

  // ----------------------------------------------------------
  // Закрытие модального окна по фону
  // ----------------------------------------------------------

  document.addEventListener("click", (event) => {

    const modal = document.getElementById("movieModal");

    if (!modal) return;

    if (
      event.target === modal ||
      event.target.classList.contains("modal-overlay")
    ) {

      closeMovieModal();
    }

  });

  // ----------------------------------------------------------
  // ESC
  // ----------------------------------------------------------

  document.addEventListener("keydown", (event) => {

    if (event.key === "Escape") {

      closeMovieModal();
    }

  });
}

// ============================================================
// ЗАГРУЗКА ВСЕХ JSON
// ============================================================

async function loadAllCatalogs() {

  if (catalogLoading) return;

  catalogLoading = true;

  const movies = [];
  const series = [];

  // ----------------------------------------------------------
  // Загружаем фильмы
  // ----------------------------------------------------------

  const movieResults = await Promise.all(
    SHOHIN_MOVIE_YEARS.map(year =>
      loadYearFile("movies", year)
    )
  );

  movieResults.forEach(result => {

    if (Array.isArray(result)) {

      result.forEach(item => {

        if (isValidCatalogItem(item)) {

          movies.push(normalizeCatalogItem(item, "movies"));
        }

      });

    }

  });

  // ----------------------------------------------------------
  // Загружаем сериалы
  // ----------------------------------------------------------

  const seriesResults = await Promise.all(
    SHOHIN_MOVIE_YEARS.map(year =>
      loadYearFile("series", year)
    )
  );

  seriesResults.forEach(result => {

    if (Array.isArray(result)) {

      result.forEach(item => {

        if (isValidCatalogItem(item)) {

          series.push(normalizeCatalogItem(item, "series"));
        }

      });

    }

  });

  // ----------------------------------------------------------
  // Убираем возможные дубликаты ID
  // ----------------------------------------------------------

  SHOHIN_MOVIE.movies = removeDuplicateItems(movies);

  SHOHIN_MOVIE.series = removeDuplicateItems(series);

  // ----------------------------------------------------------
  // По умолчанию открываем 1980
  // ----------------------------------------------------------

  SHOHIN_MOVIE.currentYear = 1980;

  currentSelectedYear = "all";

  catalogLoading = false;

  console.log(
    "SHOHIN MOVIE loaded:",
    SHOHIN_MOVIE.movies.length,
    "movies;",
    SHOHIN_MOVIE.series.length,
    "series"
  );
}

// ============================================================
// ЗАГРУЗКА ОДНОГО ГОДА
// ============================================================

async function loadYearFile(folder, year) {

  const url = `data/${folder}/${year}.json`;

  try {

    const response = await fetch(url, {
      cache: "no-cache"
    });

    // --------------------------------------------------------
    // Если файла нет — просто пропускаем
    // --------------------------------------------------------

    if (!response.ok) {

      if (response.status !== 404) {

        console.warn(
          `SHOHIN MOVIE: ошибка загрузки ${url}:`,
          response.status
        );
      }

      return [];
    }

    const data = await response.json();

    // --------------------------------------------------------
    // Поддержка нескольких вариантов JSON
    // --------------------------------------------------------

    if (Array.isArray(data)) {

      return data;
    }

    if (Array.isArray(data.movies)) {

      return data.movies;
    }

    if (Array.isArray(data.series)) {

      return data.series;
    }

    if (Array.isArray(data.items)) {

      return data.items;
    }

    return [];

  } catch (error) {

    console.warn(
      `SHOHIN MOVIE: не удалось загрузить ${url}`,
      error
    );

    return [];
  }
}

// ============================================================
// ПРОВЕРКА ЭЛЕМЕНТА
// ============================================================

function isValidCatalogItem(item) {

  if (!item || typeof item !== "object") {

    return false;
  }

  return Boolean(
    item.id ||
    item.title ||
    item.originalTitle
  );
}

// ============================================================
// НОРМАЛИЗАЦИЯ
// ============================================================

function normalizeCatalogItem(item, type) {

  const normalized = {
    ...item,

    id: String(
      item.id ||
      `${type}-${item.year || "unknown"}-${Date.now()}`
    ),

    title: String(
      item.title ||
      item.originalTitle ||
      "Без названия"
    ),

    originalTitle: String(
      item.originalTitle ||
      item.title ||
      ""
    ),

    year: Number(item.year || 0),

    countries: normalizeArray(
      item.countries ||
      item.country ||
      []
    ),

    genres: normalizeArray(
      item.genres ||
      item.genre ||
      []
    ),

    actors: normalizeArray(
      item.actors ||
      item.cast ||
      []
    ),

    rating: Number(
      item.rating || 0
    ),

    director: String(
      item.director || ""
    ),

    description: String(
      item.description || ""
    ),

    poster: String(
      item.poster || ""
    ),

    type: type
  };

  return normalized;
}

// ============================================================
// МАССИВЫ
// ============================================================

function normalizeArray(value) {

  if (Array.isArray(value)) {

    return value
      .map(item => String(item).trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {

    return value
      .split(",")
      .map(item => item.trim())
      .filter(Boolean);
  }

  return [];
}

// ============================================================
// УДАЛЕНИЕ ДУБЛИКАТОВ
// ============================================================

function removeDuplicateItems(items) {

  const seen = new Set();

  const result = [];

  items.forEach(item => {

    const key = String(
      item.id ||
      `${item.originalTitle}-${item.year}`
    ).toLowerCase();

    if (seen.has(key)) {

      return;
    }

    seen.add(key);

    result.push(item);
  });

  return result;
}

// ============================================================
// ТИП КАТАЛОГА
// ============================================================

function setCatalogType(type) {

  if (
    type !== "movies" &&
    type !== "series"
  ) {

    return;
  }

  SHOHIN_MOVIE.currentType = type;

  currentSelectedYear = "all";

  SHOHIN_MOVIE.currentYear = 1980;

  activeFilter = "all";

  renderCatalog();

  updateActiveCatalogTab();
}

// ============================================================
// ВЫБОР ГОДА
// ============================================================

function selectYear(year) {

  if (
    year === "all" ||
    year === "" ||
    year === null ||
    typeof year === "undefined"
  ) {

    currentSelectedYear = "all";

    renderCatalog();

    return;
  }

  const selectedYear = Number(year);

  if (!selectedYear) return;

  currentSelectedYear = selectedYear;

  SHOHIN_MOVIE.currentYear = selectedYear;

  renderCatalog();
}

// ============================================================
// ТЕКУЩИЕ ЭЛЕМЕНТЫ
// ============================================================

function getCurrentItems() {

  if (
    typeof SHOHIN_MOVIE.currentItems !== "undefined"
  ) {

    return SHOHIN_MOVIE.currentItems || [];
  }

  return SHOHIN_MOVIE.currentType === "series"
    ? SHOHIN_MOVIE.series
    : SHOHIN_MOVIE.movies;
}

// ============================================================
// ФИЛЬТРАЦИЯ ПО ГОДУ
// ============================================================

function getYearFilteredItems(items) {

  if (!Array.isArray(items)) {

    return [];
  }

  if (
    currentSelectedYear === "all" ||
    !currentSelectedYear
  ) {

    return items;
  }

  const year = Number(
    currentSelectedYear
  );

  return items.filter(
    item => Number(item.year) === year
  );
}

// ============================================================
// ПОИСК
// ============================================================

function setupSearch() {

  const searchInput =
    document.getElementById("searchInput");

  if (!searchInput) return;

  searchInput.addEventListener(
    "input",
    () => {

      currentSearchQuery =
        searchInput.value.trim();

      renderCatalog();
    }
  );
}

// ============================================================
// ПОИСК ПО КАТАЛОГУ
// ============================================================

function searchItems(items, query) {

  if (!Array.isArray(items)) {

    return [];
  }

  const search = String(
    query || ""
  )
    .trim()
    .toLowerCase();

  if (!search) {

    return items;
  }

  return items.filter(item => {

    const text = [

      item.title,

      item.originalTitle,

      item.description,

      item.director,

      ...(item.countries || []),

      ...(item.genres || []),

      ...(item.actors || [])

    ]
      .join(" ")
      .toLowerCase();

    return text.includes(search);
  });
}

// ============================================================
// ОСНОВНОЙ RENDER
// ============================================================

function renderCatalog() {

  const container =
    document.getElementById("movieGrid") ||
    document.getElementById("moviesGrid") ||
    document.getElementById("catalogGrid") ||
    document.querySelector(".movie-grid") ||
    document.querySelector(".movies-grid");

  if (!container) {

    console.warn(
      "SHOHIN MOVIE: контейнер каталога не найден."
    );

    return;
  }

  let items = getCurrentItems();

  // ----------------------------------------------------------
  // Год
  // ----------------------------------------------------------

  items = getYearFilteredItems(items);

  // ----------------------------------------------------------
  // Поиск
  // ----------------------------------------------------------

  items = searchItems(
    items,
    currentSearchQuery
  );

  // ----------------------------------------------------------
  // Активный фильтр
  // ----------------------------------------------------------

  if (
    typeof activeFilter !== "undefined" &&
    activeFilter &&
    activeFilter !== "all"
  ) {

    items = applyActiveFilter(
      items,
      activeFilter
    );
  }

  // ----------------------------------------------------------
  // Рендер
  // ----------------------------------------------------------

  if (!items.length) {

    container.innerHTML = `
      <div class="empty-catalog">
        <div class="empty-catalog-icon">⌕</div>
        <div class="empty-catalog-title">
          Ничего не найдено
        </div>
        <div class="empty-catalog-text">
          Попробуйте изменить поиск или выбрать другой год.
        </div>
      </div>
    `;

    updateCatalogInfo(0);

    return;
  }

  container.innerHTML = items
    .map(item => createMovieCard(item))
    .join("");

  updateCatalogInfo(items.length);

  updateActiveYear();

  updateActiveCatalogTab();
}

// ============================================================
// ПРИМЕНЕНИЕ АКТИВНОГО ФИЛЬТРА
// ============================================================

function applyActiveFilter(items, filter) {

  if (!Array.isArray(items)) {

    return [];
  }

  if (!filter || filter === "all") {

    return items;
  }

  if (
    typeof filter === "string" &&
    filter.startsWith("country:")
  ) {

    const country =
      filter.replace("country:", "");

    return items.filter(item =>
      (item.countries || [])
        .some(value =>
          String(value)
            .toLowerCase()
            .includes(
              country.toLowerCase()
            )
        )
    );
  }

  if (
    typeof filter === "string" &&
    filter.startsWith("genre:")
  ) {

    const genre =
      filter.replace("genre:", "");

    return items.filter(item =>
      (item.genres || [])
        .some(value =>
          String(value)
            .toLowerCase()
            .includes(
              genre.toLowerCase()
            )
        )
    );
  }

  const minimumRating =
    Number(filter);

  if (!Number.isNaN(minimumRating)) {

    return items.filter(
      item =>
        Number(item.rating || 0) >=
        minimumRating
    );
  }

  return items;
}

// ============================================================
// СОЗДАНИЕ КАРТОЧКИ
// ============================================================

function createMovieCard(item) {

  const safeId =
    escapeHTML(item.id);

  const title =
    escapeHTML(item.title);

  const year =
    Number(item.year || 0);

  const rating =
    Number(item.rating || 0);

  const poster =
    String(item.poster || "").trim();

  let posterHTML = "";

  if (poster) {

    posterHTML = `
      <img
        class="movie-card-poster"
        src="${escapeAttribute(poster)}"
        alt="${escapeAttribute(item.title)}"
        loading="lazy"
        onerror="this.style.display='none'; this.parentElement.classList.add('poster-error');"
      >
    `;

  } else {

    posterHTML = `
      <div class="movie-card-no-poster">
        <span>SHOHIN</span>
        <small>MOVIE</small>
      </div>
    `;
  }

  const genres =
    Array.isArray(item.genres)
      ? item.genres.slice(0, 2).join(" • ")
      : "";

  return `
    <article
      class="movie-card"
      data-movie-id="${safeId}"
      data-item-id="${safeId}"
      tabindex="0"
      role="button"
      aria-label="Открыть ${escapeAttribute(item.title)}"
    >

      <div class="movie-card-poster-wrap">

        ${posterHTML}

        ${
          rating > 0
            ? `
              <div class="movie-card-rating">
                ★ ${rating.toFixed(1)}
              </div>
            `
            : ""
        }

      </div>

      <div class="movie-card-content">

        <h3 class="movie-card-title">
          ${title}
        </h3>

        <div class="movie-card-meta">

          ${
            year
              ? `<span>${year}</span>`
              : ""
          }

          ${
            genres
              ? `<span>${escapeHTML(genres)}</span>`
              : ""
          }

        </div>

      </div>

    </article>
  `;
}

// ============================================================
// ОТКРЫТИЕ МОДАЛЬНОГО ОКНА
// ============================================================

function openMovieModal(item) {

  if (!item) return;

  currentModalItem = item;

  saveRecentItem(item);

  const modal =
    document.getElementById("movieModal");

  if (!modal) {

    console.warn(
      "SHOHIN MOVIE: #movieModal не найден."
    );

    return;
  }

  const title =
    document.getElementById("modalTitle");

  const originalTitle =
    document.getElementById("modalOriginalTitle");

  const year =
    document.getElementById("modalYear");

  const rating =
    document.getElementById("modalRating");

  const director =
    document.getElementById("modalDirector");

  const actors =
    document.getElementById("modalActors");

  const country =
    document.getElementById("modalCountry") ||
    document.getElementById("modalCountries");

  const genre =
    document.getElementById("modalGenre") ||
    document.getElementById("modalGenres");

  const description =
    document.getElementById("modalDescription");

  const poster =
    document.getElementById("modalPoster");

  // ----------------------------------------------------------
  // Заголовок
  // ----------------------------------------------------------

  if (title) {

    title.textContent =
      item.title || "Без названия";
  }

  if (originalTitle) {

    originalTitle.textContent =
      item.originalTitle || "";
  }

  if (year) {

    year.textContent =
      item.year || "";
  }

  if (rating) {

    rating.textContent =
      item.rating
        ? Number(item.rating).toFixed(1)
        : "";
  }

  if (director) {

    director.textContent =
      item.director || "—";
  }

  // ----------------------------------------------------------
  // Актёры
  // ----------------------------------------------------------

  if (actors) {

    const actorList =
      normalizeArray(item.actors);

    actors.textContent =
      actorList.length
        ? actorList.join(", ")
        : "—";
  }

  // ----------------------------------------------------------
  // Страны
  // ----------------------------------------------------------

  if (country) {

    const countries =
      normalizeArray(
        item.countries ||
        item.country
      );

    country.textContent =
      countries.length
        ? countries.join(", ")
        : "—";
  }

  // ----------------------------------------------------------
  // Жанры
  // ----------------------------------------------------------

  if (genre) {

    const genres =
      normalizeArray(
        item.genres ||
        item.genre
      );

    genre.textContent =
      genres.length
        ? genres.join(", ")
        : "—";
  }

  // ----------------------------------------------------------
  // Описание
  // ----------------------------------------------------------

  if (description) {

    description.textContent =
      item.description || "Описание отсутствует.";
  }

  // ----------------------------------------------------------
  // Постер
  // ----------------------------------------------------------

  if (poster) {

    if (item.poster) {

      poster.src = item.poster;

      poster.alt =
        item.title || "";

      poster.style.display =
        "block";

      poster.onerror = () => {

        poster.style.display =
          "none";
      };

    } else {

      poster.removeAttribute("src");

      poster.style.display =
        "none";
    }
  }

  // ----------------------------------------------------------
  // Избранное
  // ----------------------------------------------------------

  updateFavoriteButton();

  // ----------------------------------------------------------
  // Показ
  // ----------------------------------------------------------

  modal.classList.add("active");

  modal.removeAttribute("hidden");

  document.body.classList.add(
    "modal-open"
  );
}

// ============================================================
// ЗАКРЫТИЕ МОДАЛЬНОГО ОКНА
// ============================================================

function closeMovieModal() {

  const modal =
    document.getElementById("movieModal");

  if (!modal) return;

  modal.classList.remove("active");

  modal.setAttribute(
    "hidden",
    ""
  );

  document.body.classList.remove(
    "modal-open"
  );

  currentModalItem = null;
}

// ============================================================
// ИЗБРАННОЕ
// ============================================================

function getFavorites() {

  try {

    const raw =
      localStorage.getItem(
        FAVORITES_KEY
      );

    if (!raw) return [];

    const data =
      JSON.parse(raw);

    return Array.isArray(data)
      ? data
      : [];

  } catch (error) {

    console.warn(
      "SHOHIN MOVIE: ошибка избранного",
      error
    );

    return [];
  }
}

// ============================================================
// СОХРАНЕНИЕ ИЗБРАННОГО
// ============================================================

function saveFavorites(items) {

  try {

    localStorage.setItem(
      FAVORITES_KEY,
      JSON.stringify(
        items.slice(
          0,
          MAX_FAVORITES
        )
      )
    );

    return true;

  } catch (error) {

    console.warn(
      "SHOHIN MOVIE: не удалось сохранить избранное",
      error
    );

    return false;
  }
}

// ============================================================
// ПРОВЕРКА ИЗБРАННОГО
// ============================================================

function isFavorite(id) {

  if (!id) return false;

  const favorites =
    getFavorites();

  return favorites.some(
    item =>
      String(item.id) ===
      String(id)
  );
}

// ============================================================
// ДОБАВИТЬ / УБРАТЬ ИЗ ИЗБРАННОГО
// ============================================================

function toggleFavorite() {

  if (!currentModalItem) {

    return;
  }

  const favorites =
    getFavorites();

  const index =
    favorites.findIndex(
      item =>
        String(item.id) ===
        String(currentModalItem.id)
    );

  if (index >= 0) {

    favorites.splice(
      index,
      1
    );

  } else {

    favorites.unshift(
      currentModalItem
    );
  }

  saveFavorites(
    favorites
  );

  updateFavoriteButton();

  renderCatalog();
}

// ============================================================
// ИНИЦИАЛИЗАЦИЯ КНОПКИ
// ============================================================

function initFavoriteButton() {

  const button =
    document.getElementById(
      "favoriteButton"
    );

  if (!button) return;

  button.addEventListener(
    "click",
    toggleFavorite
  );

  updateFavoriteButton();
}

// ============================================================
// ОБНОВЛЕНИЕ КНОПКИ
// ============================================================

function updateFavoriteButton() {

  const button =
    document.getElementById(
      "favoriteButton"
    );

  if (!button) return;

  if (!currentModalItem) {

    button.classList.remove(
      "active"
    );

    return;
  }

  const active =
    isFavorite(
      currentModalItem.id
    );

  button.classList.toggle(
    "active",
    active
  );

  button.setAttribute(
    "aria-label",
    active
      ? "Удалить из избранного"
      : "Добавить в избранное"
  );

  const icon =
    button.querySelector(
      ".favorite-icon"
    );

  const text =
    button.querySelector(
      ".favorite-text"
    );

  if (icon) {

    icon.textContent =
      active
        ? "★"
        : "🔖";
  }

  if (text) {

    text.textContent =
      active
        ? "В избранном"
        : "Сохранить";
  }
}

// ============================================================
// НЕДАВНО ОТКРЫТЫЕ
// ============================================================

function getRecentItems() {

  try {

    const raw =
      localStorage.getItem(
        RECENT_KEY
      );

    if (!raw) return [];

    const data =
      JSON.parse(raw);

    return Array.isArray(data)
      ? data
      : [];

  } catch (error) {

    console.warn(
      "SHOHIN MOVIE: ошибка Recent",
      error
    );

    return [];
  }
}

// ============================================================
// СОХРАНИТЬ НЕДАВНО ОТКРЫТЫЙ
// ============================================================

function saveRecentItem(item) {

  if (!item || !item.id) return;

  const recent =
    getRecentItems();

  const filtered =
    recent.filter(
      existing =>
        String(existing.id) !==
        String(item.id)
    );

  filtered.unshift(item);

  try {

    localStorage.setItem(
      RECENT_KEY,
      JSON.stringify(
        filtered.slice(
          0,
          MAX_RECENT
        )
      )
    );

  } catch (error) {

    console.warn(
      "SHOHIN MOVIE: не удалось сохранить Recent",
      error
    );
  }
}

// ============================================================
// ПОИСК ЭЛЕМЕНТА ПО ID
// ============================================================

function findItemById(id) {

  if (!id) return null;

  const allItems = [
    ...(SHOHIN_MOVIE.movies || []),
    ...(SHOHIN_MOVIE.series || [])
  ];

  return (
    allItems.find(
      item =>
        String(item.id) ===
        String(id)
    ) || null
  );
}

// ============================================================
// СТРАНЫ
// ============================================================

function getAllCountries() {

  const items = [
    ...(SHOHIN_MOVIE.movies || []),
    ...(SHOHIN_MOVIE.series || [])
  ];

  const countries =
    new Set();

  items.forEach(item => {

    normalizeArray(
      item.countries ||
      item.country
    ).forEach(country => {

      countries.add(country);
    });

  });

  return [
    ...countries
  ].sort(
    (a, b) =>
      a.localeCompare(
        b,
        "ru",
        {
          sensitivity: "base"
        }
      )
  );
}

// ============================================================
// ЖАНРЫ
// ============================================================

function getAllGenres() {

  const items = [
    ...(SHOHIN_MOVIE.movies || []),
    ...(SHOHIN_MOVIE.series || [])
  ];

  const genres =
    new Set();

  items.forEach(item => {

    normalizeArray(
      item.genres ||
      item.genre
    ).forEach(genre => {

      genres.add(genre);
    });

  });

  return [
    ...genres
  ].sort(
    (a, b) =>
      a.localeCompare(
        b,
        "ru",
        {
          sensitivity: "base"
        }
      )
  );
}

// ============================================================
// ФИЛЬТР ПО СТРАНЕ
// ============================================================

function filterByCountry(country) {

  if (!country) {

    activeFilter = "all";

    renderCatalog();

    return [];
  }

  activeFilter =
    `country:${country}`;

  const items =
    getYearFilteredItems(
      getCurrentItems()
    );

  const filtered =
    items.filter(item =>
      normalizeArray(
        item.countries ||
        item.country
      ).some(
        value =>
          String(value)
            .toLowerCase()
            .includes(
              String(country)
                .toLowerCase()
            )
      )
    );

  renderFilteredItems(
    filtered
  );

  return filtered;
}

// ============================================================
// ФИЛЬТР ПО ЖАНРУ
// ============================================================

function filterByGenre(genre) {

  if (!genre) {

    activeFilter = "all";

    renderCatalog();

    return [];
  }

  activeFilter =
    `genre:${genre}`;

  const items =
    getYearFilteredItems(
      getCurrentItems()
    );

  const filtered =
    items.filter(item =>
      normalizeArray(
        item.genres ||
        item.genre
      ).some(
        value =>
          String(value)
            .toLowerCase()
            .includes(
              String(genre)
                .toLowerCase()
            )
      )
    );

  renderFilteredItems(
    filtered
  );

  return filtered;
}

// ============================================================
// ОТОБРАЖЕНИЕ ОТФИЛЬТРОВАННЫХ
// ============================================================

function renderFilteredItems(items) {

  const container =
    document.getElementById("movieGrid") ||
    document.getElementById("moviesGrid") ||
    document.getElementById("catalogGrid") ||
    document.querySelector(".movie-grid") ||
    document.querySelector(".movies-grid");

  if (!container) return;

  if (!Array.isArray(items) || !items.length) {

    container.innerHTML = `
      <div class="empty-catalog">
        <div class="empty-catalog-icon">⌕</div>
        <div class="empty-catalog-title">
          Ничего не найдено
        </div>
        <div class="empty-catalog-text">
          Попробуйте другой фильтр.
        </div>
      </div>
    `;

    updateCatalogInfo(0);

    return;
  }

  container.innerHTML =
    items
      .map(item =>
        createMovieCard(item)
      )
      .join("");

  updateCatalogInfo(
    items.length
  );
}

// ============================================================
// ДОСТУПНЫЕ ГОДЫ
// ============================================================

function getAvailableYears(items) {

  if (!Array.isArray(items)) {

    return [];
  }

  const years =
    new Set();

  items.forEach(item => {

    const year =
      Number(item.year);

    if (year) {

      years.add(year);
    }

  });

  return [
    ...years
  ].sort(
    (a, b) =>
      b - a
  );
}

// ============================================================
// ВСЕ ДОСТУПНЫЕ ГОДЫ
// ============================================================

function getAllAvailableYears() {

  const items = [
    ...(SHOHIN_MOVIE.movies || []),
    ...(SHOHIN_MOVIE.series || [])
  ];

  return getAvailableYears(
    items
  );
}

// ============================================================
// РЕНДЕР ГОДОВ
// ============================================================

function renderYearList(container) {

  if (!container) return;

  const years =
    getAllAvailableYears();

  if (!years.length) {

    container.innerHTML =
      `<div class="empty-catalog">Годы пока отсутствуют.</div>`;

    return;
  }

  container.innerHTML =
    years
      .map(year => `
        <button
          type="button"
          class="year-button"
          data-year="${year}">
          ${year}
        </button>
      `)
      .join("");
}

// ============================================================
// РЕЙТИНГ
// ============================================================

function getRatingRange(items) {

  if (!Array.isArray(items)) {

    return {
      min: 0,
      max: 0
    };
  }

  const ratings =
    items
      .map(
        item =>
          Number(item.rating)
      )
      .filter(
        rating =>
          !Number.isNaN(rating) &&
          rating > 0
      );

  if (!ratings.length) {

    return {
      min: 0,
      max: 0
    };
  }

  return {
    min: Math.min(...ratings),
    max: Math.max(...ratings)
  };
}

// ============================================================
// ФИЛЬТР ПО РЕЙТИНГУ
// ============================================================

function filterByRating(minRating) {

  const minimum =
    Number(minRating || 0);

  activeFilter =
    minimum > 0
      ? String(minimum)
      : "all";

  const items =
    getYearFilteredItems(
      getCurrentItems()
    );

  const filtered =
    items.filter(
      item =>
        Number(item.rating || 0) >=
        minimum
    );

  renderFilteredItems(
    filtered
  );

  return filtered;
}

// ============================================================
// СОРТИРОВКА ПО РЕЙТИНГУ
// ============================================================

function sortByRating(items) {

  if (!Array.isArray(items)) {

    return [];
  }

  return [
    ...items
  ].sort(
    (a, b) =>
      Number(b.rating || 0) -
      Number(a.rating || 0)
  );
}

// ============================================================
// СОРТИРОВКА ПО ГОДУ
// ============================================================

function sortByYear(items) {

  if (!Array.isArray(items)) {

    return [];
  }

  return [
    ...items
  ].sort(
    (a, b) =>
      Number(b.year || 0) -
      Number(a.year || 0)
  );
}

// ============================================================
// СОРТИРОВКА ПО НАЗВАНИЮ
// ============================================================

function sortByTitle(items) {

  if (!Array.isArray(items)) {

    return [];
  }

  return [
    ...items
  ].sort(
    (a, b) =>
      String(a.title || "")
        .localeCompare(
          String(b.title || ""),
          "ru",
          {
            sensitivity: "base"
          }
        )
  );
}

// ============================================================
// ОЧИСТИТЬ ФИЛЬТРЫ
// ============================================================

function clearAllFilters() {

  activeFilter = "all";

  currentSearchQuery = "";

  currentSelectedYear = "all";

  const searchInput =
    document.getElementById(
      "searchInput"
    );

  if (searchInput) {

    searchInput.value = "";
  }

  renderCatalog();
}

// ============================================================
// ОБНОВЛЕНИЕ АКТИВНОГО ГОДА
// ============================================================

function updateActiveYear() {

  document
    .querySelectorAll(
      "[data-year]"
    )
    .forEach(button => {

      const buttonYear =
        button.dataset.year;

      const active =
        String(
          buttonYear
        ) ===
        String(
          currentSelectedYear
        );

      button.classList.toggle(
        "active",
        active
      );

    });
}

// ============================================================
// ОБНОВЛЕНИЕ АКТИВНОЙ ВКЛАДКИ
// ============================================================

function updateActiveCatalogTab() {

  document
    .querySelectorAll(
      "[data-type], .type-tab, .catalog-tab"
    )
    .forEach(button => {

      const type =
        button.dataset.type ||
        button.dataset.catalog ||
        "";

      button.classList.toggle(
        "active",
        type ===
        SHOHIN_MOVIE.currentType
      );
    });
}

// ============================================================
// ИНФОРМАЦИЯ О КАТАЛОГЕ
// ============================================================

function updateCatalogInfo(count) {

  const elements = [

    document.getElementById(
      "catalogCount"
    ),

    document.getElementById(
      "movieCount"
    ),

    document.getElementById(
      "moviesCount"
    ),

    document.getElementById(
      "resultCount"
    )

  ].filter(Boolean);

  elements.forEach(element => {

    element.textContent =
      String(count);

  });
}

// ============================================================
// МЕНЮ / ДАННЫЕ
// ============================================================

function updateMenuData() {

  // Доступные годы
  const years =
    getAllAvailableYears();

  document
    .querySelectorAll(
      "[data-years-container]"
    )
    .forEach(container => {

      renderYearList(
        container
      );
    });

  // Страны
  const countries =
    getAllCountries();

  document
    .querySelectorAll(
      "[data-countries-container]"
    )
    .forEach(container => {

      container.innerHTML =
        countries
          .map(country => `
            <button
              type="button"
              class="country-button"
              data-country="${escapeAttribute(country)}">
              ${escapeHTML(country)}
            </button>
          `)
          .join("");
    });

  // Жанры
  const genres =
    getAllGenres();

  document
    .querySelectorAll(
      "[data-genres-container]"
    )
    .forEach(container => {

      container.innerHTML =
        genres
          .map(genre => `
            <button
              type="button"
              class="genre-button"
              data-genre="${escapeAttribute(genre)}">
              ${escapeHTML(genre)}
            </button>
          `)
          .join("");
    });

  console.log(
    "Доступные годы:",
    years
  );
}

// ============================================================
// ОШИБКА КАТАЛОГА
// ============================================================

function showCatalogError(message) {

  const container =
    document.getElementById("movieGrid") ||
    document.getElementById("moviesGrid") ||
    document.getElementById("catalogGrid") ||
    document.querySelector(".movie-grid") ||
    document.querySelector(".movies-grid");

  if (!container) return;

  container.innerHTML = `
    <div class="empty-catalog catalog-error">

      <div class="empty-catalog-title">
        Ошибка загрузки
      </div>

      <div class="empty-catalog-text">
        ${escapeHTML(message)}
      </div>

    </div>
  `;
}

// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHTML(value) {

  return String(value ?? "")
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}

// ============================================================
// ATTRIBUTE ESCAPE
// ============================================================

function escapeAttribute(value) {

  return escapeHTML(value);
}

// ============================================================
// ЭКСПОРТ ДЛЯ ДРУГИХ JS
// ============================================================

window.SHOHIN_MOVIE_APP = {

  loadAllCatalogs,

  loadYearFile,

  renderCatalog,

  openMovieModal,

  closeMovieModal,

  setCatalogType,

  selectYear,

  getCurrentItems,

  getAllCountries,

  getAllGenres,

  getAllAvailableYears,

  getFavorites,

  saveFavorites,

  isFavorite,

  toggleFavorite,

  getRecentItems,

  saveRecentItem,

  filterByCountry,

  filterByGenre,

  filterByRating,

  sortByRating,

  sortByYear,

  sortByTitle,

  clearAllFilters,

  findItemById

};

console.log(
  "SHOHIN MOVIE APP готов."
);