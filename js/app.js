// SHOHIN MOVIE — MAIN APP
// SHOHIN BRAND COLORS — НЕ МЕНЯТЬ

const movieGrid = document.getElementById("movieGrid");
const loading = document.getElementById("loading");
const emptyState = document.getElementById("emptyState");
const catalogCount = document.getElementById("catalogCount");
const catalogTitle = document.getElementById("catalogTitle");

const searchButton = document.getElementById("searchButton");
const searchPanel = document.getElementById("searchPanel");
const searchInput = document.getElementById("searchInput");
const closeSearch = document.getElementById("closeSearch");

const yearButton = document.getElementById("yearButton");
const yearMenu = document.getElementById("yearMenu");

const movieModal = document.getElementById("movieModal");
const modalOverlay = document.getElementById("modalOverlay");
const modalClose = document.getElementById("modalClose");

const modalPoster = document.getElementById("modalPoster");
const modalYear = document.getElementById("modalYear");
const modalTitle = document.getElementById("modalTitle");
const modalRating = document.getElementById("modalRating");
const modalCountry = document.getElementById("modalCountry");
const modalGenres = document.getElementById("modalGenres");
const modalDescription = document.getElementById("modalDescription");


/* =========================
   START
========================= */

document.addEventListener("DOMContentLoaded", () => {

  loadCatalog();

  setupNavigation();
  setupSearch();
  setupYearMenu();
  setupModal();

});


/* =========================
   LOAD CATALOG
========================= */

async function loadCatalog() {

  showLoading(true);
  hideEmpty();

  const type = SHOHIN_MOVIE.currentType;
  const year = SHOHIN_MOVIE.currentYear;

  const file = `data/${type}/${year}.json`;

  try {

    const response = await fetch(file, {
      cache: "no-cache"
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error("JSON должен содержать массив");
    }

    if (type === "movies") {
      SHOHIN_MOVIE.movies = data;
    } else {
      SHOHIN_MOVIE.series = data;
    }

    updateCatalogTitle();

    renderMovies();

  } catch (error) {

    console.error("SHOHIN MOVIE:", error);

    if (type === "movies") {
      SHOHIN_MOVIE.movies = [];
    } else {
      SHOHIN_MOVIE.series = [];
    }

    movieGrid.innerHTML = "";

    catalogCount.textContent =
      `Для ${year} года пока нет каталога`;

    showEmpty(
      `Файл ${year}.json пока пуст или отсутствует.`
    );

  } finally {

    showLoading(false);

  }

}


/* =========================
   RENDER
========================= */

function renderMovies() {

  const items = [...SHOHIN_MOVIE.currentItems];

  const query =
    searchInput.value
      .trim()
      .toLowerCase();

  let filtered = items.filter(item => {

    if (!query) return true;

    const title =
      String(item.title || "").toLowerCase();

    const originalTitle =
      String(item.originalTitle || "").toLowerCase();

    const genres =
      Array.isArray(item.genres)
        ? item.genres.join(" ").toLowerCase()
        : "";

    const countries =
      getCountries(item)
        .join(" ")
        .toLowerCase();

    const description =
      String(item.description || "").toLowerCase();

    return (
      title.includes(query) ||
      originalTitle.includes(query) ||
      genres.includes(query) ||
      countries.includes(query) ||
      description.includes(query)
    );

  });


  /* =========================
     FILTER
  ========================= */

  if (activeFilter === "rating") {

    filtered.sort(
      (a, b) =>
        Number(b.rating || 0) -
        Number(a.rating || 0)
    );

  }


  if (activeFilter === "new") {

    filtered.sort(
      (a, b) =>
        Number(b.year || 0) -
        Number(a.year || 0)
    );

  }


  movieGrid.innerHTML = "";


  if (!filtered.length) {

    catalogCount.textContent =
      "Ничего не найдено";

    showEmpty(
      query
        ? `По запросу «${query}» ничего не найдено.`
        : "В этом каталоге пока нет карточек."
    );

    return;

  }


  hideEmpty();


  filtered.forEach(item => {

    const card =
      createMovieCard(item);

    movieGrid.appendChild(card);

  });


  catalogCount.textContent =
    `${filtered.length} ${
      SHOHIN_MOVIE.currentType === "movies"
        ? "фильмов"
        : "сериалов"
    }`;

}


/* =========================
   CREATE CARD
========================= */

function createMovieCard(item) {

  const card =
    document.createElement("article");

  card.className = "movie-card";


  const poster =
    String(item.poster || "").trim();


  const title =
    escapeHTML(
      item.title || "Без названия"
    );


  const year =
    escapeHTML(
      item.year || SHOHIN_MOVIE.currentYear
    );


  const rating =
    item.rating !== undefined &&
    item.rating !== null &&
    item.rating !== ""
      ? Number(item.rating).toFixed(1)
      : "—";


  const genres =
    Array.isArray(item.genres)
      ? item.genres.slice(0, 3)
      : [];


  const genreText =
    genres.length
      ? escapeHTML(
          genres.join(" • ")
        )
      : "Жанр не указан";


  let posterHTML = "";


  if (poster) {

    posterHTML = `

      <img
        class="poster"
        src="${escapeAttribute(poster)}"
        alt="${escapeAttribute(
          item.title || ""
        )}"
        loading="lazy"
        onerror="
          this.style.display='none';
          this.nextElementSibling.style.display='flex';
        "
      >

      <div
        class="poster-placeholder"
        style="display:none;"
      >
        Постер недоступен
      </div>

    `;

  } else {

    posterHTML = `

      <div class="poster-placeholder">
        Постер пока не добавлен
      </div>

    `;

  }


  card.innerHTML = `

    ${posterHTML}

    <div class="movie-info">

      <div class="movie-title">
        ${title}
      </div>


      <div class="movie-meta">

        <span class="movie-year">
          ${year}
        </span>

        <span class="movie-rating">
          ★ ${rating}
        </span>

      </div>


      <div class="movie-genres">
        ${genreText}
      </div>

    </div>

  `;


  card.addEventListener(
    "click",
    () => {

      openMovieModal(item);

    }
  );


  return card;

}


/* =========================
   COUNTRIES
========================= */

function getCountries(item) {

  if (
    Array.isArray(item.countries)
  ) {

    return item.countries
      .filter(Boolean)
      .map(country =>
        String(country).trim()
      );

  }


  /*
     Совместимость со старыми данными.
     Если где-то ещё останется
     старое поле country,
     приложение его тоже поймёт.
  */

  if (item.country) {

    return [
      String(item.country).trim()
    ];

  }


  return [];

}


/* =========================
   GENRES
========================= */

function getGenres(item) {

  if (
    !Array.isArray(item.genres)
  ) {

    return [];

  }

  return item.genres
    .filter(Boolean)
    .map(genre =>
      String(genre).trim()
    );

}


/* =========================
   GET ALL COUNTRIES
========================= */

function getAllCountries() {

  const countries = new Set();

  const items =
    SHOHIN_MOVIE.currentItems || [];

  items.forEach(item => {

    getCountries(item)
      .forEach(country => {

        countries.add(country);

      });

  });

  return [...countries].sort(
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


/* =========================
   GET ALL GENRES
========================= */

function getAllGenres() {

  const genres = new Set();

  const items =
    SHOHIN_MOVIE.currentItems || [];

  items.forEach(item => {

    getGenres(item)
      .forEach(genre => {

        genres.add(genre);

      });

  });

  return [...genres].sort(
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


/* =========================
   MODAL
========================= */

function openMovieModal(item) {

  const poster =
    String(item.poster || "").trim();


  if (poster) {

    modalPoster.src = poster;

    modalPoster.alt =
      item.title || "Постер";

    modalPoster.style.display =
      "block";

  } else {

    modalPoster.removeAttribute(
      "src"
    );

    modalPoster.style.display =
      "none";

  }


  modalYear.textContent =
    item.year || "";


  modalTitle.textContent =
    item.title || "Без названия";


  modalRating.textContent =
    item.rating
      ? `★ ${Number(
          item.rating
        ).toFixed(1)}`
      : "★ —";


  const countries =
    getCountries(item);


  modalCountry.textContent =
    countries.length
      ? countries.join(" • ")
      : "Страна не указана";


  modalGenres.innerHTML = "";


  getGenres(item)
    .forEach(genre => {

      const tag =
        document.createElement(
          "span"
        );

      tag.className =
        "genre-tag";

      tag.textContent =
        genre;

      modalGenres.appendChild(tag);

    });


  modalDescription.textContent =
    item.description ||
    "Описание пока не добавлено.";


  movieModal.classList.add(
    "show"
  );


  document.body.style.overflow =
    "hidden";

}


/* =========================
   CLOSE MODAL
========================= */

function closeMovieModal() {

  movieModal.classList.remove(
    "show"
  );

  document.body.style.overflow =
    "";

}


function setupModal() {

  modalClose.addEventListener(
    "click",
    closeMovieModal
  );


  modalOverlay.addEventListener(
    "click",
    closeMovieModal
  );


  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape" &&
        movieModal.classList.contains(
          "show"
        )
      ) {

        closeMovieModal();

      }

    }
  );

}


/* =========================
   NAVIGATION
========================= */

function setupNavigation() {

  document
    .querySelectorAll(".nav-button")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const type =
            button.dataset.type;

          if (!type) return;


          document
            .querySelectorAll(
              ".nav-button"
            )
            .forEach(btn => {

              btn.classList.remove(
                "active"
              );

            });


          button.classList.add(
            "active"
          );


          SHOHIN_MOVIE.currentType =
            type;


          loadCatalog();

        }
      );

    });

}


/* =========================
   SEARCH
========================= */

function setupSearch() {

  searchButton.addEventListener(
    "click",
    () => {

      searchPanel.classList.add(
        "show"
      );


      setTimeout(() => {

        searchInput.focus();

      }, 50);

    }
  );


  closeSearch.addEventListener(
    "click",
    () => {

      searchPanel.classList.remove(
        "show"
      );


      searchInput.value = "";


      renderMovies();

    }
  );


  searchInput.addEventListener(
    "input",
    () => {

      renderMovies();

    }
  );

}


/* =========================
   YEAR MENU
========================= */

function setupYearMenu() {

  yearButton.addEventListener(
    "click",
    () => {

      yearMenu.classList.toggle(
        "show"
      );

    }
  );


  yearMenu
    .querySelectorAll("button")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const year =
            Number(
              button.dataset.year
            );


          if (!year) return;


          SHOHIN_MOVIE.currentYear =
            year;


          yearButton.innerHTML =
            `${year} <span>⌄</span>`;


          yearMenu.classList.remove(
            "show"
          );


          loadCatalog();

        }
      );

    });


  document.addEventListener(
    "click",
    event => {

      if (
        !yearMenu.contains(
          event.target
        ) &&
        !yearButton.contains(
          event.target
        )
      ) {

        yearMenu.classList.remove(
          "show"
        );

      }

    }
  );

}


/* =========================
   TITLE
========================= */

function updateCatalogTitle() {

  const typeName =
    SHOHIN_MOVIE.currentType ===
    "movies"
      ? "Фильмы"
      : "Сериалы";


  catalogTitle.textContent =
    `${typeName} ${
      SHOHIN_MOVIE.currentYear
    }`;

}


/* =========================
   LOADING
========================= */

function showLoading(show) {

  if (show) {

    loading.classList.add(
      "show"
    );

  } else {

    loading.classList.remove(
      "show"
    );

  }

}


/* =========================
   EMPTY
========================= */

function showEmpty(message) {

  emptyState.classList.add(
    "show"
  );


  const paragraph =
    emptyState.querySelector("p");


  if (paragraph) {

    paragraph.textContent =
      message;

  }

}


function hideEmpty() {

  emptyState.classList.remove(
    "show"
  );

}


/* =========================
   SECURITY
========================= */

function escapeHTML(value) {

  return String(value)
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );

}


function escapeAttribute(value) {

  return escapeHTML(value);

}