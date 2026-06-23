const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateCode(len = 6): string {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return out;
}

export function generateEventCodes() {
  return {
    organizerCode: generateCode(6),
    brideCode: generateCode(6),
    groomCode: generateCode(6),
    gateCode: generateCode(6),
  };
}
