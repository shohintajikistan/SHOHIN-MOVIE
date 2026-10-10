/* ==========================================
   SHOHIN MOVIE
   FILE: js/storage.js
   Избранное, история и локальное сохранение
   SHOHIN BRAND COLORS — НЕ МЕНЯТЬ
   ========================================== */

"use strict";

(function () {
  window.SHOHIN_MOVIE = window.SHOHIN_MOVIE || {};

  const KEYS = {
    favorites: "shohin_movie_favorites",
    history: "shohin_movie_history",
    settings: "shohin_movie_settings"
  };

  const Storage = {
    read: function (key, fallback = []) {
      try {
        const value = localStorage.getItem(key);

        if (value === null) {
          return fallback;
        }

        return JSON.parse(value);
      } catch (error) {
        console.error("SHOHIN MOVIE: ошибка чтения хранилища.", error);
        return fallback;
      }
    },

    write: function (key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));

        window.dispatchEvent(
          new CustomEvent("shohin:storage-changed", {
            detail: { key: key }
          })
        );

        return true;
      } catch (error) {
        console.error("SHOHIN MOVIE: не удалось сохранить данные.", error);
        return false;
      }
    },

    createId: function (item) {
      if (!item) return "";

      return String(
        item.id !== undefined && item.id !== null
          ? item.id
          : item.slug || item.title || item.name || ""
      );
    },

    normalizeType: function (type) {
      const value = String(type || "movie").toLowerCase();

      if (
        value === "series" ||
        value === "tv" ||
        value === "serial"
      ) {
        return "series";
      }

      if (
        value === "actor" ||
        value === "person"
      ) {
        return "actor";
      }

      return "movie";
    },

    getFavorites: function (type = null) {
      const favorites = this.read(KEYS.favorites, []);

      if (!Array.isArray(favorites)) {
        return [];
      }

      if (!type) {
        return favorites;
      }

      const normalizedType = this.normalizeType(type);

      return favorites.filter(function (item) {
        return item.type === normalizedType;
      });
    },

    isFavorite: function (id, type = "movie") {
      const normalizedId = String(id);
      const normalizedType = this.normalizeType(type);

      return this.getFavorites().some(function (item) {
        return (
          String(item.id) === normalizedId &&
          item.type === normalizedType
        );
      });
    },

    toggleFavorite: function (id, type = "movie") {
      const normalizedId = String(id);
      const normalizedType = this.normalizeType(type);

      if (!normalizedId) {
        return false;
      }

      const favorites = this.getFavorites();

      const index = favorites.findIndex(function (item) {
        return (
          String(item.id) === normalizedId &&
          item.type === normalizedType
        );
      });

      let added;

      if (index !== -1) {
        favorites.splice(index, 1);
        added = false;
      } else {
        favorites.unshift({
          id: normalizedId,
          type: normalizedType,
          savedAt: Date.now()
        });

        added = true;
      }

      this.write(KEYS.favorites, favorites);

      return added;
    },

    addFavorite: function (item, type = "movie") {
      const id = this.createId(item);

      if (!id) {
        return false;
      }

      if (this.isFavorite(id, type)) {
        return true;
      }

      const favorites = this.getFavorites();

      favorites.unshift({
        id: id,
        type: this.normalizeType(type),
        savedAt: Date.now()
      });

      return this.write(KEYS.favorites, favorites);
    },

    removeFavorite: function (id, type = "movie") {
      const normalizedId = String(id);
      const normalizedType = this.normalizeType(type);

      const favorites = this.getFavorites().filter(function (item) {
        return !(
          String(item.id) === normalizedId &&
          item.type === normalizedType
        );
      });

      return this.write(KEYS.favorites, favorites);
    },

    clearFavorites: function (type = null) {
      if (!type) {
        return this.write(KEYS.favorites, []);
      }

      const normalizedType = this.normalizeType(type);

      const remaining = this.getFavorites().filter(function (item) {
        return item.type !== normalizedType;
      });

      return this.write(KEYS.favorites, remaining);
    },

    getHistory: function (type = null) {
      const history = this.read(KEYS.history, []);

      if (!Array.isArray(history)) {
        return [];
      }

      if (!type) {
        return history;
      }

      const normalizedType = this.normalizeType(type);

      return history.filter(function (item) {
        return item.type === normalizedType;
      });
    },

    addToHistory: function (item, type = "movie") {
      const id = this.createId(item);

      if (!id) {
        return false;
      }

      const normalizedType = this.normalizeType(type);
      const history = this.getHistory().filter(function (entry) {
        return !(
          String(entry.id) === id &&
          entry.type === normalizedType
        );
      });

      history.unshift({
        id: id,
        type: normalizedType,
        openedAt: Date.now()
      });

      // Сохраняем последние 100 открытых карточек.
      return this.write(KEYS.history, history.slice(0, 100));
    },

    removeFromHistory: function (id, type = "movie") {
      const normalizedId = String(id);
      const normalizedType = this.normalizeType(type);

      const history = this.getHistory().filter(function (item) {
        return !(
          String(item.id) === normalizedId &&
          item.type === normalizedType
        );
      });

      return this.write(KEYS.history, history);
    },

    clearHistory: function () {
      return this.write(KEYS.history, []);
    },

    getSettings: function () {
      return this.read(KEYS.settings, {
        theme: "dark",
        language: "ru"
      });
    },

    saveSettings: function (settings) {
      const current = this.getSettings();

      return this.write(KEYS.settings, {
        ...current,
        ...settings
      });
    },

    getSavedItems: function (type = null) {
      const favorites = this.getFavorites(type);
      const data = window.SHOHIN_MOVIE.Data;

      if (!data) {
        return [];
      }

      return favorites
        .map(function (favorite) {
          if (favorite.type === "actor") {
            return data.getActors().find(function (item) {
              return String(item.id || item.slug || item.name) ===
                String(favorite.id);
            });
          }

          if (favorite.type === "series") {
            return data.getSeries().find(function (item) {
              return String(item.id || item.slug || item.title || item.name) ===
                String(favorite.id);
            });
          }

          return data.getMovies().find(function (item) {
            return String(item.id || item.slug || item.title || item.name) ===
              String(favorite.id);
          });
        })
        .filter(Boolean);
    },

    getHistoryItems: function (type = null) {
      const history = this.getHistory(type);
      const data = window.SHOHIN_MOVIE.Data;

      if (!data) {
        return [];
      }

      return history
        .map(function (entry) {
          if (entry.type === "actor") {
            return data.getActors().find(function (item) {
              return String(item.id || item.slug || item.name) ===
                String(entry.id);
            });
          }

          if (entry.type === "series") {
            return data.getSeries().find(function (item) {
              return String(item.id || item.slug || item.title || item.name) ===
                String(entry.id);
            });
          }

          return data.getMovies().find(function (item) {
            return String(item.id || item.slug || item.title || item.name) ===
              String(entry.id);
          });
        })
        .filter(Boolean);
    },

    exportData: function () {
      return {
        version: 1,
        exportedAt: new Date().toISOString(),
        favorites: this.getFavorites(),
        history: this.getHistory(),
        settings: this.getSettings()
      };
    },

    importData: function (data) {
      if (!data || typeof data !== "object") {
        return false;
      }

      const favorites = Array.isArray(data.favorites)
        ? data.favorites
        : [];

      const history = Array.isArray(data.history)
        ? data.history.slice(0, 100)
        : [];

      const settings =
        data.settings && typeof data.settings === "object"
          ? data.settings
          : {};

      const savedFavorites = this.write(KEYS.favorites, favorites);
      const savedHistory = this.write(KEYS.history, history);
      const savedSettings = this.saveSettings(settings);

      return savedFavorites && savedHistory && savedSettings;
    }
  };

  window.SHOHIN_MOVIE.Storage = Storage;
})();