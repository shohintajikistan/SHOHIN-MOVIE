// SHOHIN MOVIE — FILTERS
// SHOHIN BRAND COLORS — НЕ МЕНЯТЬ

let activeFilter = "all";


/* ==================================================
   SET FILTER
================================================== */

function setFilter(filter) {

  activeFilter =
    filter || "all";


  /*
   * Если основной каталог открыт —
   * сразу обновляем карточки.
   */

  if (
    typeof renderCatalog === "function"
  ) {

    renderCatalog();

  }

}


/* ==================================================
   RESET FILTER
================================================== */

function resetFilters() {

  activeFilter = "all";


  if (
    typeof renderCatalog === "function"
  ) {

    renderCatalog();

  }

}


/* ==================================================
   RATING — HIGH TO LOW
================================================== */

function sortByRating(items) {

  if (!Array.isArray(items)) {

    return [];

  }


  return [...items].sort(
    (a, b) => {

      return (
        Number(b.rating || 0) -
        Number(a.rating || 0)
      );

    }
  );

}


/* ==================================================
   YEAR — NEW TO OLD
================================================== */

function sortByYear(items) {

  if (!Array.isArray(items)) {

    return [];

  }


  return [...items].sort(
    (a, b) => {

      return (
        Number(b.year || 0) -
        Number(a.year || 0)
      );

    }
  );

}


/* ==================================================
   TITLE — A TO Z
================================================== */

function sortByTitle(items) {

  if (!Array.isArray(items)) {

    return [];

  }


  return [...items].sort(
    (a, b) => {

      const titleA =
        String(
          a.title || ""
        );


      const titleB =
        String(
          b.title || ""
        );


      return titleA.localeCompare(
        titleB,
        "ru",
        {
          sensitivity:
            "base"
        }
      );

    }
  );

}


/* ==================================================
   FILTER BY RATING
================================================== */

function filterByRating(
  minRating
) {

  const items =
    SHOHIN_MOVIE.currentItems ||
    [];


  const minimum =
    Number(
      minRating || 0
    );


  const filtered =
    items.filter(
      item =>
        Number(
          item.rating || 0
        ) >= minimum
    );


  if (
    typeof renderFilteredItems ===
    "function"
  ) {

    renderFilteredItems(
      filtered
    );

  }


  return filtered;

}


/* ==================================================
   FILTER BY YEAR
================================================== */

function filterByYear(
  year
) {

  const items =
    SHOHIN_MOVIE.currentItems ||
    [];


  if (
    !year ||
    year === "all"
  ) {

    if (
      typeof renderCatalog ===
      "function"
    ) {

      renderCatalog();

    }

    return items;

  }


  const selectedYear =
    Number(year);


  const filtered =
    items.filter(
      item =>
        Number(
          item.year
        ) === selectedYear
    );


  if (
    typeof renderFilteredItems ===
    "function"
  ) {

    renderFilteredItems(
      filtered
    );

  }


  return filtered;

}


/* ==================================================
   FILTER BY COUNTRY
================================================== */

function filterMoviesByCountry(
  country
) {

  if (
    typeof filterByCountry ===
    "function"
  ) {

    return filterByCountry(
      country
    );

  }

}


/* ==================================================
   FILTER BY GENRE
================================================== */

function filterMoviesByGenre(
  genre
) {

  if (
    typeof filterByGenre ===
    "function"
  ) {

    return filterByGenre(
      genre
    );

  }

}


/* ==================================================
   GET AVAILABLE YEARS
================================================== */

function getAvailableYears(
  items
) {

  if (!Array.isArray(items)) {

    return [];

  }


  const years =
    new Set();


  items.forEach(
    item => {

      const year =
        Number(
          item.year
        );


      if (year) {

        years.add(
          year
        );

      }

    }
  );


  return [...years].sort(
    (a, b) =>
      b - a
  );

}


/* ==================================================
   GET RATING RANGE
================================================== */

function getRatingRange(
  items
) {

  if (!Array.isArray(items)) {

    return {
      min: 0,
      max: 0
    };

  }


  const ratings =
    items
      .map(
        item =>
          Number(
            item.rating
          )
      )
      .filter(
        rating =>
          !Number.isNaN(
            rating
          ) &&
          rating > 0
      );


  if (!ratings.length) {

    return {
      min: 0,
      max: 0
    };

  }


  return {

    min:
      Math.min(
        ...ratings
      ),

    max:
      Math.max(
        ...ratings
      )

  };

}


/* ==================================================
   CLEAR FILTERS
================================================== */

function clearAllFilters() {

  activeFilter =
    "all";


  const searchInput =
    document.getElementById(
      "searchInput"
    );


  if (searchInput) {

    searchInput.value =
      "";

  }


  if (
    typeof renderCatalog ===
    "function"
  ) {

    renderCatalog();

  }

}