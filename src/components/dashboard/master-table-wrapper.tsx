import { fetchHierarchicalMasterData } from '@/lib/services/master-table-data'
import { MasterTableClient } from './master-table-client'

export async function MasterTableWrapper() {
  const data = await fetchHierarchicalMasterData()
  
  return <MasterTableClient initialData={data} />
}