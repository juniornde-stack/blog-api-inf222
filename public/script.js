const API_URL = "http://localhost:3000/api/articles";

function loadArticles() {
    fetch(API_URL)
        .then(res => {
            if (!res.ok) throw new Error('Erreur chargement');
            return res.json();
        })
        .then(articles => displayArticles(articles))
        .catch(err => console.error('Erreur:', err));
}

function displayArticles(articles) {
    const container = document.getElementById("articlesList");
    if (!container) return;
    
    if (articles.length === 0) {
        container.innerHTML = '<div class="empty-state">Aucun article publié. Créez le premier !</div>';
        return;
    }
    
    container.innerHTML = "";
    articles.forEach(article => {
        const div = document.createElement("div");
        div.className = "article";
        div.innerHTML = `
            <h3>${escapeHtml(article.title)}</h3>
            <div class="article-meta">
                <span>✍️ ${escapeHtml(article.author)}</span>
                <span>📂 ${escapeHtml(article.category || 'Non catégorisé')}</span>
                <span>🏷️ ${escapeHtml(article.tags || 'Aucun tag')}</span>
                <span>📅 ${article.date.split('T')[0]}</span>
            </div>
            <div class="article-content">${escapeHtml(article.content)}</div>
            <div class="article-actions">
                <button class="btn-edit" onclick="editArticle(${article.id})">Modifier</button>
                <button class="btn-delete" onclick="deleteArticle(${article.id})">Supprimer</button>
            </div>
        `;
        container.appendChild(div);
    });
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Créer un article
const articleForm = document.getElementById("articleForm");
if (articleForm) {
    articleForm.addEventListener("submit", e => {
        e.preventDefault();
        
        const article = {
            title: document.getElementById("title").value.trim(),
            content: document.getElementById("content").value.trim(),
            author: document.getElementById("author").value.trim(),
            category: document.getElementById("category").value.trim(),
            tags: document.getElementById("tags").value.trim()
        };
        
        if (!article.title || !article.content || !article.author) {
            alert("Le titre, le contenu et l'auteur sont obligatoires");
            return;
        }
        
        fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(article)
        })
        .then(res => {
            if (!res.ok) throw new Error('Erreur création');
            return res.json();
        })
        .then(() => {
            articleForm.reset();
            loadArticles();
        })
        .catch(err => {
            console.error(err);
            alert("Erreur lors de la création");
        });
    });
}

function deleteArticle(id) {
    if (!confirm("Supprimer cet article ?")) return;
    
    fetch(`${API_URL}/${id}`, { method: "DELETE" })
        .then(res => {
            if (!res.ok) throw new Error('Erreur suppression');
            return res.json();
        })
        .then(() => loadArticles())
        .catch(err => {
            console.error(err);
            alert("Erreur lors de la suppression");
        });
}

function editArticle(id) {
    fetch(`${API_URL}/${id}`)
        .then(res => res.json())
        .then(article => {
            const modal = document.createElement('div');
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
            modal.style.display = 'flex';
            modal.style.justifyContent = 'center';
            modal.style.alignItems = 'center';
            modal.style.zIndex = '1000';
            
            modal.innerHTML = `
                <div style="background: white; padding: 1.5rem; border-radius: 12px; width: 90%; max-width: 550px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
                    <h3 style="margin-bottom: 1rem; font-size: 1.2rem;">Modifier l'article</h3>
                    <input type="text" id="editTitle" value="${escapeHtml(article.title)}" placeholder="Titre" style="width:100%; padding:0.75rem; margin-bottom:0.75rem; border:1px solid #e2e8f0; border-radius:8px;">
                    <input type="text" id="editAuthor" value="${escapeHtml(article.author)}" placeholder="Auteur" style="width:100%; padding:0.75rem; margin-bottom:0.75rem; border:1px solid #e2e8f0; border-radius:8px;">
                    <input type="text" id="editCategory" value="${escapeHtml(article.category || '')}" placeholder="Catégorie" style="width:100%; padding:0.75rem; margin-bottom:0.75rem; border:1px solid #e2e8f0; border-radius:8px;">
                    <input type="text" id="editTags" value="${escapeHtml(article.tags || '')}" placeholder="Tags" style="width:100%; padding:0.75rem; margin-bottom:0.75rem; border:1px solid #e2e8f0; border-radius:8px;">
                    <textarea id="editContent" placeholder="Contenu" rows="6" style="width:100%; padding:0.75rem; margin-bottom:1rem; border:1px solid #e2e8f0; border-radius:8px;">${escapeHtml(article.content)}</textarea>
                    <div style="display:flex; gap:0.75rem;">
                        <button id="saveEdit" style="flex:1; padding:0.75rem; background:#4a90e2; color:white; border:none; border-radius:8px; cursor:pointer;">Enregistrer</button>
                        <button id="cancelEdit" style="flex:1; padding:0.75rem; background:#e2e8f0; color:#4a5568; border:none; border-radius:8px; cursor:pointer;">Annuler</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            document.getElementById('saveEdit').onclick = () => {
                const updated = {
                    title: document.getElementById('editTitle').value,
                    author: document.getElementById('editAuthor').value,
                    category: document.getElementById('editCategory').value,
                    tags: document.getElementById('editTags').value,
                    content: document.getElementById('editContent').value
                };
                
                if (!updated.title || !updated.author || !updated.content) {
                    alert("Titre, auteur et contenu obligatoires");
                    return;
                }
                
                fetch(`${API_URL}/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updated)
                })
                .then(res => {
                    if (!res.ok) throw new Error('Erreur modification');
                    return res.json();
                })
                .then(() => {
                    modal.remove();
                    loadArticles();
                })
                .catch(err => {
                    console.error(err);
                    alert("Erreur lors de la modification");
                });
            };
            
            document.getElementById('cancelEdit').onclick = () => modal.remove();
        })
        .catch(err => console.error(err));
}

// Recherche
const searchBtn = document.getElementById("searchBtn");
const resetSearchBtn = document.getElementById("resetSearchBtn");
const searchQuery = document.getElementById("searchQuery");

if (searchBtn) {
    searchBtn.addEventListener("click", () => {
        const query = searchQuery.value.trim();
        if (!query) {
            loadArticles();
            return;
        }
        fetch(`${API_URL}/search?query=${encodeURIComponent(query)}`)
            .then(res => res.json())
            .then(articles => displayArticles(articles))
            .catch(err => console.error(err));
    });
}

if (resetSearchBtn) {
    resetSearchBtn.addEventListener("click", () => {
        if (searchQuery) searchQuery.value = '';
        loadArticles();
    });
}

if (searchQuery) {
    searchQuery.addEventListener("keypress", (e) => {
        if (e.key === "Enter") searchBtn.click();
    });
}

loadArticles();
