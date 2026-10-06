// SHOHIN MOVIE — MAIN APP
// SHOHIN BRAND COLORS — НЕ МЕНЯТЬ

"use strict";


/* =========================================================
   НАСТРОЙКИ
========================================================= */

const SHOHIN_MOVIE_YEARS = [];

for (let year = 1980; year <= 2026; year++) {
  SHOHIN_MOVIE_YEARS.push(year);
}

const FAVORITES_KEY = "SHOHIN_MOVIE_FAVORITES";
const RECENT_KEY = "SHOHIN_MOVIE_RECENT";

const MAX_FAVORITES = 500;
const MAX_RECENT = 30;


/* =========================================================
   ОСНОВНОЙ ОБЪЕКТ
========================================================= */

if (!window.SHOHIN_MOVIE) {

  window.SHOHIN_MOVIE = {
    currentType: "movies",
    currentYear: "all",
    movies: [],
    series: []
  };

}

const SHOHIN_MOVIE = window.SHOHIN_MOVIE;


/* =========================================================
   ЗАПУСК
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  initApp();

});


async function initApp() {

  setupEventListeners();

  initFavoriteButton();

  setupSearch();

  await loadAllCatalogs();

  renderCatalog();

  updateMenuData();

}


/* =========================================================
   ЗАГРУЗКА ВСЕХ ГОДОВ
========================================================= */

async function loadAllCatalogs() {

  const movies = [];
  const series = [];

  const movieRequests = SHOHIN_MOVIE_YEARS.map(async year => {

    try {

      const response = await fetch(
        `data/movies/${year}.json`,
        {
          cache: "no-cache"
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      return normalizeCatalogData(data, year);

    } catch (error) {

      console.warn(
        `SHOHIN MOVIE: не удалось загрузить movies/${year}.json`
      );

      return [];

    }

  });


  const seriesRequests = SHOHIN_MOVIE_YEARS.map(async year => {

    try {

      const response = await fetch(
        `data/series/${year}.json`,
        {
          cache: "no-cache"
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      return normalizeCatalogData(data, year);

    } catch (error) {

      console.warn(
        `SHOHIN MOVIE: не удалось загрузить series/${year}.json`
      );

      return [];

    }

  });


  const movieResults =
    await Promise.all(movieRequests);

  const seriesResults =
    await Promise.all(seriesRequests);


  movieResults.forEach(list => {

    if (Array.isArray(list)) {
      movies.push(...list);
    }

  });


  seriesResults.forEach(list => {

    if (Array.isArray(list)) {
      series.push(...list);
    }

  });


  SHOHIN_MOVIE.movies =
    removeDuplicateItems(movies);

  SHOHIN_MOVIE.series =
    removeDuplicateItems(series);


  console.log(
    "SHOHIN MOVIE — фильмы:",
    SHOHIN_MOVIE.movies.length
  );

  console.log(
    "SHOHIN MOVIE — сериалы:",
    SHOHIN_MOVIE.series.length
  );

}


/* =========================================================
   НОРМАЛИЗАЦИЯ JSON
========================================================= */

function normalizeCatalogData(data, year) {

  let items = [];

  if (Array.isArray(data)) {

    items = data;

  } else if (
    data &&
    Array.isArray(data.movies)
  ) {

    items = data.movies;

  } else if (
    data &&
    Array.isArray(data.series)
  ) {

    items = data.series;

  } else if (
    data &&
    Array.isArray(data.items)
  ) {

    items = data.items;

  }


  return items
    .filter(item =>
      item &&
      typeof item === "object"
    )
    .map((item, index) => {

      const normalized = {
        ...item
      };


      /* -----------------------------
         ID
      ----------------------------- */

      if (!normalized.id) {

        normalized.id =
          `${year}-${index + 1}`;

      }


      /* -----------------------------
         ГОД
      ----------------------------- */

      if (
        !normalized.year ||
        Number(normalized.year) === 0
      ) {

        normalized.year = year;

      }


      /* -----------------------------
         НАЗВАНИЕ
      ----------------------------- */

      if (!normalized.title) {

        normalized.title =
          normalized.name ||
          normalized.originalTitle ||
          "Без названия";

      }


      /* -----------------------------
         ОРИГИНАЛЬНОЕ НАЗВАНИЕ
      ----------------------------- */

      if (
        normalized.originalTitle === undefined ||
        normalized.originalTitle === null
      ) {

        normalized.originalTitle = "";

      }


      /* -----------------------------
         СТРАНЫ
      ----------------------------- */

      if (
        !Array.isArray(normalized.countries)
      ) {

        if (normalized.country) {

          normalized.countries = [
            normalized.country
          ];

        } else {

          normalized.countries = [];

        }

      }


      /* -----------------------------
         ЖАНРЫ
      ----------------------------- */

      if (
        !Array.isArray(normalized.genres)
      ) {

        if (normalized.genre) {

          normalized.genres = [
            normalized.genre
          ];

        } else {

          normalized.genres = [];

        }

      }


      /* -----------------------------
         АКТЁРЫ
      ----------------------------- */

      if (
        !Array.isArray(normalized.actors)
      ) {

        if (normalized.actor) {

          normalized.actors = [
            normalized.actor
          ];

        } else {

          normalized.actors = [];

        }

      }


      /* -----------------------------
         ПОСТЕР
      ----------------------------- */

      if (
        normalized.poster === undefined ||
        normalized.poster === null
      ) {

        normalized.poster = "";

      }


      /* -----------------------------
         РЕЙТИНГ
      ----------------------------- */

      if (
        normalized.rating === undefined ||
        normalized.rating === null ||
        normalized.rating === ""
      ) {

        normalized.rating = "";

      }


      /* -----------------------------
         ОПИСАНИЕ
      ----------------------------- */

      if (
        normalized.description === undefined ||
        normalized.description === null
      ) {

        normalized.description = "";

      }


      return normalized;

    });

}


/* =========================================================
   УДАЛЕНИЕ ДУБЛИКАТОВ
========================================================= */

function removeDuplicateItems(items) {

  if (!Array.isArray(items)) {
    return [];
  }

  const result = [];
  const usedIds = new Set();

  items.forEach(item => {

    if (!item) {
      return;
    }

    const id = String(
      item.id || ""
    ).trim();

    if (!id) {
      result.push(item);
      return;
    }

    if (usedIds.has(id)) {
      return;
    }

    usedIds.add(id);

    result.push(item);

  });

  return result;
}


/* =========================================================
   РЕНДЕР КАТАЛОГА
========================================================= */

function renderCatalog() {

  const container =
    document.getElementById("movieGrid") ||
    document.getElementById("moviesGrid") ||
    document.querySelector(".movie-grid") ||
    document.querySelector(".movies-grid");


  if (!container) {
    return;
  }


  let items =
    SHOHIN_MOVIE.currentType === "series"
      ? SHOHIN_MOVIE.series
      : SHOHIN_MOVIE.movies;


  if (!Array.isArray(items)) {
    items = [];
  }


  /* -----------------------------
     ГОД
  ----------------------------- */

  if (
    SHOHIN_MOVIE.currentYear &&
    SHOHIN_MOVIE.currentYear !== "all"
  ) {

    const selectedYear =
      Number(SHOHIN_MOVIE.currentYear);

    items = items.filter(item =>
      Number(item.year) === selectedYear
    );

  }


  /* -----------------------------
     АКТИВНЫЙ ФИЛЬТР
  ----------------------------- */

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


  /* -----------------------------
     ПОИСК
  ----------------------------- */

  if (currentSearchQuery) {

    items = searchItems(
      items,
      currentSearchQuery
    );

  }


  /* -----------------------------
     КАРТОЧКИ
  ----------------------------- */

  if (
    typeof renderMovieCards === "function"
  ) {

    renderMovieCards(
      items,
      container
    );

  } else {

    container.innerHTML = items
      .map(item =>
        typeof createMovieCard === "function"
          ? createMovieCard(item)
          : ""
      )
      .join("");

  }

}


/* =========================================================
   АКТИВНЫЕ ФИЛЬТРЫ
========================================================= */

function applyActiveFilter(items, filter) {

  if (!Array.isArray(items)) {
    return [];
  }


  const value =
    String(filter)
      .trim()
      .toLowerCase();


  if (!value || value === "all") {
    return items;
  }


  /* Рейтинг */

  if (
    value.startsWith("rating:")
  ) {

    const minimum =
      Number(
        value.replace("rating:", "")
      );

    return items.filter(item =>
      Number(item.rating || 0) >= minimum
    );

  }


  /* Страна */

  if (
    value.startsWith("country:")
  ) {

    const country =
      value.replace("country:", "").trim();

    return items.filter(item => {

      const countries =
        Array.isArray(item.countries)
          ? item.countries
          : [];

      return countries.some(itemCountry =>
        String(itemCountry)
          .toLowerCase()
          .trim() === country
      );

    });

  }


  /* Жанр */

  if (
    value.startsWith("genre:")
  ) {

    const genre =
      value.replace("genre:", "").trim();

    return items.filter(item => {

      const genres =
        Array.isArray(item.genres)
          ? item.genres
          : [];

      return genres.some(itemGenre =>
        String(itemGenre)
          .toLowerCase()
          .trim() === genre
      );

    });

  }


  return items;
}


/* =========================================================
   ПОИСК
========================================================= */

let currentSearchQuery = "";


function setupSearch() {

  const searchInput =
    document.getElementById("searchInput");


  if (!searchInput) {
    return;
  }


  searchInput.addEventListener(
    "input",
    event => {

      currentSearchQuery =
        String(
          event.target.value || ""
        )
        .trim()
        .toLowerCase();


      renderCatalog();

    }
  );

}


function searchItems(items, query) {

  if (!Array.isArray(items)) {
    return [];
  }


  if (!query) {
    return items;
  }


  return items.filter(item => {

    const countries =
      Array.isArray(item.countries)
        ? item.countries.join(" ")
        : "";

    const genres =
      Array.isArray(item.genres)
        ? item.genres.join(" ")
        : "";

    const actors =
      Array.isArray(item.actors)
        ? item.actors.join(" ")
        : "";


    const text = [

      item.title,
      item.originalTitle,
      item.description,
      item.director,
      countries,
      genres,
      actors,
      item.year

    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();


    return text.includes(query);

  });

}


/* =========================================================
   ПЕРЕКЛЮЧЕНИЕ ФИЛЬМЫ / СЕРИАЛЫ
========================================================= */

function setCatalogType(type) {

  const selectedType =
    type === "series"
      ? "series"
      : "movies";


  SHOHIN_MOVIE.currentType =
    selectedType;


  SHOHIN_MOVIE.currentYear =
    "all";


  renderCatalog();

}


/* =========================================================
   ПЕРЕКЛЮЧЕНИЕ ГОДА
========================================================= */

function setCatalogYear(year) {

  if (
    year === undefined ||
    year === null ||
    year === "" ||
    year === "all"
  ) {

    SHOHIN_MOVIE.currentYear =
      "all";

  } else {

    SHOHIN_MOVIE.currentYear =
      Number(year);

  }


  renderCatalog();

}


/* =========================================================
   ФИЛЬТР ПО СТРАНЕ
========================================================= */

function filterByCountry(country) {

  if (!country || country === "all") {

    if (
      typeof resetFilters === "function"
    ) {
      resetFilters();
    } else {
      renderCatalog();
    }

    return;
  }


  const items =
    SHOHIN_MOVIE.currentType === "series"
      ? SHOHIN_MOVIE.series
      : SHOHIN_MOVIE.movies;


  const filtered =
    typeof getItemsByCountry === "function"
      ? getItemsByCountry(
          items,
          country
        )
      : items;


  renderFilteredItems(filtered);

}


/* =========================================================
   ФИЛЬТР ПО ЖАНРУ
========================================================= */

function filterByGenre(genre) {

  if (!genre || genre === "all") {

    if (
      typeof resetFilters === "function"
    ) {
      resetFilters();
    } else {
      renderCatalog();
    }

    return;
  }


  const items =
    SHOHIN_MOVIE.currentType === "series"
      ? SHOHIN_MOVIE.series
      : SHOHIN_MOVIE.movies;


  const filtered =
    typeof getItemsByGenre === "function"
      ? getItemsByGenre(
          items,
          genre
        )
      : items;


  renderFilteredItems(filtered);

}


/* =========================================================
   ФИЛЬТРОВАННЫЕ КАРТОЧКИ
========================================================= */

function renderFilteredItems(items) {

  const container =
    document.getElementById("movieGrid") ||
    document.getElementById("moviesGrid") ||
    document.querySelector(".movie-grid") ||
    document.querySelector(".movies-grid");


  if (!container) {
    return;
  }


  if (
    typeof renderMovieCards === "function"
  ) {

    renderMovieCards(
      items,
      container
    );

  }

}


/* =========================================================
   ИЗБРАННОЕ
========================================================= */

function getFavorites() {

  try {

    const saved =
      localStorage.getItem(
        FAVORITES_KEY
      );


    if (!saved) {
      return [];
    }


    const data =
      JSON.parse(saved);


    return Array.isArray(data)
      ? data
      : [];

  } catch (error) {

    return [];

  }

}


function saveFavorites(items) {

  if (!Array.isArray(items)) {
    return;
  }


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

  } catch (error) {

    console.warn(
      "SHOHIN MOVIE: ошибка сохранения избранного"
    );

  }

}


function isFavorite(id) {

  const favorites =
    getFavorites();


  return favorites.some(item =>
    String(item.id) === String(id)
  );

}


function toggleFavorite(item) {

  if (!item || !item.id) {
    return false;
  }


  let favorites =
    getFavorites();


  const existingIndex =
    favorites.findIndex(
      favorite =>
        String(favorite.id) ===
        String(item.id)
    );


  if (existingIndex !== -1) {

    favorites.splice(
      existingIndex,
      1
    );

    saveFavorites(
      favorites
    );

    updateFavoriteButton(
      false
    );

    return false;

  }


  favorites.unshift(item);


  if (
    favorites.length >
    MAX_FAVORITES
  ) {

    favorites =
      favorites.slice(
        0,
        MAX_FAVORITES
      );

  }


  saveFavorites(
    favorites
  );


  updateFavoriteButton(
    true
  );


  return true;

}


/* =========================================================
   КНОПКА ИЗБРАННОГО
========================================================= */

let currentModalItem = null;


function initFavoriteButton() {

  const button =
    document.getElementById(
      "favoriteButton"
    );


  if (!button) {
    return;
  }


  button.addEventListener(
    "click",
    event => {

      event.preventDefault();

      event.stopPropagation();


      if (!currentModalItem) {
        return;
      }


      const added =
        toggleFavorite(
          currentModalItem
        );


      button.classList.remove(
        "favorite-pulse"
      );


      void button.offsetWidth;


      button.classList.add(
        "favorite-pulse"
      );


      updateFavoriteButton(
        added
      );

    }
  );

}


function updateFavoriteButton(active) {

  const button =
    document.getElementById(
      "favoriteButton"
    );


  if (!button) {
    return;
  }


  const icon =
    button.querySelector(
      ".favorite-icon"
    );


  const text =
    button.querySelector(
      ".favorite-text"
    );


  button.classList.toggle(
    "active",
    Boolean(active)
  );


  if (icon) {

    icon.textContent =
      active
        ? "🔖"
        : "🔖";

  }


  if (text) {

    text.textContent =
      active
        ? "Сохранено"
        : "Сохранить";

  }


  button.setAttribute(
    "aria-label",
    active
      ? "Удалить из избранного"
      : "Добавить в избранное"
  );

}


/* =========================================================
   НЕДАВНО ОТКРЫТЫЕ
========================================================= */

function getRecentItems() {

  try {

    const saved =
      localStorage.getItem(
        RECENT_KEY
      );


    if (!saved) {
      return [];
    }


    const data =
      JSON.parse(saved);


    return Array.isArray(data)
      ? data
      : [];

  } catch (error) {

    return [];

  }

}


function saveRecentItem(item) {

  if (!item || !item.id) {
    return;
  }


  let recent =
    getRecentItems();


  recent =
    recent.filter(
      recentItem =>
        String(recentItem.id) !==
        String(item.id)
    );


  recent.unshift(item);


  recent =
    recent.slice(
      0,
      MAX_RECENT
    );


  try {

    localStorage.setItem(
      RECENT_KEY,
      JSON.stringify(recent)
    );

  } catch (error) {

    console.warn(
      "SHOHIN MOVIE: ошибка сохранения истории"
    );

  }

}


/* =========================================================
   МОДАЛЬНОЕ ОКНО
========================================================= */

function openMovieModal(item) {

  if (!item) {
    return;
  }


  currentModalItem =
    item;


  saveRecentItem(
    item
  );


  updateFavoriteButton(
    isFavorite(item.id)
  );


  const modal =
    document.getElementById(
      "movieModal"
    );


  if (!modal) {
    return;
  }


  const title =
    modal.querySelector(
      ".modal-title"
    );


  const originalTitle =
    modal.querySelector(
      ".modal-original-title"
    );


  const poster =
    modal.querySelector(
      ".modal-poster"
    );


  const description =
    modal.querySelector(
      ".modal-description"
    );


  const year =
    modal.querySelector(
      ".modal-year"
    );


  const rating =
    modal.querySelector(
      ".modal-rating"
    );


  const director =
    modal.querySelector(
      ".modal-director"
    );


  const actors =
    modal.querySelector(
      ".modal-actors"
    );


  const countries =
    modal.querySelector(
      ".modal-countries"
    );


  const genres =
    modal.querySelector(
      ".modal-genres"
    );


  if (title) {

    title.textContent =
      item.title || "Без названия";

  }


  if (originalTitle) {

    originalTitle.textContent =
      item.originalTitle || "";

  }


  if (poster) {

    const image =
      poster.querySelector("img");


    if (image) {

      if (item.poster) {

        image.src =
          item.poster;

        image.alt =
          item.title || "";

        image.style.display =
          "block";

      } else {

        image.removeAttribute(
          "src"
        );

        image.style.display =
          "none";

      }

    }

  }


  if (description) {

    description.textContent =
      item.description || "";

  }


  if (year) {

    year.textContent =
      item.year || "";

  }


  if (rating) {

    rating.textContent =
      item.rating
        ? `★ ${item.rating}`
        : "";

  }


  if (director) {

    director.textContent =
      item.director || "—";

  }


  if (actors) {

    const actorList =
      Array.isArray(item.actors)
        ? item.actors
        : [];


    actors.textContent =
      actorList.join(", ");

  }


  if (countries) {

    const countryList =
      Array.isArray(item.countries)
        ? item.countries
        : [];


    countries.textContent =
      countryList.join(", ");

  }


  if (genres) {

    const genreList =
      Array.isArray(item.genres)
        ? item.genres
        : [];


    genres.textContent =
      genreList.join(", ");

  }


  modal.classList.add(
    "open"
  );


  document.body.classList.add(
    "modal-open"
  );

}


function closeMovieModal() {

  const modal =
    document.getElementById(
      "movieModal"
    );


  if (!modal) {
    return;
  }


  modal.classList.remove(
    "open"
  );


  document.body.classList.remove(
    "modal-open"
  );


  currentModalItem =
    null;

}


/* =========================================================
   СОБЫТИЯ
========================================================= */

function setupEventListeners() {


  /* Фильмы */

  document.addEventListener(
    "click",
    event => {

      const moviesButton =
        event.target.closest(
          "[data-type='movies']"
        );


      if (moviesButton) {

        setCatalogType(
          "movies"
        );

      }

    }
  );


  /* Сериалы */

  document.addEventListener(
    "click",
    event => {

      const seriesButton =
        event.target.closest(
          "[data-type='series']"
        );


      if (seriesButton) {

        setCatalogType(
          "series"
        );

      }

    }
  );


  /* Год */

  document.addEventListener(
    "click",
    event => {

      const yearButton =
        event.target.closest(
          "[data-year]"
        );


      if (
        yearButton &&
        !yearButton.closest(
          ".movie-card"
        )
      ) {

        const year =
          yearButton.dataset.year;


        setCatalogYear(
          year
        );

      }

    }
  );


  /* Закрытие модального окна */

  document.addEventListener(
    "click",
    event => {

      if (
        event.target.matches(
          "[data-close-modal]"
        )
      ) {

        closeMovieModal();

      }

    }
  );


  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape"
      ) {

        closeMovieModal();

      }

    }
  );

}


/* =========================================================
   ДАННЫЕ ДЛЯ МЕНЮ
========================================================= */

function updateMenuData() {

  const allItems = [
    ...SHOHIN_MOVIE.movies,
    ...SHOHIN_MOVIE.series
  ];


  const years =
    typeof getAvailableYears === "function"
      ? getAvailableYears(allItems)
      : [];


  const countries =
    typeof getAllCountries === "function"
      ? getAllCountries(allItems)
      : [];


  const genres =
    typeof getAllGenres === "function"
      ? getAllGenres(allItems)
      : [];


  window.SHOHIN_MOVIE_MENU_DATA = {

    years,
    countries,
    genres

  };

}


/* =========================================================
   ESCAPE
========================================================= */

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =========================================================
   ГЛОБАЛЬНЫЕ ФУНКЦИИ
========================================================= */

window.loadAllCatalogs =
  loadAllCatalogs;

window.renderCatalog =
  renderCatalog;

window.setCatalogType =
  setCatalogType;

window.setCatalogYear =
  setCatalogYear;

window.searchItems =
  searchItems;

window.filterByCountry =
  filterByCountry;

window.filterByGenre =
  filterByGenre;

window.renderFilteredItems =
  renderFilteredItems;

window.getFavorites =
  getFavorites;

window.saveFavorites =
  saveFavorites;

window.isFavorite =
  isFavorite;

window.toggleFavorite =
  toggleFavorite;

window.openMovieModal =
  openMovieModal;

window.closeMovieModal =
  closeMovieModal;

window.getRecentItems =
  getRecentItems;

window.saveRecentItem =
  saveRecentItem;

window.escapeHTML =
  escapeHTML;

window.SHOHIN_MOVIE_APP = {

  loadAllCatalogs,
  renderCatalog,
  setCatalogType,
  setCatalogYear,
  searchItems,
  filterByCountry,
  filterByGenre,
  getFavorites,
  saveFavorites,
  isFavorite,
  toggleFavorite,
  openMovieModal,
  closeMovieModal,
  getRecentItems,
  saveRecentItem

};