/* ==========================================
   SHOHIN MOVIE
   FILE: js/navigation.js
   Навигация и меню
   SHOHIN BRAND COLORS — НЕ МЕНЯТЬ
   ========================================== */

"use strict";

(function () {
  window.SHOHIN_MOVIE = window.SHOHIN_MOVIE || {};

  const Navigation = {
    currentSection: "home",

    sectionNames: {
      home: "Главная",
      movies: "Фильмы",
      series: "Сериалы",
      actors: "Актёры",
      favorites: "Избранное",
      favoriteMovies: "Избранные фильмы",
      favoriteSeries: "Избранные сериалы",
      favoriteActors: "Избранные актёры",
      history: "Недавно открытые",
      genres: "Жанры",
      countries: "Страны",
      years: "Годы",
      rating: "Рейтинг",
      about: "О SHOHIN MOVIE"
    },

    init: function () {
      this.bindMenuLinks();
      this.bindNavigationButtons();
      this.bindBrowserHistory();

      const initialSection = this.getSectionFromURL();

      if (initialSection) {
        this.navigate(initialSection, false);
      } else {
        this.navigate("home", false);
      }
    },

    getSectionFromURL: function () {
      const params = new URLSearchParams(window.location.search);
      const section = params.get("section");

      if (section && this.sectionNames[section]) {
        return section;
      }

      return null;
    },

    bindMenuLinks: function () {
      document.querySelectorAll(
        "[data-section], [data-navigate]"
      ).forEach((element) => {
        if (element.dataset.navigationBound === "true") return;

        element.dataset.navigationBound = "true";

        element.addEventListener("click", (event) => {
          const section =
            element.dataset.section ||
            element.dataset.navigate;

          if (!section || !this.sectionNames[section]) return;

          event.preventDefault();
          this.navigate(section);

          if (
            typeof window.SHOHIN_MOVIE.closeMenu === "function"
          ) {
            window.SHOHIN_MOVIE.closeMenu();
          }
        });
      });
    },

    bindNavigationButtons: function () {
      document.querySelectorAll(
        "[data-go-home], #homeButton"
      ).forEach((button) => {
        button.addEventListener("click", () => {
          this.navigate("home");
        });
      });

      document.querySelectorAll(
        "[data-go-back], #backButton"
      ).forEach((button) => {
        button.addEventListener("click", () => {
          if (window.history.length > 1) {
            window.history.back();
          } else {
            this.navigate("home");
          }
        });
      });
    },

    bindBrowserHistory: function () {
      window.addEventListener("popstate", () => {
        const section = this.getSectionFromURL() || "home";
        this.navigate(section, false);
      });
    },

    navigate: function (section, updateURL = true) {
      if (!this.sectionNames[section]) {
        section = "home";
      }

      this.currentSection = section;

      document.querySelectorAll(
        "[data-page], .app-page"
      ).forEach((page) => {
        const pageName =
          page.dataset.page ||
          page.id.replace(/^page-/, "");

        const active = pageName === section;

        page.hidden = !active;
        page.classList.toggle("active", active);

        if (active) {
          page.setAttribute("aria-hidden", "false");
        } else {
          page.setAttribute("aria-hidden", "true");
        }
      });

      document.querySelectorAll(
        "[data-section], [data-navigate]"
      ).forEach((link) => {
        const linkSection =
          link.dataset.section ||
          link.dataset.navigate;

        const active = linkSection === section;

        link.classList.toggle("active", active);

        if (active) {
          link.setAttribute("aria-current", "page");
        } else {
          link.removeAttribute("aria-current");
        }
      });

      this.updatePageTitle(section);

      if (updateURL) {
        const url = new URL(window.location.href);
        url.searchParams.set("section", section);

        window.history.pushState(
          { section: section },
          "",
          url
        );
      }

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });

      document.dispatchEvent(
        new CustomEvent("shohin:navigate", {
          detail: {
            section: section,
            title: this.sectionNames[section]
          }
        })
      );

      this.renderSection(section);
    },

    updatePageTitle: function (section) {
      const title = this.sectionNames[section] || "SHOHIN MOVIE";

      document.title =
        title === "Главная"
          ? "SHOHIN MOVIE"
          : title + " — SHOHIN MOVIE";

      const titleElements = document.querySelectorAll(
        "[data-page-title], #pageTitle"
      );

      titleElements.forEach((element) => {
        element.textContent = title;
      });
    },

    renderSection: function (section) {
      const data = window.SHOHIN_MOVIE.Data;
      const cards = window.SHOHIN_MOVIE.Cards;
      const storage = window.SHOHIN_MOVIE.Storage;

      if (!data || !cards) return;

      const renderList = (selectors, items, type) => {
        const containers = document.querySelectorAll(selectors);

        containers.forEach((container) => {
          cards.renderInto(container, items, type);
        });

        cards.bindCardEvents();
      };

      switch (section) {
        case "movies":
          renderList(
            "#movieGrid, #moviesGrid, [data-movie-grid]",
            data.getMovies(),
            "movie"
          );
          break;

        case "series":
          renderList(
            "#seriesGrid, #series-grid, [data-series-grid]",
            data.getSeries(),
            "series"
          );
          break;

        case "actors":
          renderList(
            "#actorsGrid, #actorGrid, [data-actor-grid]",
            data.getActors(),
            "actor"
          );
          break;

        case "favorites":
          if (storage) {
            renderList(
              "#favoritesGrid, [data-favorites-grid]",
              storage.getSavedItems(),
              "movie"
            );
          }
          break;

        case "favoriteMovies":
          if (storage) {
            renderList(
              "#favoriteMoviesGrid, [data-favorite-movies-grid]",
              storage.getSavedItems("movie"),
              "movie"
            );
          }
          break;

        case "favoriteSeries":
          if (storage) {
            renderList(
              "#favoriteSeriesGrid, [data-favorite-series-grid]",
              storage.getSavedItems("series"),
              "series"
            );
          }
          break;

        case "favoriteActors":
          if (storage) {
            renderList(
              "#favoriteActorsGrid, [data-favorite-actors-grid]",
              storage.getSavedItems("actor"),
              "actor"
            );
          }
          break;

        case "history":
          if (storage) {
            renderList(
              "#historyGrid, [data-history-grid]",
              storage.getHistoryItems(),
              "movie"
            );
          }
          break;

        case "home":
          cards.renderCatalog();
          break;
      }
    }
  };

  window.SHOHIN_MOVIE.Navigation = Navigation;

  window.navigateTo = function (section) {
    Navigation.navigate(section);
  };

  document.addEventListener("DOMContentLoaded", function () {
    Navigation.init();
  });

  if (document.readyState !== "loading") {
    Navigation.init();
  }
})();