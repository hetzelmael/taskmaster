describe('API E2E: auth and tasks', () => {
  const email = `e2e_${Date.now()}@test.local`;
  const password = 'Test1234A';
  let token;
  let taskId;

  it('registers a new user', () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/register',
      body: { firstName: 'E2E', lastName: 'User', email, password },
    }).then((res) => {
      expect(res.status).to.eq(201);
      expect(res.body).to.have.property('id');
    });
  });

  it('logs in the user and receives a JWT', () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: { email, password },
    }).then((res) => {
      expect(res.status).to.eq(200);
      expect(res.body).to.have.property('token');
      token = res.body.token;
    });
  });

  it('creates a task', () => {
    cy.request({
      method: 'POST',
      url: '/api/tasks',
      headers: { Authorization: `Bearer ${token}` },
      body: { title: 'E2E task', description: 'created by e2e', priority: 'medium' },
    }).then((res) => {
      expect(res.status).to.eq(201);
      expect(res.body).to.have.property('id');
      taskId = res.body.id;
    });
  });

  it('gets the list of tasks and finds the created one', () => {
    cy.request({
      method: 'GET',
      url: '/api/tasks',
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      expect(res.status).to.eq(200);
      const tasks = res.body.tasks || [];
      const found = tasks.find((t) => t.id === taskId || t.id === String(taskId));
      expect(found).to.exist;
    });
  });
});
