/* SHOHIN MOVIE — APP
   Загрузка каталога и отображение фильмов.
   SHOHIN BRAND COLORS — НЕ МЕНЯТЬ
*/

(function () {
  "use strict";

  const App = {
    initialized: false,
    loading: false,
    movies: [],
    series: [],
    actors: [],
    searchQuery: "",

    escapeHTML(value) {
      return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    },

    getElement(selectors) {
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element) return element;
      }
      return null;
    },

    async loadData() {
      if (this.loading) return;
      this.loading = true;

      try {
        const data = window.SHOHIN_MOVIE &&
          window.SHOHIN_MOVIE.Data;

        if (!data || typeof data.loadCatalog !== "function") {
          throw new Error(
            "Не найден загрузчик данных. Проверь подключение js/data.js в index.html."
          );
        }

        await data.loadCatalog();

        this.movies = data.getMovies();
        this.series = data.getSeries();
        this.actors = data.getActors();

        console.log(
          "SHOHIN MOVIE: каталог загружен.",
          "Фильмы:", this.movies.length,
          "Сериалы:", this.series.length,
          "Актёры:", this.actors.length
        );

        this.renderAll();

        window.dispatchEvent(
          new CustomEvent("shohin:app-ready", {
            detail: {
              movies: this.movies.length,
              series: this.series.length,
              actors: this.actors.length
            }
          })
        );

      } catch (error) {
        console.error("SHOHIN MOVIE:", error);

        this.showError(
          "Не удалось загрузить каталог. Проверь подключение файлов данных."
        );
      } finally {
        this.loading = false;
      }
    },

    showError(message) {
      const target = this.getElement([
        "#moviesGrid",
        "#catalogGrid",
        "#featuredGrid"
      ]);

      if (!target) {
        console.error(message);
        return;
      }

      target.innerHTML =
        '<div class="shohin-data-message">' +
          this.escapeHTML(message) +
        "</div>";
    },

    getPoster(item) {
      const poster = String(item.poster || "").trim();

      if (!poster) return "";

      // Разрешаем только локальные изображения и HTTPS.
      if (
        !poster.startsWith("assets/") &&
        !poster.startsWith("./assets/") &&
        !poster.startsWith("../assets/") &&
        !poster.startsWith("https://")
      ) {
        return "";
      }

      return poster;
    },

    getGenres(item) {
      const genres = Array.isArray(item.genres)
        ? item.genres
        : [];

      return genres
        .slice(0, 3)
        .map(genre => this.escapeHTML(genre))
        .join(" · ");
    },

    createCard(item, type) {
      const id = this.escapeHTML(item.id || "");
      const title = this.escapeHTML(item.title || "Без названия");
      const year = this.escapeHTML(item.year || "");
      const rating = Number(item.rating);
      const validRating = Number.isFinite(rating) && rating > 0;
      const poster = this.getPoster(item);
      const genres = this.getGenres(item);

      const posterHTML = poster
        ? '<img class="shohin-card-poster-image" ' +
            'src="' + this.escapeHTML(poster) + '" ' +
            'alt="' + title + '" loading="lazy">' 
        : '<div class="shohin-card-poster-placeholder">' +
            '<span>SHOHIN</span>' +
            '<small>' + (type === "series" ? "SERIES" : "MOVIE") + '</small>' +
          '</div>';

      return (
        '<article class="shohin-card movie-card" ' +
          'data-item-id="' + id + '" ' +
          'data-item-type="' + type + '">' +

          '<button class="shohin-card-open" ' +
            'type="button" ' +
            'data-open-item="' + id + '" ' +
            'aria-label="Открыть ' + title + '">' +

            '<div class="shohin-card-poster">' +
              posterHTML +

              (validRating
                ? '<span class="shohin-card-rating">★ ' +
                    rating.toFixed(1) +
                  '</span>'
                : '') +
            '</div>' +

            '<div class="shohin-card-info">' +
              '<h3 class="shohin-card-title">' + title + '</h3>' +

              '<div class="shohin-card-meta">' +
                (year ? '<span>' + year + '</span>' : '') +
                (genres ? '<span>' + genres + '</span>' : '') +
              '</div>' +
            '</div>' +

          '</button>' +

          '<button class="shohin-card-favorite" ' +
            'type="button" ' +
            'data-favorite-id="' + id + '" ' +
            'aria-label="Добавить в избранное" ' +
            'title="Избранное">♡</button>' +

        '</article>'
      );
    },

    renderGrid(selectors, items, type) {
      const grid = this.getElement(selectors);
      if (!grid) return;

      const filtered = this.filterItems(items);

      if (!filtered.length) {
        grid.innerHTML =
          '<div class="shohin-data-message">' +
            (this.searchQuery
              ? "Ничего не найдено."
              : "Пока здесь нет данных.") +
          '</div>';
        return;
      }

      grid.innerHTML = filtered
        .map(item => this.createCard(item, type))
        .join("");
    },

    filterItems(items) {
      if (!this.searchQuery) return items;

      const query = this.searchQuery.toLocaleLowerCase();

      return items.filter(item => {
        const searchable = [
          item.title,
          item.originalTitle,
          item.description,
          ...(Array.isArray(item.countries) ? item.countries : []),
          ...(Array.isArray(item.genres) ? item.genres : []),
          ...(Array.isArray(item.actors) ? item.actors : [])
        ].join(" ").toLocaleLowerCase();

        return searchable.includes(query);
      });
    },

    renderAll() {
      this.renderGrid(
        ["#moviesGrid"],
        this.movies,
        "movie"
      );

      this.renderGrid(
        ["#seriesGrid"],
        this.series,
        "series"
      );

      this.renderGrid(
        ["#catalogGrid"],
        [...this.movies, ...this.series],
        "movie"
      );

      this.renderGrid(
        ["#featuredGrid"],
        this.movies.slice(0, 10),
        "movie"
      );

      this.renderGrid(
        ["#recentGrid"],
        this.getRecentItems(),
        "movie"
      );

      this.renderActors();
      this.updateCounters();
      this.bindCardImages();
    },

    renderActors() {
      const grid = this.getElement(["#actorsGrid"]);
      if (!grid) return;

      if (!this.actors.length) {
        grid.innerHTML = "";
        return;
      }

      grid.innerHTML = this.actors.map(actor => {
        const name = this.escapeHTML(
          actor.name || actor.title || "Актёр"
        );

        return (
          '<article class="shohin-actor-card">' +
            '<h3>' + name + '</h3>' +
          '</article>'
        );
      }).join("");
    },

    getRecentItems() {
      try {
        const ids = JSON.parse(
          localStorage.getItem("shohin_movie_history") || "[]"
        );

        if (!Array.isArray(ids)) return [];

        return ids
          .map(id => this.movies.find(item => item.id === id))
          .filter(Boolean)
          .slice(0, 10);

      } catch (error) {
        return [];
      }
    },

    updateCounters() {
      const movieCount = document.querySelector("#movieCount");
      const seriesCount = document.querySelector("#seriesCount");

      if (movieCount) {
        movieCount.textContent = this.movies.length;
      }

      if (seriesCount) {
        seriesCount.textContent = this.series.length;
      }
    },

    bindCardImages() {
      document.querySelectorAll(
        ".shohin-card-poster-image"
      ).forEach(image => {
        image.addEventListener("error", function () {
          const placeholder = document.createElement("div");
          placeholder.className = "shohin-card-poster-placeholder";
          placeholder.innerHTML = "<span>SHOHIN</span><small>MOVIE</small>";
          image.replaceWith(placeholder);
        }, { once: true });
      });
    },

    bindSearch() {
      const inputs = document.querySelectorAll(
        "#searchInput, #pageSearchInput"
      );

      inputs.forEach(input => {
        input.addEventListener("input", () => {
          this.searchQuery = input.value.trim();

          inputs.forEach(other => {
            if (other !== input) other.value = input.value;
          });

          this.renderAll();
        });
      });
    },

    bindCardActions() {
      document.addEventListener("click", event => {
        const favoriteButton = event.target.closest(
          "[data-favorite-id]"
        );

        if (favoriteButton) {
          event.preventDefault();

          const id = favoriteButton.dataset.favoriteId;
          this.toggleFavorite(id, favoriteButton);
          return;
        }

        const openButton = event.target.closest(
          "[data-open-item]"
        );

        if (openButton) {
          event.preventDefault();

          const id = openButton.dataset.openItem;
          const item = [...this.movies, ...this.series]
            .find(entry => String(entry.id) === String(id));

          if (!item) return;

          try {
            const history = JSON.parse(
              localStorage.getItem("shohin_movie_history") || "[]"
            );

            const updated = [
              id,
              ...(Array.isArray(history) ? history.filter(value => value !== id) : [])
            ].slice(0, 50);

            localStorage.setItem(
              "shohin_movie_history",
              JSON.stringify(updated)
            );
          } catch (error) {}

          window.dispatchEvent(
            new CustomEvent("shohin:open-item", {
              detail: { item: item }
            })
          );

          if (typeof window.openDetail === "function") {
            window.openDetail(id);
          }
        }
      });
    },

    toggleFavorite(id, button) {
      let favorites = [];

      try {
        favorites = JSON.parse(
          localStorage.getItem("shohin_movie_favorites") || "[]"
        );

        if (!Array.isArray(favorites)) favorites = [];
      } catch (error) {
        favorites = [];
      }

      const index = favorites.indexOf(id);

      if (index >= 0) {
        favorites.splice(index, 1);
        button.textContent = "♡";
        button.classList.remove("active");
      } else {
        favorites.push(id);
        button.textContent = "♥";
        button.classList.add("active");
      }

      localStorage.setItem(
        "shohin_movie_favorites",
        JSON.stringify(favorites)
      );

      window.dispatchEvent(
        new CustomEvent("shohin:favorites-changed")
      );
    },

    init() {
      if (this.initialized) return;
      this.initialized = true;

      this.bindSearch();
      this.bindCardActions();
      this.loadData();

      console.log("SHOHIN MOVIE: приложение запускается.");
    }
  };

  window.SHOHIN_MOVIE = window.SHOHIN_MOVIE || {};
  window.SHOHIN_MOVIE.App = App;

  window.renderMovieCards = function () {
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