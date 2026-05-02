// === tests/unit/taskService.test.js ===
// Tests unitaires avec Jest — couvre CP 3.3 et CP 9.2
// Un test unitaire teste UNE fonction isolément, en simulant (mock)
// les dépendances externes (BDD, réseau, fichiers)

const TaskService = require('../../src/services/TaskService');
const { Task, User } = require('../../src/models');
const sequelize = require('../../src/config/database');

// --- MOCKS ---
// On "simule" la base de données pour ne pas avoir besoin
// d'une vraie connexion PostgreSQL pendant les tests
jest.mock('../../src/models', () => ({
  Task: {
    create: jest.fn(),
    findAndCountAll: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    findAll: jest.fn(),
  },
  User: {
    findByPk: jest.fn(),
  },
}));

jest.mock('../../src/config/database', () => ({
  transaction: jest.fn((cb) => cb({})), // simule une transaction
}));

// --- BLOC DE TESTS ---
// describe() regroupe les tests par fonctionnalité
describe('TaskService', () => {

  // Avant chaque test, on remet les mocks à zéro
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ==========================================
  // Tests de createTask()
  // ==========================================
  describe('createTask()', () => {

    // Test 1 : Cas nominal (tout va bien)
    test('doit créer une tâche avec des données valides', async () => {
      const mockTask = {
        id: 1,
        title: 'Ma première tâche',
        description: 'Description test',
        priority: 'high',
        status: 'todo',
        userId: 42,
      };
      Task.create.mockResolvedValue(mockTask);

      const result = await TaskService.createTask(
        { title: 'Ma première tâche', description: 'Description test', priority: 'high' },
        42
      );

      // Vérifier que Task.create a été appelé avec les bons arguments
      expect(Task.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Ma première tâche',
          priority: 'high',
          userId: 42,
        })
      );
      expect(result.title).toBe('Ma première tâche');
    });

    // Test 2 : Titre vide → erreur
    test('doit rejeter un titre vide', async () => {
      await expect(
        TaskService.createTask({ title: '' }, 42)
      ).rejects.toThrow('Le titre est obligatoire');
    });

    // Test 3 : Titre null → erreur
    test('doit rejeter un titre null', async () => {
      await expect(
        TaskService.createTask({ title: null }, 42)
      ).rejects.toThrow('Le titre est obligatoire');
    });

    // Test 4 : Titre trop long → erreur
    test('doit rejeter un titre de plus de 255 caractères', async () => {
      const longTitle = 'a'.repeat(256);
      await expect(
        TaskService.createTask({ title: longTitle }, 42)
      ).rejects.toThrow('255 caractères');
    });

    // Test 5 : Priorité invalide → erreur
    test('doit rejeter une priorité invalide', async () => {
      await expect(
        TaskService.createTask({ title: 'Test', priority: 'ultra' }, 42)
      ).rejects.toThrow('Priorité invalide');
    });

    // Test 6 : Priorité par défaut
    test('doit mettre la priorité "medium" par défaut', async () => {
      Task.create.mockResolvedValue({ id: 1, priority: 'medium' });

      await TaskService.createTask({ title: 'Test' }, 42);

      expect(Task.create).toHaveBeenCalledWith(
        expect.objectContaining({ priority: 'medium' })
      );
    });
  });

  // ==========================================
  // Tests de getTasksByUser()
  // ==========================================
  describe('getTasksByUser()', () => {

    test('doit retourner les tâches paginées de l\'utilisateur', async () => {
      Task.findAndCountAll.mockResolvedValue({
        rows: [{ id: 1, title: 'Task 1' }],
        count: 1,
      });

      const result = await TaskService.getTasksByUser(42, { page: 1, limit: 20 });

      // Vérifie que le filtre userId est bien appliqué (protection IDOR)
      expect(Task.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 42 }),
        })
      );
      expect(result.tasks).toHaveLength(1);
      expect(result.total).toBe(1);
    });

    test('doit limiter à 100 résultats maximum', async () => {
      Task.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

      await TaskService.getTasksByUser(42, { limit: 9999 });

      expect(Task.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 100 })
      );
    });
  });

  // ==========================================
  // Tests de getTaskById()
  // ==========================================
  describe('getTaskById()', () => {

    test('doit retourner la tâche si elle appartient à l\'utilisateur', async () => {
      Task.findOne.mockResolvedValue({ id: 1, title: 'Ma tâche', userId: 42 });

      const result = await TaskService.getTaskById(1, 42);
      expect(result.title).toBe('Ma tâche');
    });

    test('doit lever une erreur 404 si la tâche n\'existe pas', async () => {
      Task.findOne.mockResolvedValue(null);

      await expect(
        TaskService.getTaskById(999, 42)
      ).rejects.toThrow('Tâche non trouvée');
    });

    test('ne doit PAS retourner la tâche d\'un autre utilisateur (IDOR)', async () => {
      Task.findOne.mockResolvedValue(null); // Simule : tâche existe mais userId ne match pas

      await expect(
        TaskService.getTaskById(1, 99) // userId 99 essaie d'accéder à la tâche du userId 42
      ).rejects.toThrow('Tâche non trouvée');
    });
  });

  // ==========================================
  // Tests de reassignAllTasks() — TRANSACTIONS
  // ==========================================
  describe('reassignAllTasks()', () => {

    test('doit réassigner les tâches dans une transaction', async () => {
      User.findByPk.mockResolvedValue({ id: 2, email: 'bob@test.com' });
      Task.count.mockResolvedValue(5);
      Task.update.mockResolvedValue([5]);

      const result = await TaskService.reassignAllTasks(1, 2);

      expect(result.reassigned).toBe(5);
      expect(result.to).toBe('bob@test.com');
      expect(sequelize.transaction).toHaveBeenCalled();
    });

    test('doit échouer si l\'utilisateur cible n\'existe pas', async () => {
      User.findByPk.mockResolvedValue(null);

      await expect(
        TaskService.reassignAllTasks(1, 999)
      ).rejects.toThrow('Utilisateur cible introuvable');
    });

    test('doit échouer s\'il n\'y a aucune tâche à réassigner', async () => {
      User.findByPk.mockResolvedValue({ id: 2 });
      Task.count.mockResolvedValue(0);

      await expect(
        TaskService.reassignAllTasks(1, 2)
      ).rejects.toThrow('Aucune tâche à réassigner');
    });
  });
});
