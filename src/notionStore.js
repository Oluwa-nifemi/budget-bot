const amountOf = (page) => page.properties.Amount.number || 0
const categoryOf = (page) => page.properties.Category?.select?.name || null

export const createStore = ({notion, databaseId}) => {
  const query = (args) => notion.databases.query({database_id: databaseId, ...args})

  return {
    async findByMessageId(id) {
      const {results} = await query({
        filter: {property: "ID", number: {equals: id}}
      })

      return results[0] || null
    },

    async lastExpense() {
      const {results} = await query({
        sorts: [{timestamp: 'created_time', direction: 'descending'}],
        page_size: 1
      })

      return results[0] || null
    },

    create(properties) {
      return notion.pages.create({parent: {database_id: databaseId}, properties})
    },

    update(pageId, properties) {
      return notion.pages.update({page_id: pageId, properties})
    },

    archive(pageId) {
      return notion.pages.update({page_id: pageId, archived: true})
    },

    async categoryOptions() {
      const response = await notion.databases.retrieve({database_id: databaseId})

      return response.properties.Category.select.options
    },

    async expensesSince(startDate) {
      const expenses = []
      let cursor

      do {
        const page = await query({
          filter: {property: "Date", date: {on_or_after: startDate}},
          start_cursor: cursor
        })

        expenses.push(...page.results.map((result) => ({amount: amountOf(result), category: categoryOf(result)})))
        cursor = page.has_more ? page.next_cursor : undefined
      } while (cursor)

      return expenses
    }
  }
}
