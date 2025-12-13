import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

interface ApplyRelationsOptions {
  /**
   * Root alias of the query builder (e.g. 'room')
   */
  rootAlias: string;

  /**
   * Allowed relations relative to root
   * Example:
   * [
   *   'contracts',
   *   'contracts.status',
   *   'contracts.status.type'
   * ]
   */
  allowedRelations?: string[];

  /**
   * If true → use leftJoin (no select)
   * If false → leftJoinAndSelect
   */
  select?: boolean;
}

export function applyRelations<T extends ObjectLiteral>(
  query: SelectQueryBuilder<T>,
  relations: string[],
  options: ApplyRelationsOptions,
) {
  const { rootAlias, allowedRelations, select = true } = options;

  const aliasMap = new Map<string, string>();

  relations.forEach((relationPath) => {
    // ---------- Allow-list validation ----------
    if (
      allowedRelations &&
      !allowedRelations.some(
        (allowed) =>
          relationPath === allowed || relationPath.startsWith(`${allowed}.`),
      )
    ) {
      throw new Error(`Relation "${relationPath}" is not allowed`);
    }

    const parts = relationPath.split('.');
    let parentAlias = rootAlias;
    let accumulatedPath = '';

    for (const part of parts) {
      accumulatedPath = accumulatedPath ? `${accumulatedPath}.${part}` : part;

      if (!aliasMap.has(accumulatedPath)) {
        const alias = accumulatedPath.replace(/\./g, '_');

        if (select) {
          query.leftJoinAndSelect(`${parentAlias}.${part}`, alias);
        } else {
          query.leftJoin(`${parentAlias}.${part}`, alias);
        }

        aliasMap.set(accumulatedPath, alias);
      }

      parentAlias = aliasMap.get(accumulatedPath)!;
    }
  });
}
