// https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText
import { logger } from '../services/logger';

export const copyContent = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    logger.info('helpers/dom', 'Content copied to clipboard');
  } catch (err) {
    logger.error('helpers/dom', 'Failed to copy', undefined, err instanceof Error ? err : new Error(String(err)));
  }
};
