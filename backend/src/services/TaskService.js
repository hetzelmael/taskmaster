// === TaskService.js ===
// Couche service : logique métier isolée de la couche contrôleur
// Couvre : CRUD sécurisé (8.1), Transactions (8.3), Style défensif (3.1)

const { Task, User, Version } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

const VALID_TRANSITIONS = {
  todo:        ['in_progress'],
  in_progress: ['todo', 'done'],
  done:        ['in_progress', 'archived'],
  archived:    [],
};

class TaskService {
  // --- CRUD SÉCURISÉ (CP 8.1) ---
  // Toutes les requêtes passent par Sequelize (ORM) qui utilise
  // des requêtes préparées en interne → protection injection SQL

  /**
   * Créer une tâche pour un utilisateur donné
   * @param {Object} data - { title, description, priority, dueDate }
   * @param {number} userId - ID de l'utilisateur authentifié
   * @returns {Promise<Task>}
   */
  async createTask(data, userId) {
    // Validation défensive : on vérifie TOUJOURS côté serveur
    if (!data.title || data.title.trim().length === 0) {
      throw new Error('Le titre est obligatoire');
    }
    if (data.title.length > 255) {
      throw new Error('Le titre ne doit pas dépasser 255 caractères');
    }
    const validPriorities = ['low', 'medium', 'high'];
    if (data.priority && !validPriorities.includes(data.priority)) {
      throw new Error('Priorité invalide (low, medium, high)');
    }

    const projectId = data.projectId ? parseInt(data.projectId, 10) : null;
    const versionId = data.versionId ? parseInt(data.versionId, 10) : null;

    if (versionId && projectId) {
      const version = await Version.findOne({ where: { id: versionId, projectId } });
      if (!version) {
        const err = new Error('Version introuvable dans ce projet');
        err.status = 400;
        throw err;
      }
    }

    return Task.create({
      title: data.title.trim(),
      description: data.description?.trim() || null,
      priority: data.priority || 'medium',
      dueDate: data.dueDate || null,
      status: 'todo',
      userId,
      versionId,
      projectId,
    });
  }

  /**
   * Récupérer les tâches d'un utilisateur avec filtres et pagination
   * Protection IDOR : on ne retourne que les tâches du userId
   */
  async getTasksByUser(userId, { status, priority, versionId, projectId, page = 1, limit = 20 }) {
    const where = { userId };

    if (status) {
      where.status = status;
    } else {
      where.status = { [Op.ne]: 'archived' };
    }
    if (priority)  { where.priority  = priority; }
    if (versionId) { where.versionId = parseInt(versionId); }
    if (projectId) { where.projectId = parseInt(projectId); }

    const offset = (Math.max(1, page) - 1) * Math.min(limit, 100);

    const { rows, count } = await Task.findAndCountAll({
      where,
      include: [{ model: Version, attributes: ['id', 'name'], required: false }],
      order: [['createdAt', 'DESC']],
      limit: Math.min(limit, 100),
      offset,
      distinct: true,
    });

    return {
      tasks: rows,
      total: count,
      page: Math.max(1, page),
      totalPages: Math.ceil(count / Math.min(limit, 100)),
    };
  }

  /**
   * Récupérer une tâche par ID — avec vérification de propriété
   */
  async getTaskById(taskId, userId) {
    const task = await Task.findOne({
      where: { id: taskId, userId }, // IDOR : on vérifie que c'est bien SA tâche
    });
    if (!task) {
      const error = new Error('Tâche non trouvée');
      error.status = 404;
      throw error;
    }
    return task;
  }

  /**
   * Modifier une tâche (vérification de propriété)
   */
  async updateTask(taskId, userId, updates) {
    const task = await this.getTaskById(taskId, userId);

    const allowed = ['title', 'description', 'priority', 'status', 'dueDate', 'versionId'];
    const safeUpdates = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) { safeUpdates[key] = updates[key]; }
    }

    if (safeUpdates.versionId && task.projectId) {
      const version = await Version.findOne({ where: { id: safeUpdates.versionId, projectId: task.projectId } });
      if (!version) {
        const err = new Error('Version introuvable dans ce projet');
        err.status = 400;
        throw err;
      }
    }

    // Validation et horodatage automatique des transitions de statut
    if (safeUpdates.status && safeUpdates.status !== task.status) {
      const validNext = VALID_TRANSITIONS[task.status] || [];
      if (!validNext.includes(safeUpdates.status)) {
        const err = new Error('Transition de statut invalide');
        err.status = 400;
        throw err;
      }
      const now = new Date();
      if (safeUpdates.status === 'in_progress') {
        safeUpdates.startedAt = now;
        safeUpdates.completedAt = null;
      }
      if (safeUpdates.status === 'done') {
        safeUpdates.completedAt = now;
        // Conserver startedAt si déjà défini, sinon enregistrer maintenant
        if (!task.startedAt) { safeUpdates.startedAt = now; }
      }
      if (safeUpdates.status === 'todo') {
        safeUpdates.startedAt   = null;
        safeUpdates.completedAt = null;
      }
    }

    return task.update(safeUpdates);
  }

  /**
   * Supprimer une tâche (soft delete recommandé en prod)
   */
  async deleteTask(taskId, userId) {
    const task = await this.getTaskById(taskId, userId);
    await task.destroy();
    return { message: 'Tâche supprimée' };
  }

  // --- TRANSACTIONS (CP 8.3) ---
  // Une transaction garantit que TOUTES les opérations réussissent
  // ou qu'AUCUNE n'est appliquée (atomicité)

  /**
   * Réassigner toutes les tâches d'un utilisateur à un autre
   * Utilise une TRANSACTION pour garantir la cohérence
   */
  async reassignAllTasks(fromUserId, toUserId) {
    // On utilise une transaction managée (Sequelize gère commit/rollback)
    const result = await sequelize.transaction(async (t) => {
      // Vérifier que l'utilisateur cible existe
      const targetUser = await User.findByPk(toUserId, { transaction: t });
      if (!targetUser) {
        throw new Error('Utilisateur cible introuvable');
      }

      // Compter les tâches à réassigner
      const count = await Task.count({
        where: { userId: fromUserId },
        transaction: t,
      });

      if (count === 0) {
        throw new Error('Aucune tâche à réassigner');
      }

      // Mettre à jour toutes les tâches en une seule opération
      await Task.update(
        { userId: toUserId },
        {
          where: { userId: fromUserId },
          transaction: t, // IMPORTANT : lier à la transaction
        }
      );

      return { reassigned: count, to: targetUser.email };
    });
    // Si on arrive ici, la transaction est COMMIT automatiquement
    // Si une erreur est levée, ROLLBACK automatique

    return result;
  }

  /**
   * Archiver les tâches terminées de plus de 30 jours (dans une transaction)
   */
  async archiveOldTasks(userId) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return sequelize.transaction(async (t) => {
      const tasks = await Task.findAll({
        where: {
          userId,
          status: 'done',
          updatedAt: { [Op.lt]: thirtyDaysAgo },
        },
        transaction: t,
      });

      for (const task of tasks) {
        await task.update({ status: 'archived' }, { transaction: t });
      }

      return { archived: tasks.length };
    });
  }
}

module.exports = new TaskService();
