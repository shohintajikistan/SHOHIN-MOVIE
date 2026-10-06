// SHOHIN MOVIE — MAIN APP
// SHOHIN BRAND COLORS — НЕ МЕНЯТЬ

document.addEventListener("DOMContentLoaded", () => {

  initApp();

});


/* ==================================================
   INIT
================================================== */

function initApp() {

  setupSearch();

  setupTypeNavigation();

  setupModal();

  loadCatalog();

}


/* ==================================================
   LOAD CATALOG
================================================== */

async function loadCatalog() {

  showLoading(true);

  hideEmpty();


  const type =
    window.SHOHIN_MOVIE?.currentType || "movies";

  const year =
    window.SHOHIN_MOVIE?.currentYear || 1980;


  const file =
    `data/${type}/${year}.json`;


  try {

    const response =
      await fetch(
        file,
        {
          cache: "no-cache"
        }
      );


    if (!response.ok) {

      throw new Error(
        `HTTP ${response.status}`
      );

    }


    const data =
      await response.json();


    if (!Array.isArray(data)) {

      throw new Error(
        "JSON должен содержать массив"
      );

    }


    if (type === "movies") {

      SHOHIN_MOVIE.movies =
        data;

    } else {

      SHOHIN_MOVIE.series =
        data;

    }


    renderCatalog();


  } catch (error) {

    console.error(
      "SHOHIN MOVIE:",
      error
    );


    if (type === "movies") {

      SHOHIN_MOVIE.movies = [];

    } else {

      SHOHIN_MOVIE.series = [];

    }


    const grid =
      document.getElementById(
        "movieGrid"
      );


    if (grid) {

      grid.innerHTML = "";

    }


    showEmpty(
      `Каталог ${year} года пока не загружен.`
    );


  } finally {

    showLoading(false);

  }

}


/* ==================================================
   RENDER CATALOG
================================================== */

function renderCatalog() {

  const grid =
    document.getElementById(
      "movieGrid"
    );


  if (!grid) {
    return;
  }


  const items =
    Array.isArray(
      SHOHIN_MOVIE.currentItems
    )
      ? [...SHOHIN_MOVIE.currentItems]
      : [];


  const searchInput =
    document.getElementById(
      "searchInput"
    );


  const query =
    searchInput
      ? searchInput.value
          .trim()
          .toLowerCase()
      : "";


  let filtered =
    items.filter(
      item => {

        if (!query) {
          return true;
        }


        const title =
          String(
            item.title || ""
          ).toLowerCase();


        const originalTitle =
          String(
            item.originalTitle || ""
          ).toLowerCase();


        const description =
          String(
            item.description || ""
          ).toLowerCase();


        const countries =
          getCountries(item)
            .join(" ")
            .toLowerCase();


        const genres =
          getGenres(item)
            .join(" ")
            .toLowerCase();


        return (

          title.includes(query) ||

          originalTitle.includes(query) ||

          description.includes(query) ||

          countries.includes(query) ||

          genres.includes(query)

        );

      }
    );


  /*
   * Фильтр по рейтингу,
   * если его вызовет меню
   */

  if (
    window.activeFilter === "rating"
  ) {

    filtered.sort(
      (a, b) =>
        Number(
          b.rating || 0
        ) -
        Number(
          a.rating || 0
        )
    );

  }


  /*
   * Очистить старые карточки
   */

  grid.innerHTML = "";


  /*
   * Ничего не найдено
   */

  if (!filtered.length) {

    showEmpty(
      query
        ? `По запросу «${query}» ничего не найдено.`
        : "В этом каталоге пока нет карточек."
    );

    return;

  }


  hideEmpty();


  /*
   * Создаём карточки
   */

  filtered.forEach(
    item => {

      const card =
        createMovieCard(item);

      grid.appendChild(card);

    }
  );

}


/* ==================================================
   CREATE CARD
================================================== */

function createMovieCard(item) {

  const card =
    document.createElement(
      "article"
    );


  card.className =
    "movie-card";


  const poster =
    String(
      item.poster || ""
    ).trim();


  const title =
    escapeHTML(
      item.title ||
      "Без названия"
    );


  const year =
    escapeHTML(
      item.year ||
      ""
    );


  let rating = "—";


  if (
    item.rating !== undefined &&
    item.rating !== null &&
    item.rating !== ""
  ) {

    const number =
      Number(item.rating);


    if (!Number.isNaN(number)) {

      rating =
        number.toFixed(1);

    }

  }


  const genres =
    getGenres(item)
      .slice(0, 3);


  const genreText =
    genres.length
      ? escapeHTML(
          genres.join(" • ")
        )
      : "";


  let posterHTML;


  if (poster) {

    posterHTML = `

      <img
        class="poster"
        src="${escapeAttribute(poster)}"
        alt="${escapeAttribute(
          item.title || ""
        )}"
        loading="lazy"
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


      ${
        genreText
          ? `
            <div class="movie-genres">
              ${genreText}
            </div>
          `
          : ""
      }

    </div>

  `;


  /*
   * Если постер не загрузился
   */

  const image =
    card.querySelector(
      ".poster"
    );


  if (image) {

    image.addEventListener(
      "error",
      function () {

        image.style.display =
          "none";


        const placeholder =
          card.querySelector(
            ".poster-placeholder"
          );


        if (placeholder) {

          placeholder.style.display =
            "flex";

        }

      }
    );

  }


  /*
   * Открытие карточки
   */

  card.addEventListener(
    "click",
    () => {

      openMovieModal(item);

      saveRecent(item);

    }
  );


  return card;

}


/* ==================================================
   COUNTRIES
================================================== */

function getCountries(item) {

  if (
    Array.isArray(
      item.countries
    )
  ) {

    return item.countries
      .filter(Boolean)
      .map(
        country =>
          String(country).trim()
      )
      .filter(Boolean);

  }


  if (item.country) {

    return [
      String(
        item.country
      ).trim()
    ];

  }


  return [];

}


/* ==================================================
   GENRES
================================================== */

function getGenres(item) {

  if (
    !Array.isArray(
      item.genres
    )
  ) {

    return [];

  }


  return item.genres
    .filter(Boolean)
    .map(
      genre =>
        String(
          genre
        ).trim()
    )
    .filter(Boolean);

}


/* ==================================================
   ALL COUNTRIES
================================================== */

function getAllCountries() {

  const countries =
    new Set();


  const items =
    SHOHIN_MOVIE.currentItems ||
    [];


  items.forEach(
    item => {

      getCountries(item)
        .forEach(
          country =>
            countries.add(
              country
            )
        );

    }
  );


  return [...countries]
    .sort(
      (a, b) =>
        a.localeCompare(
          b,
          "ru",
          {
            sensitivity:
              "base"
          }
        )
    );

}


/* ==================================================
   ALL GENRES
================================================== */

function getAllGenres() {

  const genres =
    new Set();


  const items =
    SHOHIN_MOVIE.currentItems ||
    [];


  items.forEach(
    item => {

      getGenres(item)
        .forEach(
          genre =>
            genres.add(
              genre
            )
        );

    }
  );


  return [...genres]
    .sort(
      (a, b) =>
        a.localeCompare(
          b,
          "ru",
          {
            sensitivity:
              "base"
          }
        )
    );

}


/* ==================================================
   TYPE NAVIGATION
================================================== */

function setupTypeNavigation() {

  const buttons =
    document.querySelectorAll(
      ".nav-button"
    );


  buttons.forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const type =
            button.dataset.type;


          if (
            !type ||
            !window.SHOHIN_MOVIE
          ) {

            return;

          }


          buttons.forEach(
            item =>
              item.classList.remove(
                "active"
              )
          );


          button.classList.add(
            "active"
          );


          SHOHIN_MOVIE.currentType =
            type;


          /*
           * Сбрасываем поиск
           */

          const input =
            document.getElementById(
              "searchInput"
            );


          if (input) {

            input.value = "";

          }


          loadCatalog();

        }
      );

    }
  );

}


/* ==================================================
   SEARCH
================================================== */

function setupSearch() {

  const searchButton =
    document.getElementById(
      "searchButton"
    );


  const searchPanel =
    document.getElementById(
      "searchPanel"
    );


  const searchInput =
    document.getElementById(
      "searchInput"
    );


  const closeSearch =
    document.getElementById(
      "closeSearch"
    );


  if (
    !searchButton ||
    !searchPanel ||
    !searchInput
  ) {

    return;

  }


  /*
   * Открыть поиск
   */

  searchButton.addEventListener(
    "click",
    () => {

      searchPanel.classList.add(
        "show"
      );


      searchPanel.setAttribute(
        "aria-hidden",
        "false"
      );


      setTimeout(
        () => {

          searchInput.focus();

        },
        80
      );

    }
  );


  /*
   * Закрыть поиск
   */

  if (closeSearch) {

    closeSearch.addEventListener(
      "click",
      () => {

        searchPanel.classList.remove(
          "show"
        );


        searchPanel.setAttribute(
          "aria-hidden",
          "true"
        );


        searchInput.value = "";


        renderCatalog();

      }
    );

  }


  /*
   * Поиск в реальном времени
   */

  searchInput.addEventListener(
    "input",
    () => {

      renderCatalog();

    }
  );


  /*
   * ESC
   */

  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape"
      ) {

        if (
          searchPanel.classList.contains(
            "show"
          )
        ) {

          searchPanel.classList.remove(
            "show"
          );


          searchPanel.setAttribute(
            "aria-hidden",
            "true"
          );

        }

      }

    }
  );

}


/* ==================================================
   MOVIE MODAL
================================================== */

function setupModal() {

  const modal =
    document.getElementById(
      "movieModal"
    );


  const overlay =
    document.getElementById(
      "modalOverlay"
    );


  const close =
    document.getElementById(
      "modalClose"
    );


  if (!modal) {
    return;
  }


  if (close) {

    close.addEventListener(
      "click",
      closeMovieModal
    );

  }


  if (overlay) {

    overlay.addEventListener(
      "click",
      closeMovieModal
    );

  }


  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape" &&
        modal.classList.contains(
          "show"
        )
      ) {

        closeMovieModal();

      }

    }
  );

}


/* ==================================================
   OPEN MOVIE
================================================== */

function openMovieModal(item) {

  const modal =
    document.getElementById(
      "movieModal"
    );


  const modalPoster =
    document.getElementById(
      "modalPoster"
    );


  const modalYear =
    document.getElementById(
      "modalYear"
    );


  const modalTitle =
    document.getElementById(
      "modalTitle"
    );


  const modalRating =
    document.getElementById(
      "modalRating"
    );


  const modalCountry =
    document.getElementById(
      "modalCountry"
    );


  const modalGenres =
    document.getElementById(
      "modalGenres"
    );


  const modalDescription =
    document.getElementById(
      "modalDescription"
    );


  if (!modal) {
    return;
  }


  const poster =
    String(
      item.poster || ""
    ).trim();


  /*
   * POSTER
   */

  if (
    modalPoster &&
    poster
  ) {

    modalPoster.src =
      poster;

    modalPoster.alt =
      item.title ||
      "Постер";

    modalPoster.style.display =
      "block";

  } else if (modalPoster) {

    modalPoster.removeAttribute(
      "src"
    );

    modalPoster.alt = "";

    modalPoster.style.display =
      "none";

  }


  /*
   * YEAR
   */

  if (modalYear) {

    modalYear.textContent =
      item.year ||
      "";

  }


  /*
   * TITLE
   */

  if (modalTitle) {

    modalTitle.textContent =
      item.title ||
      "Без названия";

  }


  /*
   * RATING
   */

  if (modalRating) {

    if (
      item.rating !== undefined &&
      item.rating !== null &&
      item.rating !== ""
    ) {

      modalRating.textContent =
        `★ ${Number(
          item.rating
        ).toFixed(1)}`;

    } else {

      modalRating.textContent =
        "★ —";

    }

  }


  /*
   * COUNTRY
   */

  if (modalCountry) {

    const countries =
      getCountries(item);


    modalCountry.textContent =
      countries.length
        ? countries.join(" • ")
        : "Страна не указана";

  }


  /*
   * GENRES
   */

  if (modalGenres) {

    modalGenres.innerHTML = "";


    getGenres(item)
      .forEach(
        genre => {

          const tag =
            document.createElement(
              "span"
            );


          tag.className =
            "genre-tag";


          tag.textContent =
            genre;


          modalGenres.appendChild(
            tag
          );

        }
      );

  }


  /*
   * DESCRIPTION
   */

  if (modalDescription) {

    modalDescription.textContent =
      item.description ||
      "Описание пока не добавлено.";

  }


  /*
   * SHOW
   */

  modal.classList.add(
    "show"
  );


  modal.setAttribute(
    "aria-hidden",
    "false"
  );


  document.body.style.overflow =
    "hidden";

}


/* ==================================================
   CLOSE MODAL
================================================== */

function closeMovieModal() {

  const modal =
    document.getElementById(
      "movieModal"
    );


  if (!modal) {
    return;
  }


  modal.classList.remove(
    "show"
  );


  modal.setAttribute(
    "aria-hidden",
    "true"
  );


  document.body.style.overflow =
    "";

}


/* ==================================================
   RECENT
================================================== */

function saveRecent(item) {

  try {

    const key =
      "SHOHIN_MOVIE_RECENT";


    let recent =
      JSON.parse(
        localStorage.getItem(
          key
        ) || "[]"
      );


    recent =
      recent.filter(
        movie =>
          movie.id !== item.id
      );


    recent.unshift(
      item
    );


    /*
     * Максимум 30
     */

    recent =
      recent.slice(
        0,
        30
      );


    localStorage.setItem(
      key,
      JSON.stringify(
        recent
      )
    );


  } catch (error) {

    console.warn(
      "SHOHIN MOVIE RECENT:",
      error
    );

  }

}


/* ==================================================
   FILTER BY COUNTRY
================================================== */

function filterByCountry(
  country
) {

  const items =
    SHOHIN_MOVIE.currentItems ||
    [];


  if (
    !country ||
    country === "all"
  ) {

    renderCatalog();

    return;

  }


  const filtered =
    items.filter(
      item =>
        getCountries(item)
          .some(
            itemCountry =>
              itemCountry
                .toLowerCase() ===
              country
                .toLowerCase()
          )
    );


  renderFilteredItems(
    filtered
  );

}


/* ==================================================
   FILTER BY GENRE
================================================== */

function filterByGenre(
  genre
) {

  const items =
    SHOHIN_MOVIE.currentItems ||
    [];


  if (
    !genre ||
    genre === "all"
  ) {

    renderCatalog();

    return;

  }


  const filtered =
    items.filter(
      item =>
        getGenres(item)
          .some(
            itemGenre =>
              itemGenre
                .toLowerCase() ===
              genre
                .toLowerCase()
          )
    );


  renderFilteredItems(
    filtered
  );

}


/* ==================================================
   RENDER FILTERED
================================================== */

function renderFilteredItems(
  items
) {

  const grid =
    document.getElementById(
      "movieGrid"
    );


  if (!grid) {
    return;
  }


  grid.innerHTML = "";


  if (!items.length) {

    showEmpty(
      "По выбранному фильтру ничего не найдено."
    );

    return;

  }


  hideEmpty();


  items.forEach(
    item => {

      grid.appendChild(
        createMovieCard(item)
      );

    }
  );

}


/* ==================================================
   LOADING
================================================== */

function showLoading(
  show
) {

  const loading =
    document.getElementById(
      "loading"
    );


  if (!loading) {
    return;
  }


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


/* ==================================================
   EMPTY
================================================== */

function showEmpty(
  message
) {

  const empty =
    document.getElementById(
      "emptyState"
    );


  if (!empty) {
    return;
  }


  const paragraph =
    empty.querySelector(
      "p"
    );


  if (paragraph) {

    paragraph.textContent =
      message;

  }


  empty.classList.add(
    "show"
  );

}


/* ==================================================
   HIDE EMPTY
================================================== */

function hideEmpty() {

  const empty =
    document.getElementById(
      "emptyState"
    );


  if (!empty) {
    return;
  }


  empty.classList.remove(
    "show"
  );

}


/* ==================================================
   HTML ESCAPE
================================================== */

function escapeHTML(
  value
) {

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


/* ==================================================
   ATTRIBUTE ESCAPE
================================================== */

function escapeAttribute(
  value
) {

  return escapeHTML(
    value
  );

}