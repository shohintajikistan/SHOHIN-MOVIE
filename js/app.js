/* ==========================================
   SHOHIN MOVIE
   FILE: js/app.js
   Главный запуск приложения
   ========================================== */

"use strict";

window.SHOHIN_MOVIE = window.SHOHIN_MOVIE || {};

(function () {
  const App = {
    version: "1.0.0",
    started: false,

    init: function () {
      if (this.started) return;

      this.started = true;

      document.addEventListener("DOMContentLoaded", () => {
        this.start();
      });

      if (document.readyState !== "loading") {
        this.start();
      }
    },

    start: function () {
      this.setCurrentYear();
      this.setupMenuButton();
      this.setupSearchButton();
      this.setupBackToTop();
      this.setupKeyboard();
      this.setupFooter();
      this.loadCatalog();
    },

    setCurrentYear: function () {
      const yearElements = document.querySelectorAll(
        "[data-current-year], #currentYear"
      );

      yearElements.forEach(function (element) {
        element.textContent = new Date().getFullYear();
      });
    },

    setupMenuButton: function () {
      const menuButton = document.querySelector(
        "#menuButton, #menuToggle, [data-menu-toggle]"
      );

      const menu = document.querySelector(
        "#sideMenu, #side-menu, .side-menu"
      );

      const overlay = document.querySelector(
        "#menuOverlay, #menu-overlay, .menu-overlay"
      );

      if (!menuButton || !menu) return;

      const closeMenu = function () {
        menu.classList.remove("active", "open", "show");
        menuButton.classList.remove("active");
        menuButton.setAttribute("aria-expanded", "false");

        if (overlay) {
          overlay.classList.remove("active", "show");
          overlay.setAttribute("aria-hidden", "true");
        }

        document.body.classList.remove("menu-open");
      };

      const openMenu = function () {
        menu.classList.add("active");
        menuButton.classList.add("active");
        menuButton.setAttribute("aria-expanded", "true");

        if (overlay) {
          overlay.classList.add("active");
          overlay.setAttribute("aria-hidden", "false");
        }

        document.body.classList.add("menu-open");
      };

      menuButton.setAttribute("aria-expanded", "false");

      menuButton.addEventListener("click", function () {
        const isOpen = menu.classList.contains("active");

        if (isOpen) {
          closeMenu();
        } else {
          openMenu();
        }
      });

      if (overlay) {
        overlay.addEventListener("click", closeMenu);
      }

      menu.querySelectorAll("a, button").forEach(function (item) {
        item.addEventListener("click", function () {
          if (item.dataset.keepMenuOpen !== "true") {
            closeMenu();
          }
        });
      });

      window.SHOHIN_MOVIE.closeMenu = closeMenu;
      window.SHOHIN_MOVIE.openMenu = openMenu;
    },

    setupSearchButton: function () {
      const searchInput = document.querySelector(
        "#searchInput, #search-input, [data-search-input]"
      );

      const searchButton = document.querySelector(
        "#searchButton, #search-button, [data-search-button]"
      );

      if (!searchInput) return;

      if (searchButton) {
        searchButton.addEventListener("click", function () {
          searchInput.dispatchEvent(
            new Event("input", { bubbles: true })
          );

          if (typeof window.searchCatalog === "function") {
            window.searchCatalog(searchInput.value.trim());
          }
        });
      }

      searchInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
          event.preventDefault();

          if (typeof window.searchCatalog === "function") {
            window.searchCatalog(searchInput.value.trim());
          }
        }
      });
    },

    setupBackToTop: function () {
      const button = document.querySelector(
        "#backToTop, #back-to-top, [data-back-to-top]"
      );

      if (!button) return;

      button.addEventListener("click", function () {
        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      });

      const updateButton = function () {
        button.hidden = window.scrollY < 400;
      };

      window.addEventListener("scroll", updateButton, {
        passive: true
      });

      updateButton();
    },

    setupKeyboard: function () {
      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") {
          if (typeof window.SHOHIN_MOVIE.closeMenu === "function") {
            window.SHOHIN_MOVIE.closeMenu();
          }

          const modal = document.querySelector(
            ".modal.active, .modal.open, [role='dialog'].active"
          );

          if (modal) {
            modal.classList.remove("active", "open");
          }
        }

        if (
          (event.ctrlKey || event.metaKey) &&
          event.key.toLowerCase() === "k"
        ) {
          const searchInput = document.querySelector(
            "#searchInput, #search-input, [data-search-input]"
          );

          if (searchInput) {
            event.preventDefault();
            searchInput.focus();
          }
        }
      });
    },

    setupFooter: function () {
      const footer = document.querySelector(
        "#appFooter, #footer, footer"
      );

      if (!footer) return;

      const year = footer.querySelector(
        "#currentYear, [data-current-year]"
      );

      if (year) {
        year.textContent = new Date().getFullYear();
      }
    },

    loadCatalog: async function () {
      this.showLoading();

      try {
        if (typeof window.loadCatalogData === "function") {
          await window.loadCatalogData();
        }

        if (typeof window.renderCatalog === "function") {
          window.renderCatalog();
        }

        document.dispatchEvent(
          new CustomEvent("shohin:catalog-ready")
        );
      } catch (error) {
        console.error("SHOHIN MOVIE: ошибка загрузки каталога.", error);
        this.showError(
          "Не удалось загрузить каталог. Проверь файлы JSON и пути к ним."
        );
      } finally {
        this.hideLoading();
      }
    },

    showLoading: function () {
      const loader = document.querySelector(
        "#appLoader, #loadingScreen, [data-app-loader]"
      );

      if (loader) {
        loader.hidden = false;
        loader.classList.remove("hidden");
        loader.setAttribute("aria-hidden", "false");
      }
    },

    hideLoading: function () {
      const loader = document.querySelector(
        "#appLoader, #loadingScreen, [data-app-loader]"
      );

      if (loader) {
        loader.classList.add("hidden");
        loader.setAttribute("aria-hidden", "true");

        window.setTimeout(function () {
          loader.hidden = true;
        }, 500);
      }
    },

    showError: function (message) {
      const errorBox = document.querySelector(
        "#errorMessage, #error-message, [data-error-message]"
      );

      if (errorBox) {
        errorBox.textContent = message;
        errorBox.hidden = false;
        return;
      }

      console.error(message);
    }
  };

  window.SHOHIN_MOVIE.App = App;

  window.addEventListener("DOMContentLoaded", function () {
    App.start();
  });

  if (document.readyState !== "loading") {
    App.start();
  }
})();