import { QueryProvider } from './QueryProvider'

type Props = { children: React.ReactNode }

export function AppProviders({ children }: Props) {
  return <QueryProvider>{children}</QueryProvider>
}
