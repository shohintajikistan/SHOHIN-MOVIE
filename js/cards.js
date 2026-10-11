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
        if (item && item[key] != null && item[key] !== "") {
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
      const value = this.getValue(item, ["country", "countries"], "");

      if (Array.isArray(value)) {
        return value.map(item =>
          typeof item === "object" && item !== null
            ? item.name || item.title || ""
            : item
        ).filter(Boolean).join(", ");
      }

      if (typeof value === "object" && value !== null) {
        return value.name || value.title || "";
      }

      return value;
    },

    getRating(item) {
      return this.getValue(item, ["rating", "imdbRating", "score"], "");
    },

    getDescription(item) {
      return this.getValue(
        item,
        ["description", "overview", "plot", "summary"],
        "Описание пока не добавлено."
      );
    },

    getPoster(item) {
      const value = this.getValue(
        item,
        ["poster", "posterUrl", "poster_url", "image", "imageUrl", "image_url", "cover"],
        ""
      );

      if (typeof value !== "string") return "";

      const poster = value.trim();

      if (/^https:\/\//i.test(poster)) return poster;

      if (
        poster.startsWith("assets/") ||
        poster.startsWith("./assets/") ||
        poster.startsWith("../assets/")
      ) {
        return poster;
      }

      return "";
    },

    /*
      ВАЖНО:
      Используем реальный ID из данных.
      Если ID отсутствует, используем название.
      Не создаём временный ID вида movie-0,
      который details.js не сможет найти.
    */
    getId(item) {
      const id = this.getValue(item, ["id", "slug"], "");

      if (id !== "") return String(id);

      return String(
        this.getValue(
          item,
          ["title", "name", "ruTitle", "originalTitle", "original_title"],
          ""
        )
      );
    },

    getStorage() {
      return window.SHOHIN_MOVIE.Storage || null;
    },

    isFavorite(item, type, id) {
      const storage = this.getStorage();

      if (storage && typeof storage.isFavorite === "function") {
        return !!storage.isFavorite(id, type);
      }

      try {
        const favorites = JSON.parse(
          localStorage.getItem("shohin_movie_favorites") || "[]"
        );

        return favorites.some(favorite => {
          if (typeof favorite === "object" && favorite !== null) {
            return String(favorite.id) === String(id) &&
              favorite.type === type;
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
          <div class="poster-placeholder">
            <span>SHOHIN</span>
            <span>MOVIE</span>
          </div>
        `;
      }

      return `
        <img
          src="${this.escapeHTML(poster)}"
          alt="${title}"
          loading="lazy"
          onerror="this.hidden=true;this.nextElementSibling.hidden=false"
        >
        <div class="poster-placeholder" hidden>
          <span>SHOHIN</span>
          <span>MOVIE</span>
        </div>
      `;
    },

    createMediaCard(item, index, type = "movie") {
      const title = this.escapeHTML(this.getTitle(item));
      const year = this.escapeHTML(this.getYear(item));
      const country = this.escapeHTML(this.getCountry(item));
      const rating = this.escapeHTML(this.getRating(item));
      const description = this.escapeHTML(this.getDescription(item));

      const rawId = this.getId(item);
      const id = this.escapeHTML(rawId);

      const favorite = this.isFavorite(item, type, rawId);

      return `
        <article
          class="media-card"
          data-card-type="${type}"
          data-item-id="${id}"
        >
          <button
            type="button"
            class="card-open"
            data-open-card
            data-card-type="${type}"
            data-item-id="${id}"
            aria-label="Открыть: ${title}"
          >
            <div class="card-poster">
              ${this.makePoster(item)}

              ${year ? `
                <span class="card-badge">${year}</span>
              ` : ""}
            </div>

            <div class="card-info">
              <h3 class="card-title">${title}</h3>

              <div class="card-meta">
                ${country ? `<span>${country}</span>` : ""}
                ${rating ? `<span class="card-rating">★ ${rating}</span>` : ""}
              </div>

              <p class="card-description">${description}</p>
            </div>
          </button>

          <button
            type="button"
            class="favorite-button ${favorite ? "is-favorite" : ""}"
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
        </article>
      `;
    },

    createActorCard(actor, index) {
      const name = this.escapeHTML(
        this.getValue(actor, ["name", "title", "fullName", "full_name"], "Без имени")
      );

      const rawId = this.getId(actor);
      const id = this.escapeHTML(rawId);

      const photoValue = this.getValue(
        actor,
        ["photo", "image", "portrait"],
        ""
      );

      const photo = typeof photoValue === "string" ? photoValue.trim() : "";

      let imageHTML = `
        <div class="actor-photo-placeholder">
          <span>SHOHIN</span>
        </div>
      `;

      if (
        /^https:\/\//i.test(photo) ||
        photo.startsWith("assets/") ||
        photo.startsWith("./assets/") ||
        photo.startsWith("../assets/")
      ) {
        imageHTML = `
          <img
            src="${this.escapeHTML(photo)}"
            alt="${name}"
            loading="lazy"
            onerror="this.hidden=true;this.nextElementSibling.hidden=false"
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
            ${imageHTML}
          </div>

          <div class="actor-name">${name}</div>
        </article>
      `;
    },

    renderInto(container, items, type = "movie") {
      if (!container) return;

      if (!Array.isArray(items) || items.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">✦</div>
            <h3>Пока здесь пусто</h3>
            <p>Каталог будет пополняться.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = items.map((item, index) => {
        return type === "actor"
          ? this.createActorCard(item, index)
          : this.createMediaCard(item, index, type);
      }).join("");
    },

    renderHome(movies, series) {
      const container = document.getElementById("homeCatalog");

      if (!container) return;

      const combined = [
        ...movies.map(item => ({ item, type: "movie" })),
        ...series.map(item => ({ item, type: "series" }))
      ].sort((a, b) => {
        return (Number(this.getYear(b.item)) || 0) -
          (Number(this.getYear(a.item)) || 0);
      });

      if (!combined.length) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">✦</div>
            <h3>Фильмы скоро появятся</h3>
            <p>Проверьте файлы каталога SHOHIN MOVIE.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = combined.map((entry, index) =>
        this.createMediaCard(entry.item, index, entry.type)
      ).join("");
    },

    renderCatalog() {
      const data = window.SHOHIN_MOVIE.Data;

      if (!data) {
        console.error("SHOHIN MOVIE: модуль js/data.js не найден.");
        return;
      }

      const movies = data.getMovies();
      const series = data.getSeries();
      const actors = data.getActors();

      const sortedMovies = [...movies].sort((a, b) =>
        (Number(this.getYear(b)) || 0) - (Number(this.getYear(a)) || 0)
      );

      const sortedSeries = [...series].sort((a, b) =>
        (Number(this.getYear(b)) || 0) - (Number(this.getYear(a)) || 0)
      );

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
    },

    updateCounters(movies, series, actors = []) {
      document.querySelectorAll("#movieCount, [data-movie-count]").forEach(el => {
        el.textContent = movies.length;
      });

      document.querySelectorAll("#seriesCount, [data-series-count]").forEach(el => {
        el.textContent = series.length;
      });

      document.querySelectorAll("#actorCount, [data-actor-count]").forEach(el => {
        el.textContent = actors.length;
      });
    },

    bindCardEvents(root = document) {
      root.addEventListener("click", event => {
        const favoriteButton = event.target.closest("[data-favorite-button]");

        if (favoriteButton && root.contains(favoriteButton)) {
          event.preventDefault();
          event.stopPropagation();

          const id = favoriteButton.dataset.favoriteId;
          const type = favoriteButton.dataset.favoriteType || "movie";
          const storage = this.getStorage();

          let active;

          if (storage && typeof storage.toggleFavorite === "function") {
            active = !!storage.toggleFavorite(id, type);
          } else {
            active = this.toggleFavoriteLocally(id, type);
          }

          favoriteButton.classList.toggle("is-favorite", active);
          favoriteButton.setAttribute("aria-pressed", String(active));
          favoriteButton.setAttribute(
            "aria-label",
            active ? "Убрать из избранного" : "Добавить в избранное"
          );

          return;
        }

        const openButton = event.target.closest("[data-open-card]");

        if (openButton && root.contains(openButton)) {
          event.preventDefault();

          const id = openButton.dataset.itemId;
          const type = openButton.dataset.cardType || "movie";

          const details = window.SHOHIN_MOVIE.Details;

          if (details && typeof details.open === "function") {
            const opened = details.open(id, type);

            if (!opened && window.SHOHIN_MOVIE.App) {
              window.SHOHIN_MOVIE.App.showToast(
                "Не удалось найти фильм. Проверь ID в data.js."
              );
            }
          } else if (typeof window.openDetails === "function") {
            window.openDetails(id, type);
          } else if (window.SHOHIN_MOVIE.App) {
            window.SHOHIN_MOVIE.App.showToast(
              "Модуль подробностей не загружен."
            );
          }

          return;
        }

        const actorCard = event.target.closest(
          '.actor-card[data-card-type="actor"]'
        );

        if (actorCard && root.contains(actorCard)) {
          const details = window.SHOHIN_MOVIE.Details;

          if (details && typeof details.open === "function") {
            details.open(actorCard.dataset.itemId, "actor");
          }
        }
      });

      root.addEventListener("keydown", event => {
        const actorCard = event.target.closest(
          '.actor-card[data-card-type="actor"]'
        );

        if (
          actorCard &&
          (event.key === "Enter" || event.key === " ")
        ) {
          event.preventDefault();

          const details = window.SHOHIN_MOVIE.Details;

          if (details && typeof details.open === "function") {
            details.open(actorCard.dataset.itemId, "actor");
          }
        }
      });
    },

    toggleFavoriteLocally(id, type) {
      const key = "shohin_movie_favorites";
      let favorites = [];

      try {
        favorites = JSON.parse(localStorage.getItem(key) || "[]");

        if (!Array.isArray(favorites)) favorites = [];
      } catch (error) {
        favorites = [];
      }

      const index = favorites.findIndex(favorite => {
        if (typeof favorite === "object" && favorite !== null) {
          return String(favorite.id) === String(id) &&
            favorite.type === type;
        }

        return String(favorite) === String(id);
      });

      if (index >= 0) {
        favorites.splice(index, 1);
      } else {
        favorites.push({
          id: String(id),
          type,
          savedAt: Date.now()
        });
      }

      try {
        localStorage.setItem(key, JSON.stringify(favorites));
      } catch (error) {
        console.error("SHOHIN MOVIE: не удалось сохранить избранное.", error);
      }

      return index < 0;
    }
  };

  window.SHOHIN_MOVIE.Cards = Cards;

  /*
    Один обработчик событий на document.
    Работает и для карточек, созданных позже.
  */
  if (!document.documentElement.dataset.shohinCardsEvents) {
    document.documentElement.dataset.shohinCardsEvents = "true";
    Cards.bindCardEvents(document);
  }

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