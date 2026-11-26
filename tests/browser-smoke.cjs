const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createServer } = require('node:http');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const { setTimeout: sleep } = require('node:timers/promises');
const jsonServer = require('json-server');
const WebSocket = require('ws');

async function until(check, label) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (await check()) return;
    await sleep(100);
  }
  throw new Error('Délai dépassé — ' + label);
}

async function main() {
  const directory = fs.mkdtempSync(path.join(__dirname, '.browser-'));
  const database = path.join(directory, 'db.json');
  fs.copyFileSync(path.join(__dirname, '../db.seed.json'), database);
  const api = jsonServer.create();
  api.use(jsonServer.defaults({ logger: false }));
  api.use(jsonServer.bodyParser);
  api.use(jsonServer.router(database));
  const rest = api.listen(3000, '127.0.0.1');
  const build = path.join(__dirname, '../dist/study-bloom/browser');
  const web = createServer((request, response) => {
    const file = path.basename(new URL(request.url, 'http://localhost').pathname);
    const type = { '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' }[path.extname(file)];
    response.setHeader('content-type', type ?? 'text/html; charset=utf-8');
    fs.createReadStream(path.join(build, type ? file : 'index.html'))
      .on('error', () => { response.statusCode = 404; response.end(); })
      .pipe(response);
  }).listen(0, '127.0.0.1');

  let chrome;
  let socket;
  try {
    await Promise.all([once(rest, 'listening'), once(web, 'listening')]);
    const origin = 'http://127.0.0.1:' + web.address().port;
    const executable = process.env.CHROME_BIN || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
    chrome = spawn(executable, ['--headless', '--disable-gpu', '--no-first-run', '--remote-debugging-port=0', '--user-data-dir=' + directory, 'about:blank'], { stdio: 'ignore' });
    const activePort = path.join(directory, 'DevToolsActivePort');
    await until(() => fs.existsSync(activePort), 'démarrage de Chrome');
    const port = fs.readFileSync(activePort, 'utf8').split(/\r?\n/)[0];
    const targets = await fetch('http://127.0.0.1:' + port + '/json/list').then(response => response.json());
    socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
    await once(socket, 'open');
    let nextId = 0;
    const pending = new Map();
    socket.on('message', raw => {
      const data = JSON.parse(raw);
      const callback = pending.get(data.id);
      if (callback) { pending.delete(data.id); callback(data); }
    });
    async function send(method, params = {}) {
      const id = ++nextId;
      return new Promise((resolve, reject) => {
        pending.set(id, data => data.error ? reject(new Error(data.error.message)) : resolve(data.result));
        socket.send(JSON.stringify({ id, method, params }));
      });
    }
    async function evaluate(expression) {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true });
      if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails));
      return result.result.value;
    }
    const wait = (expression, label) => until(() => evaluate(expression), label);
    const navigate = route => send('Page.navigate', { url: origin + route });
    const heading = value => wait('document.querySelector("h1")?.textContent.includes(' + JSON.stringify(value) + ')', value);
    const click = (selector, label) => wait(
      '(() => { const node = Array.from(document.querySelectorAll(' + JSON.stringify(selector) +
      ')).find(item => item.textContent.includes(' + JSON.stringify(label) +
      ')); if (!node || node.disabled) return false; node.click(); return true; })()',
      'clic ' + label
    );
    const enter = (selector, value, event = 'input') => evaluate(
      '(() => {const el = document.querySelector(' + JSON.stringify(selector) + '); el.value = ' + JSON.stringify(value) +
      '; el.dispatchEvent(new Event(' + JSON.stringify(event) + ', {bubbles:true}));})()'
    );
    const url = value => wait('location.pathname === ' + JSON.stringify(value), value);
    const text = value => wait('document.body?.textContent.includes(' + JSON.stringify(value) + ')', value);
    const data = () => JSON.parse(fs.readFileSync(database, 'utf8'));

    await navigate('/tasks');
    await url('/login');
    await text('Bon retour');
    await click('details button', 'Étudiant');
    await enter('[formControlName=password]', 'incorrect1');
    await click('form button', 'Me connecter');
    await text('Identifiants invalides');
    await click('details button', 'Étudiant');
    await click('form button', 'Me connecter');
    await heading('Lina');
    await text('Progression du jardin');
    assert.equal(await evaluate('document.querySelectorAll(".metric").length'), 6);
    await navigate('/admin');
    await url('/dashboard');
    await heading('Lina');
    await click('nav a', 'Mes tâches');
    await heading('Mes tâches');
    await text('Finaliser le projet Angular');
    assert.equal(await evaluate('document.querySelectorAll("sb-task-card").length'), 15);
    await enter('input[type=search]', 'Finaliser le projet');
    await wait('document.querySelectorAll("sb-task-card").length === 1', 'recherche dynamique');
    await click('button', 'Vue Kanban');
    await wait('document.querySelectorAll(".kanban > section").length === 3', 'Kanban');
    await enter('sb-task-card select', 'done', 'change');
    await until(() => data().tasks.find(task => task.id === 't0').status === 'done', 'persistance statut');
    await click('sb-task-card a', 'Finaliser le projet Angular');
    await url('/tasks/t0');
    await heading('Finaliser le projet Angular');
    await navigate('/tasks/t15');
    await text('Cette tâche est introuvable.');
    await click('nav a', 'Mes matières');
    await heading('Mes matières');
    await text('Programmation web');
    await click('button', 'Nouvelle matière');
    await enter('dialog[open] [formControlName=name]', 'Matière de vérification');
    await enter('dialog[open] [formControlName=categoryId]', 'c0', 'change');
    await click('dialog[open] button.primary', 'Enregistrer');
    await text('Matière enregistrée.');
    const subject = data().subjects.find(item => item.name === 'Matière de vérification');
    await click('.subject a', subject.name);
    await url('/subjects/' + subject.id);
    await click('article button', 'Modifier');
    await enter('dialog[open] [formControlName=name]', 'Matière modifiée');
    await click('dialog[open] button.primary', 'Enregistrer');
    await heading('Matière modifiée');
    await click('nav a', 'Mes tâches');
    await heading('Mes tâches');
    await click('a.primary', 'Nouvelle tâche');
    await heading('Nouvelle tâche');
    await text('Échéance');
    await enter('[formControlName=title]', 'Tâche de vérification');
    await enter('[formControlName=subjectId]', subject.id, 'change');
    await enter('[formControlName=dueDate]', '2000-01-01');
    assert.equal(await evaluate('document.querySelector("form button.primary").disabled'), true);
    await enter('[formControlName=dueDate]', '2099-01-01');
    await click('form button.primary', 'Enregistrer');
    await heading('Tâche de vérification');
    const task = data().tasks.find(item => item.title === 'Tâche de vérification');
    await url('/tasks/' + task.id);
    await click('.form-card a.primary', 'Modifier');
    await heading('Modifier la tâche');
    await text('Échéance');
    await enter('[formControlName=title]', 'Tâche modifiée');
    await click('form button.primary', 'Enregistrer');
    await heading('Tâche modifiée');
    await click('nav a', 'Mes tâches');
    await text('Tâche modifiée');
    await enter('input[type=search]', 'Tâche modifiée');
    await wait('document.querySelectorAll("sb-task-card").length === 1', 'filtrage de la tâche créée');
    await click('sb-task-card button', 'Supprimer');
    await click('dialog[open] button.primary', 'Supprimer');
    await text('Aucune tâche ne correspond');
    assert.equal(data().tasks.some(item => item.id === task.id), false);
    await click('nav a', 'Mes matières');
    await text('Matière modifiée');
    await click('.subject a', 'Matière modifiée');
    await heading('Matière modifiée');
    await click('article button', 'Supprimer');
    await click('dialog[open] button.primary', 'Supprimer');
    await url('/subjects');
    assert.equal(data().subjects.some(item => item.id === subject.id), false);
    await click('nav a', 'Calendrier');
    await heading('Calendrier');
    await text('Dim.');
    await click('nav a', 'Statistiques');
    await heading('Statistiques');
    await text('Priorités');

    await send('Emulation.setDeviceMetricsOverride', { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
    assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
    await click('button', 'Déconnexion');
    await url('/login');
    await text('Bon retour');
    await click('details button', 'Administrateur');
    await click('form button', 'Me connecter');
    await heading('Vue globale');
    await text('Comptes actifs');
    await navigate('/dashboard');
    await url('/admin');
    await heading('Vue globale');
    await click('nav a', 'Utilisateurs');
    await text('Équipe StudyBloom');
    await click('.grid article button', 'Désactiver');
    await text('Le dernier administrateur actif doit rester actif.');
    await click('nav a', 'Catégories');
    await text('Informatique');
    await click('.grid article button', 'Supprimer');
    await click('dialog[open] button.primary', 'Supprimer');
    await text('Cette catégorie est utilisée par une matière.');
    assert.equal(data().categories.length, 5);
    await click('button', 'Nouvelle catégorie');
    await enter('dialog[open] [formControlName=name]', 'Catégorie de vérification');
    await click('dialog[open] button.primary', 'Enregistrer');
    await text('Catégorie de vérification');
    await evaluate('Array.from(document.querySelectorAll(".subject")).find(node => node.textContent.includes("Catégorie de vérification")).querySelector("button").click()');
    await enter('dialog[open] [formControlName=name]', 'Catégorie modifiée');
    await click('dialog[open] button.primary', 'Enregistrer');
    await text('Catégorie modifiée');
    await evaluate('Array.from(document.querySelectorAll(".subject")).find(node => node.textContent.includes("Catégorie modifiée")).querySelector(".danger").click()');
    await click('dialog[open] button.primary', 'Supprimer');
    await until(() => data().categories.length === 5, 'suppression de la catégorie');

    await send('Network.enable');
    await send('Network.setBlockedURLs', { urls: ['http://127.0.0.1:3000/categories'] });
    await navigate('/admin/categories');
    await text('Impossible de communiquer avec StudyBloom.');
    await send('Network.setBlockedURLs', { urls: [] });
    await click('button', 'Réessayer');
    await text('Informatique');
    console.log('OK — parcours Chrome étudiant et admin, recherche, Kanban, isolation et écran mobile.');
  } finally {
    socket?.terminate();
    if (chrome && chrome.exitCode === null) {
      chrome.kill();
      await once(chrome, 'exit');
    }
    for (const server of [web, rest]) {
      server.closeAllConnections();
      await new Promise(resolve => server.close(resolve));
    }
    fs.rmSync(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
