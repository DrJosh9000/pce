var macplus = require('pcejs-macplus');
var utils = require('pcejs-util');

// add a load progress bar. not required, but good ux
var loadingStatus = utils.loadingStatus(
  document.querySelector('.pcejs-loading-status')
);

var Module = macplus({
  arguments: ['-c', 'pce-config.cfg', '-r'],
  autoloadFiles: [
    'macplus-pcex.rom',
    'mac-plus.rom',
    'hd1.qed',
    'dc.dsk',
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

document.getElementById('print-hello-world-link').addEventListener('click', Module._print_hello_world);
document.getElementById('paperclip').addEventListener('click', () => {
  Module._paperclip(1);
});