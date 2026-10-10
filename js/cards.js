/* SHOHIN MOVIE — CARD SYSTEM /
/ SHOHIN BRAND COLORS — НЕ МЕНЯТЬ */

(function () {
"use strict";

// Безопасное отображение текста
function escapeHTML(value) {
const entities = {
"&": "&",
"<": "<",
">": ">",
'"': """,
"'": "'"
};

return String(value ?? "").replace(/[&<>"']/g, function (char) {
  return entities[char];
});

}

// Уникальный идентификатор фильма
function getMovieId(movie) {
if (movie.id !== undefined && movie.id !== null) {
return String(movie.id);
}

return [
  movie.type || "film",
  movie.year || "",
  movie.originalTitle || movie.title || ""
].join("-").toLowerCase();

}

// Получение избранного
function getFavorites() {
try {
const stored = JSON.parse(
localStorage.getItem("shohin_movie_favorites") || "[]"
);

  return Array.isArray(stored) ? stored : [];
} catch (error) {
  return [];
}

}

// Проверка избранного
function isFavorite(movie) {
const id = getMovieId(movie);

return getFavorites().some(function (item) {
  if (typeof item === "string" || typeof item === "number") {
    return String(item) === id;
  }

  return item && String(item.id) === id;
});

}

// Постер фильма
function getPosterHTML(movie) {
const poster = movie.poster || movie.posterUrl || "";
const title = escapeHTML(movie.title || "Без названия");

if (poster) {
  return `
    <img
      class="movie-poster"
      src="${escapeHTML(poster)}"
      alt="${title}"
      loading="lazy"
      onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
    >

    <div class="poster-placeholder" style="display:none">
      <span>SM</span>
      <strong>${title}</strong>
    </div>
  `;
}

return `
  <div class="poster-placeholder">
    <span>SM</span>
    <strong>${title}</strong>
  </div>
`;

}

// Карточка фильма
function getMovieCardHTML(movie, index) {
const id = getMovieId(movie);
const title = escapeHTML(movie.title || "Без названия");
const year = escapeHTML(movie.year || "—");
const country = escapeHTML(
movie.country || "Страна не указана"
);

const rating = Number(movie.rating);

const description = escapeHTML(
  movie.description || "Описание фильма скоро появится."
);

const favorite = isFavorite(movie);
const favoriteClass = favorite ? " active" : "";
const favoriteIcon = favorite ? "♥" : "♡";

const safeRating =
  Number.isFinite(rating) && rating > 0
    ? rating.toFixed(1)
    : "";

// JSON.stringify безопаснее для передачи ID в JavaScript-строку.
const safeId = JSON.stringify(id)
  .replace(/</g, "\\u003c")
  .replace(/>/g, "\\u003e")
  .replace(/&/g, "\\u0026");

return `
  <article
    class="movie-card"
    data-movie-id="${escapeHTML(id)}"
    style="animation-delay:${Math.min(index * 25, 250)}ms"
  >
    <div class="movie-poster-wrap">
      <button
        class="poster-open-button"
        type="button"
        aria-label="Открыть фильм: ${title}"
        onclick="openDetail(${safeId})"
        style="position:absolute;inset:0;width:100%;height:100%;background:transparent;z-index:1"
      ></button>

      ${getPosterHTML(movie)}

      ${
        safeRating
          ? `<div class="movie-rating">★ ${safeRating}</div>`
          : ""
      }

      <button
        class="favorite-btn${favoriteClass}"
        type="button"
        aria-label="Добавить в избранное"
        aria-pressed="${favorite}"
        onclick="event.stopPropagation();toggleFavorite(${safeId})"
      >${favoriteIcon}</button>
    </div>

    <div class="movie-info">
      <button
        type="button"
        class="movie-title"
        onclick="openDetail(${safeId})"
        style="display:block;width:100%;padding:0;border:0;background:transparent;text-align:left"
      >${title}</button>

      <div class="movie-meta">
        <span>${year}</span>
        <span>${country}</span>
      </div>

      <p class="movie-description">${description}</p>
    </div>
  </article>
`;

}

// Отображение карточек фильмов
function renderMovieCards(movies, container, options = {}) {
const target =
typeof container === "string"
? document.querySelector(container)
: container;

if (!target) {
  console.warn(
    "SHOHIN MOVIE: контейнер карточек не найден."
  );
  return;
}

if (!Array.isArray(movies) || movies.length === 0) {
  target.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">🎬</div>

      <h3>${escapeHTML(
        options.emptyTitle || "Фильмы пока не найдены"
      )}</h3>

      <p>${escapeHTML(
        options.emptyText ||
        "Попробуйте изменить поиск или фильтры."
      )}</p>
    </div>
  `;

  return;
}

target.innerHTML = movies
  .map(function (movie, index) {
    return getMovieCardHTML(movie, index);
  })
  .join("");

}

// Карточка актёра
function getActorCardHTML(actor) {
const name = escapeHTML(
actor.name || "Неизвестный актёр"
);

const id = JSON.stringify(
  String(actor.id || actor.name || "")
)
  .replace(/</g, "\\u003c")
  .replace(/>/g, "\\u003e")
  .replace(/&/g, "\\u0026");

const photo = actor.photo || actor.image || "";
const filmsCount = Number(actor.filmsCount) || 0;

const photoHTML = photo
  ? `
    <img
      src="${escapeHTML(photo)}"
      alt="${name}"
      loading="lazy"
      onerror="this.remove()"
    >
  `
  : escapeHTML((actor.name || "?").charAt(0));

return `
  <button
    class="actor-card"
    type="button"
    onclick="openActor(${id})"
  >
    <span class="actor-photo">
      ${photoHTML}
    </span>

    <strong>${name}</strong>

    <small>
      ${filmsCount ? filmsCount + " фильмов" : "Актёр"}
    </small>
  </button>
`;

}

// Отображение актёров
function renderActorCards(actors, container) {
const target =
typeof container === "string"
? document.querySelector(container)
: container;

if (!target) {
  console.warn(
    "SHOHIN MOVIE: контейнер актёров не найден."
  );
  return;
}

if (!Array.isArray(actors) || actors.length === 0) {
  target.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">♙</div>

      <h3>Актёры пока не добавлены</h3>

      <p>Список появится после добавления данных.</p>
    </div>
  `;

  return;
}

target.innerHTML = actors
  .map(getActorCardHTML)
  .join("");

}

// Публичные функции SHOHIN MOVIE
window.SHOHINCards = {
escapeHTML: escapeHTML,
getMovieId: getMovieId,
getMovieCardHTML: getMovieCardHTML,
renderMovieCards: renderMovieCards,
getActorCardHTML: getActorCardHTML,
renderActorCards: renderActorCards,
isFavorite: isFavorite
};
})();