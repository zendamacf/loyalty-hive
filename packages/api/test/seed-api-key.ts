import { hash as bcryptHash } from "bcryptjs";

import {
  BCRYPT_COST,
  TEST_API_KEY,
  TEST_API_KEY_INTEGRATION,
} from "../src/common/constants";
import { db } from "../src/db/client";
import { apiKeys } from "../src/db/schema";

export async function seedTestApiKey() {
  const keyHash = await bcryptHash(TEST_API_KEY, BCRYPT_COST);
  await db
    .insert(apiKeys)
    .values({
      integrationName: TEST_API_KEY_INTEGRATION,
      keyHash,
    })
    .onConflictDoUpdate({
      target: apiKeys.integrationName,
      set: { keyHash },
    });
}
