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
      history: "Недавно открытые",
      genres: "Жанры",
      countries: "Страны",
      years: "Годы выпуска",
      settings: "Настройки",
      about: "О SHOHIN MOVIE",
      details: "Подробности"
    },

    init: function () {
      this.bindMenuLinks();
      this.bindNavigationButtons();
      this.bindBrowserHistory();

      const initialSection = this.getSectionFromURL();

      this.navigate(initialSection || "home", false);
    },

    getSectionFromURL: function () {
      const params = new URLSearchParams(window.location.search);
      const querySection = params.get("section");

      if (querySection && this.sectionNames[querySection]) {
        return querySection;
      }

      const hash = window.location.hash.replace(/^#/, "");

      if (this.sectionNames[hash]) {
        return hash;
      }

      return "home";
    },

    bindMenuLinks: function () {
      document.querySelectorAll(
        "a[data-page], a[data-section], a[data-navigate]"
      ).forEach((element) => {
        if (element.dataset.navigationBound === "true") return;

        element.dataset.navigationBound = "true";

        element.addEventListener("click", (event) => {
          const section =
            element.dataset.section ||
            element.dataset.navigate ||
            element.dataset.page ||
            element.getAttribute("href")?.replace(/^#/, "");

          if (!section || !this.sectionNames[section]) return;

          event.preventDefault();
          this.navigate(section);

          if (typeof window.SHOHIN_MOVIE.closeMenu === "function") {
            window.SHOHIN_MOVIE.closeMenu();
          }
        });
      });
    },

    bindNavigationButtons: function () {
      const backButton = document.querySelector("#backFromDetails");

      if (backButton) {
        backButton.addEventListener("click", () => {
          this.navigate("home");
        });
      }

      document.querySelectorAll("[data-go-home], #homeButton").forEach(
        (button) => {
          button.addEventListener("click", (event) => {
            event.preventDefault();
            this.navigate("home");
          });
        }
      );
    },

    bindBrowserHistory: function () {
      window.addEventListener("popstate", () => {
        this.navigate(this.getSectionFromURL(), false);
      });

      window.addEventListener("hashchange", () => {
        const hash = window.location.hash.replace(/^#/, "");

        if (this.sectionNames[hash]) {
          this.navigate(hash, false);
        }
      });
    },

    navigate: function (section, updateURL = true) {
      if (!this.sectionNames[section]) {
        section = "home";
      }

      this.currentSection = section;

      // Переключаем только настоящие страницы.
      document.querySelectorAll("[data-page-content]").forEach((page) => {
        const active = page.dataset.pageContent === section;

        page.hidden = !active;
        page.classList.toggle("active", active);
        page.setAttribute("aria-hidden", active ? "false" : "true");
      });

      // Активное состояние ссылок меню.
      document.querySelectorAll(
        ".menu-navigation a, a[data-section], a[data-navigate]"
      ).forEach((link) => {
        const linkSection =
          link.dataset.section ||
          link.dataset.navigate ||
          link.dataset.page ||
          link.getAttribute("href")?.replace(/^#/, "");

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
        url.hash = section;

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
        section === "home"
          ? "SHOHIN MOVIE"
          : title + " — SHOHIN MOVIE";

      document.querySelectorAll(
        "[data-page-title], #pageTitle"
      ).forEach((element) => {
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
          if (typeof cards.renderInto === "function") {
            cards.renderInto(container, items || [], type);
          }
        });

        if (typeof cards.bindCardEvents === "function") {
          cards.bindCardEvents();
        }
      };

      switch (section) {
        case "movies":
          if (typeof data.getMovies === "function") {
            renderList("#moviesGrid", data.getMovies(), "movie");
          }
          break;

        case "series":
          if (typeof data.getSeries === "function") {
            renderList("#seriesGrid", data.getSeries(), "series");
          }
          break;

        case "actors":
          if (typeof data.getActors === "function") {
            renderList("#actorsGrid", data.getActors(), "actor");
          }
          break;

        case "favorites":
          if (storage && typeof storage.getSavedItems === "function") {
            renderList(
              "#favoritesGrid",
              storage.getSavedItems(),
              "movie"
            );
          }
          break;

        case "history":
          if (storage && typeof storage.getHistoryItems === "function") {
            renderList(
              "#historyGrid",
              storage.getHistoryItems(),
              "movie"
            );
          }
          break;

        case "home":
          if (typeof cards.renderCatalog === "function") {
            cards.renderCatalog();
          }
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
  }, { once: true });

  if (document.readyState !== "loading") {
    Navigation.init();
  }
})();