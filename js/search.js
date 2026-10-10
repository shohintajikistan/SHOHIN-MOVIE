/* ==========================================
   SHOHIN MOVIE
   FILE: js/search.js
   Поиск и фильтры каталога
   SHOHIN BRAND COLORS — НЕ МЕНЯТЬ
   ========================================== */

"use strict";

(function () {
  window.SHOHIN_MOVIE = window.SHOHIN_MOVIE || {};

  const Search = {
    query: "",
    type: "all",
    filters: {
      year: "",
      country: "",
      genre: "",
      minRating: ""
    },

    init: function () {
      this.bindSearchInputs();
      this.bindSearchButtons();
      this.bindFilters();
      this.bindResetButtons();
    },

    getData: function () {
      return window.SHOHIN_MOVIE.Data || null;
    },

    normalize: function (value) {
      return String(value == null ? "" : value)
        .toLocaleLowerCase("ru")
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/ё/g, "е");
    },

    getItemText: function (item) {
      const values = [
        item.title,
        item.name,
        item.originalTitle,
        item.ruTitle,
        item.description,
        item.overview,
        item.plot,
        item.country,
        item.countries,
        item.genre,
        item.genres,
        item.actors,
        item.cast,
        item.director
      ];

      return this.normalize(
        values
          .filter(Boolean)
          .map(function (value) {
            return Array.isArray(value)
              ? value.join(" ")
              : value;
          })
          .join(" ")
      );
    },

    getList: function () {
      const data = this.getData();

      if (!data) return [];

      if (this.type === "movies") {
        return data.getMovies();
      }

      if (this.type === "series") {
        return data.getSeries();
      }

      if (this.type === "actors") {
        return data.getActors();
      }

      return [
        ...data.getMovies(),
        ...data.getSeries(),
        ...data.getActors()
      ];
    },

    matchesFilters: function (item) {
      const year = Number(item.year || item.releaseYear || 0);

      if (
        this.filters.year &&
        year !== Number(this.filters.year)
      ) {
        return false;
      }

      const countryValue =
        item.country || item.countries || "";

      const country = this.normalize(
        Array.isArray(countryValue)
          ? countryValue.join(" ")
          : countryValue
      );

      if (
        this.filters.country &&
        !country.includes(this.normalize(this.filters.country))
      ) {
        return false;
      }

      const genreValue = item.genres || item.genre || [];

      const genre = this.normalize(
        Array.isArray(genreValue)
          ? genreValue.join(" ")
          : genreValue
      );

      if (
        this.filters.genre &&
        !genre.includes(this.normalize(this.filters.genre))
      ) {
        return false;
      }

      if (this.filters.minRating !== "") {
        const rating = Number(
          item.rating || item.imdbRating || item.score || 0
        );

        if (rating < Number(this.filters.minRating)) {
          return false;
        }
      }

      return true;
    },

    search: function (query = "") {
      this.query = String(query || "").trim();

      const normalizedQuery = this.normalize(this.query);

      const results = this.getList().filter((item) => {
        const matchesQuery =
          !normalizedQuery ||
          this.getItemText(item).includes(normalizedQuery);

        return matchesQuery && this.matchesFilters(item);
      });

      this.renderResults(results);

      document.dispatchEvent(
        new CustomEvent("shohin:search-results", {
          detail: {
            query: this.query,
            type: this.type,
            count: results.length,
            results: results
          }
        })
      );

      return results;
    },

    renderResults: function (results) {
      const cards = window.SHOHIN_MOVIE.Cards;

      const containers = document.querySelectorAll(
        "#searchResults, #searchResultsGrid, [data-search-results]"
      );

      if (!cards || !containers.length) return;

      containers.forEach((container) => {
        cards.renderInto(
          container,
          results,
          this.type === "actors" ? "actor" :
          this.type === "series" ? "series" : "movie"
        );
      });

      cards.bindCardEvents();

      const countElements = document.querySelectorAll(
        "#searchResultCount, [data-search-result-count]"
      );

      countElements.forEach((element) => {
        element.textContent = String(results.length);
      });

      const emptyElements = document.querySelectorAll(
        "#searchEmpty, [data-search-empty]"
      );

      emptyElements.forEach((element) => {
        element.hidden = results.length > 0;
      });
    },

    bindSearchInputs: function () {
      const inputs = document.querySelectorAll(
        "#searchInput, #search-input, [data-search-input]"
      );

      inputs.forEach((input) => {
        input.addEventListener("input", () => {
          this.search(input.value);
        });
      });
    },

    bindSearchButtons: function () {
      const buttons = document.querySelectorAll(
        "#searchButton, #search-button, [data-search-button]"
      );

      buttons.forEach((button) => {
        button.addEventListener("click", () => {
          const input = document.querySelector(
            "#searchInput, #search-input, [data-search-input]"
          );

          this.search(input ? input.value : "");
        });
      });
    },

    bindFilters: function () {
      const filterSelectors = {
        year: "#yearFilter, [data-filter='year']",
        country: "#countryFilter, [data-filter='country']",
        genre: "#genreFilter, [data-filter='genre']",
        minRating: "#ratingFilter, [data-filter='rating']"
      };

      Object.entries(filterSelectors).forEach(([key, selector]) => {
        document.querySelectorAll(selector).forEach((element) => {
          element.addEventListener("change", () => {
            this.filters[key] = element.value;
            this.search(this.query);
          });
        });
      });
    },

    bindResetButtons: function () {
      document.querySelectorAll(
        "#resetFilters, [data-reset-filters]"
      ).forEach((button) => {
        button.addEventListener("click", () => {
          this.resetFilters();
        });
      });
    },

    resetFilters: function () {
      this.filters = {
        year: "",
        country: "",
        genre: "",
        minRating: ""
      };

      document.querySelectorAll(
        "#yearFilter, [data-filter='year'], " +
        "#countryFilter, [data-filter='country'], " +
        "#genreFilter, [data-filter='genre'], " +
        "#ratingFilter, [data-filter='rating']"
      ).forEach((element) => {
        element.value = "";
      });

      this.search(this.query);
    },

    setType: function (type) {
      const allowedTypes = ["all", "movies", "series", "actors"];

      this.type = allowedTypes.includes(type) ? type : "all";
      this.search(this.query);
    },

    setFilter: function (name, value) {
      if (!Object.prototype.hasOwnProperty.call(this.filters, name)) {
        return [];
      }

      this.filters[name] = value;
      return this.search(this.query);
    }
  };

  window.SHOHIN_MOVIE.Search = Search;

  window.searchCatalog = function (query) {
    return Search.search(query);
  };

  window.setCatalogType = function (type) {
    Search.setType(type);
  };

  document.addEventListener("DOMContentLoaded", function () {
    Search.init();
  });

  if (document.readyState !== "loading") {
    Search.init();
  }
})();