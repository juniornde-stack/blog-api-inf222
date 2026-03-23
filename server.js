// Importer les modules nécessaires
const express = require('express');
const cors = require('cors');
const app = express();

// Swagger
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Importer la base de données SQLite (better-sqlite3)
const db = require('./database/db');

// Middleware
app.use(cors());  // Permet au frontend de communiquer avec l'API
app.use(express.json());  // Lire le JSON dans les requêtes
app.use(express.static('public'));  // Servir les fichiers statiques (HTML, CSS, JS)

// Configuration Swagger
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Blog API - INF222',
            version: '1.0.0',
            description: 'API de gestion d’articles pour le blog CleeRoute',
        },
    },
    apis: ['./server.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// =======================
// ROUTE TEST
// =======================
/**
 * @swagger
 * /:
 *   get:
 *     summary: Vérifier que le serveur fonctionne
 *     responses:
 *       200:
 *         description: Serveur opérationnel
 */
app.get('/', (req, res) => {
    res.send("API Blog fonctionne");
});

// =======================
// GET TOUS LES ARTICLES
// =======================
/**
 * @swagger
 * /api/articles:
 *   get:
 *     summary: Récupérer tous les articles
 *     responses:
 *       200:
 *         description: Liste des articles
 *       500:
 *         description: Erreur serveur
 */
app.get('/api/articles', (req, res) => {
    try {
        const articles = db.prepare("SELECT * FROM articles ORDER BY date DESC").all();
        res.json(articles);
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// =======================
// RECHERCHE
// =======================
/**
 * @swagger
 * /api/articles/search:
 *   get:
 *     summary: Rechercher des articles par titre ou contenu
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Articles correspondants
 *       400:
 *         description: Paramètre de recherche requis
 */
app.get('/api/articles/search', (req, res) => {
    const query = req.query.query;

    if (!query) return res.status(400).json({ error: "Paramètre de recherche requis" });

    try {
        const results = db.prepare(`
            SELECT * FROM articles 
            WHERE title LIKE ? OR content LIKE ?
            ORDER BY date DESC
        `).all(`%${query}%`, `%${query}%`);

        res.json(results);
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// =======================
// GET ARTICLE PAR ID
// =======================
/**
 * @swagger
 * /api/articles/{id}:
 *   get:
 *     summary: Récupérer un article par son ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Article trouvé
 *       404:
 *         description: Article non trouvé
 */
app.get('/api/articles/:id', (req, res) => {
    const id = req.params.id;

    try {
        const article = db.prepare("SELECT * FROM articles WHERE id = ?").get(id);

        if (!article) {
            return res.status(404).json({ error: "Article non trouvé" });
        }

        res.json(article);
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// =======================
// POST (CREER ARTICLE)
// =======================
/**
 * @swagger
 * /api/articles:
 *   post:
 *     summary: Créer un nouvel article
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *               - author
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               author:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: string
 *     responses:
 *       201:
 *         description: Article créé
 *       400:
 *         description: Données manquantes
 *       500:
 *         description: Erreur serveur
 */
app.post('/api/articles', (req, res) => {
    const { title, content, author, category, tags } = req.body;

    if (!title || !content || !author) {
        return res.status(400).json({ error: "title, content et author obligatoires" });
    }

    const date = new Date().toISOString();

    try {
        const result = db
            .prepare(`INSERT INTO articles (title, content, author, category, tags, date) VALUES (?, ?, ?, ?, ?, ?)`)
            .run(title, content, author, category || null, tags || null, date);

        res.status(201).json({
            id: result.lastInsertRowid,
            title,
            content,
            author,
            category: category || null,
            tags: tags || null,
            date
        });
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// =======================
// PUT (MODIFIER ARTICLE)
// =======================
/**
 * @swagger
 * /api/articles/{id}:
 *   put:
 *     summary: Modifier un article existant
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               author:
 *                 type: string
 *               category:
 *                 type: string
 *               tags:
 *                 type: string
 *     responses:
 *       200:
 *         description: Article modifié
 *       404:
 *         description: Article non trouvé
 */
app.put('/api/articles/:id', (req, res) => {
    const id = req.params.id;
    const { title, content, author, category, tags } = req.body;

    if (!title || !content || !author) {
        return res.status(400).json({ error: "title, content et author obligatoires" });
    }

    try {
        const result = db.prepare(`
            UPDATE articles 
            SET title = ?, content = ?, author = ?, category = ?, tags = ?
            WHERE id = ?
        `).run(title, content, author, category || null, tags || null, id);

        if (result.changes === 0) {
            return res.status(404).json({ error: "Article non trouvé" });
        }

        res.json({ message: "Article mis à jour" });
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// =======================
// DELETE (SUPPRIMER ARTICLE)
// =======================
/**
 * @swagger
 * /api/articles/{id}:
 *   delete:
 *     summary: Supprimer un article
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Article supprimé
 *       404:
 *         description: Article non trouvé
 */
app.delete('/api/articles/:id', (req, res) => {
    const id = req.params.id;

    try {
        const result = db.prepare("DELETE FROM articles WHERE id = ?").run(id);

        if (result.changes === 0) {
            return res.status(404).json({ error: "Article non trouvé" });
        }

        res.json({ message: "Article supprimé" });
    } catch (error) {
        res.status(500).json({ error: "Erreur serveur" });
    }
});

// =======================
// LANCEMENT DU SERVEUR
// =======================
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
    console.log(`📚 Documentation Swagger : http://localhost:${PORT}/api-docs`);
    console.log(`🌐 Frontend : http://localhost:${PORT}`);
});
