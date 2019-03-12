const macplus = require('pcejs-macplus');
const utils = require('pcejs-util');

// add a load progress bar. not required, but good ux
const loadingStatus = utils.loadingStatus(
  document.querySelector('.pcejs-loading-status')
);

const items = [];

const Module = macplus({
  arguments: ['-c', 'pce-config.cfg', '-r'],
  autoloadFiles: [
    'mac-classic-pram.dat',
    'macplus-pcex.rom',
    'mac-classic.rom',
    'pce-config.cfg',
  ],

  print: console.log.bind(console),

  printErr: console.warn.bind(console),

  canvas: document.querySelector('.pcejs-canvas'),

  onDiskEject: () => {
    items.forEach(i => {
      i.listItem.style.display = i.needsEmptyDrive ? '' : 'none';
    });
  },

  monitorRunDependencies: remainingDependencies => {
    loadingStatus.update(remainingDependencies);
  },
});

const insertDiskFn = Module.cwrap('insert_disk', 'number', ['string']);

const insertDisk = file => {
  if (insertDiskFn(file) != 0) {
    return false;
  }
  items.forEach(i => {
    i.listItem.style.display = i.needsEmptyDrive ? 'none' : '';
  });
  return true;
}

const diskInserter = (file, url) => {
  return e => {
    e.preventDefault();
    if (insertDisk(file)) {
      return;
    }
    Module.FS_createPreloadedFile('/', file, url, true, true, () => {
      insertDisk(file);
    });
  };
}

items.push(
  {
    name: 'Paperclip',
    action: e => {
      e.preventDefault();
      Module._paperclip();
    },
    needsEmptyDrive: false,
  },
  {
    name: 'KidPix',
    action: diskInserter('kidpix.dsk', '/kidpix.dsk'),
    needsEmptyDrive: true,
  },
  {
    name: 'Dark Castle',
    action: diskInserter('dc.dsk', '/dc.dsk'),
    needsEmptyDrive: true,
  },
  {
    name: '800k',
    action: diskInserter('800K.dsk', '/800K.dsk'),
    needsEmptyDrive: true,
  }
);

const linksList = document.getElementById('links-list');

items.forEach(i => {
  const li = document.createElement('li');
  linksList.appendChild(li);
  const a = document.createElement('a');
  li.appendChild(a);
  a.appendChild(document.createTextNode(i.name));
  a.href = '#';
  a.addEventListener('click', i.action);
  i.listItem = li;
  i.link = a;
});
