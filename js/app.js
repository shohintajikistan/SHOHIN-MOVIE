/* SHOHIN MOVIE — NAVIGATION
Меню, переходы между страницами и кнопка «Назад».
*/

(function () {
"use strict";

const Navigation = {
initialized: false,

pageNames: {
  home: "Главная",
  movies: "Фильмы",
  series: "Сериалы",
  actors: "Актёры",
  countries: "Страны",
  genres: "Жанры",
  years: "Годы",
  favorites: "Избранное",
  history: "Недавно открытые",
  details: "Информация",
  settings: "Настройки",
  about: "О SHOHIN MOVIE"
},

getMenu() {
  return document.querySelector(
    "#sideMenu, #side-menu, .side-menu"
  );
},

getOverlay() {
  return document.querySelector(
    "#menuOverlay, #menu-overlay, .menu-overlay"
  );
},

getMenuButton() {
  return document.querySelector(
    "#menuButton, #menuToggle, [data-menu-toggle]"
  );
},

getCloseButton() {
  return document.querySelector(
    "#closeMenuButton, #closeMenu, [data-menu-close]"
  );
},

openMenu() {
  const menu = this.getMenu();
  const overlay = this.getOverlay();
  const button = this.getMenuButton();

  if (!menu) {
    console.error(
      "SHOHIN MOVIE: не найден элемент #sideMenu."
    );
    return;
  }

  menu.classList.add("active", "open");
  menu.setAttribute("aria-hidden", "false");

  if (overlay) {
    overlay.classList.add("active", "open");
    overlay.hidden = false;
    overlay.setAttribute("aria-hidden", "false");
  }

  if (button) {
    button.setAttribute("aria-expanded", "true");
  }

  document.body.classList.add("menu-open");
},

closeMenu() {
  const menu = this.getMenu();
  const overlay = this.getOverlay();
  const button = this.getMenuButton();

  if (menu) {
    menu.classList.remove("active", "open");
    menu.setAttribute("aria-hidden", "true");
  }

  if (overlay) {
    overlay.classList.remove("active", "open");
    overlay.setAttribute("aria-hidden", "true");
    overlay.hidden = true;
  }

  if (button) {
    button.setAttribute("aria-expanded", "false");
  }

  document.body.classList.remove("menu-open");
},

toggleMenu() {
  const menu = this.getMenu();

  if (
    menu &&
    (
      menu.classList.contains("active") ||
      menu.classList.contains("open")
    )
  ) {
    this.closeMenu();
  } else {
    this.openMenu();
  }
},

getPageName(element) {
  if (!element) return "";

  let name = element.dataset.page || "";

  if (!name) {
    const href = element.getAttribute("href") || "";

    if (href.startsWith("#")) {
      name = href.slice(1);
    }
  }

  const aliases = {
    homePage: "home",
    moviesPage: "movies",
    seriesPage: "series",
    actorsPage: "actors",
    countriesPage: "countries",
    genresPage: "genres",
    yearsPage: "years",
    favoritesPage: "favorites",
    historyPage: "history",
    detailsPage: "details",
    settingsPage: "settings",
    aboutPage: "about"
  };

  return aliases[name] || name;
},

getPages() {
  return Array.from(
    document.querySelectorAll("[data-page-content]")
  );
},

showPage(pageName, updateAddress = true) {
  if (!pageName) return;

  const pages = this.getPages();

  const target = pages.find(function (page) {
    return page.dataset.pageContent === pageName;
  });

  if (!target) {
    console.warn(
      "SHOHIN MOVIE: страница не найдена:",
      pageName
    );
    return;
  }

  pages.forEach(function (page) {
    const active =
      page.dataset.pageContent === pageName;

    page.hidden = !active;
    page.classList.toggle("active", active);
    page.classList.toggle("is-active", active);
    page.setAttribute(
      "aria-hidden",
      active ? "false" : "true"
    );
  });

  document.querySelectorAll("a[data-page]").forEach(
    function (link) {
      const active =
        link.dataset.page === pageName;

      link.classList.toggle("active", active);

      if (active) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    }
  );

  const title = document.querySelector(
    "[data-page-title], #pageTitle"
  );

  if (title && this.pageNames[pageName]) {
    title.textContent = this.pageNames[pageName];
  }

  this.closeMenu();

  if (updateAddress) {
    const newHash = "#" + pageName;

    if (window.location.hash !== newHash) {
      window.history.pushState(
        { page: pageName },
        "",
        newHash
      );
    }
  }

  window.dispatchEvent(
    new CustomEvent("shohin:page-changed", {
      detail: { page: pageName }
    })
  );

  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
},

bindEvents() {
  const self = this;

  /*
   * Обработчик меню.
   * Предотвращаем двойное переключение кнопки.
   */
  document.addEventListener("click", function (event) {
    const openButton = event.target.closest(
      "#menuButton, #menuToggle, [data-menu-toggle]"
    );

    if (openButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      self.toggleMenu();
      return;
    }

    const closeButton = event.target.closest(
      "#closeMenuButton, #closeMenu, [data-menu-close]"
    );

    if (closeButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      self.closeMenu();
      return;
    }

    const overlay = self.getOverlay();

    if (overlay && event.target === overlay) {
      self.closeMenu();
      return;
    }

    const pageLink = event.target.closest(
      "a[data-page], [data-page-link]"
    );

    if (pageLink) {
      const pageName = self.getPageName(pageLink);

      if (pageName) {
        event.preventDefault();
        self.showPage(pageName);
      }
    }
  }, true);

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      self.closeMenu();
    }
  });

  window.addEventListener("popstate", function () {
    const pageName =
      window.location.hash.replace(/^#/, "") || "home";

    self.showPage(pageName, false);
  });

  window.addEventListener("hashchange", function () {
    const pageName =
      window.location.hash.replace(/^#/, "") || "home";

    self.showPage(pageName, false);
  });
},

init() {
  if (this.initialized) return;

  this.initialized = true;
  this.bindEvents();

  const initialPage =
    window.location.hash.replace(/^#/, "") || "home";

  const pages = this.getPages();

  if (pages.length > 0) {
    const validPage = pages.some(function (page) {
      return page.dataset.pageContent === initialPage;
    });

    this.showPage(
      validPage ? initialPage : "home",
      false
    );
  }

  this.closeMenu();

  console.log("SHOHIN MOVIE: навигация запущена.");
}

};

window.SHOHIN_MOVIE = window.SHOHIN_MOVIE || {};
window.SHOHIN_MOVIE.Navigation = Navigation;

if (document.readyState === "loading") {
document.addEventListener(
"DOMContentLoaded",
function () {
Navigation.init();
},
{ once: true }
);
} else {
Navigation.init();
}
})();