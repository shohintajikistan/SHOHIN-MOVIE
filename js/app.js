/* =====================================================
   SHOHIN MOVIE — APP
   Загрузка каталога, главная страница и поиск.
   SHOHIN BRAND COLORS — НЕ МЕНЯТЬ
===================================================== */

(function () {
  "use strict";

  const App = {
    initialized: false,
    loading: false,
    movies: [],
    series: [],
    actors: [],
    searchQuery: "",
    actorQuery: "",

    /* Безопасное отображение текста */
    escapeHTML(value) {
      return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    },

    /* Поиск элемента по нескольким селекторам */
    getElement(selectors) {
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) return element;
      }

      return null;
    },

    /* Нормализация текста для поиска */
    normalize(value) {
      return String(value == null ? "" : value)
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ё/g, "е");
    },

    /* Получение текста для поиска */
    getSearchText(item) {
      const values = [
        item.title,
        item.name,
        item.originalTitle,
        item.original_title,
        item.description,
        item.overview,
        item.year,
        item.country,
        item.countries,
        item.genre,
        item.genres,
        item.actors,
        item.cast,
        item.director
      ];

      return this.normalize(
        values.map(value => {
          if (Array.isArray(value)) {
            return value.map(element => {
              if (typeof element === "object" && element !== null) {
                return element.name || element.title || "";
              }

              return element;
            }).join(" ");
          }

          if (typeof value === "object" && value !== null) {
            return value.name || value.title || "";
          }

          return value || "";
        }).join(" ")
      );
    },

    /* Название фильма или сериала */
    getTitle(item) {
      return item.title ||
        item.name ||
        item.originalTitle ||
        item.original_title ||
        "Без названия";
    },

    /* Постер */
    getPoster(item) {
      const poster =
        item.poster ||
        item.posterUrl ||
        item.poster_url ||
        item.image ||
        item.imageUrl ||
        item.image_url ||
        "";

      if (typeof poster !== "string" || !poster.trim()) {
        return "";
      }

      const value = poster.trim();

      /*
        Разрешаем локальные изображения SHOHIN
        и обычные HTTPS-ссылки.
      */
      if (/^https:\/\//i.test(value)) {
        return value;
      }

      if (
        value.startsWith("assets/") ||
        value.startsWith("./assets/") ||
        value.startsWith("../assets/")
      ) {
        return value;
      }

      return "";
    },

    /* Проверка соответствия поисковому запросу */
    matchesSearch(item, query) {
      if (!query) return true;

      return this.getSearchText(item).includes(
        this.normalize(query)
      );
    },

    /* Сортировка: новые годы сначала */
    sortByYear(items) {
      return [...items].sort((a, b) => {
        const yearA = Number(a.year) || 0;
        const yearB = Number(b.year) || 0;

        if (yearA !== yearB) {
          return yearB - yearA;
        }

        return this.getTitle(a).localeCompare(
          this.getTitle(b),
          "ru"
        );
      });
    },

    /* Показать или скрыть состояние пустого списка */
    setEmptyState(container, emptyState, hasItems) {
      if (container) {
        container.hidden = !hasItems;
      }

      if (emptyState) {
        emptyState.hidden = hasItems;
      }
    },

    /* Экран загрузки */
    setLoading(visible) {
      const loader = document.getElementById("loadingScreen");

      if (loader) {
        loader.hidden = !visible;
        loader.setAttribute(
          "aria-hidden",
          visible ? "false" : "true"
        );
      }
    },

    /* Сообщение об ошибке */
    showError(message) {
      console.error("SHOHIN MOVIE:", message);

      const target = this.getElement([
        "#homeEmptyState",
        "#moviesEmptyState",
        "#homeCatalog",
        "#moviesGrid"
      ]);

      if (target) {
        target.hidden = false;
        target.textContent = message;
      }

      this.showToast(message);
    },

    /* Уведомление */
    showToast(message) {
      const toast = document.getElementById("toast");

      if (!toast) return;

      toast.textContent = message;
      toast.hidden = false;
      toast.classList.add("show");

      clearTimeout(this.toastTimer);

      this.toastTimer = setTimeout(() => {
        toast.classList.remove("show");

        setTimeout(() => {
          toast.hidden = true;
        }, 250);
      }, 2500);
    },

    /* Получение модуля карточек */
    getCardsModule() {
      return window.SHOHIN_MOVIE &&
        window.SHOHIN_MOVIE.Cards
        ? window.SHOHIN_MOVIE.Cards
        : null;
    },

    /*
      Отображение карточек через существующий cards.js.
      Сначала используем renderInto, если он доступен.
    */
    renderInto(container, items, type) {
      if (!container) return;

      const Cards = this.getCardsModule();

      if (
        Cards &&
        typeof Cards.renderInto === "function"
      ) {
        if (!items.length) {
          container.innerHTML = "";
          return;
        }

        Cards.renderInto(container, items, type);
        return;
      }

      container.innerHTML = items.map(item => {
        const title = this.escapeHTML(this.getTitle(item));
        const year = this.escapeHTML(item.year || "");
        const poster = this.getPoster(item);
        const imageHTML = poster
          ? `<img src="${this.escapeHTML(poster)}"
                  alt="${title}"
                  loading="lazy">`
          : `<div class="shohin-poster-placeholder">
               <span>SHOHIN</span>
             </div>`;

        return `
          <article
            class="movie-card shohin-card"
            data-card-type="${this.escapeHTML(type)}"
            data-item-id="${this.escapeHTML(item.id || item.slug || title)}"
          >
            <div class="movie-card-poster">
              ${imageHTML}
            </div>

            <div class="movie-card-info">
              <h3>${title}</h3>
              <p>${year}</p>
            </div>
          </article>
        `;
      }).join("");
    },

    /* Смешанный каталог фильмов и сериалов */
    renderMixed(container, items) {
      if (!container) return;

      const Cards = this.getCardsModule();

      if (
        Cards &&
        typeof Cards.renderInto === "function"
      ) {
        const movies = items.filter(item => item.type !== "series");
        const series = items.filter(item => item.type === "series");

        const movieBox = document.createElement("div");
        const seriesBox = document.createElement("div");

        if (movies.length) {
          Cards.renderInto(movieBox, movies, "movie");
        }

        if (series.length) {
          Cards.renderInto(seriesBox, series, "series");
        }

        container.replaceChildren();

        while (movieBox.firstChild) {
          container.appendChild(movieBox.firstChild);
        }

        while (seriesBox.firstChild) {
          container.appendChild(seriesBox.firstChild);
        }

        return;
      }

      this.renderInto(container, items, "movie");
    },

    /* Главная страница */
    renderHome() {
      const container = document.getElementById("homeCatalog");
      const emptyState = document.getElementById("homeEmptyState");

      if (!container) return;

      const allItems = this.sortByYear([
        ...this.movies.map(item => ({ ...item, type: "movie" })),
        ...this.series.map(item => ({ ...item, type: "series" }))
      ]);

      const filtered = allItems.filter(item =>
        this.matchesSearch(item, this.searchQuery)
      );

      const visibleItems = this.searchQuery
        ? filtered
        : filtered.slice(0, 24);

      this.renderMixed(container, visibleItems);

      this.setEmptyState(
        emptyState,
        null,
        visibleItems.length > 0
      );

      if (emptyState) {
        emptyState.hidden = visibleItems.length > 0;

        if (!visibleItems.length) {
          emptyState.textContent = this.searchQuery
            ? "Ничего не найдено. Попробуйте другой запрос."
            : "Каталог пока пуст. Добавьте фильмы в файлы данных.";
        }
      }
    },

    /* Страница фильмов */
    renderMovies() {
      const container = document.getElementById("moviesGrid");
      const emptyState = document.getElementById("moviesEmptyState");

      if (!container) return;

      const filtered = this.sortByYear(this.movies)
        .filter(item => this.matchesSearch(item, this.searchQuery));

      this.renderInto(container, filtered, "movie");

      if (emptyState) {
        emptyState.hidden = filtered.length > 0;

        if (!filtered.length) {
          emptyState.textContent = this.searchQuery
            ? "Фильмы не найдены."
            : "Фильмов пока нет.";
        }
      }
    },

    /* Страница сериалов */
    renderSeries() {
      const container = document.getElementById("seriesGrid");
      const emptyState = document.getElementById("seriesEmptyState");

      if (!container) return;

      const filtered = this.sortByYear(this.series)
        .filter(item => this.matchesSearch(item, this.searchQuery));

      this.renderInto(container, filtered, "series");

      if (emptyState) {
        emptyState.hidden = filtered.length > 0;

        if (!filtered.length) {
          emptyState.textContent = this.searchQuery
            ? "Сериалы не найдены."
            : "Сериалов пока нет.";
        }
      }
    },

    /* Страница актёров */
    renderActors() {
      const container = document.getElementById("actorsGrid");
      const emptyState = document.getElementById("actorsEmptyState");

      if (!container) return;

      const query = this.normalize(this.actorQuery);

      const filtered = this.actors.filter(actor => {
        const name = this.normalize(
          actor.name ||
          actor.title ||
          actor.fullName ||
          actor.full_name ||
          ""
        );

        return !query || name.includes(query);
      });

      this.renderInto(container, filtered, "actor");

      if (emptyState) {
        emptyState.hidden = filtered.length > 0;

        if (!filtered.length) {
          emptyState.textContent = query
            ? "Актёры не найдены."
            : "Список актёров пока пуст.";
        }
      }
    },

    /* Поисковые подсказки */
    renderSuggestions(query) {
      const container = document.getElementById("searchSuggestions");

      if (!container) return;

      if (!query.trim()) {
        container.innerHTML = "";
        container.hidden = true;
        return;
      }

      const allItems = [
        ...this.movies.map(item => ({ ...item, type: "movie" })),
        ...this.series.map(item => ({ ...item, type: "series" })),
        ...this.actors.map(item => ({ ...item, type: "actor" }))
      ];

      const matches = allItems
        .filter(item => this.matchesSearch(item, query))
        .slice(0, 8);

      if (!matches.length) {
        container.innerHTML = `
          <div class="search-suggestion-empty">
            Ничего не найдено
          </div>
        `;

        container.hidden = false;
        return;
      }

      container.innerHTML = matches.map(item => {
        const title = this.escapeHTML(this.getTitle(item));
        const type = this.escapeHTML(item.type);
        const id = this.escapeHTML(
          item.id || item.slug || item.title || item.name || ""
        );

        const category = item.type === "series"
          ? "Сериал"
          : item.type === "actor"
            ? "Актёр"
            : "Фильм";

        return `
          <button
            type="button"
            class="search-suggestion"
            data-suggestion-id="${id}"
            data-suggestion-type="${type}"
          >
            <span class="search-suggestion-title">${title}</span>
            <span class="search-suggestion-meta">
              ${category}${item.year ? " · " + this.escapeHTML(item.year) : ""}
            </span>
          </button>
        `;
      }).join("");

      container.hidden = false;
    },

    /* Поле поиска на главной */
    bindMainSearch() {
      const input = document.getElementById("mainSearch");
      const clearButton = document.getElementById("clearSearchButton");
      const suggestions = document.getElementById("searchSuggestions");

      if (input && !input.dataset.appBound) {
        input.dataset.appBound = "true";

        input.addEventListener("input", () => {
          this.searchQuery = input.value.trim();

          this.renderHome();
          this.renderSuggestions(this.searchQuery);
        });

        input.addEventListener("keydown", event => {
          if (event.key === "Escape") {
            input.value = "";
            this.searchQuery = "";
            this.renderHome();
            this.renderSuggestions("");
          }

          if (event.key === "Enter") {
            const first = suggestions
              ? suggestions.querySelector("[data-suggestion-id]")
              : null;

            if (first) first.click();
          }
        });
      }

      if (clearButton && !clearButton.dataset.appBound) {
        clearButton.dataset.appBound = "true";

        clearButton.addEventListener("click", () => {
          if (input) {
            input.value = "";
            input.focus();
          }

          this.searchQuery = "";
          this.renderHome();
          this.renderSuggestions("");
        });
      }

      if (suggestions && !suggestions.dataset.appBound) {
        suggestions.dataset.appBound = "true";

        suggestions.addEventListener("click", event => {
          const button = event.target.closest("[data-suggestion-id]");

          if (!button) return;

          const id = button.dataset.suggestionId;
          const type = button.dataset.suggestionType;

          if (
            window.SHOHIN_MOVIE &&
            window.SHOHIN_MOVIE.Details &&
            typeof window.SHOHIN_MOVIE.Details.open === "function"
          ) {
            window.SHOHIN_MOVIE.Details.open(id, type);
          } else {
            this.showToast("Страница подробностей пока недоступна.");
          }

          suggestions.hidden = true;
        });
      }
    },

    /* Поиск актёров */
    bindActorSearch() {
      const input = document.getElementById("actorSearch");

      if (!input || input.dataset.appBound) return;

      input.dataset.appBound = "true";

      input.addEventListener("input", () => {
        this.actorQuery = input.value.trim();
        this.renderActors();
      });
    },

    /* Обновление счётчиков */
    updateCounters() {
      const movieCount = document.getElementById("movieCount");
      const seriesCount = document.getElementById("seriesCount");
      const actorCount = document.getElementById("actorCount");

      if (movieCount) movieCount.textContent = this.movies.length;
      if (seriesCount) seriesCount.textContent = this.series.length;
      if (actorCount) actorCount.textContent = this.actors.length;

      const currentYear = document.getElementById("currentYear");

      if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
      }
    },

    /* Общая перерисовка каталога */
    renderAll() {
      /*
        Основные страницы фильмов и сериалов
        обслуживает существующий cards.js.
      */
      const Cards = this.getCardsModule();

      if (Cards && typeof Cards.renderCatalog === "function") {
        Cards.renderCatalog();
      } else {
        this.renderMovies();
        this.renderSeries();
      }

      this.renderHome();
      this.renderActors();
      this.updateCounters();

      window.dispatchEvent(new CustomEvent("shohin:catalog-rendered", {
        detail: {
          movies: this.movies.length,
          series: this.series.length,
          actors: this.actors.length
        }
      }));
    },

    /* Загрузка файлов данных */
    async loadData() {
      if (this.loading) return;

      this.loading = true;
      this.setLoading(true);

      try {
        const data =
          window.SHOHIN_MOVIE &&
          window.SHOHIN_MOVIE.Data;

        if (!data || typeof data.loadCatalog !== "function") {
          throw new Error(
            "Не найден js/data.js. Проверь подключение файла в index.html."
          );
        }

        await data.loadCatalog();

        this.movies = data.getMovies();
        this.series = data.getSeries();
        this.actors = data.getActors();

        console.log("SHOHIN MOVIE: каталог загружен", {
          movies: this.movies.length,
          series: this.series.length,
          actors: this.actors.length
        });

        this.renderAll();

        window.dispatchEvent(new CustomEvent("shohin:app-ready", {
          detail: {
            movies: this.movies.length,
            series: this.series.length,
            actors: this.actors.length
          }
        }));

      } catch (error) {
        console.error("SHOHIN MOVIE: ошибка загрузки", error);

        this.showError(
          "Не удалось загрузить каталог. Проверь файлы данных и подключение JavaScript."
        );

      } finally {
        this.loading = false;
        this.setLoading(false);
      }
    },

    /* Запуск приложения */
    init() {
      if (this.initialized) return;

      this.initialized = true;

      this.bindMainSearch();
      this.bindActorSearch();

      this.loadData();
    }
  };

  window.SHOHIN_MOVIE = window.SHOHIN_MOVIE || {};
  window.SHOHIN_MOVIE.App = App;

  window.renderMovieCards = function () {
    App.renderAll();
  };

  window.renderCatalog = function () {
    App.renderAll();
  };

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      () => App.init(),
      { once: true }
    );
  } else {
    App.init();
  }

})();