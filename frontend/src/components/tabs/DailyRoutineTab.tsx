import { Grid, GridItem } from '@chakra-ui/react'
import type { User } from '@/types'
import StackedTasksBoard from '../StackedTasksBoard'

interface DailyRoutineTabProps {
  user?: User
}

const DailyRoutineTab = ({ user }: DailyRoutineTabProps) => {
  return (
    <Grid templateColumns={{ base: '1fr', lg: '1fr' }} gap={{ base: 6, lg: 8 }} alignItems="stretch">
      <GridItem colSpan={1}>
        <StackedTasksBoard />
      </GridItem>
    </Grid>
  )
}

export default DailyRoutineTab
