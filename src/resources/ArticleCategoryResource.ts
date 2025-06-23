export default class ArticleCategoryResource {
    collection(articleCategories: any[]): object[] {
        return articleCategories.map((articleCategory) => {
            return this.transform(articleCategory);
        });
    }

    get(articleCategory: any): object {
        return this.transform(articleCategory);
    }

    transform(article: any): object {
        return {
            id: article.id,
            name: article.name,
        };
    }
}
