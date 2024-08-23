import { StorageFacade } from '@icure/ehr-lite-sdk'
import localforage from 'localforage'

class AppStorage implements StorageFacade<string> {
  async getItem(key: string): Promise<string | undefined> {
    return (await localforage.getItem(key)) ?? undefined
  }
  async setItem(key: string, valueToStore: string): Promise<void> {
    await localforage.setItem(key, valueToStore)
  }
  removeItem(key: string): Promise<void> {
    return localforage.removeItem(key)
  }
}

export default new AppStorage()
