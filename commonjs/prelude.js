var Module = opts || {};

// hide node/commonjs globals so emscripten doesn't get confused
var process = null; 
var require = null; 

var pathGetFilenameRegex = /\/([^\/]+)$/;

function pathGetFilename(path) {
  var matches = path.match(pathGetFilenameRegex);
  if (matches && matches.length) {
    return matches[1];
  } else {
    return path;
  }
}

function addAutoloader(module) {
  if (!module.autoloadFiles) {
    return;
  }
  module.preRun = module.preRun || [];
  module.preRun.unshift(() => {
    module.autoloadFiles.forEach((filepath) => {
      module.FS_createPreloadedFile('/', pathGetFilename(filepath), filepath, true, true);
    });
  });
}

function addCustomAsyncInit(module) {
  if (!module.asyncInit) {
    return;
  }
  module.preRun = module.preRun || [];
  module.preRun.push(() => {
    module.addRunDependency('pcejsAsyncInit');

    module.asyncInit(module, () => {
      module.removeRunDependency('pcejsAsyncInit');
    });
  });
}

// inject extra behaviours
addAutoloader(Module);
addCustomAsyncInit(Module);
