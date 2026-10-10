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

  const PAGE_IDS = [
    "homePage",
    "catalogPage",
    "favoritesPage",
    "historyPage",
    "searchPage",
    "detailPage",
    "actorPage",
    "settingsPage",
    "aboutPage"
  ];

  const state = {
    movies: [],
    series: [],
    actors: [],
    allItems: [],
    currentItem: null,
    currentActor: null,
    catalogType: "all",
    favoritesType: "all",
    searchQuery: "",
    visibleCount: 20,
    pageSize: 20,
    loading: false,
    activePage: "homePage",
    lastPage: "homePage"
  };

  const $ = (selector) => document.querySelector(selector);
  const byId = (id) => document.getElementById(id);

  // --------------------------------------------------
  // ХРАНЕНИЕ ДАННЫХ
  // --------------------------------------------------

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
    if (window.SHOHINCards &&
        typeof window.SHOHINCards.escapeHTML === "function") {
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
    if (window.SHOHINCards &&
        typeof window.SHOHINCards.getMovieId === "function") {
      return String(window.SHOHINCards.getMovieId(item));
    }

    if (item.id !== undefined && item.id !== null) {
      return String(item.id);
    }

    return [
      item.type || "film",
      item.year || "",
      item.originalTitle || item.title || item.name || ""
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

  function isFavorite(id) {
    return getFavorites().some(function (item) {
      return String(typeof item === "object" ? item.id : item) === String(id);
    });
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

  function isActorType(type) {
    return String(type || "").toLowerCase() === "actor";
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
  // ПЕРЕКЛЮЧЕНИЕ СТРАНИЦ
  // --------------------------------------------------

  function showPage(pageId) {
    const page = byId(pageId);

    if (!page) {
      console.warn("SHOHIN MOVIE: страница не найдена:", pageId);
      showToast("Не удалось открыть эту страницу.");
      return;
    }

    PAGE_IDS.forEach(function (id) {
      const element = byId(id);

      if (element) {
        element.classList.add("hidden");
        element.classList.remove("active");
      }
    });

    page.classList.remove("hidden");
    page.classList.add("active");

    state.lastPage = state.activePage;
    state.activePage = pageId;

    updateNavigation(pageId);
    closeMenu();

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  function updateNavigation(pageId) {
    document.querySelectorAll(".bottom-nav .nav-btn").forEach(function (button) {
      const nav = button.dataset.nav;
      let active = false;

      if (nav === "home") {
        active = pageId === "homePage";
      } else if (nav === "search") {
        active = pageId === "searchPage";
      } else if (nav === "catalog") {
        active = pageId === "catalogPage";
      } else if (nav === "favorites") {
        active = pageId === "favoritesPage";
      } else if (nav === "menu") {
        active = false;
      }

      button.classList.toggle("active", active);
    });
  }

  function goHome() {
    showPage("homePage");
    renderHome();
  }

  function goBack() {
    const previous = state.lastPage;

    if (previous && previous !== state.activePage && byId(previous)) {
      showPage(previous);
    } else {
      goHome();
    }
  }

  // --------------------------------------------------
  // ЗАГРУЗКА JSON
  // --------------------------------------------------

  function getYearFolder(year) {
    const number = Number(year);

    if (number <= 2000) return "1990-2000";
    if (number <= 2010) return "2001-2010";
    if (number <= 2020) return "2011-2020";

    return "2021-2026";
  }

  async function fetchJSON(path) {
    try {
      const response = await fetch(path, { cache: "no-cache" });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.warn("Не удалось загрузить:", path);
      return null;
    }
  }

  function extractArray(data) {
    if (Array.isArray(data)) return data;
    if (data && Array.isArray(data.movies)) return data.movies;
    if (data && Array.isArray(data.series)) return data.series;
    if (data && Array.isArray(data.actors)) return data.actors;
    if (data && Array.isArray(data.items)) return data.items;

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

  function normalizeItem(item, defaultType) {
    const normalized = {
      ...item,
      type: item.type || defaultType,
      title: item.title || item.name || "Без названия",
      originalTitle:
        item.originalTitle ||
        item.original_title ||
        item.originalName ||
        item.original_name ||
        item.title ||
        item.name ||
        "",
      year: item.year || item.releaseYear || item.release_year || "",
      country: item.country || item.countries || "",
      genres: Array.isArray(item.genres)
        ? item.genres
        : typeof item.genres === "string"
          ? item.genres.split(",").map(function (genre) {
              return genre.trim();
            }).filter(Boolean)
          : [],
      actors: Array.isArray(item.actors) ? item.actors : [],
      description: item.description || item.overview || "",
      poster: item.poster || item.posterUrl || item.poster_url || "",
      rating: item.rating || "",
      director: item.director || "",
      runtime: item.runtime || "",
      language: item.language || ""
    };

    return normalized;
  }

  function removeDuplicates(items) {
    const seen = new Set();

    return items.filter(function (item) {
      const id = getId(item);

      if (seen.has(id)) return false;

      seen.add(id);
      return true;
    });
  }

  async function loadAllData() {
    if (state.loading) return;

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

      const normalizedMovies = results.flat().map(function (item) {
        return normalizeItem(item, "film");
      });

      const seriesData = await fetchJSON("data/series.json");
      const actorsData = await fetchJSON("data/actors.json");

      state.movies = removeDuplicates(normalizedMovies);
      state.series = removeDuplicates(
        extractArray(seriesData).map(function (item) {
          return normalizeItem(item, "series");
        })
      );

      state.actors = extractArray(actorsData);

      state.allItems = removeDuplicates(
        state.movies.concat(state.series)
      );

      populateFilters();
      renderHome();
      renderFavorites();
      renderHistory();
      updateFooter();

      if (state.allItems.length === 0) {
        showToast("Каталог пока пуст. Данные появятся после добавления JSON-файлов.");
      }
    } catch (error) {
      console.error("SHOHIN MOVIE:", error);
      showToast("Не удалось загрузить каталог.");
    } finally {
      state.loading = false;
    }
  }

  // --------------------------------------------------
  // КАРТОЧКИ
  // --------------------------------------------------

  function renderCards(items, containerId, emptyTitle) {
    const target = byId(containerId);

    if (!target) return;

    if (window.SHOHINCards &&
        typeof window.SHOHINCards.renderMovieCards === "function") {
      window.SHOHINCards.renderMovieCards(items, target, {
        emptyTitle: emptyTitle || "Пока пусто",
        emptyText: "Когда данные будут добавлены, они появятся здесь."
      });

      refreshFavoriteButtons();
      return;
    }

    if (!items.length) {
      target.innerHTML = `
        <div class="empty-state">
          <h3>${escapeHTML(emptyTitle || "Пока пусто")}</h3>
          <p>Добавьте данные, чтобы увидеть карточки.</p>
        </div>
      `;
      return;
    }

    target.innerHTML = items.map(function (item) {
      const id = escapeHTML(getId(item));
      const title = escapeHTML(item.title);
      const poster = item.poster
        ? `<img src="${escapeHTML(item.poster)}" alt="${title}" loading="lazy">`
        : `<div class="poster-placeholder"><span>SM</span><strong>${title}</strong></div>`;

      return `
        <article class="movie-card" data-movie-id="${id}">
          <button class="favorite-btn" type="button"
            onclick="toggleFavorite('${id}')" aria-label="Избранное">
            ${isFavorite(getId(item)) ? "♥" : "♡"}
          </button>
          <div class="movie-poster" onclick="openDetail('${id}')">
            ${poster}
          </div>
          <div class="movie-card-info" onclick="openDetail('${id}')">
            <h3>${title}</h3>
            <p>${escapeHTML(item.year || "")}</p>
          </div>
        </article>
      `;
    }).join("");
  }

  function renderActorCards(items, containerId) {
    const target = byId(containerId);

    if (!target) return;

    if (window.SHOHINCards &&
        typeof window.SHOHINCards.renderActorCards === "function") {
      window.SHOHINCards.renderActorCards(items, containerId);
      return;
    }

    if (!items.length) {
      target.innerHTML = `
        <div class="empty-state">
          <h3>Актёры пока не добавлены</h3>
        </div>
      `;
      return;
    }

    target.innerHTML = items.map(function (actor) {
      const name = actor.name || "Неизвестный актёр";
      const id = actor.id || name;
      const image = actor.photo || actor.image || "";

      return `
        <button class="actor-card" type="button"
          onclick="openActor('${escapeHTML(String(id))}')">
          <span class="actor-avatar">
            ${image
              ? `<img src="${escapeHTML(image)}" alt="${escapeHTML(name)}" loading="lazy">`
              : escapeHTML(name.charAt(0))}
          </span>
          <strong>${escapeHTML(name)}</strong>
        </button>
      `;
    }).join("");
  }

  function refreshFavoriteButtons() {
    document.querySelectorAll(".movie-card").forEach(function (card) {
      const id = card.dataset.movieId;
      const button = card.querySelector(".favorite-btn");

      if (!button) return;

      const favorite = isFavorite(id);

      button.classList.toggle("active", favorite);
      button.textContent = favorite ? "♥" : "♡";
      button.setAttribute("aria-pressed", String(favorite));
    });
  }

  // --------------------------------------------------
  // ГЛАВНАЯ
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

    renderCards(recent, "recentGrid", "Недавно открытые");
    renderCards(featured, "featuredGrid", "Выбор SHOHIN");
    renderCards(state.movies.slice(0, 20), "moviesGrid", "Фильмы");
    renderCards(state.series.slice(0, 20), "seriesGrid", "Сериалы");

    renderActorCards(state.actors.slice(0, 12), "actorsGrid");
    renderGenreChips();
  }

  function renderGenreChips() {
    const container = byId("genreChips");

    if (!container) return;

    const genres = new Set();

    state.allItems.forEach(function (item) {
      item.genres.forEach(function (genre) {
        if (genre) genres.add(genre);
      });
    });

    container.innerHTML = Array.from(genres).slice(0, 15).map(function (genre) {
      return `
        <button class="chip" type="button"
          onclick="openGenre('${escapeHTML(genre).replace(/'/g, "\\'")}')">
          ${escapeHTML(genre)}
        </button>
      `;
    }).join("");
  }

  // --------------------------------------------------
  // ПОИСК
  // --------------------------------------------------

  function focusSearch() {
    showPage("homePage");

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
      input.value = state.searchQuery;
      input.focus();
    }

    renderSearchResults();
  }

  function handleSearch(value) {
    const query = String(value || "").trim();

    state.searchQuery = query;

    const pageInput = byId("pageSearchInput");

    if (pageInput && pageInput.value !== query) {
      pageInput.value = query;
    }

    if (query) {
      renderSearchResults(query);

      if (state.activePage !== "searchPage") {
        showPage("searchPage");
      }
    } else if (state.activePage === "searchPage") {
      renderSearchResults("");
    }
  }

  function renderSearchResults(value) {
    const input = byId("pageSearchInput");
    const query = String(
      value !== undefined
        ? value
        : (input && input.value) || state.searchQuery || ""
    ).trim().toLowerCase();

    state.searchQuery = query;

    const results = query
      ? state.allItems.filter(function (item) {
          const actorNames = item.actors.map(function (actor) {
            return typeof actor === "string" ? actor : actor.name || "";
          }).join(" ");

          const searchable = [
            item.title,
            item.originalTitle,
            item.year,
            item.country,
            item.description,
            item.genres.join(" "),
            actorNames
          ].join(" ").toLowerCase();

          return searchable.includes(query);
        })
      : [];

    renderCards(results, "searchResultsGrid", "Ничего не найдено");
  }

  // --------------------------------------------------
  // КАТАЛОГ И ФИЛЬТРЫ
  // --------------------------------------------------

  function populateFilters() {
    const genres = new Set();
    const years = new Set();
    const countries = new Set();

    state.allItems.forEach(function (item) {
      item.genres.forEach(function (genre) {
        if (genre) genres.add(genre);
      });

      if (item.year) years.add(String(item.year));

      const countryList = Array.isArray(item.country)
        ? item.country
        : String(item.country || "").split(",");

      countryList.forEach(function (country) {
        const value = String(country).trim();
        if (value) countries.add(value);
      });
    });

    fillSelect("filterGenre", Array.from(genres).sort());
    fillSelect("filterYear", Array.from(years).sort(function (a, b) {
      return Number(b) - Number(a);
    }));
    fillSelect("filterCountry", Array.from(countries).sort());
  }

  function fillSelect(id, values) {
    const select = byId(id);

    if (!select) return;

    const previous = select.value;
    const firstOption = select.options[0]
      ? select.options[0].outerHTML
      : '<option value="">Все</option>';

    select.innerHTML = firstOption;

    values.forEach(function (value) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });

    if (values.includes(previous)) {
      select.value = previous;
    }
  }

  function normalizeCatalogType(type) {
    if (type === "movie") return "film";
    if (type === "movies") return "film";
    if (type === "tv") return "series";
    return type || "all";
  }

  function showCatalog(type) {
    state.catalogType = normalizeCatalogType(type);
    state.visibleCount = state.pageSize;

    showPage("catalogPage");

    const title = byId("catalogTitle");

    if (title) {
      title.textContent = {
        all: "Весь каталог",
        film: "Фильмы",
        series: "Сериалы",
        actor: "Актёры"
      }[state.catalogType] || "Каталог";
    }

    renderCatalogTypes();
    applyFilters();
  }

  function renderCatalogTypes() {
    const container = byId("catalogTypes");

    if (!container) return;

    const types = [
      { id: "all", title: "Все" },
      { id: "film", title: "Фильмы" },
      { id: "series", title: "Сериалы" },
      { id: "actor", title: "Актёры" }
    ];

    container.innerHTML = types.map(function (type) {
      const active = state.catalogType === type.id ? " active" : "";

      return `
        <button class="chip${active}" type="button"
          onclick="setCatalogType('${type.id}', this)">
          ${type.title}
        </button>
      `;
    }).join("");
  }

  function setCatalogType(type) {
    state.catalogType = normalizeCatalogType(type);
    state.visibleCount = state.pageSize;

    const title = byId("catalogTitle");

    if (title) {
      title.textContent = {
        all: "Весь каталог",
        film: "Фильмы",
        series: "Сериалы",
        actor: "Актёры"
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

    if (state.catalogType === "actor") {
      renderActorCards(state.actors, "catalogGrid");

      const count = byId("resultsCount");
      if (count) count.textContent = "Актёров: " + state.actors.length;

      const button = byId("loadMoreBtn");
      if (button) button.classList.add("hidden");

      return;
    }

    let items = state.allItems.filter(function (item) {
      if (state.catalogType === "film" && isSeries(item)) return false;
      if (state.catalogType === "series" && !isSeries(item)) return false;

      if (genre && !item.genres.includes(genre)) return false;
      if (year && String(item.year) !== String(year)) return false;

      if (country) {
        const itemCountry = Array.isArray(item.country)
          ? item.country.join(", ")
          : String(item.country || "");

        if (!itemCountry.toLowerCase().includes(country.toLowerCase())) {
          return false;
        }
      }

      return true;
    });

    if (sort === "rating") {
      items.sort(function (a, b) {
        return Number(b.rating || 0) - Number(a.rating || 0);
      });
    } else if (sort === "year" || sort === "year-new") {
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

    renderCards(visibleItems, "catalogGrid", "Фильмы не найдены");

    const count = byId("resultsCount");

    if (count) {
      count.textContent = "Найдено: " + items.length;
    }

    const button = byId("loadMoreBtn");

    if (button) {
      button.classList.toggle("hidden", visibleItems.length >= items.length);
    }
  }

  function resetFilters() {
    ["filterGenre", "filterYear", "filterCountry"].forEach(function (id) {
      const element = byId(id);
      if (element) element.value = "";
    });

    const sort = byId("sortOrder");
    if (sort) sort.value = "rating";

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

      if (exists) select.value = genre;
    }

    applyFilters();
  }

  function surpriseMe() {
    if (!state.allItems.length) {
      showToast("Сначала добавьте фильмы в каталог.");
      return;
    }

    const item = state.allItems[
      Math.floor(Math.random() * state.allItems.length)
    ];

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
      return String(typeof favorite === "object" ? favorite.id : favorite) ===
        String(id);
    });

    if (exists) {
      favorites = favorites.filter(function (favorite) {
        return String(typeof favorite === "object" ? favorite.id : favorite) !==
          String(id);
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

  function toggleCurrentFavorite() {
    if (state.currentItem) {
      toggleFavorite(getId(state.currentItem));
    }
  }

  function openFavorites(type) {
    state.favoritesType = normalizeCatalogType(type || "all");
    showPage("favoritesPage");
    renderFavorites();
  }

  function showFavorites(type) {
    state.favoritesType = normalizeCatalogType(type || "all");

    document.querySelectorAll("#favoritesPage .chip").forEach(function (button) {
      button.classList.remove("active");
    });

    if (typeof event !== "undefined" && event && event.currentTarget) {
      event.currentTarget.classList.add("active");
    }

    renderFavorites();
  }

  function renderFavorites() {
    const favoriteIds = getFavorites().map(function (item) {
      return String(typeof item === "object" ? item.id : item);
    });

    let items = state.allItems.filter(function (item) {
      return favoriteIds.includes(getId(item));
    });

    if (state.favoritesType === "film") {
      items = items.filter(function (item) {
        return !isSeries(item);
      });
    } else if (state.favoritesType === "series") {
      items = items.filter(isSeries);
    } else if (state.favoritesType === "actor") {
      renderActorCards([], "favoritesGrid");
      return;
    }

    renderCards(items, "favoritesGrid", "Избранное пока пусто");
  }

  // --------------------------------------------------
  // ИСТОРИЯ
  // --------------------------------------------------

  function addToHistory(item) {
    const enabled = readStorage(STORAGE.saveHistory, true);

    if (!enabled || !item) return;

    let history = getHistory();
    const id = getId(item);

    history = history.filter(function (entry) {
      return String(entry.id) !== id;
    });

    history.unshift({
      id: id,
      openedAt: Date.now()
    });

    writeStorage(STORAGE.history, history.slice(0, 100));
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
    if (!confirm("Очистить историю просмотренных карточек?")) return;

    writeStorage(STORAGE.history, []);
    renderHistory();
    renderHome();

    showToast("История очищена.");
  }

  // --------------------------------------------------
  // ПОДРОБНАЯ СТРАНИЦА ФИЛЬМА
  // --------------------------------------------------

  function setText(id, value) {
    const element = byId(id);
    if (element) element.textContent = value ?? "";
  }

  function openDetail(id) {
    const item = findItem(id);

    if (!item) {
      showToast("Информация об этом фильме пока недоступна.");
      return;
    }

    state.currentItem = item;
    addToHistory(item);

    const poster = byId("detailPoster");

    if (poster) {
      poster.innerHTML = item.poster
        ? `<img src="${escapeHTML(item.poster)}"
             alt="${escapeHTML(item.title)}"
             onerror="this.remove()">`
        : `<div class="poster-placeholder">
             <span>SM</span>
             <strong>${escapeHTML(item.title)}</strong>
           </div>`;
    }

    setText("detailType", isSeries(item) ? "СЕРИАЛ" : "ФИЛЬМ");
    setText("detailTitle", item.title);

    setText(
      "detailMeta",
      [item.year, item.rating ? "★ " + item.rating : ""]
        .filter(Boolean).join(" • ")
    );

    setText("detailCountry", item.country || "Страна не указана");

    const genres = byId("detailGenres");

    if (genres) {
      genres.innerHTML = item.genres.map(function (genre) {
        return `<span class="detail-tag">${escapeHTML(genre)}</span>`;
      }).join("");
    }

    setText(
      "detailDescription",
      item.description || "Описание пока не добавлено."
    );

    setText("detailDirector", item.director || "Не указано");
    setText("detailRuntime", item.runtime || "Не указано");
    setText("detailLanguage", item.language || "Не указано");

    const cast = byId("detailCast");

    if (cast) {
      cast.innerHTML = item.actors.map(function (actor) {
        const name = typeof actor === "string" ? actor : actor.name || "";

        return `
          <button class="detail-actor" type="button"
            onclick="openActor('${escapeHTML(name).replace(/'/g, "\\'")}')">
            ${escapeHTML(name)}
          </button>
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

  function updateDetailFavorite() {
    const button = byId("detailFavorite");

    if (!button || !state.currentItem) return;

    const favorite = isFavorite(getId(state.currentItem));

    button.textContent = favorite ? "♥ В избранном" : "♡ В избранное";
    button.setAttribute("aria-pressed", String(favorite));
  }

  function handleWatchButton() {
    showToast(
      "SHOHIN MOVIE — каталог фильмов. Просмотр внутри приложения пока не предусмотрен."
    );
  }

  async function shareCurrent() {
    if (!state.currentItem) return;

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

    const name = actor ? actor.name : String(id);

    state.currentActor = actor || { name: name };

    setText("actorName", name);
    setText("actorMeta", actor && actor.country ? actor.country : "Актёр");

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
          <img src="${escapeHTML(actor.photo || actor.image)}"
            alt="${escapeHTML(name)}"
            onerror="this.remove()">
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

    if (!overlay) {
      showToast("Меню не найдено.");
      return;
    }

    overlay.classList.remove("hidden");
    overlay.classList.add("open");
    overlay.setAttribute("aria-hidden", "false");

    const drawer = overlay.querySelector(".drawer");

    if (drawer) {
      drawer.classList.add("open");
    }

    document.body.style.overflow = "hidden";
  }

  function closeMenu() {
    const overlay = byId("menuOverlay");

    if (overlay) {
      overlay.classList.remove("open");
      overlay.classList.add("hidden");
      overlay.setAttribute("aria-hidden", "true");

      const drawer = overlay.querySelector(".drawer");

      if (drawer) {
        drawer.classList.remove("open");
      }
    }

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
      "cards-large",
      "cards-compact"
    );

    document.body.classList.add(
      size === "compact" ? "cards-small" : "cards-" + size
    );

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

    showToast(enabled ? "История включена." : "История отключена.");
  }

  function resetAppSettings() {
    if (!confirm("Сбросить настройки SHOHIN MOVIE?")) return;

    localStorage.removeItem(STORAGE.cardSize);
    localStorage.removeItem(STORAGE.saveHistory);

    document.body.classList.remove(
      "cards-small",
      "cards-normal",
      "cards-large",
      "cards-compact"
    );

    document.body.classList.add("cards-normal");

    const size = byId("cardSize");
    if (size) size.value = "normal";

    const history = byId("saveHistory");
    if (history) history.checked = true;

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
    }

    const pageSearchInput = byId("pageSearchInput");

    if (pageSearchInput) {
      pageSearchInput.addEventListener("input", function () {
        renderSearchResults(pageSearchInput.value);
      });
    }

    ["filterGenre", "filterYear", "filterCountry", "sortOrder"]
      .forEach(function (id) {
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

      const drawer = overlay.querySelector(".drawer");

      if (drawer) {
        drawer.addEventListener("click", function (event) {
          event.stopPropagation();
        });
      }
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeMenu();
      }
    });
  }

  // --------------------------------------------------
  // ФУНКЦИИ, ДОСТУПНЫЕ ИЗ HTML
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
    openFavorites,
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

    document.body.classList.add(
      savedSize === "compact" ? "cards-small" : "cards-" + savedSize
    );

    closeMenu();
    updateFooter();
    loadAllData();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();