import {useState} from "react";

export const usePagination = (items: [], page = 1, perPage = 10) => {
    const [activePage, setActivePage] = useState(page)
    const totalPages = Math.ceil(items.length / perPage)
    const offset = perPage * (activePage - 1)
    const paginatedItems = items.slice(offset, perPage * activePage)

    return {
        activePage,
        nextPage: ()=> setActivePage(p => p < totalPages ? p + 1 : p),
        previousPage: ()=> setActivePage(p => p > 1 ? p - 1 : p),
        totalPages,
        totalItems: items.length,
        items: paginatedItems,
    }
}
