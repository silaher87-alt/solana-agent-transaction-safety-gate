import { base58Decode, base58Encode } from '../src/base58.js';
import { writeShortVec } from '../src/shortvec.js';
import { SYSTEM_PROGRAM_ID, TOKEN_PROGRAM_ID } from '../src/decoders.js';

function key(seed) { const b=Buffer.alloc(32); for(let i=0;i<32;i++) b[i]=(seed+i*17)&255; return b; }
function pub(seed) { return base58Encode(key(seed)); }
function u64(v) { const b=Buffer.alloc(8); b.writeBigUInt64LE(BigInt(v)); return b; }
function u32(v) { const b=Buffer.alloc(4); b.writeUInt32LE(v); return b; }
function instruction(programIdIndex, accountIndexes, data) { return Buffer.concat([Buffer.from([programIdIndex]),writeShortVec(accountIndexes.length),Buffer.from(accountIndexes),writeShortVec(data.length),data]); }
function wire({version='legacy',header,accounts,instructions,lookups=[]}) {
  const sigs = Buffer.concat([writeShortVec(header[0]), Buffer.alloc(header[0]*64)]);
  const message = [];
  if (version === 0) message.push(Buffer.from([0x80]));
  message.push(Buffer.from(header), writeShortVec(accounts.length), ...accounts.map(a=>Buffer.from(a)), Buffer.alloc(32), writeShortVec(instructions.length), ...instructions);
  if (version === 0) {
    message.push(writeShortVec(lookups.length));
    for (const l of lookups) message.push(Buffer.from(l.key),writeShortVec(l.writable.length),Buffer.from(l.writable),writeShortVec(l.readonly.length),Buffer.from(l.readonly));
  }
  return Buffer.concat([sigs,...message]).toString('base64');
}
export function systemTransferFixture(lamports=50_000_000n, version='legacy') {
  const source=key(1), dest=key(2), system=Buffer.from(base58Decode(SYSTEM_PROGRAM_ID));
  return {base64:wire({version,header:[1,0,1],accounts:[source,dest,system],instructions:[instruction(2,[0,1],Buffer.concat([u32(2),u64(lamports)]))]}),destination:base58Encode(dest),source:base58Encode(source)};
}
export function tokenTransferCheckedFixture(amount=500_000n) {
  const authority=key(3), source=key(4), dest=key(5), mint=key(6), token=Buffer.from(base58Decode(TOKEN_PROGRAM_ID));
  const data=Buffer.concat([Buffer.from([12]),u64(amount),Buffer.from([6])]);
  return {base64:wire({header:[1,0,2],accounts:[authority,source,dest,mint,token],instructions:[instruction(4,[1,3,2,0],data)]}),destination:base58Encode(dest),mint:base58Encode(mint)};
}
export function setAuthorityFixture() {
  const authority=key(7), target=key(8), token=Buffer.from(base58Decode(TOKEN_PROGRAM_ID));
  const data=Buffer.concat([Buffer.from([6,2,1]),key(9)]);
  return {base64:wire({header:[1,0,1],accounts:[authority,target,token],instructions:[instruction(2,[1,0],data)]})};
}
export function unknownProgramFixture() {
  const authority=key(10), target=key(11), unknown=key(12);
  return {base64:wire({header:[1,0,1],accounts:[authority,target,unknown],instructions:[instruction(2,[0,1],Buffer.from([1,2,3]))]})};
}
export function malformedFixture() { return '!!!!'; }
export { pub };
