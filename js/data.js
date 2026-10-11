/* ==========================================
   SHOHIN MOVIE
   FILE: js/data.js
   Загрузка и управление каталогом
   SHOHIN BRAND COLORS — НЕ МЕНЯТЬ
   ========================================== */

"use strict";

(function () {
  window.SHOHIN_MOVIE = window.SHOHIN_MOVIE || {};

  /*
   * ВАЖНО:
   * Сайт работает в корне репозитория SHOHIN-MOVIE.
   * Относительный путь "./" сохраняет правильный адрес
   * и на GitHub Pages, и при открытии в подпапке проекта.
   */
  const BASE_PATH = new URL("./", window.location.href);

  const CONFIG = {
    actors: "data/actors.json",
    genres: "data/genres.json",
    countries: "data/countries.json",

    movieYears: [
      1960, 1970, 1980, 1981, 1990, 2000,
      2020, 2021, 2022, 2023, 2024, 2025, 2026
    ],

    seriesYears: [
      1960, 1970, 1980, 1981, 1990, 2000,
      2020, 2021, 2022, 2023, 2024, 2025, 2026
    ]
  };

  const CatalogData = {
    movies: [],
    series: [],
    actors: [],
    genres: [],
    countries: [],

    loaded: false,
    loading: false,
    errors: [],

    getFileUrl: function (path) {
      return new URL(path, BASE_PATH).href;
    },

    async fetchJSON(path, optional = false) {
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
          url: url,
          message: error.message
        });

        if (optional) {
          return [];
        }

        throw error;
      }
    },

    async loadCatalog() {
      if (this.loading) {
        while (this.loading) {
          await new Promise(function (resolve) {
            setTimeout(resolve, 50);
          });
        }

        return this;
      }

      if (this.loaded) {
        return this;
      }

      this.loading = true;
      this.errors = [];
      this.movies = [];
      this.series = [];
      this.actors = [];
      this.genres = [];
      this.countries = [];

      try {
        const basicRequests = await Promise.all([
          this.fetchJSON(CONFIG.actors, true),
          this.fetchJSON(CONFIG.genres, true),
          this.fetchJSON(CONFIG.countries, true)
        ]);

        this.actors = basicRequests[0];
        this.genres = basicRequests[1];
        this.countries = basicRequests[2];

        const movieRequests = CONFIG.movieYears.map((year) => {
          return this.fetchJSON(
            "data/movies/" + year + ".json",
            true
          ).then((items) => {
            this.addYear(items, year, "movie");
          });
        });

        const seriesRequests = CONFIG.seriesYears.map((year) => {
          return this.fetchJSON(
            "data/series/" + year + ".json",
            true
          ).then((items) => {
            this.addYear(items, year, "series");
          });
        });

        await Promise.all([
          ...movieRequests,
          ...seriesRequests
        ]);

        this.movies = this.removeDuplicates(this.movies);
        this.series = this.removeDuplicates(this.series);

        this.loaded = true;

        console.log(
          "SHOHIN MOVIE: каталог загружен",
          {
            movies: this.movies.length,
            series: this.series.length,
            actors: this.actors.length,
            genres: this.genres.length,
            countries: this.countries.length,
            errors: this.errors.length
          }
        );

        window.dispatchEvent(
          new CustomEvent("shohin:data-loaded", {
            detail: {
              movies: this.movies.length,
              series: this.series.length,
              actors: this.actors.length,
              errors: this.errors.length
            }
          })
        );

        return this;
      } catch (error) {
        console.error(
          "SHOHIN MOVIE: ошибка загрузки каталога",
          error
        );

        throw error;
      } finally {
        this.loading = false;
      }
    },

    addYear: function (items, year, type) {
      if (!Array.isArray(items)) {
        return;
      }

      const prepared = items.map(function (item) {
        const result = Object.assign({}, item);

        if (
          result.year === undefined ||
          result.year === null ||
          result.year === ""
        ) {
          result.year = year;
        }

        if (!result.type) {
          result.type = type;
        }

        return result;
      });

      if (type === "movie") {
        this.movies.push(...prepared);
      } else if (type === "series") {
        this.series.push(...prepared);
      }
    },

    removeDuplicates: function (items) {
      const seen = new Set();
      const result = [];

      items.forEach(function (item) {
        const title = String(
          item.title ||
          item.name ||
          item.originalTitle ||
          ""
        ).trim().toLowerCase();

        const year = String(item.year || "");

        const uniqueKey = item.id
          ? String(item.id).trim().toLowerCase()
          : title + "|" + year;

        if (!uniqueKey || seen.has(uniqueKey)) {
          return;
        }

        seen.add(uniqueKey);
        result.push(item);
      });

      return result;
    },

    getMovies: function () {
      return this.movies.slice();
    },

    getSeries: function () {
      return this.series.slice();
    },

    getActors: function () {
      return this.actors.slice();
    },

    getGenres: function () {
      return this.genres.slice();
    },

    getCountries: function () {
      return this.countries.slice();
    },

    getMoviesByYear: function (year) {
      return this.movies.filter(function (item) {
        return Number(item.year) === Number(year);
      });
    },

    getSeriesByYear: function (year) {
      return this.series.filter(function (item) {
        return Number(item.year) === Number(year);
      });
    },

    getById: function (id, type) {
      const normalizedId = String(id);

      let items;

      if (type === "series") {
        items = this.series;
      } else if (type === "actor") {
        items = this.actors;
      } else if (type === "movie") {
        items = this.movies;
      } else {
        items = this.movies.concat(this.series);
      }

      return items.find(function (item, index) {
        const itemId = item.id !== undefined &&
          item.id !== null
          ? String(item.id)
          : String(
              (type || item.type || "item") + "-" + index
            );

        const slug = item.slug !== undefined &&
          item.slug !== null
          ? String(item.slug)
          : "";

        return (
          itemId === normalizedId ||
          slug === normalizedId
        );
      }) || null;
    },

    getAllTitles: function () {
      return this.movies.concat(this.series);
    },

    getErrors: function () {
      return this.errors.slice();
    },

    getStats: function () {
      return {
        movies: this.movies.length,
        series: this.series.length,
        actors: this.actors.length,
        genres: this.genres.length,
        countries: this.countries.length,
        errors: this.errors.length,
        loaded: this.loaded
      };
    }
  };

  window.SHOHIN_MOVIE.Data = CatalogData;
  window.SHOHIN_MOVIE.DataConfig = CONFIG;

  window.loadCatalogData = async function () {
    return await CatalogData.loadCatalog();
  };

  window.renderCatalog = function () {
    const cards = window.SHOHIN_MOVIE.Cards;

    if (
      cards &&
      typeof cards.renderCatalog === "function"
    ) {
      cards.renderCatalog();
      return;
    }

    if (typeof window.renderMovieCards === "function") {
      window.renderMovieCards();
    }
  };
})();