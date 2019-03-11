const macplus = require('pcejs-macplus');
const utils = require('pcejs-util');

// add a load progress bar. not required, but good ux
const loadingStatus = utils.loadingStatus(
  document.querySelector('.pcejs-loading-status')
);

const items = [
  {
    name: 'Paperclip',
    image: 'paperclip',
  },
  {
    name: 'KidPix',
    image: 'kidpix',
    file: 'kidpix.dsk',
    url: '/kidpix.dsk',
  },
  {
    name: 'Dark Castle',
    image: 'dc',
    file: 'dc.dsk',
    url: '/dc.dsk',
  },
];

const linksList = document.getElementById('links-list');

items.forEach((i) => {
  const li = document.createElement('li');
  linksList.appendChild(li);
  const a = document.createElement('a');
  li.appendChild(a);
  a.appendChild(document.createTextNode(i.name));
  a.href = '#';
  i.listItem = li;
  i.link = a;
  // Start with no disk inserted
  if (i.name == 'Paperclip') {
    li.style.display = 'none';
  }
});

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
    items.forEach((i) => {
      if (i.name == 'Paperclip') {
        i.listItem.style.display = 'none';
      } else {
        i.listItem.style.display = '';
      }
    });
  },

  monitorRunDependencies: (remainingDependencies) => {
    loadingStatus.update(remainingDependencies);
  },
});

const insertDiskFn = Module.cwrap('insert_disk', 'number', ['string']);

function insertDisk(file) {
  if (insertDiskFn(file) != 0) {
    return false;
  }
  items.forEach((i) => {
    if (i.name == 'Paperclip') {
      i.listItem.style.display = '';
    } else {
      i.listItem.style.display = 'none';
    }
  });
  return true;
}

items.forEach((i) => {
  if (i.name == 'Paperclip') {
    i.link.addEventListener('click', (e) => {
      e.preventDefault();
      Module._paperclip();
    });
  } else {
    i.link.addEventListener('click', (e) => {
      e.preventDefault();
      if (insertDisk(i.file)) {
        return;
      }
      Module.FS_createPreloadedFile('/', i.file, i.url, true, true, () => {
        insertDisk(i.file);
      });
    });
  }
});
