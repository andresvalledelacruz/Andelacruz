import {lstatSync,realpathSync} from 'node:fs';
import {resolve,relative,dirname,basename,sep,isAbsolute} from 'node:path';

export function privateReportDestination(root,output) {
  const repository=realpathSync(root);
  const destination=resolve(realpathSync(dirname(resolve(output))),basename(output));
  let existing;
  try {existing=lstatSync(destination);} catch(error) {if(error.code!=='ENOENT') throw error;}
  if(existing?.isSymbolicLink() || (existing && !existing.isFile())) throw new Error('El destino debe ser un archivo normal, nunca un enlace.');
  const rel=relative(repository,existing ? realpathSync(destination) : destination);
  if(!(rel.startsWith('..'+sep)||isAbsolute(rel))) throw new Error('El informe privado debe guardarse fuera del repositorio público.');
  return destination;
}
