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

  // Get existing joins to avoid duplicates
  const existingAliases = new Set(
    query.expressionMap.joinAttributes.map((join) => join.alias.name),
  );

  relations.forEach((relationPath) => {
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

        // Check if alias already exists in query
        if (existingAliases.has(alias)) {
          // If it exists and we need select, add select to existing join
          if (select) {
            query.addSelect(alias);
          }
          aliasMap.set(accumulatedPath, alias);
        } else {
          // Create new join
          if (select) {
            query.leftJoinAndSelect(`${parentAlias}.${part}`, alias);
          } else {
            query.leftJoin(`${parentAlias}.${part}`, alias);
          }
          aliasMap.set(accumulatedPath, alias);
          existingAliases.add(alias);
        }
      }

      parentAlias = aliasMap.get(accumulatedPath)!;
    }
  });
}
