import { Box } from '@chakra-ui/react';
import GroupProgress from '../GroupProgress';
import { DashboardState } from '../../api/types';

interface SocialTabProps {
  data: DashboardState;
}

const SocialTab = ({ data }: SocialTabProps) => (
  <Box maxW="5xl" mx="auto">
    <GroupProgress data={data.group_progress} />
  </Box>
);

export default SocialTab;
