const ARTICLE_STORAGE_KEY = "intherval_articles";

const getStoredArticles = () => {
    try {
        const articles = JSON.parse(localStorage.getItem(ARTICLE_STORAGE_KEY) || "[]");
        return Array.isArray(articles) ? articles : [];
    } catch {
        return [];
    }
};

const getArticles = () => {
    const seedArticles = Array.isArray(window.INTHERVAL_ARTICLES) ? window.INTHERVAL_ARTICLES : [];
    const storedArticles = getStoredArticles();
    const articleMap = new Map();

    [...seedArticles, ...storedArticles].forEach((article) => {
        if (article?.slug) articleMap.set(article.slug, article);
    });

    return Array.from(articleMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
};

const formatDate = (dateValue) => {
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return dateValue || "";
    return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric" }).format(date);
};

const renderArticleBlocks = (article) => {
    if (Array.isArray(article.contentBlocks)) {
        return article.contentBlocks.map((block) => {
            if (block.type === "heading") return `<h2>${block.text}</h2>`;
            if (block.type === "image") return `
                <figure class="article-inline-figure">
                    <img src="${block.src}" alt="${block.alt || ""}" loading="lazy">
                    ${block.caption ? `<figcaption>${block.caption}</figcaption>` : ""}
                </figure>
            `;
            if (block.type === "list") return `<ul>${(block.items || []).map((item) => `<li>${item}</li>`).join("")}</ul>`;
            if (block.type === "quote") return `<blockquote>${block.text}</blockquote>`;
            if (block.type === "callout") return `<p class="article-callout">${block.text}</p>`;
            return `<p>${String(block.text || "").replace(/\n/g, "<br>")}</p>`;
        }).join("");
    }

    return (article.content || "").split(/\n{2,}/).map((paragraph) => {
        const imageMatch = paragraph.trim().match(/^!\[(.*?)\]\((.*?)\)$/);
        if (imageMatch) {
            return `
                <figure class="article-inline-figure">
                    <img src="${imageMatch[2]}" alt="${imageMatch[1]}" loading="lazy">
                    ${imageMatch[1] ? `<figcaption>${imageMatch[1]}</figcaption>` : ""}
                </figure>
            `;
        }
        return `<p>${paragraph.replace(/\n/g, "<br>")}</p>`;
    }).join("");
};

const renderInsightList = () => {
    const container = document.querySelector("[data-insight-list]");
    if (!container) return;

    const articles = getArticles();
    if (!articles.length) {
        container.innerHTML = "<p class=\"empty-state\">Belum ada artikel insight yang tersedia.</p>";
        return;
    }

    const [featured, ...sideArticles] = articles;
    const articleUrl = (article) => `./article.html?slug=${encodeURIComponent(article.slug)}`;

    container.innerHTML = `
        <article class="insight-featured">
            <a href="${articleUrl(featured)}" aria-label="Baca ${featured.title}">
                <img src="${featured.image}" alt="${featured.title}" width="1100" height="680" loading="lazy">
            </a>
            <div>
                <div class="insight-meta">
                    <time datetime="${featured.date}">${formatDate(featured.date)}</time>
                    <span>Oleh: ${featured.author || "CV. InTherVal Sistem"}</span>
                    <span>${featured.category || "Insight"}</span>
                </div>
                <h2>${featured.title}</h2>
                <p>${featured.excerpt}</p>
                <a class="read-more" href="${articleUrl(featured)}">Read More <span aria-hidden="true">→</span></a>
            </div>
        </article>
        <aside class="insight-side-list" aria-label="Artikel lainnya">
            ${sideArticles.map((article, index) => `
                <article class="insight-side-card">
                    <div class="insight-side-meta">
                        <span>#${index + 2}</span>
                        <strong>${article.category || "Insight"}</strong>
                        <time datetime="${article.date}">${formatDate(article.date)}</time>
                    </div>
                    <h3>${article.title}</h3>
                    <p>Oleh: ${article.author || "CV. InTherVal Sistem"}</p>
                    <a href="${articleUrl(article)}">Baca selengkapnya</a>
                </article>
            `).join("")}
        </aside>
    `;
};

const renderArticleDetail = () => {
    const articleRoot = document.querySelector("[data-article-detail]");
    if (!articleRoot) return;

    const slug = new URLSearchParams(window.location.search).get("slug");
    const article = getArticles().find((item) => item.slug === slug);

    if (!article) {
        articleRoot.innerHTML = `
            <section class="page-hero">
                <p class="eyebrow">Insight</p>
                <h1>Artikel tidak ditemukan.</h1>
                <p>Artikel yang Anda cari belum tersedia atau sudah dipindahkan.</p>
                <a class="button button-primary" href="./insight.html">Kembali ke Insight</a>
            </section>
        `;
        document.title = "Artikel Tidak Ditemukan | InTherVal System";
        return;
    }

    document.title = `${article.title} | InTherVal Insight`;
    const relatedArticles = getArticles().filter((item) => item.slug !== article.slug).slice(0, 3);
    articleRoot.innerHTML = `
        <article class="article-detail">
            <header>
                <p class="eyebrow">${article.category || "Insight"}</p>
                <h1>${article.title}</h1>
                <p class="article-author">Oleh: ${article.author || "CV. InTherVal Sistem"}</p>
                <time datetime="${article.date}">${formatDate(article.date)}</time>
            </header>
            <img class="article-cover" src="${article.image}" alt="${article.title}" width="1200" height="720">
            <div class="article-body">
                ${renderArticleBlocks(article)}
            </div>
            <div class="article-back">
                <a href="./insight.html">← Kembali ke Daftar Insight</a>
            </div>
        </article>
        ${relatedArticles.length ? `
            <section class="related-articles" aria-labelledby="related-title">
                <h2 id="related-title">Artikel Terkait</h2>
                <div class="insight-grid">
                    ${relatedArticles.map((related) => `
                        <article class="insight-card">
                            <a href="./article.html?slug=${encodeURIComponent(related.slug)}">
                                <img src="${related.image}" alt="${related.title}" width="900" height="560" loading="lazy">
                                <div>
                                    <span>${related.category || "Insight"}</span>
                                    <h2>${related.title}</h2>
                                </div>
                            </a>
                        </article>
                    `).join("")}
                </div>
            </section>
        ` : ""}
    `;
};

renderInsightList();
renderArticleDetail();
