import ArticleImageResource from "./ArticleImageResource";

export default class ArticleResource {
    collection(articles: any[]): object[] {
        return articles.map((article) => {
            return this.transform(article);
        });
    }

    get(article: any): object {
        return this.transform(article);
    }

    transform(article: any): object {
        return {
            id: article.id,
            slug: article.slug,
            title: article.title,
            content: article.content,
            images: article.images ? new ArticleImageResource().collection(article.images) : [],
            createdAt: article.createdAt,
        };
    }
}
