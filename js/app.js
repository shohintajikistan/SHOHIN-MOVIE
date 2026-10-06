// SHOHIN MOVIE — MAIN APP
// SHOHIN BRAND COLORS — НЕ МЕНЯТЬ

let currentModalItem = null;


/* =========================================================
   INIT
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

  initSearch();
  initTypeNavigation();
  initModal();
  initFavoriteButton();

  loadCatalog("movies");

});


/* =========================================================
   SEARCH
========================================================= */

function initSearch() {

  const searchButton =
    document.getElementById("searchButton");

  const searchPanel =
    document.getElementById("searchPanel");

  const searchInput =
    document.getElementById("searchInput");

  const closeSearch =
    document.getElementById("closeSearch");


  if (searchButton) {

    searchButton.addEventListener(
      "click",
      () => {

        if (!searchPanel) return;

        searchPanel.classList.toggle("show");

        if (
          searchPanel.classList.contains("show") &&
          searchInput
        ) {

          setTimeout(() => {
            searchInput.focus();
          }, 100);

        }

      }
    );

  }


  if (closeSearch) {

    closeSearch.addEventListener(
      "click",
      () => {

        if (searchInput) {
          searchInput.value = "";
        }

        if (searchPanel) {
          searchPanel.classList.remove("show");
        }

        renderCatalog();

      }
    );

  }


  if (searchInput) {

    searchInput.addEventListener(
      "input",
      () => {

        renderCatalog();

      }
    );

  }

}


/* =========================================================
   TYPE NAVIGATION
========================================================= */

function initTypeNavigation() {

  document
    .querySelectorAll(".nav-button")
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(".nav-button")
            .forEach(item => {
              item.classList.remove("active");
            });

          button.classList.add("active");

          const type =
            button.dataset.type || "movies";

          loadCatalog(type);

        }
      );

    });

}


/* =========================================================
   LOAD CATALOG
========================================================= */

async function loadCatalog(type) {

  const loading =
    document.getElementById("loading");

  const grid =
    document.getElementById("movieGrid");

  const emptyState =
    document.getElementById("emptyState");


  if (loading) {
    loading.classList.add("show");
  }

  if (grid) {
    grid.innerHTML = "";
  }

  if (emptyState) {
    emptyState.hidden = true;
  }


  if (
    typeof SHOHIN_MOVIE !== "undefined"
  ) {

    SHOHIN_MOVIE.currentType =
      type === "series"
        ? "series"
        : "movies";

  }


  /*
    Сейчас загружаем тестовый 1980 год.
    Позже можно будет автоматически
    подключать все годы.
  */

  const year = 1980;


  if (
    typeof SHOHIN_MOVIE !== "undefined"
  ) {

    SHOHIN_MOVIE.currentYear = year;

  }


  const folder =
    type === "series"
      ? "series"
      : "movies";


  const url =
    `data/${folder}/${year}.json`;


  try {

    const response =
      await fetch(url, {
        cache: "no-cache"
      });


    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }


    const data =
      await response.json();


    if (!Array.isArray(data)) {
      throw new Error(
        "JSON должен содержать массив."
      );
    }


    if (
      typeof SHOHIN_MOVIE !== "undefined"
    ) {

      if (type === "series") {

        SHOHIN_MOVIE.series = data;

      } else {

        SHOHIN_MOVIE.movies = data;

      }

    }


    renderCatalog();


  } catch (error) {

    console.error(
      "SHOHIN MOVIE LOAD ERROR:",
      error
    );


    if (grid) {

      grid.innerHTML = `
        <div class="load-error">

          <h3>
            Не удалось загрузить каталог
          </h3>

          <p>
            Проверьте файл:
            <br>
            <strong>${escapeHTML(url)}</strong>
          </p>

        </div>
      `;

    }

  } finally {

    if (loading) {
      loading.classList.remove("show");
    }

  }

}


/* =========================================================
   RENDER CATALOG
========================================================= */

function renderCatalog() {

  const grid =
    document.getElementById("movieGrid");

  const emptyState =
    document.getElementById("emptyState");

  const searchInput =
    document.getElementById("searchInput");


  if (!grid) return;


  let items = [];


  if (
    typeof SHOHIN_MOVIE !== "undefined"
  ) {

    items =
      Array.isArray(SHOHIN_MOVIE.currentItems)
        ? SHOHIN_MOVIE.currentItems
        : [];

  }


  const query =
    searchInput
      ? String(searchInput.value || "")
          .trim()
          .toLowerCase()
      : "";


  if (query) {

    items =
      items.filter(item =>
        searchItem(item, query)
      );

  }


  grid.innerHTML = "";


  if (!items.length) {

    if (emptyState) {
      emptyState.hidden = false;
    }

    return;

  }


  if (emptyState) {
    emptyState.hidden = true;
  }


  items.forEach(item => {

    const card =
      createMovieCard(item);

    if (card) {
      grid.appendChild(card);
    }

  });

}


/* =========================================================
   SEARCH ITEM
========================================================= */

function searchItem(item, query) {

  const title =
    String(item.title || "")
      .toLowerCase();

  const originalTitle =
    String(item.originalTitle || "")
      .toLowerCase();

  const description =
    String(item.description || "")
      .toLowerCase();


  const countries =
    Array.isArray(item.countries)
      ? item.countries
      : item.country
        ? [item.country]
        : [];


  const genres =
    Array.isArray(item.genres)
      ? item.genres
      : item.genre
        ? [item.genre]
        : [];


  return (
    title.includes(query) ||
    originalTitle.includes(query) ||
    description.includes(query) ||
    countries.some(country =>
      String(country)
        .toLowerCase()
        .includes(query)
    ) ||
    genres.some(genre =>
      String(genre)
        .toLowerCase()
        .includes(query)
    )
  );

}


/* =========================================================
   CREATE CARD
========================================================= */

function createMovieCard(item) {

  if (!item) return null;


  const card =
    document.createElement("article");

  card.className = "movie-card";


  const poster =
    document.createElement("div");

  poster.className = "movie-poster";


  if (item.poster) {

    const image =
      document.createElement("img");

    image.src = item.poster;

    image.alt =
      item.title || "SHOHIN MOVIE";

    image.loading = "lazy";


    image.addEventListener(
      "error",
      () => {

        image.remove();

        poster.classList.add(
          "poster-placeholder"
        );

        poster.innerHTML =
          "<span>SH</span>";

      }
    );


    poster.appendChild(image);

  } else {

    poster.classList.add(
      "poster-placeholder"
    );

    poster.innerHTML =
      "<span>SH</span>";

  }


  const info =
    document.createElement("div");

  info.className = "movie-card-info";


  const title =
    document.createElement("h3");

  title.className = "movie-card-title";

  title.textContent =
    item.title || "Без названия";


  const meta =
    document.createElement("div");

  meta.className = "movie-card-meta";


  if (item.year) {

    const year =
      document.createElement("span");

    year.textContent =
      String(item.year);

    meta.appendChild(year);

  }


  if (item.rating !== undefined) {

    const rating =
      document.createElement("span");

    rating.className =
      "movie-card-rating";

    rating.textContent =
      `★ ${Number(item.rating || 0).toFixed(1)}`;

    meta.appendChild(rating);

  }


  info.appendChild(title);
  info.appendChild(meta);


  card.appendChild(poster);
  card.appendChild(info);


  card.addEventListener(
    "click",
    () => {

      openMovieModal(item);

      saveRecent(item);

    }
  );


  return card;

}


/* =========================================================
   MODAL
========================================================= */

function initModal() {

  const modal =
    document.getElementById("movieModal");

  const overlay =
    document.getElementById("modalOverlay");

  const close =
    document.getElementById("modalClose");


  if (overlay) {

    overlay.addEventListener(
      "click",
      closeMovieModal
    );

  }


  if (close) {

    close.addEventListener(
      "click",
      closeMovieModal
    );

  }


  document.addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape" &&
        modal &&
        modal.classList.contains("show")
      ) {

        closeMovieModal();

      }

    }
  );

}


/* =========================================================
   OPEN MODAL
========================================================= */

function openMovieModal(item) {

  if (!item) return;


  currentModalItem = item;


  const modal =
    document.getElementById("movieModal");

  const modalPoster =
    document.getElementById("modalPoster");

  const modalYear =
    document.getElementById("modalYear");

  const modalTitle =
    document.getElementById("modalTitle");

  const modalRating =
    document.getElementById("modalRating");

  const modalCountry =
    document.getElementById("modalCountry");

  const modalGenres =
    document.getElementById("modalGenres");

  const modalDescription =
    document.getElementById("modalDescription");


  if (modalPoster) {

    if (item.poster) {

      modalPoster.src =
        item.poster;

      modalPoster.alt =
        item.title || "";

      modalPoster.style.display =
        "block";

    } else {

      modalPoster.removeAttribute(
        "src"
      );

      modalPoster.alt = "";

      modalPoster.style.display =
        "none";

    }

  }


  if (modalYear) {

    modalYear.textContent =
      item.year
        ? String(item.year)
        : "";

  }


  if (modalTitle) {

    modalTitle.textContent =
      item.title || "Без названия";

  }


  if (modalRating) {

    if (
      item.rating !== undefined &&
      item.rating !== null
    ) {

      modalRating.textContent =
        `★ ${Number(item.rating).toFixed(1)}`;

    } else {

      modalRating.textContent =
        "";

    }

  }


  /* COUNTRY */

  if (modalCountry) {

    const countries =
      Array.isArray(item.countries)
        ? item.countries
        : item.country
          ? [item.country]
          : [];


    modalCountry.textContent =
      countries.length
        ? countries.join(" • ")
        : "";

  }


  /* GENRES */

  if (modalGenres) {

    const genres =
      Array.isArray(item.genres)
        ? item.genres
        : item.genre
          ? [item.genre]
          : [];


    modalGenres.textContent =
      genres.length
        ? genres.join(" • ")
        : "";

  }


  if (modalDescription) {

    modalDescription.textContent =
      item.description ||
      "Описание пока отсутствует.";

  }


  /*
    Обновляем состояние кнопки
    🔖 Сохранить / Сохранено
  */

  updateFavoriteButton(item);


  if (modal) {

    modal.classList.add("show");

    modal.setAttribute(
      "aria-hidden",
      "false"
    );

    document.body.style.overflow =
      "hidden";

  }

}


/* =========================================================
   CLOSE MODAL
========================================================= */

function closeMovieModal() {

  const modal =
    document.getElementById("movieModal");


  if (modal) {

    modal.classList.remove("show");

    modal.setAttribute(
      "aria-hidden",
      "true"
    );

  }


  document.body.style.overflow =
    "";

}


/* =========================================================
   FAVORITES
========================================================= */

const FAVORITES_KEY =
  "SHOHIN_MOVIE_FAVORITES";


function getFavorites() {

  try {

    const saved =
      localStorage.getItem(
        FAVORITES_KEY
      );


    if (!saved) {
      return [];
    }


    const favorites =
      JSON.parse(saved);


    return Array.isArray(favorites)
      ? favorites
      : [];


  } catch (error) {

    console.warn(
      "SHOHIN MOVIE FAVORITES:",
      error
    );

    return [];

  }

}


/* =========================================================
   SAVE FAVORITES
========================================================= */

function saveFavorites(favorites) {

  try {

    localStorage.setItem(
      FAVORITES_KEY,
      JSON.stringify(
        Array.isArray(favorites)
          ? favorites
          : []
      )
    );


  } catch (error) {

    console.warn(
      "SHOHIN MOVIE FAVORITES SAVE:",
      error
    );

  }

}


/* =========================================================
   IS FAVORITE
========================================================= */

function isFavorite(item) {

  if (!item) return false;


  const favorites =
    getFavorites();


  return favorites.some(
    favorite =>
      String(favorite.id) ===
      String(item.id)
  );

}


/* =========================================================
   TOGGLE FAVORITE
========================================================= */

function toggleFavorite(item) {

  if (!item) return false;


  let favorites =
    getFavorites();


  const index =
    favorites.findIndex(
      favorite =>
        String(favorite.id) ===
        String(item.id)
    );


  if (index >= 0) {

    /*
      Уже сохранён —
      удаляем
    */

    favorites.splice(
      index,
      1
    );


    saveFavorites(
      favorites
    );


    return false;

  }


  /*
    Ещё не сохранён —
    добавляем в начало
  */

  favorites.unshift(item);


  /*
    Чтобы localStorage
    не рос бесконечно
  */

  favorites =
    favorites.slice(0, 500);


  saveFavorites(
    favorites
  );


  return true;

}


/* =========================================================
   FAVORITE BUTTON
========================================================= */

function initFavoriteButton() {

  const button =
    document.getElementById(
      "favoriteButton"
    );


  if (!button) return;


  button.addEventListener(
    "click",
    event => {

      event.preventDefault();

      event.stopPropagation();


      if (!currentModalItem) {
        return;
      }


      const saved =
        toggleFavorite(
          currentModalItem
        );


      updateFavoriteButton(
        currentModalItem
      );


      /*
        Небольшая визуальная
        обратная связь
      */

      button.classList.remove(
        "favorite-pulse"
      );


      void button.offsetWidth;


      button.classList.add(
        "favorite-pulse"
      );


      console.log(
        saved
          ? "SHOHIN MOVIE: добавлено в избранное"
          : "SHOHIN MOVIE: удалено из избранного"
      );

    }
  );

}


/* =========================================================
   UPDATE FAVORITE BUTTON
========================================================= */

function updateFavoriteButton(item) {

  const button =
    document.getElementById(
      "favoriteButton"
    );


  if (!button || !item) {
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


  const saved =
    isFavorite(item);


  if (saved) {

    button.classList.add(
      "active"
    );

    button.setAttribute(
      "aria-label",
      "Удалить из избранного"
    );


    if (icon) {
      icon.textContent = "🔖";
    }


    if (text) {
      text.textContent =
        "Сохранено";
    }


  } else {

    button.classList.remove(
      "active"
    );

    button.setAttribute(
      "aria-label",
      "Добавить в избранное"
    );


    if (icon) {
      icon.textContent = "🔖";
    }


    if (text) {
      text.textContent =
        "Сохранить";
    }

  }

}


/* =========================================================
   RECENT
========================================================= */

function saveRecent(item) {

  if (!item) return;


  try {

    const key =
      "SHOHIN_MOVIE_RECENT";


    let recent =
      JSON.parse(
        localStorage.getItem(key) ||
        "[]"
      );


    recent =
      Array.isArray(recent)
        ? recent
        : [];


    recent =
      recent.filter(
        movie =>
          String(movie.id) !==
          String(item.id)
      );


    recent.unshift(item);


    recent =
      recent.slice(0, 30);


    localStorage.setItem(
      key,
      JSON.stringify(recent)
    );


  } catch (error) {

    console.warn(
      "SHOHIN MOVIE RECENT:",
      error
    );

  }

}


/* =========================================================
   COUNTRIES
========================================================= */

function getAllCountries() {

  const items =
    typeof SHOHIN_MOVIE !== "undefined"
      ? SHOHIN_MOVIE.currentItems || []
      : [];


  const countries =
    new Set();


  items.forEach(item => {

    const list =
      Array.isArray(item.countries)
        ? item.countries
        : item.country
          ? [item.country]
          : [];


    list.forEach(country => {

      if (country) {
        countries.add(
          String(country)
        );
      }

    });

  });


  return [...countries]
    .sort((a, b) =>
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
   GENRES
========================================================= */

function getAllGenres() {

  const items =
    typeof SHOHIN_MOVIE !== "undefined"
      ? SHOHIN_MOVIE.currentItems || []
      : [];


  const genres =
    new Set();


  items.forEach(item => {

    const list =
      Array.isArray(item.genres)
        ? item.genres
        : item.genre
          ? [item.genre]
          : [];


    list.forEach(genre => {

      if (genre) {
        genres.add(
          String(genre)
        );
      }

    });

  });


  return [...genres]
    .sort((a, b) =>
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
========================================================= */

function filterByCountry(country) {

  const items =
    typeof SHOHIN_MOVIE !== "undefined"
      ? SHOHIN_MOVIE.currentItems || []
      : [];


  if (!country) {

    renderFilteredItems(
      items
    );

    return items;

  }


  const filtered =
    items.filter(item => {

      const countries =
        Array.isArray(item.countries)
          ? item.countries
          : item.country
            ? [item.country]
            : [];


      return countries.some(
        value =>
          String(value).toLowerCase() ===
          String(country).toLowerCase()
      );

    });


  renderFilteredItems(
    filtered
  );


  return filtered;

}


/* =========================================================
   FILTER BY GENRE
========================================================= */

function filterByGenre(genre) {

  const items =
    typeof SHOHIN_MOVIE !== "undefined"
      ? SHOHIN_MOVIE.currentItems || []
      : [];


  if (!genre) {

    renderFilteredItems(
      items
    );

    return items;

  }


  const filtered =
    items.filter(item => {

      const genres =
        Array.isArray(item.genres)
          ? item.genres
          : item.genre
            ? [item.genre]
            : [];


      return genres.some(
        value =>
          String(value).toLowerCase() ===
          String(genre).toLowerCase()
      );

    });


  renderFilteredItems(
    filtered
  );


  return filtered;

}


/* =========================================================
   RENDER FILTERED
========================================================= */

function renderFilteredItems(items) {

  const grid =
    document.getElementById(
      "movieGrid"
    );

  const emptyState =
    document.getElementById(
      "emptyState"
    );


  if (!grid) return;


  grid.innerHTML = "";


  if (!items || !items.length) {

    if (emptyState) {
      emptyState.hidden = false;
    }

    return;

  }


  if (emptyState) {
    emptyState.hidden = true;
  }


  items.forEach(item => {

    const card =
      createMovieCard(item);

    if (card) {
      grid.appendChild(card);
    }

  });

}


/* =========================================================
   AVAILABLE YEARS
========================================================= */

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


  return [...years]
    .sort(
      (a, b) => b - a
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

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