// SHOHIN MOVIE — FILTERS

let activeFilter = "all";

function setFilter(filter) {
  activeFilter = filter;

  document
    .querySelectorAll(".filter-button")
    .forEach(button => {
      button.classList.toggle(
        "active",
        button.dataset.filter === filter
      );
    });

  if (typeof renderMovies === "function") {
    renderMovies();
  }
}

document.addEventListener("click", event => {

  const button = event.target.closest(".filter-button");

  if (!button) return;

  setFilter(button.dataset.filter);

});