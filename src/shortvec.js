export function readShortVec(buffer, state) {
  let value = 0;
  let shift = 0;
  for (let i = 0; i < 3; i++) {
    if (state.offset >= buffer.length) throw new Error('Unexpected EOF in shortvec');
    const b = buffer[state.offset++];
    value |= (b & 0x7f) << shift;
    if ((b & 0x80) === 0) return value;
    shift += 7;
  }
  throw new Error('shortvec too large');
}

export function writeShortVec(value) {
  if (!Number.isInteger(value) || value < 0) throw new Error('Invalid shortvec value');
  const out = [];
  let v = value;
  do {
    let b = v & 0x7f;
    v >>>= 7;
    if (v) b |= 0x80;
    out.push(b);
  } while (v);
  return Buffer.from(out);
}
