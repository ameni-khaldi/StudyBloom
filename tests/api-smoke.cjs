const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { once } = require('node:events');
const jsonServer = require('json-server');

async function main() {
  const directory = fs.mkdtempSync(path.join(__dirname, '.api-'));
  const database = path.join(directory, 'db.json');
  fs.copyFileSync(path.join(__dirname, '../db.seed.json'), database);
  const app = jsonServer.create();
  app.use(jsonServer.defaults({ logger: false }));
  app.use(jsonServer.bodyParser);
  app.use(jsonServer.router(database));
  const server = app.listen(0, '127.0.0.1');
  try {
    await once(server, 'listening');
    const base = 'http://127.0.0.1:' + server.address().port;
    async function request(route, method = 'GET', body) {
      const response = await fetch(base + '/' + route, {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
      });
      assert.ok(response.ok, method + ' ' + route + ' → ' + response.status);
      return await response.json();
    }

    const users = await request('users');
    assert.equal(users.filter(user => user.role === 'admin').length, 1);
    assert.equal(users.filter(user => user.role === 'student').length, 3);
    const initialTasks = await request('tasks');
    assert.equal(initialTasks.length, 24);
    const expected = initialTasks.filter(task => ['s0', 's1'].includes(task.subjectId) && /angular/i.test(task.title));
    assert.ok(expected.length);
    assert.deepEqual(await request('tasks?subjectId=s0&subjectId=s1&title_like=angular&_sort=dueDate'), expected);
    const category = await request('categories', 'POST', { id: 'test-category', name: 'Test', color: '#a9c8e8' });
    const subject = await request('subjects', 'POST', { id: 'test-subject', userId: 'u1', categoryId: category.id, name: 'Test' });
    const task = await request('tasks', 'POST', { id: 'test-task', subjectId: subject.id, title: 'C++ basics', status: 'todo' });
    assert.equal((await request('tasks?title_like=' + encodeURIComponent('C\\+\\+')))[0].id, task.id);
    for (const [collection, record, change] of [
      ['categories', category, { name: 'Catégorie modifiée' }],
      ['subjects', subject, { name: 'Matière modifiée' }],
      ['tasks', task, { status: 'done' }]
    ]) {
      const updated = await request(collection + '/' + record.id, 'PATCH', change);
      assert.deepEqual(await request(collection + '/' + record.id), updated);
      const persisted = JSON.parse(fs.readFileSync(database, 'utf8'));
      assert.deepEqual(persisted[collection].find(item => item.id === record.id), updated);
    }
    await request('tasks/' + task.id, 'DELETE');
    await request('subjects/' + subject.id, 'DELETE');
    await request('categories/' + category.id, 'DELETE');
    assert.deepEqual(await request('tasks'), initialTasks);
    console.log('OK — JSON Server, recherche, CRUD et persistance.');
  } finally {
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
    fs.unlinkSync(database);
    fs.rmdirSync(directory);
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
