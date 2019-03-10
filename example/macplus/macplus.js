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
    'hd2.qed',
    'kidpix.dsk',
    'pce-config.cfg',
  ],

  print: console.log.bind(console),

  printErr: console.warn.bind(console),

  canvas: document.querySelector('.pcejs-canvas'),

  monitorRunDependencies: (remainingDependencies) => {
    loadingStatus.update(remainingDependencies);
  },
});

document.getElementById('paperclip').addEventListener('click', Module._paperclip);
document.getElementById('insert-kidpix').addEventListener('click', Module._insert_kidpix_dsk);