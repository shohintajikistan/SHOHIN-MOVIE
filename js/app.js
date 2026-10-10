/* SHOHIN MOVIE — MAIN APPLICATION */
/* SHOHIN BRAND COLORS — НЕ МЕНЯТЬ */

(function () {
  "use strict";

  const STORAGE = {
    favorites: "shohin_movie_favorites",
    history: "shohin_movie_history",
    cardSize: "shohin_movie_card_size",
    saveHistory: "shohin_movie_save_history"
  };

  const state = {
    movies: [],
    series: [],
    actors: [],
    allItems: [],
    currentItem: null,
    currentActor: null,
    catalogType: "all",
    searchQuery: "",
    visibleCount: 20,
    pageSize: 20,
    loading: false,
    activePage: "homePage",
    lastPage: "homePage"
  };

  const $ = (selector) => document.querySelector(selector);

  const byId = (id) => document.getElementById(id);

  function readStorage(key, fallback) {
    try {
      const value = localStorage.getItem(key);

      return value === null ? fallback : JSON.parse(value);
    } catch (error) {
      return fallback;
    }
  }

  function writeStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      showToast("Не удалось сохранить данные на устройстве.");
      return false;
    }
  }

  function escapeHTML(value) {
    if (window.SHOHINCards) {
      return window.SHOHINCards.escapeHTML(value);
    }

    return String(value ?? "").replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char];
    });
  }

  function getId(item) {
    if (window.SHOHINCards) {
      return window.SHOHINCards.getMovieId(item);
    }

    if (item.id !== undefined && item.id !== null) {
      return String(item.id);
    }

    return [
      item.type || "film",
      item.year || "",
      item.originalTitle || item.title || ""
    ].join("-").toLowerCase();
  }

  function getFavorites() {
    const result = readStorage(STORAGE.favorites, []);

    return Array.isArray(result) ? result : [];
  }

  function getHistory() {
    const result = readStorage(STORAGE.history, []);

    return Array.isArray(result) ? result : [];
  }

  function isSeries(item) {
    return [
      "series",
      "serie",
      "tv",
      "tvshow",
      "tv_show",
      "сериал"
    ].includes(String(item.type || "").toLowerCase());
  }

  function findItem(id) {
    return state.allItems.find(function (item) {
      return getId(item) === String(id);
    });
  }

  function showToast(message) {
    const toast = byId("toast");

    if (!toast) {
      console.log(message);
      return;
    }

    toast.textContent = message;
    toast.classList.remove("hidden");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(function () {
      toast.classList.add("hidden");
    }, 2500);
  }

  // --------------------------------------------------
  // ЗАГРУЗКА ЛОКАЛЬНЫХ JSON-ФАЙЛОВ
  // --------------------------------------------------

  function getYearFolder(year) {
    const number = Number(year);

    if (number >= 1990 && number <= 2000) {
      return "1990-2000";
    }

    if (number >= 2001 && number <= 2010) {
      return "2001-2010";
    }

    if (number >= 2011 && number <= 2020) {
      return "2011-2020";
    }

    return "2021-2026";
  }

  async function fetchJSON(path) {
    try {
      const response = await fetch(path, {
        cache: "no-cache"
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      return null;
    }
  }

  function extractArray(data) {
    if (Array.isArray(data)) {
      return data;
    }

    if (data && Array.isArray(data.movies)) {
      return data.movies;
    }

    if (data && Array.isArray(data.series)) {
      return data.series;
    }

    if (data && Array.isArray(data.actors)) {
      return data.actors;
    }

    if (data && Array.isArray(data.items)) {
      return data.items;
    }

    return [];
  }

  async function loadYear(year) {
    const folder = getYearFolder(year);

    const paths = [
      `data/movies/${folder}/${year}.json`,
      `data/movies/${year}.json`
    ];

    for (const path of paths) {
      const data = await fetchJSON(path);

      if (data !== null) {
        return extractArray(data);
      }
    }

    return [];
  }

  async function loadAllData() {
    if (state.loading) {
      return;
    }

    state.loading = true;

    const moviesGrid = byId("moviesGrid");

    if (moviesGrid) {
      moviesGrid.innerHTML = `
        <div class="loader-wrap">
          <div class="loader"></div>
          <span>Загружаем фильмы...</span>
        </div>
      `;
    }

    try {
      const years = [];

      for (let year = 1990; year <= 2026; year++) {
        years.push(year);
      }

      const results = await Promise.all(
        years.map(function (year) {
          return loadYear(year);
        })
      );

      const loadedMovies = results.flat();

      const normalizedMovies = loadedMovies.map(function (item) {
        return normalizeItem(item, "film");
      });

      const seriesData = await fetchJSON("data/series.json");

      const normalizedSeries = extractArray(seriesData).map(function (item) {
        return normalizeItem(item, "series");
      });

      const actorsData = await fetchJSON("data/actors.json");

      state.movies = removeDuplicates(normalizedMovies);
      state.series = removeDuplicates(normalizedSeries);
      state.actors = extractArray(actorsData);

      state.allItems = removeDuplicates(
        state.movies.concat(state.series)
      );

      renderHome();
      renderFavorites();
      renderHistory();
      updateFooter();

      if (state.allItems.length === 0) {
        showToast(
          "Фильмы пока не загружены. Проверьте JSON-файлы."
        );
      }
    } catch (error) {
      console.error("SHOHIN MOVIE:", error);

      showToast("Не удалось загрузить каталог.");
    } finally {
      state.loading = false;
    }
  }

  function normalizeItem(item, defaultType) {
    return {
      ...item,
      type: item.type || defaultType,
      title: item.title || item.name || "Без названия",
      originalTitle:
        item.originalTitle ||
        item.original_title ||
        item.originalName ||
        item.title ||
        item.name ||
        "",
      year: item.year || item.releaseYear || "",
      country: item.country || item.countries || "",
      genres: Array.isArray(item.genres)
        ? item.genres
        : typeof item.genres === "string"
          ? item.genres.split(",").map(function (genre) {
              return genre.trim();
            })
          : [],
      actors: Array.isArray(item.actors)
        ? item.actors
        : [],
      description:
        item.description ||
        item.overview ||
        "",
      poster:
        item.poster ||
        item.posterUrl ||
        ""
    };
  }

  function removeDuplicates(items) {
    const seen = new Set();

    return items.filter(function (item) {
      const id = getId(item);

      if (seen.has(id)) {
        return false;
      }

      seen.add(id);
      return true;
    });
  }

  // --------------------------------------------------
  // НАВИГАЦИЯ МЕЖДУ СТРАНИЦАМИ
  // --------------------------------------------------

  function showPage(pageId) {
    const page = byId(pageId);

    if (!page) {
      console.warn("SHOHIN MOVIE: страница не найдена:", pageId);
      return;
    }

    document.querySelectorAll(".page").forEach(function (element) {
      element.classList.remove("active");
    });

    page.classList.add("active");

    state.lastPage = state.activePage;
    state.activePage = pageId;

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });

    updateNavigation(pageId);
    closeMenu();
  }

  function updateNavigation(pageId) {
    document.querySelectorAll(
      ".nav-item, .drawer-link"
    ).forEach(function (button) {
      const target =
        button.dataset.page ||
        button.dataset.target ||
        "";

      button.classList.toggle(
        "active",
        target === pageId
      );
    });
  }

  function goHome() {
    showPage("homePage");
    renderHome();
  }

  function goBack() {
    showPage(state.lastPage || "homePage");
  }

  // --------------------------------------------------
  // ГЛАВНАЯ СТРАНИЦА
  // --------------------------------------------------

  function renderHome() {
    const recent = getHistory()
      .map(function (entry) {
        return findItem(entry.id);
      })
      .filter(Boolean)
      .slice(0, 10);

    const featured = state.movies
      .filter(function (item) {
        return Number(item.rating) >= 7;
      })
      .sort(function (a, b) {
        return Number(b.rating || 0) - Number(a.rating || 0);
      })
      .slice(0, 12);

    renderCards(recent, "recentGrid", "Недавно открытые фильмы");
    renderCards(featured, "featuredGrid", "Популярные фильмы");
    renderCards(state.movies.slice(0, 20), "moviesGrid", "Фильмы");
    renderCards(state.series.slice(0, 20), "seriesGrid", "Сериалы");

    if (window.SHOHINCards) {
      window.SHOHINCards.renderActorCards(
        state.actors.slice(0, 12),
        "actorsGrid"
      );
    }

    renderGenreChips();
  }

  function renderCards(items, containerId, emptyTitle) {
    const target = byId(containerId);

    if (!target || !window.SHOHINCards) {
      return;
    }

    window.SHOHINCards.renderMovieCards(
      items,
      target,
      {
        emptyTitle: emptyTitle,
        emptyText: "Когда данные будут добавлены, они появятся здесь."
      }
    );
  }

  function renderGenreChips() {
    const container = byId("genreChips");

    if (!container) {
      return;
    }

    const genres = new Set();

    state.allItems.forEach(function (item) {
      item.genres.forEach(function (genre) {
        if (genre) {
          genres.add(genre);
        }
      });
    });

    const list = Array.from(genres).slice(0, 15);

    container.innerHTML = list.map(function (genre) {
      return `
        <button
          class="chip"
          type="button"
          onclick="openGenre('${escapeHTML(genre).replace(/'/g, "\\'")}')"
        >${escapeHTML(genre)}</button>
      `;
    }).join("");
  }

  // --------------------------------------------------
  // ПОИСК
  // --------------------------------------------------

  function focusSearch() {
    const input = byId("searchInput");

    if (input) {
      input.focus();
      input.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  }

  function openSearch() {
    showPage("searchPage");

    const input = byId("pageSearchInput");

    if (input) {
      input.focus();
    }
  }

  function handleSearch(value) {
    const query = String(
      value !== undefined
        ? value
        : (byId("searchInput") || {}).value || ""
    ).trim();

    state.searchQuery = query;

    if (!query) {
      return;
    }

    const pageInput = byId("pageSearchInput");

    if (pageInput) {
      pageInput.value = query;
    }

    renderSearchResults();
    showPage("searchPage");
  }

  function renderSearchResults() {
    const input = byId("pageSearchInput");

    const query = String(
      (input && input.value) || state.searchQuery || ""
    ).trim().toLowerCase();

    state.searchQuery = query;

    const results = query
      ? state.allItems.filter(function (item) {
          const searchable = [
            item.title,
            item.originalTitle,
            item.year,
            item.country,
            item.description,
            item.genres.join(" "),
            item.actors.join(" ")
          ].join(" ").toLowerCase();

          return searchable.includes(query);
        })
      : [];

    renderCards(results, "searchResultsGrid", "Ничего не найдено");
  }

  // --------------------------------------------------
  // КАТАЛОГ И ФИЛЬТРЫ
  // --------------------------------------------------

  function showCatalog(type) {
    state.catalogType = type || "all";
    state.visibleCount = state.pageSize;

    showPage("catalogPage");

    const title = byId("catalogTitle");

    if (title) {
      const titles = {
        all: "Весь каталог",
        film: "Фильмы",
        series: "Сериалы"
      };

      title.textContent = titles[state.catalogType] || "Каталог";
    }

    renderCatalogTypes();
    applyFilters();
  }

  function renderCatalogTypes() {
    const container = byId("catalogTypes");

    if (!container) {
      return;
    }

    const types = [
      { id: "all", title: "Всё" },
      { id: "film", title: "Фильмы" },
      { id: "series", title: "Сериалы" }
    ];

    container.innerHTML = types.map(function (type) {
      const active = state.catalogType === type.id
        ? " active"
        : "";

      return `
        <button
          class="chip${active}"
          type="button"
          onclick="setCatalogType('${type.id}')"
        >${type.title}</button>
      `;
    }).join("");
  }

  function setCatalogType(type) {
    state.catalogType = type || "all";
    state.visibleCount = state.pageSize;

    const title = byId("catalogTitle");

    if (title) {
      title.textContent = {
        all: "Весь каталог",
        film: "Фильмы",
        series: "Сериалы"
      }[state.catalogType] || "Каталог";
    }

    renderCatalogTypes();
    applyFilters();
  }

  function applyFilters() {
    const genre = (byId("filterGenre") || {}).value || "";
    const year = (byId("filterYear") || {}).value || "";
    const country = (byId("filterCountry") || {}).value || "";
    const sort = (byId("sortOrder") || {}).value || "rating";

    let items = state.allItems.filter(function (item) {
      if (
        state.catalogType === "film" &&
        isSeries(item)
      ) {
        return false;
      }

      if (
        state.catalogType === "series" &&
        !isSeries(item)
      ) {
        return false;
      }

      if (genre && !item.genres.includes(genre)) {
        return false;
      }

      if (year && String(item.year) !== String(year)) {
        return false;
      }

      if (
        country &&
        !String(item.country).toLowerCase().includes(
          country.toLowerCase()
        )
      ) {
        return false;
      }

      return true;
    });

    if (sort === "rating") {
      items.sort(function (a, b) {
        return Number(b.rating || 0) - Number(a.rating || 0);
      });
    } else if (sort === "year-new") {
      items.sort(function (a, b) {
        return Number(b.year || 0) - Number(a.year || 0);
      });
    } else if (sort === "year-old") {
      items.sort(function (a, b) {
        return Number(a.year || 0) - Number(b.year || 0);
      });
    } else if (sort === "title") {
      items.sort(function (a, b) {
        return a.title.localeCompare(b.title, "ru");
      });
    }

    const visibleItems = items.slice(0, state.visibleCount);

    renderCards(
      visibleItems,
      "catalogGrid",
      "Фильмы не найдены"
    );

    const count = byId("resultsCount");

    if (count) {
      count.textContent = "Найдено: " + items.length;
    }

    const button = byId("loadMoreBtn");

    if (button) {
      button.classList.toggle(
        "hidden",
        visibleItems.length >= items.length
      );
    }
  }

  function resetFilters() {
    [
      "filterGenre",
      "filterYear",
      "filterCountry"
    ].forEach(function (id) {
      const element = byId(id);

      if (element) {
        element.value = "";
      }
    });

    const sort = byId("sortOrder");

    if (sort) {
      sort.value = "rating";
    }

    state.visibleCount = state.pageSize;
    applyFilters();
  }

  function loadMore() {
    state.visibleCount += state.pageSize;
    applyFilters();
  }

  function openGenre(genre) {
    showCatalog("all");

    const select = byId("filterGenre");

    if (select) {
      const exists = Array.from(select.options).some(function (option) {
        return option.value === genre;
      });

      if (exists) {
        select.value = genre;
      }
    }

    applyFilters();
  }

  function surpriseMe() {
    const items = state.allItems;

    if (!items.length) {
      showToast("Сначала добавьте фильмы в каталог.");
      return;
    }

    const item = items[Math.floor(Math.random() * items.length)];

    openDetail(getId(item));
  }

  // --------------------------------------------------
  // ИЗБРАННОЕ
  // --------------------------------------------------

  function toggleFavorite(id) {
    const item = findItem(id);

    if (!item) {
      showToast("Фильм пока не найден в каталоге.");
      return;
    }

    let favorites = getFavorites();

    const exists = favorites.some(function (favorite) {
      return String(
        typeof favorite === "object" ? favorite.id : favorite
      ) === String(id);
    });

    if (exists) {
      favorites = favorites.filter(function (favorite) {
        return String(
          typeof favorite === "object" ? favorite.id : favorite
        ) !== String(id);
      });

      showToast("Удалено из избранного.");
    } else {
      favorites.push(String(id));
      showToast("Добавлено в избранное ♥");
    }

    writeStorage(STORAGE.favorites, favorites);

    refreshFavoriteButtons();
    renderFavorites();

    if (state.currentItem && getId(state.currentItem) === String(id)) {
      updateDetailFavorite();
    }
  }

  function refreshFavoriteButtons() {
    document.querySelectorAll(".movie-card").forEach(function (card) {
      const id = card.dataset.movieId;

      const button = card.querySelector(".favorite-btn");

      if (!button) {
        return;
      }

      const favorite = getFavorites().some(function (item) {
        return String(typeof item === "object" ? item.id : item) === id;
      });

      button.classList.toggle("active", favorite);
      button.textContent = favorite ? "♥" : "♡";
      button.setAttribute("aria-pressed", String(favorite));
    });
  }

  function showFavorites() {
    showPage("favoritesPage");
    renderFavorites();
  }

  function renderFavorites() {
    const favoriteIds = getFavorites().map(function (item) {
      return String(typeof item === "object" ? item.id : item);
    });

    const items = state.allItems.filter(function (item) {
      return favoriteIds.includes(getId(item));
    });

    renderCards(items, "favoritesGrid", "Избранное пока пусто");
  }

  function toggleCurrentFavorite() {
    if (state.currentItem) {
      toggleFavorite(getId(state.currentItem));
    }
  }

  // --------------------------------------------------
  // ИСТОРИЯ
  // --------------------------------------------------

  function addToHistory(item) {
    const enabled = readStorage(STORAGE.saveHistory, true);

    if (!enabled || !item) {
      return;
    }

    let history = getHistory();

    const id = getId(item);

    history = history.filter(function (entry) {
      return String(entry.id) !== id;
    });

    history.unshift({
      id: id,
      openedAt: Date.now()
    });

    history = history.slice(0, 100);

    writeStorage(STORAGE.history, history);
  }

  function showRecent() {
    showPage("historyPage");
    renderHistory();
  }

  function renderHistory() {
    const items = getHistory()
      .map(function (entry) {
        return findItem(entry.id);
      })
      .filter(Boolean);

    renderCards(items, "historyGrid", "История пока пуста");
  }

  function clearHistory() {
    if (!confirm("Очистить историю просмотренных карточек?")) {
      return;
    }

    writeStorage(STORAGE.history, []);

    renderHistory();
    renderHome();

    showToast("История очищена.");
  }

  // --------------------------------------------------
  // СТРАНИЦА ФИЛЬМА
  // --------------------------------------------------

  function openDetail(id) {
    const item = findItem(id);

    if (!item) {
      showToast("Информация об этом фильме пока недоступна.");
      return;
    }

    state.currentItem = item;

    addToHistory(item);

    const poster = byId("detailPoster");
    const type = byId("detailType");
    const title = byId("detailTitle");
    const meta = byId("detailMeta");
    const country = byId("detailCountry");
    const genres = byId("detailGenres");
    const description = byId("detailDescription");

    if (poster) {
      poster.innerHTML = item.poster
        ? `
          <img
            src="${escapeHTML(item.poster)}"
            alt="${escapeHTML(item.title)}"
            onerror="this.remove()"
          >
        `
        : `
          <div class="poster-placeholder">
            <span>SM</span>
            <strong>${escapeHTML(item.title)}</strong>
          </div>
        `;
    }

    if (type) {
      type.textContent = isSeries(item) ? "Сериал" : "Фильм";
    }

    if (title) {
      title.textContent = item.title;
    }

    if (meta) {
      meta.textContent = [
        item.year,
        item.rating ? "★ " + item.rating : ""
      ].filter(Boolean).join(" • ");
    }

    if (country) {
      country.textContent = item.country || "Не указано";
    }

    if (genres) {
      genres.innerHTML = item.genres.map(function (genre) {
        return `
          <span class="detail-tag">${escapeHTML(genre)}</span>
        `;
      }).join("");
    }

    if (description) {
      description.textContent =
        item.description || "Описание пока не добавлено.";
    }

    setText("detailDirector", item.director || "Не указано");
    setText("detailRuntime", item.runtime || "Не указано");
    setText("detailLanguage", item.language || "Не указано");

    const cast = byId("detailCast");

    if (cast) {
      cast.innerHTML = item.actors.map(function (actor) {
        const name = typeof actor === "string"
          ? actor
          : actor.name || "";

        return `
          <button
            class="detail-actor"
            type="button"
            onclick="openActor('${escapeHTML(name).replace(/'/g, "\\'")}')"
          >${escapeHTML(name)}</button>
        `;
      }).join("");
    }

    const extra = byId("detailExtraSection");

    if (extra) {
      extra.classList.toggle(
        "hidden",
        !item.director && !item.runtime && !item.language
      );
    }

    const similar = state.allItems.filter(function (other) {
      return getId(other) !== getId(item) &&
        other.genres.some(function (genre) {
          return item.genres.includes(genre);
        });
    }).slice(0, 8);

    renderCards(similar, "similarGrid", "Похожих фильмов пока нет");

    updateDetailFavorite();

    showPage("detailPage");
  }

  function setText(id, value) {
    const element = byId(id);

    if (element) {
      element.textContent = value;
    }
  }

  function updateDetailFavorite() {
    const button = byId("detailFavorite");

    if (!button || !state.currentItem) {
      return;
    }

    const favorite = getFavorites().some(function (item) {
      return String(typeof item === "object" ? item.id : item) ===
        getId(state.currentItem);
    });

    button.textContent = favorite
      ? "♥ В избранном"
      : "♡ В избранное";

    button.setAttribute("aria-pressed", String(favorite));
  }

  function handleWatchButton() {
    showToast(
      "SHOHIN MOVIE — каталог фильмов. Просмотр внутри приложения пока не предусмотрен."
    );
  }

  async function shareCurrent() {
    if (!state.currentItem) {
      return;
    }

    const item = state.currentItem;

    const text = [
      item.title,
      item.year || "",
      item.country || "",
      item.description || ""
    ].filter(Boolean).join("\n");

    try {
      if (navigator.share) {
        await navigator.share({
          title: item.title,
          text: text
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        showToast("Информация скопирована.");
      } else {
        showToast("Поделиться сейчас невозможно.");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        showToast("Не удалось поделиться информацией.");
      }
    }
  }

  // --------------------------------------------------
  // АКТЁРЫ
  // --------------------------------------------------

  function openActor(id) {
    const actor = state.actors.find(function (item) {
      return String(item.id || item.name) === String(id) ||
        String(item.name) === String(id);
    });

    const name = actor
      ? actor.name
      : String(id);

    state.currentActor = actor || { name: name };

    setText("actorName", name);
    setText(
      "actorMeta",
      actor && actor.country ? actor.country : "Актёр"
    );

    setText(
      "actorBiography",
      actor && actor.biography
        ? actor.biography
        : "Биография пока не добавлена."
    );

    const avatar = byId("actorBigAvatar");

    if (avatar) {
      if (actor && (actor.photo || actor.image)) {
        avatar.innerHTML = `
          <img
            src="${escapeHTML(actor.photo || actor.image)}"
            alt="${escapeHTML(name)}"
            onerror="this.remove()"
          >
        `;
      } else {
        avatar.textContent = name.charAt(0) || "?";
      }
    }

    const filmography = state.allItems.filter(function (item) {
      return item.actors.some(function (person) {
        const personName = typeof person === "string"
          ? person
          : person.name || "";

        return personName.toLowerCase() === name.toLowerCase();
      });
    });

    renderCards(
      filmography,
      "actorFilmography",
      "Фильмография пока не добавлена"
    );

    showPage("actorPage");
  }

  // --------------------------------------------------
  // МЕНЮ
  // --------------------------------------------------

  function openMenu() {
    const overlay = byId("menuOverlay");

    if (overlay) {
      overlay.classList.add("open");
      overlay.setAttribute("aria-hidden", "false");
    }

    document.querySelectorAll(".drawer").forEach(function (drawer) {
      drawer.classList.add("open");
    });

    document.body.style.overflow = "hidden";
  }

  function closeMenu() {
    const overlay = byId("menuOverlay");

    if (overlay) {
      overlay.classList.remove("open");
      overlay.setAttribute("aria-hidden", "true");
    }

    document.querySelectorAll(".drawer").forEach(function (drawer) {
      drawer.classList.remove("open");
    });

    document.body.style.overflow = "";
  }

  // --------------------------------------------------
  // НАСТРОЙКИ
  // --------------------------------------------------

  function openSettings() {
    showPage("settingsPage");

    const size = byId("cardSize");

    if (size) {
      size.value = readStorage(STORAGE.cardSize, "normal");
    }

    const history = byId("saveHistory");

    if (history) {
      history.checked = readStorage(STORAGE.saveHistory, true);
    }
  }

  function setCardSize(value) {
    const size = value || (byId("cardSize") || {}).value || "normal";

    writeStorage(STORAGE.cardSize, size);

    document.body.classList.remove(
      "cards-small",
      "cards-normal",
      "cards-large"
    );

    document.body.classList.add("cards-" + size);

    showToast("Размер карточек изменён.");
  }

  function setHistoryEnabled(value) {
    const enabled = typeof value === "boolean"
      ? value
      : Boolean((byId("saveHistory") || {}).checked);

    writeStorage(STORAGE.saveHistory, enabled);

    if (!enabled) {
      writeStorage(STORAGE.history, []);
      renderHistory();
      renderHome();
    }

    showToast(
      enabled
        ? "История включена."
        : "История отключена."
    );
  }

  function resetAppSettings() {
    if (!confirm("Сбросить настройки SHOHIN MOVIE?")) {
      return;
    }

    localStorage.removeItem(STORAGE.cardSize);
    localStorage.removeItem(STORAGE.saveHistory);

    document.body.classList.remove(
      "cards-small",
      "cards-large"
    );

    const size = byId("cardSize");

    if (size) {
      size.value = "normal";
    }

    const history = byId("saveHistory");

    if (history) {
      history.checked = true;
    }

    showToast("Настройки сброшены.");
  }

  function openAbout() {
    showPage("aboutPage");
  }

  function updateFooter() {
    const year = byId("footerYear");

    if (year) {
      year.textContent = String(new Date().getFullYear());
    }
  }

  // --------------------------------------------------
  // СОБЫТИЯ
  // --------------------------------------------------

  function connectEvents() {
    const searchInput = byId("searchInput");

    if (searchInput) {
      searchInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          handleSearch(searchInput.value);
        }
      });

      searchInput.addEventListener("input", function () {
        if (!searchInput.value.trim()) {
          state.searchQuery = "";
        }
      });
    }

    const pageSearchInput = byId("pageSearchInput");

    if (pageSearchInput) {
      pageSearchInput.addEventListener("input", renderSearchResults);
    }

    [
      "filterGenre",
      "filterYear",
      "filterCountry",
      "sortOrder"
    ].forEach(function (id) {
      const element = byId(id);

      if (element) {
        element.addEventListener("change", function () {
          state.visibleCount = state.pageSize;
          applyFilters();
        });
      }
    });

    const cardSize = byId("cardSize");

    if (cardSize) {
      cardSize.addEventListener("change", function () {
        setCardSize(cardSize.value);
      });
    }

    const saveHistory = byId("saveHistory");

    if (saveHistory) {
      saveHistory.addEventListener("change", function () {
        setHistoryEnabled(saveHistory.checked);
      });
    }

    const overlay = byId("menuOverlay");

    if (overlay) {
      overlay.addEventListener("click", function (event) {
        if (event.target === overlay) {
          closeMenu();
        }
      });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeMenu();
      }
    });

    document.querySelectorAll("[data-page]").forEach(function (button) {
      button.addEventListener("click", function () {
        const pageId = button.dataset.page;

        if (pageId) {
          showPage(pageId);
        }
      });
    });
  }

  // --------------------------------------------------
  // ПУБЛИЧНЫЕ ФУНКЦИИ ДЛЯ HTML
  // --------------------------------------------------

  Object.assign(window, {
    goHome,
    goBack,
    focusSearch,
    openSearch,
    handleSearch,
    renderSearchResults,

    showCatalog,
    setCatalogType,
    applyFilters,
    resetFilters,
    loadMore,
    surpriseMe,
    openGenre,

    toggleFavorite,
    toggleCurrentFavorite,
    showFavorites,
    showRecent,
    clearHistory,

    openDetail,
    handleWatchButton,
    shareCurrent,

    openActor,

    openMenu,
    closeMenu,
    openSettings,
    openAbout,

    setCardSize,
    setHistoryEnabled,
    resetAppSettings
  });

  // --------------------------------------------------
  // ЗАПУСК
  // --------------------------------------------------

  function init() {
    connectEvents();

    const savedSize = readStorage(STORAGE.cardSize, "normal");

    document.body.classList.add("cards-" + savedSize);

    updateFooter();
    loadAllData();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();