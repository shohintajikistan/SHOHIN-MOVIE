/* ==========================================
   SHOHIN MOVIE
   FILE: js/cards.js
   Карточки фильмов, сериалов и актёров
   SHOHIN BRAND COLORS — НЕ МЕНЯТЬ
   ========================================== */

"use strict";

(function () {
  window.SHOHIN_MOVIE = window.SHOHIN_MOVIE || {};

  const Cards = {
    escapeHTML: function (value) {
      return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    },

    getValue: function (item, keys, fallback = "") {
      for (const key of keys) {
        if (
          item &&
          item[key] !== undefined &&
          item[key] !== null &&
          item[key] !== ""
        ) {
          return item[key];
        }
      }

      return fallback;
    },

    getTitle: function (item) {
      return this.getValue(
        item,
        ["title", "name", "ruTitle", "originalTitle"],
        "Без названия"
      );
    },

    getYear: function (item) {
      return this.getValue(item, ["year", "releaseYear"], "");
    },

    getCountry: function (item) {
      const country = this.getValue(
        item,
        ["country", "countries"],
        ""
      );

      if (Array.isArray(country)) {
        return country.join(", ");
      }

      return country;
    },

    getRating: function (item) {
      return this.getValue(
        item,
        ["rating", "imdbRating", "score"],
        ""
      );
    },

    getPoster: function (item) {
      return this.getValue(
        item,
        ["poster", "image", "cover", "posterUrl"],
        ""
      );
    },

    getDescription: function (item) {
      return this.getValue(
        item,
        ["description", "overview", "plot", "summary"],
        "Описание пока не добавлено."
      );
    },

    getId: function (item, index, type) {
      return String(
        this.getValue(
          item,
          ["id", "slug"],
          type + "-" + index
        )
      );
    },

    getStorage: function () {
      return window.SHOHIN_MOVIE.Storage || null;
    },

    isFavorite: function (item, type) {
      const storage = this.getStorage();

      if (storage && typeof storage.isFavorite === "function") {
        return storage.isFavorite(item.id, type);
      }

      try {
        const favorites = JSON.parse(
          localStorage.getItem("shohin_movie_favorites") || "[]"
        );

        return favorites.some(function (favorite) {
          return (
            String(favorite.id) === String(item.id) &&
            favorite.type === type
          );
        });
      } catch (error) {
        return false;
      }
    },

    makePoster: function (item) {
      const poster = this.getPoster(item);

      if (!poster) {
        return `
          <div class="movie-poster-placeholder" aria-label="Постер отсутствует">
            <span class="poster-placeholder-logo">SHOHIN</span>
            <span class="poster-placeholder-text">MOVIE</span>
          </div>
        `;
      }

      const safePoster = this.escapeHTML(poster);
      const title = this.escapeHTML(this.getTitle(item));

      return `
        <img
          class="movie-poster-image"
          src="${safePoster}"
          alt="${title}"
          loading="lazy"
          onerror="this.hidden=true;this.nextElementSibling.hidden=false"
        >
        <div class="movie-poster-placeholder" hidden>
          <span class="poster-placeholder-logo">SHOHIN</span>
          <span class="poster-placeholder-text">MOVIE</span>
        </div>
      `;
    },

    createMediaCard: function (item, index, type = "movie") {
      const title = this.escapeHTML(this.getTitle(item));
      const year = this.escapeHTML(this.getYear(item));
      const country = this.escapeHTML(this.getCountry(item));
      const rating = this.escapeHTML(this.getRating(item));
      const id = this.escapeHTML(this.getId(item, index, type));
      const favorite = this.isFavorite(item, type);

      return `
        <article
          class="movie-card"
          data-card-type="${type}"
          data-item-id="${id}"
          tabindex="0"
          role="button"
          aria-label="Открыть: ${title}"
        >
          <div class="movie-poster">
            ${this.makePoster(item)}

            <button
              class="favorite-button ${favorite ? "is-favorite" : ""}"
              type="button"
              data-favorite-button
              data-favorite-id="${id}"
              data-favorite-type="${type}"
              aria-label="${favorite ? "Убрать из избранного" : "Добавить в избранное"}"
              aria-pressed="${favorite ? "true" : "false"}"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 21s-8-4.8-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 6.2-8 11-8 11z"
                ></path>
              </svg>
            </button>

            ${
              rating
                ? `<span class="movie-rating">★ ${rating}</span>`
                : ""
            }
          </div>

          <div class="movie-card-info">
            <h3 class="movie-card-title">${title}</h3>

            <div class="movie-card-meta">
              ${year ? `<span>${year}</span>` : ""}
              ${
                country
                  ? `<span class="movie-card-country">${country}</span>`
                  : ""
              }
            </div>
          </div>
        </article>
      `;
    },

    createActorCard: function (actor, index) {
      const name = this.escapeHTML(
        this.getValue(actor, ["name", "title"], "Без имени")
      );

      const photo = this.escapeHTML(
        this.getValue(actor, ["photo", "image", "portrait"], "")
      );

      const id = this.escapeHTML(
        this.getId(actor, index, "actor")
      );

      const fallback = `
        <div class="actor-photo-placeholder">
          <span>SHOHIN</span>
        </div>
      `;

      const image = photo
        ? `
          <img
            src="${photo}"
            alt="${name}"
            loading="lazy"
            onerror="this.hidden=true;this.nextElementSibling.hidden=false"
          >
          <div class="actor-photo-placeholder" hidden>
            <span>SHOHIN</span>
          </div>
        `
        : fallback;

      return `
        <article
          class="actor-card"
          data-card-type="actor"
          data-item-id="${id}"
          tabindex="0"
          role="button"
          aria-label="Открыть актёра: ${name}"
        >
          <div class="actor-photo">
            ${image}
          </div>

          <div class="actor-card-info">
            <h3>${name}</h3>
          </div>
        </article>
      `;
    },

    renderInto: function (container, items, type = "movie") {
      if (!container) return;

      if (!Array.isArray(items) || items.length === 0) {
        container.innerHTML = `
          <div class="catalog-empty">
            <div class="catalog-empty-icon">✦</div>
            <h3>Пока здесь пусто</h3>
            <p>Каталог будет пополняться.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = items
        .map((item, index) => {
          if (type === "actor") {
            return this.createActorCard(item, index);
          }

          return this.createMediaCard(item, index, type);
        })
        .join("");
    },

    renderCatalog: function () {
      const data = window.SHOHIN_MOVIE.Data;

      if (!data) {
        console.warn(
          "SHOHIN MOVIE: сначала подключи js/data.js"
        );
        return;
      }

      const movies = data.getMovies();
      const series = data.getSeries();

      const movieContainers = document.querySelectorAll(
        "#movieGrid, #moviesGrid, [data-movie-grid]"
      );

      const seriesContainers = document.querySelectorAll(
        "#seriesGrid, #series-grid, [data-series-grid]"
      );

      movieContainers.forEach((container) => {
        this.renderInto(container, movies, "movie");
      });

      seriesContainers.forEach((container) => {
        this.renderInto(container, series, "series");
      });

      this.updateCounters(movies, series);
      this.bindCardEvents();
    },

    updateCounters: function (movies, series) {
      const movieCounters = document.querySelectorAll(
        "#movieCount, [data-movie-count]"
      );

      const seriesCounters = document.querySelectorAll(
        "#seriesCount, [data-series-count]"
      );

      movieCounters.forEach((element) => {
        element.textContent = movies.length;
      });

      seriesCounters.forEach((element) => {
        element.textContent = series.length;
      });
    },

    bindCardEvents: function () {
      document.querySelectorAll("[data-favorite-button]").forEach((button) => {
        if (button.dataset.favoriteBound === "true") return;

        button.dataset.favoriteBound = "true";

        button.addEventListener("click", (event) => {
          event.stopPropagation();

          const id = button.dataset.favoriteId;
          const type = button.dataset.favoriteType;

          const storage = this.getStorage();

          if (storage && typeof storage.toggleFavorite === "function") {
            storage.toggleFavorite(id, type);
          } else {
            this.toggleFavoriteLocally(id, type);
          }

          const active = button.classList.toggle("is-favorite");

          button.setAttribute(
            "aria-pressed",
            active ? "true" : "false"
          );

          button.setAttribute(
            "aria-label",
            active ? "Убрать из избранного" : "Добавить в избранное"
          );
        });
      });

      document.querySelectorAll(
        ".movie-card, .actor-card"
      ).forEach((card) => {
        if (card.dataset.cardBound === "true") return;

        card.dataset.cardBound = "true";

        const openCard = () => {
          const type = card.dataset.cardType;
          const id = card.dataset.itemId;

          if (
            window.SHOHIN_MOVIE.Details &&
            typeof window.SHOHIN_MOVIE.Details.open === "function"
          ) {
            window.SHOHIN_MOVIE.Details.open(id, type);
            return;
          }

          if (typeof window.openDetails === "function") {
            window.openDetails(id, type);
          }
        };

        card.addEventListener("click", (event) => {
          if (event.target.closest("[data-favorite-button]")) return;
          openCard();
        });

        card.addEventListener("keydown", (event) => {
          if (event.target !== card) return;

          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openCard();
          }
        });
      });
    },

    toggleFavoriteLocally: function (id, type) {
      const key = "shohin_movie_favorites";
      let favorites = [];

      try {
        favorites = JSON.parse(localStorage.getItem(key) || "[]");
      } catch (error) {
        favorites = [];
      }

      const index = favorites.findIndex((favorite) => {
        return (
          String(favorite.id) === String(id) &&
          favorite.type === type
        );
      });

      if (index >= 0) {
        favorites.splice(index, 1);
      } else {
        favorites.push({
          id: id,
          type: type,
          savedAt: Date.now()
        });
      }

      localStorage.setItem(key, JSON.stringify(favorites));
    }
  };

  window.SHOHIN_MOVIE.Cards = Cards;

  window.renderMovieCards = function () {
    Cards.renderCatalog();
  };

  window.createMovieCard = function (item, index) {
    return Cards.createMediaCard(item, index, "movie");
  };

  window.createSeriesCard = function (item, index) {
    return Cards.createMediaCard(item, index, "series");
  };

  window.createActorCard = function (item, index) {
    return Cards.createActorCard(item, index);
  };
})();