const lookBookContainers = document.querySelectorAll('.js-lookbook');

lookBookContainers.forEach(lookbookNode => {
  new LookBook(lookbookNode);
});