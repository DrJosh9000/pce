var macplus = require('pcejs-macplus');
var utils = require('pcejs-util');

// add a load progress bar. not required, but good ux
var loadingStatus = utils.loadingStatus(
  document.querySelector('.pcejs-loading-status')
);

var paperclipLink = document.getElementById('paperclip');
var insertKidPixLink = document.getElementById('insert-kidpix');
var insertDarkCastleLink = document.getElementById('insert-darkcastle');

var Module = macplus({
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
    paperclipLink.style.textDecoration = 'line-through';
    insertKidPixLink.style.textDecoration = null;
    insertDarkCastleLink.style.textDecoration = null;
  },

  monitorRunDependencies: (remainingDependencies) => {
    loadingStatus.update(remainingDependencies);
  },
});

var insertDiskFn = Module.cwrap('insert_disk', 'number', ['string']);

function insertDisk(file) {
  if (insertDiskFn(file) != 0) {
    return false;
  }
  paperclipLink.style.textDecoration = null;
  insertKidPixLink.style.textDecoration = 'line-through';
  insertDarkCastleLink.style.textDecoration = 'line-through';
  return true;
}

function diskInserter(file) {
  return (e) => {
    e.preventDefault();
    if (insertDisk(file)) {
      return;
    }
    Module.FS_createPreloadedFile('/', file, file, true, true, () => {
      insertDisk(file);
    });
  };
}

paperclipLink.addEventListener('click', (e) => {
  e.preventDefault();
  Module._paperclip();
  
  paperclipLink.style.textDecoration = 'line-through';
  insertKidPixLink.style.textDecoration = null;
  insertDarkCastleLink.style.textDecoration = null;
});
insertKidPixLink.addEventListener('click', diskInserter('kidpix.dsk'));
insertDarkCastleLink.addEventListener('click', diskInserter('dc.dsk'));