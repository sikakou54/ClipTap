import { createHash } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { setCryptoAdapter } from '../../src/adapters/CryptoAdapter';
import { ImportParserService } from '../../src/services/ImportParserService';
import { buildChecksumPayload, buildPasswordHashInput } from '../../src/utils/exportImportUtils';
import {
  InvalidFileFormatError,
  VersionMismatchError,
} from '../../src/errors';

const sha256 = async (input: string): Promise<string> =>
  createHash('sha256').update(input).digest('hex');

const encodeDoubleBase64 = (bytes: Uint8Array): string => {
  const base64 = Buffer.from(bytes).toString('base64');
  return Buffer.from(base64, 'utf8').toString('base64');
};

async function buildExportData(bytes: Uint8Array, schemaVersion = 7) {
  const password = 'test';
  const data = {
    s: schemaVersion,
    t: '2026-08-04T00:00:00.000Z',
    h: await sha256(buildPasswordHashInput(password, schemaVersion)),
    d: encodeDoubleBase64(bytes),
  };
  return {
    password,
    json: JSON.stringify({ ...data, c: await sha256(buildChecksumPayload(data)) }),
  };
}

describe('ImportParserService.parseAndValidate', () => {
  beforeAll(() => setCryptoAdapter({ sha256 }));

  it('accepts a checksummed SQLite payload', async () => {
    const bytes = new Uint8Array(32);
    bytes.set(Buffer.from('SQLite format 3\0', 'binary'));
    const fixture = await buildExportData(bytes);

    const result = await new ImportParserService().parseAndValidate(fixture.json, fixture.password);

    expect(result.dbBytes).toEqual(bytes);
  });

  it('rejects a missing checksum as an invalid format', async () => {
    await expect(new ImportParserService().parseAndValidate(
      JSON.stringify({ s: 7, t: '', h: '', d: '' }),
      'test',
    )).rejects.toBeInstanceOf(InvalidFileFormatError);
  });

  it('rejects a decoded payload without the SQLite header', async () => {
    const fixture = await buildExportData(new Uint8Array([1, 2, 3]));
    await expect(new ImportParserService().parseAndValidate(fixture.json, fixture.password))
      .rejects.toBeInstanceOf(InvalidFileFormatError);
  });

  it('rejects schema versions older than V3', async () => {
    const bytes = new Uint8Array(16);
    bytes.set(Buffer.from('SQLite format 3\0', 'binary'));
    const fixture = await buildExportData(bytes, 2);
    await expect(new ImportParserService().parseAndValidate(fixture.json, fixture.password))
      .rejects.toBeInstanceOf(VersionMismatchError);
  });
});
