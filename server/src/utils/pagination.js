export const parsePagination = (query, { defaultLimit = 20, maxLimit = 100 } = {}) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || defaultLimit, 1), maxLimit);

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

export const buildPaginationMeta = ({ total, page, limit }) => ({
  total,
  page,
  pages: Math.ceil(total / limit),
});

