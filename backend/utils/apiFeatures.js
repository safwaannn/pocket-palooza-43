/**
 * ============================================================================
 * APIFeatures — turns URL query strings into Mongoose queries
 * ============================================================================
 *
 * Lets a client shape the response purely from the URL:
 *
 *   /api/v1/transactions?type=expense&amount[gte]=500&sort=-date&fields=amount,date&page=2&limit=20
 *   \_____________________________/ \______________/ \_______/ \_____________/ \_____________/
 *              filter()                                 sort()    limitFields()   paginate()
 *
 * KEY IDEA — LAZY QUERIES: a Mongoose query is not executed when built. Each
 * method here adds one more instruction to `this.query`, and the caller awaits
 * it at the very end — the DB is contacted exactly once. Every method returns
 * `this` so the calls chain.
 */
class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  /**
   * FILTERING — ?type=expense&amount[gte]=500
   *
   * JOB A: strip the params that are not filters (page, sort, limit, fields).
   * JOB B: translate URL operators into Mongo operators, via an ALLOW-LIST.
   *
   * We do NOT use the stringify → regex-replace → parse trick: it can corrupt
   * legitimate string values and, worse, forwards ANY operator the client
   * invents — including `$where` (server-side JS) or `$ne` (auth bypass). An
   * allow-list can never be tricked into passing something we didn't approve.
   */
  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // $ne / $nin / $where are deliberately absent — `?role[ne]=admin` is a
    // well-known NoSQL-injection pattern for slipping past filters.
    const ALLOWED_OPERATORS = ['gte', 'gt', 'lte', 'lt', 'in', 'nin'];
    const mongoFilter = {};

    Object.entries(queryObj).forEach(([field, value]) => {
      // Case 1: plain equality, e.g. ?type=expense
      if (value === null || typeof value !== 'object') {
        mongoFilter[field] = value;
        return;
      }

      // Case 2: an operator object, e.g. ?amount[gte]=500 → { gte: '500' }
      const operators = {};
      Object.entries(value).forEach(([op, opValue]) => {
        if (!ALLOWED_OPERATORS.includes(op)) return; // silently ignore
        if (op === 'in' || op === 'nin') {
          operators[`$${op}`] = Array.isArray(opValue) ? opValue : [opValue];
        } else {
          operators[`$${op}`] = opValue;
        }
      });

      if (Object.keys(operators).length > 0) mongoFilter[field] = operators;
    });

    // Mongoose casts strings to the schema type, so '500' becomes the number
    // 500 automatically — we don't convert by hand here.
    this.query = this.query.find(mongoFilter);
    return this;
  }

  /**
   * SORTING — ?sort=-date,amount  (comma-separated; leading `-` = descending)
   * Default is `-_id` (newest first, stable) — never a field that may not
   * exist on every document, which would make pagination unstable.
   */
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-_id');
    }
    return this;
  }

  /**
   * FIELD LIMITING / PROJECTION — ?fields=amount,date
   * The default strips `__v`, Mongoose's internal version key, which is useless
   * to API clients.
   */
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  /**
   * PAGINATION — ?page=2&limit=20
   *
   * Clamped: max 100 per page (a `?limit=999999` would otherwise try to load
   * the whole collection into memory — a cheap DoS), min page 1, floored to
   * integers. `(page - 1) * limit` — the parentheses matter: without them
   * operator precedence computes `page - (1 * limit)`.
   */
  paginate() {
    const MAX_LIMIT = 100;
    const page = Math.max(1, Math.floor(this.queryString.page * 1) || 1);
    const limit = Math.min(
      MAX_LIMIT,
      Math.max(1, Math.floor(this.queryString.limit * 1) || 100),
    );
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);
    this.page = page;
    this.limit = limit;
    return this;
  }
}

module.exports = APIFeatures;
