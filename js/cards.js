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
    escapeHTML(value) {
      return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    },

    getValue(item, keys, fallback = "") {
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

    getTitle(item) {
      return this.getValue(
        item,
        ["title", "name", "ruTitle", "originalTitle", "original_title"],
        "Без названия"
      );
    },

    getYear(item) {
      return this.getValue(item, ["year", "releaseYear"], "");
    },

    getCountry(item) {
      const value = this.getValue(
        item,
        ["country", "countries"],
        ""
      );

      if (Array.isArray(value)) {
        return value.map(item => {
          if (typeof item === "object" && item !== null) {
            return item.name || item.title || "";
          }

          return item;
        }).filter(Boolean).join(", ");
      }

      if (typeof value === "object" && value !== null) {
        return value.name || value.title || "";
      }

      return value;
    },

    getRating(item) {
      return this.getValue(
        item,
        ["rating", "imdbRating", "score"],
        ""
      );
    },

    getPoster(item) {
      const value = this.getValue(
        item,
        ["poster", "image", "cover", "posterUrl", "poster_url", "imageUrl"],
        ""
      );

      if (typeof value !== "string") return "";

      const poster = value.trim();

      if (!poster) return "";

      if (/^https:\/\//i.test(poster)) {
        return poster;
      }

      if (
        poster.startsWith("assets/") ||
        poster.startsWith("./assets/") ||
        poster.startsWith("../assets/")
      ) {
        return poster;
      }

      return "";
    },

    getDescription(item) {
      return this.getValue(
        item,
        ["description", "overview", "plot", "summary"],
        "Описание пока не добавлено."
      );
    },

    getId(item, index, type) {
      return String(
        this.getValue(
          item,
          ["id", "slug"],
          type + "-" + index
        )
      );
    },

    getStorage() {
      return window.SHOHIN_MOVIE.Storage || null;
    },

    isFavorite(item, type, id) {
      const storage = this.getStorage();

      if (storage && typeof storage.isFavorite === "function") {
        return storage.isFavorite(id, type);
      }

      try {
        const favorites = JSON.parse(
          localStorage.getItem("shohin_movie_favorites") || "[]"
        );

        return favorites.some(favorite => {
          if (typeof favorite === "object" && favorite !== null) {
            return (
              String(favorite.id) === String(id) &&
              favorite.type === type
            );
          }

          return String(favorite) === String(id);
        });
      } catch (error) {
        return false;
      }
    },

    makePoster(item) {
      const poster = this.getPoster(item);
      const title = this.escapeHTML(this.getTitle(item));

      if (!poster) {
        return `
          <div class="movie-poster-placeholder"
               aria-label="Постер отсутствует">
            <span class="poster-placeholder-logo">SHOHIN</span>
            <span class="poster-placeholder-text">MOVIE</span>
          </div>
        `;
      }

      return `
        <img
          class="movie-poster-image"
          src="${this.escapeHTML(poster)}"
          alt="${title}"
          loading="lazy"
          onerror="
            this.hidden=true;
            if(this.nextElementSibling){
              this.nextElementSibling.hidden=false;
            }
          "
        >

        <div class="movie-poster-placeholder" hidden>
          <span class="poster-placeholder-logo">SHOHIN</span>
          <span class="poster-placeholder-text">MOVIE</span>
        </div>
      `;
    },

    createMediaCard(item, index, type = "movie") {
      const title = this.escapeHTML(this.getTitle(item));
      const year = this.escapeHTML(this.getYear(item));
      const country = this.escapeHTML(this.getCountry(item));
      const rating = this.escapeHTML(this.getRating(item));
      const id = this.escapeHTML(this.getId(item, index, type));

      const favorite = this.isFavorite(
        item,
        type,
        this.getId(item, index, type)
      );

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
              aria-label="${
                favorite
                  ? "Убрать из избранного"
                  : "Добавить в избранное"
              }"
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

    createActorCard(actor, index) {
      const name = this.escapeHTML(
        this.getValue(actor, ["name", "title"], "Без имени")
      );

      const photoValue = this.getValue(
        actor,
        ["photo", "image", "portrait"],
        ""
      );

      const photo = typeof photoValue === "string"
        ? photoValue
        : "";

      const id = this.escapeHTML(
        this.getId(actor, index, "actor")
      );

      const fallback = `
        <div class="actor-photo-placeholder">
          <span>SHOHIN</span>
        </div>
      `;

      let image = fallback;

      if (
        /^https:\/\//i.test(photo) ||
        photo.startsWith("assets/") ||
        photo.startsWith("./assets/") ||
        photo.startsWith("../assets/")
      ) {
        image = `
          <img
            src="${this.escapeHTML(photo)}"
            alt="${name}"
            loading="lazy"
            onerror="
              this.hidden=true;
              if(this.nextElementSibling){
                this.nextElementSibling.hidden=false;
              }
            "
          >

          <div class="actor-photo-placeholder" hidden>
            <span>SHOHIN</span>
          </div>
        `;
      }

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

    renderInto(container, items, type = "movie") {
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

      container.innerHTML = items.map((item, index) => {
        if (type === "actor") {
          return this.createActorCard(item, index);
        }

        return this.createMediaCard(item, index, type);
      }).join("");

      this.bindCardEvents(container);
    },

    /*
      Главная страница:
      фильмы и сериалы вместе, новые годы первыми.
    */
    renderHome(movies, series) {
      const container = document.getElementById("homeCatalog");

      if (!container) return;

      const combined = [
        ...movies.map(item => ({ ...item, type: "movie" })),
        ...series.map(item => ({ ...item, type: "series" }))
      ].sort((a, b) => {
        return (Number(b.year) || 0) - (Number(a.year) || 0);
      });

      if (!combined.length) {
        container.innerHTML = `
          <div class="catalog-empty">
            <div class="catalog-empty-icon">✦</div>
            <h3>Фильмы скоро появятся</h3>
            <p>Проверьте файлы каталога SHOHIN MOVIE.</p>
          </div>
        `;

        return;
      }

      container.innerHTML = combined.map((item, index) => {
        return this.createMediaCard(
          item,
          index,
          item.type
        );
      }).join("");

      this.bindCardEvents(container);
    },

    /*
      Основной каталог.
      Обрабатываем и старый #movieGrid,
      и актуальный #moviesGrid.
    */
    renderCatalog() {
      const data = window.SHOHIN_MOVIE.Data;

      if (!data) {
        console.error(
          "SHOHIN MOVIE: модуль js/data.js не найден."
        );

        return;
      }

      const movies = data.getMovies();
      const series = data.getSeries();
      const actors = data.getActors();

      const sortedMovies = [...movies].sort((a, b) => {
        return (Number(b.year) || 0) - (Number(a.year) || 0);
      });

      const sortedSeries = [...series].sort((a, b) => {
        return (Number(b.year) || 0) - (Number(a.year) || 0);
      });

      document.querySelectorAll(
        "#movieGrid, #moviesGrid, #movie-grid, [data-movie-grid]"
      ).forEach(container => {
        this.renderInto(container, sortedMovies, "movie");
      });

      document.querySelectorAll(
        "#seriesGrid, #series-grid, [data-series-grid]"
      ).forEach(container => {
        this.renderInto(container, sortedSeries, "series");
      });

      const actorGrid = document.getElementById("actorsGrid");

      if (actorGrid) {
        this.renderInto(actorGrid, actors, "actor");
      }

      this.renderHome(sortedMovies, sortedSeries);

      this.updateCounters(sortedMovies, sortedSeries, actors);

      this.bindCardEvents();
    },

    updateCounters(movies, series, actors = []) {
      document.querySelectorAll(
        "#movieCount, [data-movie-count]"
      ).forEach(element => {
        element.textContent = movies.length;
      });

      document.querySelectorAll(
        "#seriesCount, [data-series-count]"
      ).forEach(element => {
        element.textContent = series.length;
      });

      document.querySelectorAll(
        "#actorCount, [data-actor-count]"
      ).forEach(element => {
        element.textContent = actors.length;
      });
    },

    /*
      Назначаем обработчики только карточкам,
      которые ещё не были обработаны.
    */
    bindCardEvents(root = document) {
      root.querySelectorAll("[data-favorite-button]").forEach(button => {
        if (button.dataset.favoriteBound === "true") return;

        button.dataset.favoriteBound = "true";

        button.addEventListener("click", event => {
          event.preventDefault();
          event.stopPropagation();

          const id = button.dataset.favoriteId;
          const type = button.dataset.favoriteType || "movie";
          const storage = this.getStorage();

          if (
            storage &&
            typeof storage.toggleFavorite === "function"
          ) {
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
            active
              ? "Убрать из избранного"
              : "Добавить в избранное"
          );
        });
      });

      root.querySelectorAll(".movie-card, .actor-card").forEach(card => {
        if (card.dataset.cardBound === "true") return;

        card.dataset.cardBound = "true";

        const openCard = () => {
          const type = card.dataset.cardType || "movie";
          const id = card.dataset.itemId;

          const details = window.SHOHIN_MOVIE.Details;

          if (details && typeof details.open === "function") {
            details.open(id, type);
            return;
          }

          if (typeof window.openDetails === "function") {
            window.openDetails(id, type);
          }
        };

        card.addEventListener("click", event => {
          if (event.target.closest("[data-favorite-button]")) {
            return;
          }

          openCard();
        });

        card.addEventListener("keydown", event => {
          if (event.target !== card) return;

          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openCard();
          }
        });
      });
    },

    toggleFavoriteLocally(id, type) {
      const key = "shohin_movie_favorites";
      let favorites = [];

      try {
        favorites = JSON.parse(
          localStorage.getItem(key) || "[]"
        );

        if (!Array.isArray(favorites)) {
          favorites = [];
        }
      } catch (error) {
        favorites = [];
      }

      const index = favorites.findIndex(favorite => {
        if (typeof favorite === "object" && favorite !== null) {
          return (
            String(favorite.id) === String(id) &&
            favorite.type === type
          );
        }

        return String(favorite) === String(id);
      });

      if (index >= 0) {
        favorites.splice(index, 1);
      } else {
        favorites.push({
          id: String(id),
          type: type,
          savedAt: Date.now()
        });
      }

      try {
        localStorage.setItem(key, JSON.stringify(favorites));
      } catch (error) {
        console.error(
          "SHOHIN MOVIE: не удалось сохранить избранное.",
          error
        );
      }
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