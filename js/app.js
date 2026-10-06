// SHOHIN MOVIE — CARD SYSTEM
// SHOHIN BRAND COLORS — НЕ МЕНЯТЬ

const SHOHIN_MOVIE = window.SHOHIN_MOVIE || {
  currentType: "movies",
  currentYear: "all",
  movies: [],
  series: []
};

window.SHOHIN_MOVIE = SHOHIN_MOVIE;


/* =========================================================
   ОСНОВНЫЕ ДАННЫЕ
========================================================= */

function getCurrentItems() {
  if (SHOHIN_MOVIE.currentType === "series") {
    return Array.isArray(SHOHIN_MOVIE.series)
      ? SHOHIN_MOVIE.series
      : [];
  }

  return Array.isArray(SHOHIN_MOVIE.movies)
    ? SHOHIN_MOVIE.movies
    : [];
}


/* =========================================================
   ПОЛУЧЕНИЕ КАРТОЧКИ
========================================================= */

function createMovieCard(item) {

  if (!item || typeof item !== "object") {
    return "";
  }

  const id = String(item.id || "");
  const title = String(item.title || item.name || "Без названия");
  const originalTitle = String(
    item.originalTitle ||
    item.original_title ||
    ""
  );

  const year = item.year || "";
  const rating = item.rating !== undefined && item.rating !== null
    ? String(item.rating)
    : "";

  const poster = String(item.poster || "").trim();

  const genres = Array.isArray(item.genres)
    ? item.genres
    : item.genre
      ? [item.genre]
      : [];

  const genreText = genres
    .filter(Boolean)
    .slice(0, 2)
    .join(" • ");

  const safeId = escapeCardHTML(id);
  const safeTitle = escapeCardHTML(title);
  const safeOriginalTitle = escapeCardHTML(originalTitle);
  const safeYear = escapeCardHTML(year);
  const safeRating = escapeCardHTML(rating);
  const safeGenre = escapeCardHTML(genreText);

  const hasPoster = poster.length > 0;

  return `
    <article
      class="movie-card"
      data-id="${safeId}"
      data-year="${safeYear}"
      data-title="${safeTitle}"
      tabindex="0"
      role="button"
      aria-label="${safeTitle}"
    >

      <div class="movie-card-poster">

        ${
          hasPoster
            ? `
              <img
                src="${escapeCardHTML(poster)}"
                alt="${safeTitle}"
                class="movie-card-image"
                loading="lazy"
                decoding="async"
                onerror="this.style.display='none'; this.parentElement.classList.add('poster-empty');"
              >
            `
            : `
              <div class="poster-placeholder">
                <div class="poster-placeholder-logo">SH</div>
                <div class="poster-placeholder-text">SHOHIN MOVIE</div>
              </div>
            `
        }

        ${
          safeRating
            ? `
              <div class="movie-rating">
                <span class="rating-star">★</span>
                <span>${safeRating}</span>
              </div>
            `
            : ""
        }

      </div>

      <div class="movie-card-info">

        <h3 class="movie-card-title">
          ${safeTitle}
        </h3>

        ${
          safeOriginalTitle
            ? `
              <div class="movie-card-original-title">
                ${safeOriginalTitle}
              </div>
            `
            : ""
        }

        <div class="movie-card-meta">

          ${
            safeYear
              ? `
                <span class="movie-card-year">
                  ${safeYear}
                </span>
              `
              : ""
          }

          ${
            safeGenre
              ? `
                <span class="movie-card-genre">
                  ${safeGenre}
                </span>
              `
              : ""
          }

        </div>

      </div>

    </article>
  `;
}


/* =========================================================
   РЕНДЕР КАРТОЧЕК
========================================================= */

function renderMovieCards(items, container) {

  if (!container) {
    return;
  }

  if (!Array.isArray(items)) {
    container.innerHTML = "";
    return;
  }

  if (!items.length) {

    container.innerHTML = `
      <div class="empty-catalog">
        <div class="empty-catalog-icon">⌕</div>
        <h3>Ничего не найдено</h3>
        <p>Попробуйте изменить поиск или выбрать другой раздел.</p>
      </div>
    `;

    return;
  }

  container.innerHTML = items
    .map(item => createMovieCard(item))
    .join("");

  attachCardEvents(container);
}


/* =========================================================
   СОБЫТИЯ КАРТОЧЕК
========================================================= */

function attachCardEvents(container) {

  const cards = container.querySelectorAll(".movie-card");

  cards.forEach(card => {

    card.addEventListener("click", function () {

      const id = this.dataset.id;

      const item = findMovieById(id);

      if (item && typeof window.openMovieModal === "function") {
        window.openMovieModal(item);
      }

    });


    card.addEventListener("keydown", function (event) {

      if (
        event.key === "Enter" ||
        event.key === " "
      ) {

        event.preventDefault();

        const id = this.dataset.id;

        const item = findMovieById(id);

        if (
          item &&
          typeof window.openMovieModal === "function"
        ) {
          window.openMovieModal(item);
        }

      }

    });

  });
}


/* =========================================================
   ПОИСК ФИЛЬМА
========================================================= */

function findMovieById(id) {

  const movieId = String(id || "");

  if (!movieId) {
    return null;
  }

  const movies = Array.isArray(SHOHIN_MOVIE.movies)
    ? SHOHIN_MOVIE.movies
    : [];

  const series = Array.isArray(SHOHIN_MOVIE.series)
    ? SHOHIN_MOVIE.series
    : [];

  return (
    movies.find(item => String(item.id) === movieId) ||
    series.find(item => String(item.id) === movieId) ||
    null
  );
}


/* =========================================================
   ТЕКУЩИЕ ФИЛЬМЫ
========================================================= */

function getCurrentMovieItems() {
  return getCurrentItems();
}


/* =========================================================
   ФИЛЬТРАЦИЯ ПО ГОДУ
========================================================= */

function getItemsByYear(items, year) {

  if (!Array.isArray(items)) {
    return [];
  }

  if (
    year === undefined ||
    year === null ||
    year === "" ||
    year === "all"
  ) {
    return items;
  }

  const selectedYear = Number(year);

  if (!selectedYear) {
    return items;
  }

  return items.filter(item => {
    return Number(item.year) === selectedYear;
  });
}


/* =========================================================
   ФИЛЬТРАЦИЯ ПО СТРАНЕ
========================================================= */

function getItemsByCountry(items, country) {

  if (!Array.isArray(items)) {
    return [];
  }

  if (
    !country ||
    country === "all"
  ) {
    return items;
  }

  const selectedCountry = String(country)
    .trim()
    .toLowerCase();

  return items.filter(item => {

    const countries = Array.isArray(item.countries)
      ? item.countries
      : item.country
        ? [item.country]
        : [];

    return countries.some(value =>
      String(value)
        .trim()
        .toLowerCase() === selectedCountry
    );

  });
}


/* =========================================================
   ФИЛЬТРАЦИЯ ПО ЖАНРУ
========================================================= */

function getItemsByGenre(items, genre) {

  if (!Array.isArray(items)) {
    return [];
  }

  if (
    !genre ||
    genre === "all"
  ) {
    return items;
  }

  const selectedGenre = String(genre)
    .trim()
    .toLowerCase();

  return items.filter(item => {

    const genres = Array.isArray(item.genres)
      ? item.genres
      : item.genre
        ? [item.genre]
        : [];

    return genres.some(value =>
      String(value)
        .trim()
        .toLowerCase() === selectedGenre
    );

  });
}


/* =========================================================
   ПОЛУЧИТЬ СТРАНЫ
========================================================= */

function getAllCountries(items) {

  if (!Array.isArray(items)) {
    return [];
  }

  const countries = new Set();

  items.forEach(item => {

    const list = Array.isArray(item.countries)
      ? item.countries
      : item.country
        ? [item.country]
        : [];

    list.forEach(country => {

      if (country) {
        countries.add(String(country).trim());
      }

    });

  });

  return [...countries]
    .filter(Boolean)
    .sort((a, b) =>
      a.localeCompare(b, "ru")
    );
}


/* =========================================================
   ПОЛУЧИТЬ ЖАНРЫ
========================================================= */

function getAllGenres(items) {

  if (!Array.isArray(items)) {
    return [];
  }

  const genres = new Set();

  items.forEach(item => {

    const list = Array.isArray(item.genres)
      ? item.genres
      : item.genre
        ? [item.genre]
        : [];

    list.forEach(genre => {

      if (genre) {
        genres.add(String(genre).trim());
      }

    });

  });

  return [...genres]
    .filter(Boolean)
    .sort((a, b) =>
      a.localeCompare(b, "ru")
    );
}


/* =========================================================
   ПОЛУЧИТЬ ГОДЫ
========================================================= */

function getAvailableYears(items) {

  if (!Array.isArray(items)) {
    return [];
  }

  const years = new Set();

  items.forEach(item => {

    const year = Number(item.year);

    if (
      Number.isInteger(year) &&
      year > 1800
    ) {
      years.add(year);
    }

  });

  return [...years]
    .sort((a, b) => b - a);
}


/* =========================================================
   СОРТИРОВКИ
========================================================= */

function sortByRating(items) {

  if (!Array.isArray(items)) {
    return [];
  }

  return [...items].sort((a, b) => {

    return (
      Number(b.rating || 0) -
      Number(a.rating || 0)
    );

  });
}


function sortByYear(items) {

  if (!Array.isArray(items)) {
    return [];
  }

  return [...items].sort((a, b) => {

    return (
      Number(b.year || 0) -
      Number(a.year || 0)
    );

  });
}


function sortByTitle(items) {

  if (!Array.isArray(items)) {
    return [];
  }

  return [...items].sort((a, b) => {

    const titleA = String(
      a.title || ""
    );

    const titleB = String(
      b.title || ""
    );

    return titleA.localeCompare(
      titleB,
      "ru",
      {
        sensitivity: "base"
      }
    );

  });
}


/* =========================================================
   ЭКРАНИРОВАНИЕ HTML
========================================================= */

function escapeCardHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================================================
   ОБНОВЛЕНИЕ КАРТОЧЕК
========================================================= */

function refreshCards() {

  const container =
    document.getElementById("movieGrid") ||
    document.getElementById("moviesGrid") ||
    document.querySelector(".movie-grid") ||
    document.querySelector(".movies-grid");

  if (!container) {
    return;
  }

  const items = getCurrentItems();

  renderMovieCards(
    items,
    container
  );
}


/* =========================================================
   ГЛОБАЛЬНЫЕ ФУНКЦИИ
========================================================= */

window.createMovieCard =
  createMovieCard;

window.renderMovieCards =
  renderMovieCards;

window.getCurrentMovieItems =
  getCurrentMovieItems;

window.findMovieById =
  findMovieById;

window.getItemsByYear =
  getItemsByYear;

window.getItemsByCountry =
  getItemsByCountry;

window.getItemsByGenre =
  getItemsByGenre;

window.getAllCountries =
  getAllCountries;

window.getAllGenres =
  getAllGenres;

window.getAvailableYears =
  getAvailableYears;

window.sortByRating =
  sortByRating;

window.sortByYear =
  sortByYear;

window.sortByTitle =
  sortByTitle;

window.refreshCards =
  refreshCards;