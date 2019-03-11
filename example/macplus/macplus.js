var macplus = require('pcejs-macplus');
var utils = require('pcejs-util');

// add a load progress bar. not required, but good ux
var loadingStatus = utils.loadingStatus(
  document.querySelector('.pcejs-loading-status')
);

var Module = macplus({
  arguments: ['-c', 'pce-config.cfg', '-r'],
  autoloadFiles: [
    'mac-classic-pram.dat',
    'macplus-pcex.rom',
    'mac-classic.rom',
    //'hd2.qed',
    //'dc.dsk',
    //'kidpix.dsk',
    'pce-config.cfg',
  ],

  print: console.log.bind(console),

  printErr: console.warn.bind(console),

  canvas: document.querySelector('.pcejs-canvas'),

  onDiskEject: () => {
    console.log('disk is eject!');
  },

  monitorRunDependencies: (remainingDependencies) => {
    loadingStatus.update(remainingDependencies);
  },
});

var insertDisk = Module.cwrap('insert_disk', 'number', ['string']);

function diskInserter(file) {
  return (e) => {
    e.preventDefault();
    if (insertDisk(file) == 0) {
      return;
    }
    Module.FS_createPreloadedFile('/', file, file, true, true, () => {
      insertDisk(file);
    });
  }
}

document.getElementById('paperclip').addEventListener('click', Module._paperclip);
document.getElementById('insert-kidpix').addEventListener('click', diskInserter('kidpix.dsk'));
document.getElementById('insert-darkcastle').addEventListener('click', diskInserter('dc.dsk'));