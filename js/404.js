const backLink = document.querySelector("#error404-back");

backLink?.addEventListener("click", (event) => {
  if (window.history.length <= 1) return;

  event.preventDefault();
  window.history.back();
});
