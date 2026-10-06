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


/* =========================================================
   START
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  loadCatalog();
  setupNavigation();
  setupSearch();
  setupYearMenu();
  setupModal();
});


/* =========================================================
   LOAD CATALOG
========================================================= */

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

    /*
      После загрузки автоматически строим
      список доступных стран и жанров.
    */
    prepareFilters();

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


/* =========================================================
   PREPARE FILTER DATA
========================================================= */

function prepareFilters() {

  /*
    Здесь пока только собираем данные.

    Например JSON:

    "countries": ["USA", "Japan"]

    "genres": [
      "Science Fiction",
      "Adventure",
      "Action"
    ]

    В будущем эти данные появятся
    прямо на главном экране.
  */

  const countries = getAllCountries();
  const genres = getAllGenres();

  console.log("SHOHIN MOVIE — COUNTRIES:", countries);
  console.log("SHOHIN MOVIE — GENRES:", genres);
}


/* =========================================================
   RENDER MOVIES
========================================================= */

function renderMovies() {

  const items = [...SHOHIN_MOVIE.currentItems];

  const query =
    searchInput.value.trim().toLowerCase();


  /* -------------------------------------------------------
     SEARCH
  ------------------------------------------------------- */

  let filtered = items.filter(item => {

    if (!query) return true;

    const title =
      String(item.title || "").toLowerCase();

    const originalTitle =
      String(item.originalTitle || "").toLowerCase();

    const genres =
      getGenres(item)
        .join(" ")
        .toLowerCase();

    const countries =
      getCountries(item)
        .join(" ")
        .toLowerCase();

    const description =
      String(item.description || "")
        .toLowerCase();

    return (
      title.includes(query) ||
      originalTitle.includes(query) ||
      genres.includes(query) ||
      countries.includes(query) ||
      description.includes(query)
    );
  });


  /* -------------------------------------------------------
     ACTIVE FILTER
  ------------------------------------------------------- */

  if (typeof activeFilter !== "undefined") {

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
  }


  /* -------------------------------------------------------
     DRAW CARDS
  ------------------------------------------------------- */

  movieGrid.innerHTML = "";


  if (!filtered.length) {

    catalogCount.textContent =
      "Ничего не найдено";

    showEmpty(
      query
        ? `По запросу «${query}» ничего не найдено.`
        : "В этом каталоге пока нет подходящих карточек."
    );

    return;
  }


  hideEmpty();


  filtered.forEach(item => {

    const card =
      createMovieCard(item);

    movieGrid.appendChild(card);

  });


  const typeName =
    SHOHIN_MOVIE.currentType === "movies"
      ? "фильмов"
      : "сериалов";


  catalogCount.textContent =
    `${filtered.length} ${typeName}`;
}


/* =========================================================
   CREATE MOVIE CARD
========================================================= */

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
      item.year ||
      SHOHIN_MOVIE.currentYear
    );


  const rating =
    item.rating !== undefined &&
    item.rating !== null &&
    item.rating !== ""
      ? Number(item.rating).toFixed(1)
      : "—";


  const genres =
    getGenres(item).slice(0, 3);


  const genreText =
    genres.length
      ? escapeHTML(
          genres.join(" • ")
        )
      : "Жанр не указан";


  let posterHTML = "";


  /* -------------------------------------------------------
     POSTER
  ------------------------------------------------------- */

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


  /* -------------------------------------------------------
     CARD HTML
  ------------------------------------------------------- */

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
    () => openMovieModal(item)
  );


  return card;
}


/* =========================================================
   COUNTRIES
========================================================= */

function getCountries(item) {

  /*
    Новый формат:

    "countries": [
      "USA",
      "Japan"
    ]
  */

  if (Array.isArray(item.countries)) {

    return item.countries
      .filter(Boolean)
      .map(country =>
        String(country).trim()
      )
      .filter(Boolean);
  }


  /*
    Старый формат тоже поддерживаем:

    "country": "USA"
  */

  if (item.country) {

    return [
      String(item.country).trim()
    ];
  }


  return [];
}


/* =========================================================
   GENRES
========================================================= */

function getGenres(item) {

  if (!Array.isArray(item.genres)) {
    return [];
  }

  return item.genres
    .filter(Boolean)
    .map(genre =>
      String(genre).trim()
    )
    .filter(Boolean);
}


/* =========================================================
   GET ALL COUNTRIES
========================================================= */

function getAllCountries() {

  const countries =
    new Set();


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


/* =========================================================
   GET ALL GENRES
========================================================= */

function getAllGenres() {

  const genres =
    new Set();


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


/* =========================================================
   FILTER BY COUNTRY
   Готово для следующего шага
========================================================= */

function filterByCountry(country) {

  const items =
    SHOHIN_MOVIE.currentItems || [];


  if (!country || country === "all") {

    renderMovies();
    return;
  }


  const filtered =
    items.filter(item => {

      return getCountries(item)
        .some(itemCountry =>
          itemCountry.toLowerCase() ===
          country.toLowerCase()
        );

    });


  renderFilteredItems(filtered);
}


/* =========================================================
   FILTER BY GENRE
   Готово для следующего шага
========================================================= */

function filterByGenre(genre) {

  const items =
    SHOHIN_MOVIE.currentItems || [];


  if (!genre || genre === "all") {

    renderMovies();
    return;
  }


  const filtered =
    items.filter(item => {

      return getGenres(item)
        .some(itemGenre =>
          itemGenre.toLowerCase() ===
          genre.toLowerCase()
        );

    });


  renderFilteredItems(filtered);
}


/* =========================================================
   RENDER FILTERED ITEMS
========================================================= */

function renderFilteredItems(items) {

  movieGrid.innerHTML = "";


  if (!items.length) {

    catalogCount.textContent =
      "Ничего не найдено";

    showEmpty(
      "По выбранному фильтру фильмов пока нет."
    );

    return;
  }


  hideEmpty();


  items.forEach(item => {

    const card =
      createMovieCard(item);

    movieGrid.appendChild(card);

  });


  const typeName =
    SHOHIN_MOVIE.currentType === "movies"
      ? "фильмов"
      : "сериалов";


  catalogCount.textContent =
    `${items.length} ${typeName}`;
}


/* =========================================================
   MOVIE MODAL
========================================================= */

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
    item.title ||
    "Без названия";


  modalRating.textContent =
    item.rating
      ? `★ ${Number(item.rating).toFixed(1)}`
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
        document.createElement("span");

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


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeMovieModal() {

  movieModal.classList.remove(
    "show"
  );

  document.body.style.overflow =
    "";
}


/* =========================================================
   MODAL SETUP
========================================================= */

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


/* =========================================================
   MOVIES / SERIES NAVIGATION
========================================================= */

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


          /*
            При переключении
            сбрасываем старые фильтры.
          */

          resetFilters();


          loadCatalog();

        }
      );

    });
}


/* =========================================================
   RESET FILTERS
========================================================= */

function resetFilters() {

  if (
    typeof activeFilter !==
    "undefined"
  ) {

    activeFilter =
      "all";
  }


  document
    .querySelectorAll(
      ".filter-button"
    )
    .forEach(button => {

      button.classList.toggle(
        "active",
        button.dataset.filter ===
        "all"
      );

    });


  if (searchInput) {

    searchInput.value = "";

  }
}


/* =========================================================
   SEARCH
========================================================= */

function setupSearch() {

  searchButton.addEventListener(
    "click",
    () => {

      searchPanel.classList.add(
        "show"
      );


      setTimeout(
        () =>
          searchInput.focus(),
        50
      );

    }
  );


  closeSearch.addEventListener(
    "click",
    () => {

      searchPanel.classList.remove(
        "show"
      );


      searchInput.value =
        "";


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


/* =========================================================
   YEAR MENU
========================================================= */

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


          resetFilters();


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


/* =========================================================
   CATALOG TITLE
========================================================= */

function updateCatalogTitle() {

  const typeName =
    SHOHIN_MOVIE.currentType ===
    "movies"
      ? "Фильмы"
      : "Сериалы";


  catalogTitle.textContent =
    `${typeName} ${SHOHIN_MOVIE.currentYear}`;
}


/* =========================================================
   LOADING
========================================================= */

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


/* =========================================================
   EMPTY STATE
========================================================= */

function showEmpty(message) {

  emptyState.classList.add(
    "show"
  );


  const paragraph =
    emptyState.querySelector(
      "p"
    );


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


/* =========================================================
   SECURITY / HTML
========================================================= */

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