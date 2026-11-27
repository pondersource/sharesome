const core = 'https://atomicdata.dev/properties/';
const fileClass = 'https://atomicdata.dev/classes/File';
const publicAgent = 'https://atomicdata.dev/agents/publicAgent';
const prefix = 'sharesome-file/v1:';

function element(tag, text) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  return node;
}

function publicLink(file) {
  if (!file.get(core + 'read')?.includes(publicAgent)) return;
  const subject = file.subject;
  const direct = /^https?:\/\//.test(subject);
  // Use a resource link, whose access is set in the Share dialog. The file's
  // download URL only identifies the node for a DID-based resource.
  let url;
  try {
    url = new URL(direct ? subject : file.get(core + 'downloadURL'));
  } catch {
    return;
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return;
  if (direct) return url.href;
  return new URL('/app/show?' + new URLSearchParams({subject}), url.origin).href;
}

export async function view({root, store}) {
  const main = element('main');
  const style = element('style', `
    main { max-width: 52rem; margin: auto; padding: 1.25rem; font: 1rem system-ui; }
    ul { padding: 0; list-style: none; }
    li { border-top: 1px solid #8886; padding-block: .8rem; }
    h2 { font: inherit; font-weight: 600; overflow-wrap: anywhere; }
    button, input { font: inherit; padding: .4rem; margin: .2rem .4rem .2rem 0; }
    input { width: 100%; box-sizing: border-box; }
  `);
  main.append(element('h1', 'Sharesome'));
  root.replaceChildren(style, main);

  if (!store.ui?.pickFile || !store.ui?.share) {
    main.append(element('p', 'Update Atomic to use the file picker and sharing settings.'));
    return;
  }
  const {table, rowClass} = await store.getData();
  const add = element('button', 'Choose or upload a file');
  const info = element('p', 'Choose a file, then set Public access to Read if anyone with the link should be able to open it.');
  const status = element('p');
  status.setAttribute('role', 'status');
  const list = element('ul');
  main.append(info, add, status, list);

  async function rows() {
    const subjects = await store.query({property: core + 'parent', value: table});
    if (subjects.length >= 500) throw new Error('This version supports fewer than 500 rows.');
    const entries = [];
    for (let offset = 0; offset < subjects.length; offset += 100) {
      const batch = await store.getMany(subjects.slice(offset, offset + 100));
      for (const row of batch) {
        if (row.error) throw new Error('Atomic could not read a saved share.');
        const value = row.get(core + 'description');
        if (row.get(core + 'parent') === table && row.get(core + 'isA')?.includes(rowClass) &&
            typeof value === 'string' && value.startsWith(prefix)) {
          entries.push({row, subject: value.slice(prefix.length)});
        }
      }
    }
    return entries;
  }

  async function render() {
    const entries = await rows();
    list.replaceChildren();
    for (const {row, subject} of entries) {
      const item = element('li');
      const file = await store.getResource(subject).catch(() => undefined);
      item.append(element('h2', row.get(core + 'name')));
      if (file?.get(core + 'isA')?.includes(fileClass)) {
        const share = element('button', 'Sharing settings');
        share.addEventListener('click', () => run(() => store.ui.share(subject)));
        item.append(share);
        const url = publicLink(file);
        if (url) {
          const label = element('label', 'Public resource link');
          const input = element('input');
          input.value = url;
          input.readOnly = true;
          input.addEventListener('focus', () => input.select());
          label.append(input);
          item.append(label);
        }
      }
      const forget = element('button', 'Remove from list');
      forget.addEventListener('click', () => run(() => row.destroy()));
      item.append(forget);
      list.append(item);
    }
  }

  async function run(operation) {
    if (add.disabled) return;
    add.disabled = true;
    status.textContent = '';
    try {
      await operation();
      await render();
    } catch (error) {
      status.textContent = error.message;
    } finally {
      add.disabled = false;
    }
  }

  add.addEventListener('click', () => run(async () => {
    const subject = await store.ui.pickFile();
    if (!subject) return;
    const file = await store.getResource(subject);
    if (!file.get(core + 'isA')?.includes(fileClass)) throw new Error('Choose a file to share.');
    if (!(await rows()).some(entry => entry.subject === subject)) {
      await store.newResource({
        parent: table,
        isA: [rowClass],
        propVals: {
          [core + 'name']: file.get(core + 'filename') || file.title || 'File',
          [core + 'description']: prefix + subject
        }
      });
    }
    await store.ui.share(subject);
  }));

  await run(async () => {});
}
