import { createInterface } from "node:readline";
import { Writable } from "node:stream";

export function prompt() {
  let muted = false;
  const output = new Writable({
    write(chunk, encoding, done) {
      if (!muted) process.stdout.write(chunk);
      done();
    },
  });
  const rl = createInterface({
    input: process.stdin,
    output,
    terminal: Boolean(process.stdin.isTTY),
  });
  const lines = rl[Symbol.asyncIterator]();
  return {
    async ask(label, secret = false) {
      process.stdout.write(label);
      muted = secret;
      try {
        const line = await lines.next();
        if (line.done)
          throw new Error(
            "Entrada encerrada. Execute novamente para concluir a configuração.",
          );
        return line.value;
      } finally {
        muted = false;
        if (secret) process.stdout.write("\n");
      }
    },
    close() {
      muted = false;
      rl.close();
    },
  };
}
