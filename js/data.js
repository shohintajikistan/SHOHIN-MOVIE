/* ==========================================
   SHOHIN MOVIE
   FILE: js/data.js
   Загрузка каталога из JSON-файлов
   ========================================== */

"use strict";

(function () {
  const BASE_PATH = new URL("../", window.location.href);

  const CONFIG = {
    actors: "data/actors.json",
    genres: "data/genres.json",
    countries: "data/countries.json",

    movieYears: [
      1960,
      1970,
      1980,
      1981,
      1990,
      2000,
      2020,
      2021,
      2022,
      2023,
      2024,
      2025,
      2026
    ],

    seriesYears: [
      1960,
      1970,
      1980,
      1981,
      1990,
      2000,
      2020,
      2021,
      2022,
      2023,
      2024,
      2025,
      2026
    ]
  };

  const CatalogData = {
    movies: [],
    series: [],
    actors: [],
    genres: [],
    countries: [],
    loaded: false,
    errors: [],

    getFileUrl: function (path) {
      return new URL(path, BASE_PATH).href;
    },

    async fetchJSON: async function (path, optional = false) {
      const url = this.getFileUrl(path);

      try {
        const response = await fetch(url, {
          cache: "no-cache"
        });

        if (!response.ok) {
          throw new Error(
            "HTTP " + response.status + " — " + path
          );
        }

        const result = await response.json();

        if (!Array.isArray(result)) {
          throw new Error(
            "JSON должен содержать массив []: " + path
          );
        }

        return result;
      } catch (error) {
        console.error(
          "SHOHIN MOVIE: не удалось загрузить " + path,
          error
        );

        this.errors.push({
          file: path,
          message: error.message
        });

        if (optional) {
          return [];
        }

        throw error;
      }
    },

    async loadCatalog: async function () {
      this.errors = [];

      const requests = [
        this.fetchJSON(CONFIG.actors, true),
        this.fetchJSON(CONFIG.genres, true),
        this.fetchJSON(CONFIG.countries, true)
      ];

      const movieRequests = CONFIG.movieYears.map((year) =>
        this.fetchJSON("data/movies/" + year + ".json", true)
          .then((items) => this.addYear(items, year, "movie"))
      );

      const seriesRequests = CONFIG.seriesYears.map((year) =>
        this.fetchJSON("data/series/" + year + ".json", true)
          .then((items) => this.addYear(items, year, "series"))
      );

      const results = await Promise.all([
        ...requests,
        ...movieRequests,
        ...seriesRequests
      ]);

      this.actors = results[0];
      this.genres = results[1];
      this.countries = results[2];

      this.movies = this.removeDuplicates(this.movies);
      this.series = this.removeDuplicates(this.series);

      this.loaded = true;

      window.dispatchEvent(
        new CustomEvent("shohin:data-loaded", {
          detail: {
            movies: this.movies.length,
            series: this.series.length,
            actors: this.actors.length
          }
        })
      );

      return this;
    },

    addYear: function (items, year, type) {
      const prepared = items.map((item) => {
        return {
          ...item,
          year: item.year || year,
          type: item.type || type
        };
      });

      if (type === "movie") {
        this.movies.push(...prepared);
      } else {
        this.series.push(...prepared);
      }
    },

    removeDuplicates: function (items) {
      const seen = new Set();

      return items.filter((item) => {
        const key = String(
          item.id ||
          item.slug ||
          (
            (item.title || item.name || "").trim().toLowerCase() +
            "-" +
            (item.year || "")
          )
        );

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      });
    },

    getMovies: function () {
      return [...this.movies];
    },

    getSeries: function () {
      return [...this.series];
    },

    getActors: function () {
      return [...this.actors];
    },

    getGenres: function () {
      return [...this.genres];
    },

    getCountries: function () {
      return [...this.countries];
    },

    getMoviesByYear: function (year) {
      return this.movies.filter(
        (item) => Number(item.year) === Number(year)
      );
    },

    getSeriesByYear: function (year) {
      return this.series.filter(
        (item) => Number(item.year) === Number(year)
      );
    },

    getById: function (id, type) {
      const list =
        type === "series"
          ? this.series
          : type === "actor"
            ? this.actors
            : this.movies;

      return list.find(
        (item) => String(item.id) === String(id)
      ) || null;
    },

    getAllTitles: function () {
      return [
        ...this.movies,
        ...this.series
      ];
    }
  };

  window.SHOHIN_MOVIE = window.SHOHIN_MOVIE || {};
  window.SHOHIN_MOVIE.Data = CatalogData;
  window.SHOHIN_MOVIE.DataConfig = CONFIG;

  /*
   * Эти функции вызываются главным файлом app.js.
   */

  window.loadCatalogData = async function () {
    return await CatalogData.loadCatalog();
  };

  window.renderCatalog = function () {
    if (
      window.SHOHIN_MOVIE.Cards &&
      typeof window.SHOHIN_MOVIE.Cards.renderCatalog === "function"
    ) {
      window.SHOHIN_MOVIE.Cards.renderCatalog();
      return;
    }

    if (typeof window.renderMovieCards === "function") {
      window.renderMovieCards();
    }
  };
})();