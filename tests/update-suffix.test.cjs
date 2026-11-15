const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {root}=require('./helpers/browser.cjs');
for(const valid of [true,false])test(`Suffix updater: ${valid?'valid offline source generates local JavaScript':'invalid source cannot overwrite the snapshot'}`,()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'cia-suffix-test-'));
 try{
  fs.mkdirSync(path.join(dir,'js'));const target=path.join(dir,'js/public-suffix-list.js');fs.writeFileSync(target,'original');
  const source=path.join(dir,'source.dat');fs.writeFileSync(source,valid?'// VERSION: test\n// ===BEGIN ICANN DOMAINS===\ncom\nco.uk\n*.ck\n!www.ck\n// ===END PRIVATE DOMAINS===\n':'<html>Not a suffix list</html>');
  const program='import runpy,sys\nfrom pathlib import Path\nm=runpy.run_path(sys.argv[1])\nm["main"].__globals__["ROOT"]=Path(sys.argv[2])\nsys.argv=[sys.argv[1],"--source",sys.argv[3]]\nm["main"]()';
  const result=spawnSync('python3',['-c',program,path.join(root,'scripts/update-public-suffix-list.py'),dir,source],{encoding:'utf8'});
  assert(!result.error,result.error?.message);assert.equal(result.status,valid?0:1,result.stderr);
  const output=fs.readFileSync(target,'utf8');if(valid){assert(output.includes('const PUBLIC_SUFFIX_RULES = ["com","co.uk","*.ck","!www.ck"]'));assert(output.includes('Mozilla Public License'));}else assert.equal(output,'original');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
