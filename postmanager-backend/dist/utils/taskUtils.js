export const getTaskOrderBy = () => [
    {
        priority: 'desc'
    },
    {
        order: 'asc'
    },
    {
        createdAt: 'asc'
    }
];
export const getTasksWithPrioritySort = async (prisma, options) => {
    return await prisma.task.findMany({
        ...options,
        orderBy: getTaskOrderBy()
    });
};
//# sourceMappingURL=taskUtils.js.map