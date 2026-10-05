// SHOHIN MOVIE — CARD SYSTEM

const SHOHIN_MOVIE = {

  currentType: "movies",
  currentYear: 1980,
  movies: [],
  series: [],

  get currentItems() {
    return this.currentType === "movies"
      ? this.movies
      : this.series;
  }

};