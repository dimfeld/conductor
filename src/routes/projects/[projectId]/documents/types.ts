import type { Document } from '$lib/server/db/schema';

export interface DocumentWithContents extends Document {
  contents: string;
}
