import { DEBUGGING } from './consts.js';
import { registerHandler as registerConfigurationUpdateHandler, defaultConfiguration, type Configuration } from './config.js';

/**
 * Initialize gist service
 */
export async function init() {
  // Register for configuration updates
  registerConfigurationUpdateHandler(config => {
    // Log: config change
    if (DEBUGGING) console.log('COMMON | gist.ts: Configuration change detected ...');
    // Store configuration
    _config = config;
  });
}

// Holds latest configuration
let _config: Configuration = defaultConfiguration;

/**
 * Exports data into a Gist file
 * @param filename Filename to export to
 * @param data Data to export
 */
export async function writeToGist(filename: string, data: any) {
  // Log: config change
  if (DEBUGGING) console.log('COMMON | gist.ts: Writing to Gist: ', filename, data);
  // Export to gist
  await fetch(`https://api.github.com/gists/${_config.sync.gistId}`, {
    method: 'PATCH',
    headers: [
      ['Accept', 'application/vnd.github+json'],
      ['Authorization', `Bearer ${_config.sync.gistToken}`],
      ['X-GitHub-Api-Version', '2022-11-28'],
    ],
    body: JSON.stringify({
      files: {
        [filename]: { content: await compress(JSON.stringify(data)) },
      },
    }),
  });
}

/**
 * Imports data from a Gist file
 * @param filename  File to import from
 * @returns Data from the requested Gist file
 */
export async function readFromGist(filename: string): Promise<any> {
  // Import from gist
  const data = await (
    await fetch(`https://api.github.com/gists/${_config.sync.gistId}`, {
      method: 'GET',
      headers: [
        ['Accept', 'application/vnd.github+json'],
        ['Authorization', `Bearer ${_config.sync.gistToken}`],
        ['X-GitHub-Api-Version', '2022-11-28'],
      ],
    })
  ).json();
  // Log: config change
  if (DEBUGGING) console.log('COMMON | gist.ts: Read from Gist: ', filename, data);
  // Extract requested file's content
  try {
    if (data.files[filename].content && !data.files[filename].truncated) {
      return JSON.parse(await decompress(data.files[filename].content));
    } else {
      return undefined;
    }
  } catch (err) {
    console.error('ERROR:', err);
    debugger;
    return undefined;
  }
}

async function compress(str: string): Promise<string> {
  // Convert the string to a byte stream.
  const stream = new Blob([str]).stream();

  // Create a compressed stream.
  const compressedStream = stream.pipeThrough(new CompressionStream('gzip'));

  // Read all the bytes from this stream.
  const chunks = [];
  for await (const chunk of compressedStream) {
    chunks.push(chunk);
  }
  return encode(await concatUint8Arrays(chunks));
}

async function decompress(str: string): Promise<string> {
  // Convert the bytes to a stream.
  const compressedBytes = decode(str);
  const stream = new Blob([compressedBytes]).stream();

  // Create a decompressed stream.
  const decompressedStream = stream.pipeThrough(new DecompressionStream('gzip'));

  // Read all the bytes from this stream.
  const chunks = [];
  for await (const chunk of decompressedStream) {
    chunks.push(chunk);
  }
  const stringBytes = await concatUint8Arrays(chunks);

  // Convert the bytes to a string.
  return new TextDecoder().decode(stringBytes);
}

function encode(arr: Uint8Array): string {
  var binary = '';
  var bytes = new Uint8Array(arr);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

function decode(str: string): BlobPart {
  const binary_string = atob(str);
  const len = binary_string.length;
  const bytes = new Uint8Array(new ArrayBuffer(len));
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

async function concatUint8Arrays(uint8arrays: BlobPart[]) {
  const blob = new Blob(uint8arrays);
  const buffer = await blob.arrayBuffer();
  return new Uint8Array(buffer);
}
