const ADMIN_PASSCODE = "intherval-admin-2026";
const ARTICLE_STORAGE_KEY = "intherval_articles";

const loginPanel = document.querySelector("[data-admin-login]");
const dashboard = document.querySelector("[data-admin-dashboard]");
const articleForm = document.getElementById("articleForm");
const articleList = document.getElementById("adminArticleList");
const imageInput = document.getElementById("articleImage");
const imagePreview = document.getElementById("imagePreview");
const inlineImageInput = document.getElementById("inlineArticleImage");
const inlineImageCaption = document.getElementById("inlineImageCaption");
const articleContent = document.getElementById("articleContent");

let currentImage = "";
let currentInlineImage = "";

const slugify = (value) => value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const getStoredArticles = () => {
    try {
        const articles = JSON.parse(localStorage.getItem(ARTICLE_STORAGE_KEY) || "[]");
        return Array.isArray(articles) ? articles : [];
    } catch {
        return [];
    }
};

const saveStoredArticles = (articles) => {
    localStorage.setItem(ARTICLE_STORAGE_KEY, JSON.stringify(articles));
};

const getAllArticles = () => {
    const seedArticles = Array.isArray(window.INTHERVAL_ARTICLES) ? window.INTHERVAL_ARTICLES : [];
    const storedArticles = getStoredArticles();
    const articleMap = new Map();
    [...seedArticles, ...storedArticles].forEach((article) => {
        if (article?.slug) articleMap.set(article.slug, article);
    });
    return Array.from(articleMap.values()).sort((a, b) => new Date(b.date) - new Date(a.date));
};

const syncSeedArticlesToStorage = () => {
    const seedArticles = Array.isArray(window.INTHERVAL_ARTICLES) ? window.INTHERVAL_ARTICLES : [];
    const storedArticles = getStoredArticles();
    const storedSlugs = new Set(storedArticles.map((article) => article.slug));
    const missingSeedArticles = seedArticles.filter((article) => article?.slug && !storedSlugs.has(article.slug));

    if (missingSeedArticles.length) {
        saveStoredArticles([...storedArticles, ...missingSeedArticles]);
    }
};

const resetForm = () => {
    articleForm.reset();
    document.getElementById("articleId").value = "";
    document.getElementById("articleAuthor").value = "CV. InTherVal Sistem";
    document.getElementById("articleDate").valueAsDate = new Date();
    currentImage = "";
    currentInlineImage = "";
    inlineImageInput.value = "";
    inlineImageCaption.value = "";
    imagePreview.classList.add("hidden");
    imagePreview.removeAttribute("src");
};

const blocksToEditorText = (article) => {
    if (!Array.isArray(article.contentBlocks)) return article.content || "";
    return article.contentBlocks.map((block) => {
        if (block.type === "heading") return block.text;
        if (block.type === "image") return `![${block.caption || block.alt || ""}](${block.src})`;
        if (block.type === "list") return (block.items || []).map((item) => `- ${item}`).join("\n");
        return block.text || "";
    }).join("\n\n");
};

const renderAdminList = () => {
    const articles = getStoredArticles().sort((a, b) => new Date(b.date) - new Date(a.date));
    if (!articles.length) {
        articleList.innerHTML = "<p class=\"empty-state\">Belum ada artikel.</p>";
        return;
    }

    articleList.innerHTML = articles.map((article) => `
        <article class="admin-article-row">
            <img src="${article.image}" alt="${article.title}" width="120" height="80">
            <div>
                <h3>${article.title}</h3>
                <p>${article.category || "Insight"} · Oleh: ${article.author || "CV. InTherVal Sistem"} · ${article.date}</p>
            </div>
            <div class="admin-row-actions">
                <button class="button button-secondary" type="button" data-edit="${article.slug}">Edit</button>
                <button class="button button-secondary" type="button" data-delete="${article.slug}">Hapus</button>
            </div>
        </article>
    `).join("");
};

document.getElementById("loginAdmin").addEventListener("click", () => {
    const passcode = document.getElementById("adminPasscode").value;
    if (passcode !== ADMIN_PASSCODE) {
        alert("Passcode admin tidak sesuai.");
        return;
    }
    loginPanel.classList.add("hidden");
    dashboard.classList.remove("hidden");
    syncSeedArticlesToStorage();
    resetForm();
    renderAdminList();
});

imageInput.addEventListener("change", () => {
    const file = imageInput.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        currentImage = String(reader.result);
        imagePreview.src = currentImage;
        imagePreview.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
});

inlineImageInput.addEventListener("change", () => {
    const file = inlineImageInput.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        currentInlineImage = String(reader.result);
    };
    reader.readAsDataURL(file);
});

document.getElementById("insertInlineImage").addEventListener("click", () => {
    if (!currentInlineImage) {
        alert("Pilih gambar sisipan terlebih dahulu.");
        return;
    }

    const caption = inlineImageCaption.value.trim() || "Gambar artikel";
    const token = `\n\n![${caption}](${currentInlineImage})\n\n`;
    const start = articleContent.selectionStart;
    const end = articleContent.selectionEnd;
    articleContent.value = `${articleContent.value.slice(0, start)}${token}${articleContent.value.slice(end)}`;
    articleContent.focus();
    articleContent.selectionStart = articleContent.selectionEnd = start + token.length;
    currentInlineImage = "";
    inlineImageInput.value = "";
    inlineImageCaption.value = "";
});

articleForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = document.getElementById("articleTitle").value.trim();
    const slug = document.getElementById("articleId").value || slugify(title);
    const storedArticles = getStoredArticles().filter((article) => article.slug !== slug);
    const oldArticle = getStoredArticles().find((article) => article.slug === slug);

    const article = {
        id: slug,
        slug,
        title,
        author: document.getElementById("articleAuthor").value.trim(),
        category: document.getElementById("articleCategory").value.trim(),
        date: document.getElementById("articleDate").value,
        excerpt: document.getElementById("articleExcerpt").value.trim(),
        content: articleContent.value.trim(),
        image: currentImage || oldArticle?.image || "./_Assets/Termal_process-optimized.jpg"
    };

    storedArticles.push(article);
    saveStoredArticles(storedArticles);
    resetForm();
    renderAdminList();
    alert("Artikel berhasil disimpan.");
});

articleList.addEventListener("click", (event) => {
    const editSlug = event.target.dataset.edit;
    const deleteSlug = event.target.dataset.delete;

    if (editSlug) {
        const article = getStoredArticles().find((item) => item.slug === editSlug);
        if (!article) return;

        document.getElementById("articleId").value = article.slug;
        document.getElementById("articleTitle").value = article.title;
        document.getElementById("articleAuthor").value = article.author || "CV. InTherVal Sistem";
        document.getElementById("articleCategory").value = article.category;
        document.getElementById("articleDate").value = article.date;
        document.getElementById("articleExcerpt").value = article.excerpt;
        articleContent.value = blocksToEditorText(article);
        currentImage = article.image;
        imagePreview.src = article.image;
        imagePreview.classList.remove("hidden");
    }

    if (deleteSlug && confirm("Hapus artikel ini dari penyimpanan admin?")) {
        saveStoredArticles(getStoredArticles().filter((article) => article.slug !== deleteSlug));
        renderAdminList();
    }
});

document.getElementById("resetForm").addEventListener("click", resetForm);

document.getElementById("exportArticles").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(getStoredArticles(), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "intherval-articles.json";
    link.click();
    URL.revokeObjectURL(url);
});

document.getElementById("importArticles").addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
        try {
            const articles = JSON.parse(String(reader.result));
            if (!Array.isArray(articles)) throw new Error("Invalid format");
            saveStoredArticles(articles);
            renderAdminList();
            alert("Data artikel berhasil diimport.");
        } catch {
            alert("File JSON tidak valid.");
        }
    };
    reader.readAsText(file);
});
