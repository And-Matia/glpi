import { ParseResult, runCsvImport } from '@app/core/utils/csv.utils';
import { ImportStats } from '@app/core/models/import.model';

export abstract class GlpiBaseImportService<T> {

  protected abstract parseFile(file: File): Promise<ParseResult<T>>;
  protected abstract importRow(row: T): Promise<void>;

  async validateFile(file: File): Promise<string[]> {
    try {
      const { errors } = await this.parseFile(file);
      return errors.map(e => `Ligne ${e.row}: ${e.error}`);
    } catch (e) {
      return [e instanceof Error ? e.message : 'Erreur inconnue'];
    }
  }

  importFile(file: File): Promise<ImportStats> {
    return this.parseFile(file).then(parsed =>
      runCsvImport(parsed, row => this.importRow(row))
    );
  }
}
