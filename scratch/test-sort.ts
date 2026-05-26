import { sortCasesByStatus } from '../src/utils/helpers'
import { ReworkCase } from '../src/services/api'

const mockCases = [
  { id: '1', status: 'Completed' },
  { id: '2', status: 'Pending' },
  { id: '3', status: 'Awaiting Valuation' },
  { id: '4', status: 'In-Progress' },
] as ReworkCase[]

const sorted = sortCasesByStatus(mockCases)
console.log('SORTED:', sorted.map(c => c.status))
