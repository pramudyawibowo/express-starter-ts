import type { ArticleImage } from "@prisma/client";

export default class ArticleImageResource {
    collection(articles: ArticleImage[]): object[] {
        return articles.map((article) => {
            return this.transform(article);
        });
    }

    get(article: ArticleImage): object {
        return this.transform(article);
    }

    transform(article: ArticleImage): object {
        return {
            id: article.id,
            articleId: article.articleId,
            url: process.env.APP_URL + "/storage/" + article.path,
        };
    }
}
