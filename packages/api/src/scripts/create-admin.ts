/**
 * Creates an admin panel account.
 *
 * Usage: bun run admin:create <email>
 *
 * Prompts for the password when run in a terminal. Otherwise reads the
 * password from the first line of stdin.
 */
import { AdminUserInputError, createAdminUser } from "../common/admin-users.js";

const email = process.argv[2];
if (!email) {
  console.error("Usage: bun run admin:create <email>");
  process.exit(1);
}

try {
  const password = await readPassword();
  const admin = await createAdminUser({ email, password });
  console.log(`Created admin ${admin.email} (${admin.id})`);
  process.exit(0);
} catch (error) {
  if (error instanceof AdminUserInputError) {
    console.error(error.message);
    process.exit(1);
  }
  throw error;
}

async function readPassword(): Promise<string> {
  if (!process.stdin.isTTY) {
    const input = await Bun.stdin.text();
    return input.split(/\r?\n/)[0] ?? "";
  }

  const [password, confirm] = await readHiddenLines([
    "Password: ",
    "Confirm password: ",
  ]);
  if (password !== confirm) {
    throw new AdminUserInputError("Passwords do not match");
  }
  return password ?? "";
}

/** Reads one line per prompt without echo. One raw-mode session, so pasted input is not lost between prompts. */
function readHiddenLines(prompts: string[]): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    const lines: string[] = [];
    let value = "";

    const cleanup = () => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
    };

    const onData = (chunk: string) => {
      for (const char of chunk) {
        if (char === "\r" || char === "\n") {
          process.stdout.write("\n");
          lines.push(value);
          value = "";
          if (lines.length === prompts.length) {
            cleanup();
            resolve(lines);
            return;
          }
          process.stdout.write(prompts[lines.length] ?? "");
          continue;
        }
        if (char === "\u0003") {
          process.stdout.write("\n");
          cleanup();
          reject(new AdminUserInputError("Cancelled"));
          return;
        }
        if (char === "\u007f" || char === "\b") {
          value = value.slice(0, -1);
        } else {
          value += char;
        }
      }
    };

    process.stdout.write(prompts[0] ?? "");
    stdin.setRawMode(true);
    stdin.setEncoding("utf8");
    stdin.resume();
    stdin.on("data", onData);
  });
}
