document.addEventListener("DOMContentLoaded", function () {
  fetch("./dist/articles_data.json")
    .then((response) => response.json())
    .then((data) => {
      const gridViewContainer = document.getElementById("gridView");
      data.gridView.forEach((item, index) => {
        const cardClass = index === 0 ? "card--big" : "card--small";
        const card = `
                    <div class="card ${cardClass}">
                        <a href="${item.articleUrl}">
                            <img class="card__img" src="${item.imageUrl}">
                        </a>
                        <span class="card__title">
                            <a href="${item.articleUrl}">
                                ${item.title}
                            </a>
                        </span>
                        <div class="card__meta">
                            ${item.time}
                            <img src="images/svgs/viewings.svg">
                            ${item.views}
                            <img src="images/svgs/comments.svg">
                            ${item.comments}
                        </div>
                    </div>
                `;
        gridViewContainer.innerHTML += card;
      });

      const renderArticles = (articles) => {
        const scrollViewContainer =
          document.querySelector(".scroll-news__list");
        scrollViewContainer.innerHTML = "";
        articles.forEach((item) => {
          const sideCard = `
              <div class="side-card">
                  <span class="side-card__title">
                      <a href="${item.articleUrl}">
                          ${item.title}
                      </a>
                  </span>
                  <div class="side-card__meta">
                      ${item.time}
                      <div class="side-card__meta__vc">
                          <img src="images/svgs/viewings.svg">
                          ${item.views}
                          <img class="side-card__meta--comment" src="images/svgs/comments.svg">
                          ${item.comments}
                      </div>
                  </div>
              </div>
          `;
          scrollViewContainer.innerHTML += sideCard;
        });
      };

      const radioButtons = document.querySelectorAll(
        'input[name="side-button"]'
      );

      function sortArticlesByViews(articles) {
        return articles.slice().sort((a, b) => b.views - a.views);
      }

      radioButtons.forEach((button, index) => {
        button.addEventListener("change", () => {
          if (index === 1) {
            const sortedArticles = sortArticlesByViews(data.scrollView);
            renderArticles(sortedArticles);
          } else {
            renderArticles(data.scrollView);
          }
        });
      });

      renderArticles(data.scrollView);
    })
    .catch((error) => console.error("Error fetching data:", error));
});
