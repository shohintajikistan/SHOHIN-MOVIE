/* ==========================================
   SHOHIN MOVIE
   FILE: js/details.js
   Подробные карточки фильмов, сериалов и актёров
   SHOHIN BRAND COLORS — НЕ МЕНЯТЬ
   ========================================== */

"use strict";

(function () {
  window.SHOHIN_MOVIE = window.SHOHIN_MOVIE || {};

  const Details = {
    currentItem: null,
    currentType: "movie",

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

    formatList: function (value) {
      if (Array.isArray(value)) {
        return value
          .map((item) => {
            if (typeof item === "object" && item !== null) {
              return item.name || item.title || "";
            }

            return String(item);
          })
          .filter(Boolean)
          .join(", ");
      }

      return String(value || "");
    },

    getDataItem: function (id, type) {
      const data = window.SHOHIN_MOVIE.Data;

      if (!data) return null;

      const normalizedType =
        type === "tv" || type === "serial"
          ? "series"
          : type;

      let list;

      if (normalizedType === "actor") {
        list = data.getActors();
      } else if (normalizedType === "series") {
        list = data.getSeries();
      } else {
        list = data.getMovies();
      }

      return list.find((item) => {
        const itemId = String(
          item.id !== undefined && item.id !== null
            ? item.id
            : item.slug ||
              item.title ||
              item.name ||
              ""
        );

        return itemId === String(id);
      }) || null;
    },

    open: function (id, type = "movie") {
      const item = this.getDataItem(id, type);

      if (!item) {
        console.warn(
          "SHOHIN MOVIE: карточка не найдена.",
          id,
          type
        );
        return false;
      }

      this.currentItem = item;
      this.currentType = type;

      const storage = window.SHOHIN_MOVIE.Storage;

      if (storage) {
        storage.addToHistory(item, type);
      }

      const detailPage = document.querySelector(
        "#detailsPage, #detailPage, [data-details-page]"
      );

      if (detailPage) {
        detailPage.innerHTML = this.createDetailsHTML(item, type);
        detailPage.hidden = false;
        detailPage.classList.add("active");

        document.querySelectorAll(
          "[data-page], .app-page"
        ).forEach((page) => {
          if (page !== detailPage) {
            page.hidden = true;
            page.classList.remove("active");
            page.setAttribute("aria-hidden", "true");
          }
        });

        detailPage.setAttribute("aria-hidden", "false");

        this.bindDetailsEvents(detailPage, item, type);

        const title = this.getValue(
          item,
          ["title", "name"],
          "SHOHIN MOVIE"
        );

        document.title = title + " — SHOHIN MOVIE";

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      } else {
        this.openModal(item, type);
      }

      document.dispatchEvent(
        new CustomEvent("shohin:details-opened", {
          detail: {
            id: id,
            type: type,
            item: item
          }
        })
      );

      return true;
    },

    createDetailsHTML: function (item, type) {
      const title = this.escapeHTML(
        this.getValue(item, ["title", "name"], "Без названия")
      );

      const originalTitle = this.escapeHTML(
        this.getValue(
          item,
          ["originalTitle", "originalName"],
          ""
        )
      );

      const description = this.escapeHTML(
        this.getValue(
          item,
          ["description", "overview", "plot", "summary"],
          "Описание пока не добавлено."
        )
      );

      const poster = this.escapeHTML(
        this.getValue(
          item,
          ["poster", "image", "cover", "photo"],
          ""
        )
      );

      const year = this.escapeHTML(
        this.getValue(item, ["year", "releaseYear"], "")
      );

      const country = this.escapeHTML(
        this.formatList(
          this.getValue(item, ["country", "countries"], "")
        )
      );

      const genres = this.escapeHTML(
        this.formatList(
          this.getValue(item, ["genres", "genre"], [])
        )
      );

      const rating = this.escapeHTML(
        this.getValue(
          item,
          ["rating", "imdbRating", "score"],
          ""
        )
      );

      const director = this.escapeHTML(
        this.formatList(
          this.getValue(item, ["director", "directors"], "")
        )
      );

      const actors = this.getValue(
        item,
        ["actors", "cast", "starring"],
        []
      );

      const actorsList = Array.isArray(actors)
        ? actors
        : String(actors || "")
            .split(",")
            .map((name) => name.trim())
            .filter(Boolean);

      const actorsHTML = actorsList.length
        ? `
          <section class="details-section">
            <h3>Актёрский состав</h3>
            <div class="details-actors">
              ${actorsList.map((actor) => {
                const name =
                  typeof actor === "object" && actor !== null
                    ? actor.name || actor.title || ""
                    : actor;

                return `
                  <span class="details-actor-name">
                    ${this.escapeHTML(name)}
                  </span>
                `;
              }).join("")}
            </div>
          </section>
        `
        : "";

      const storage = window.SHOHIN_MOVIE.Storage;

      const id = String(
        item.id !== undefined && item.id !== null
          ? item.id
          : item.slug || item.title || item.name || ""
      );

      const isFavorite = storage
        ? storage.isFavorite(id, type)
        : false;

      const favoriteLabel = isFavorite
        ? "♥ В избранном"
        : "♡ В избранное";

      const posterHTML = poster
        ? `
          <img
            class="details-poster-image"
            src="${poster}"
            alt="${title}"
            onerror="this.hidden=true;this.nextElementSibling.hidden=false"
          >
          <div class="details-poster-placeholder" hidden>
            <span>SHOHIN</span>
            <span>MOVIE</span>
          </div>
        `
        : `
          <div class="details-poster-placeholder">
            <span>SHOHIN</span>
            <span>MOVIE</span>
          </div>
        `;

      return `
        <div class="details-page-content">
          <div class="details-toolbar">
            <button
              type="button"
              class="details-back-button"
              data-details-back
            >
              <span aria-hidden="true">←</span>
              Назад
            </button>

            <button
              type="button"
              class="details-favorite-button ${isFavorite ? "is-favorite" : ""}"
              data-details-favorite
              aria-pressed="${isFavorite ? "true" : "false"}"
            >
              ${favoriteLabel}
            </button>
          </div>

          <div class="details-layout">
            <div class="details-poster">
              ${posterHTML}
            </div>

            <div class="details-main">
              <span class="details-type">
                ${
                  type === "actor"
                    ? "АКТЁР"
                    : type === "series"
                      ? "СЕРИАЛ"
                      : "ФИЛЬМ"
                }
              </span>

              <h1 class="details-title">${title}</h1>

              ${
                originalTitle
                  ? `<p class="details-original-title">${originalTitle}</p>`
                  : ""
              }

              <div class="details-meta">
                ${year ? `<span>${year}</span>` : ""}
                ${country ? `<span>${country}</span>` : ""}
                ${rating ? `<span>★ ${rating}</span>` : ""}
              </div>

              ${
                genres
                  ? `
                    <div class="details-genres">
                      ${genres.split(",").map((genre) => `
                        <span class="details-genre-tag">
                          ${this.escapeHTML(genre.trim())}
                        </span>
                      `).join("")}
                    </div>
                  `
                  : ""
              }

              <section class="details-section">
                <h3>
                  ${type === "actor" ? "Биография" : "Описание"}
                </h3>

                <p class="details-description">${description}</p>
              </section>

              ${
                director && type !== "actor"
                  ? `
                    <div class="details-information">
                      <strong>Режиссёр:</strong>
                      <span>${director}</span>
                    </div>
                  `
                  : ""
              }

              ${
                item.duration
                  ? `
                    <div class="details-information">
                      <strong>Продолжительность:</strong>
                      <span>${this.escapeHTML(item.duration)}</span>
                    </div>
                  `
                  : ""
              }

              ${
                item.birthday && type === "actor"
                  ? `
                    <div class="details-information">
                      <strong>Дата рождения:</strong>
                      <span>${this.escapeHTML(item.birthday)}</span>
                    </div>
                  `
                  : ""
              }
            </div>
          </div>

          ${actorsHTML}

          <div class="details-extra">
            <p>SHOHIN MOVIE — исследуйте мир кино.</p>
          </div>
        </div>
      `;
    },

    bindDetailsEvents: function (container, item, type) {
      const backButton = container.querySelector(
        "[data-details-back]"
      );

      if (backButton) {
        backButton.addEventListener("click", () => {
          this.close();
        });
      }

      const favoriteButton = container.querySelector(
        "[data-details-favorite]"
      );

      if (favoriteButton) {
        favoriteButton.addEventListener("click", () => {
          const storage = window.SHOHIN_MOVIE.Storage;

          if (!storage) return;

          const id = String(
            item.id !== undefined && item.id !== null
              ? item.id
              : item.slug || item.title || item.name || ""
          );

          const added = storage.toggleFavorite(id, type);

          favoriteButton.classList.toggle(
            "is-favorite",
            added
          );

          favoriteButton.setAttribute(
            "aria-pressed",
            added ? "true" : "false"
          );

          favoriteButton.textContent = added
            ? "♥ В избранном"
            : "♡ В избранное";
        });
      }
    },

    openModal: function (item, type) {
      let modal = document.querySelector(
        "#detailsModal, [data-details-modal]"
      );

      if (!modal) {
        modal = document.createElement("div");
        modal.id = "detailsModal";
        modal.className = "details-modal";
        modal.setAttribute("role", "dialog");
        modal.setAttribute("aria-modal", "true");

        document.body.appendChild(modal);
      }

      modal.innerHTML = `
        <div class="details-modal-content">
          <button
            type="button"
            class="details-modal-close"
            data-modal-close
            aria-label="Закрыть"
          >
            ×
          </button>

          ${this.createDetailsHTML(item, type)}
        </div>
      `;

      modal.hidden = false;
      modal.classList.add("active");

      const closeButton = modal.querySelector("[data-modal-close]");

      if (closeButton) {
        closeButton.addEventListener("click", () => {
          modal.classList.remove("active");
          modal.hidden = true;
        });
      }

      modal.addEventListener("click", function (event) {
        if (event.target === modal) {
          modal.classList.remove("active");
          modal.hidden = true;
        }
      });

      this.bindDetailsEvents(modal, item, type);
    },

    close: function () {
      const detailPage = document.querySelector(
        "#detailsPage, #detailPage, [data-details-page]"
      );

      if (detailPage && detailPage.classList.contains("active")) {
        detailPage.classList.remove("active");
        detailPage.hidden = true;
        detailPage.setAttribute("aria-hidden", "true");

        const currentSection =
          window.SHOHIN_MOVIE.Navigation?.currentSection || "home";

        if (window.SHOHIN_MOVIE.Navigation) {
          window.SHOHIN_MOVIE.Navigation.navigate(
            currentSection,
            false
          );
        } else {
          const home = document.querySelector(
            '[data-page="home"], #page-home'
          );

          if (home) {
            home.hidden = false;
            home.classList.add("active");
          }
        }

        return;
      }

      const modal = document.querySelector(
        "#detailsModal, [data-details-modal]"
      );

      if (modal) {
        modal.classList.remove("active");
        modal.hidden = true;
      }
    }
  };

  window.SHOHIN_MOVIE.Details = Details;

  window.openDetails = function (id, type) {
    return Details.open(id, type);
  };

  window.closeDetails = function () {
    Details.close();
  };
})();