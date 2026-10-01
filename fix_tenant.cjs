const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(dirPath);
  });
}

walk('src/app/api/accounting', (filepath) => {
  if (filepath.endsWith('.js')) {
    let content = fs.readFileSync(filepath, 'utf8');
    let replaced = content.replace(/typeof empresaId !== 'undefined' \? empresaId : 'ayatech'/g, "(typeof empresaId !== 'undefined' ? empresaId : (typeof companyProfileId !== 'undefined' && companyProfileId ? companyProfileId : 'ayatech'))");
    if (content !== replaced) {
      fs.writeFileSync(filepath, replaced);
      console.log('Fixed ' + filepath);
    }
  }
});
