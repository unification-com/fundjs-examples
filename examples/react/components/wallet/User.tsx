import { ReactNode } from 'react';
import { Box, Text, Stack, useColorModeValue } from '@interchain-ui/react';
import { Astronaut } from './Astronaut';

export type UserProps = {
  name: string;
  icon?: ReactNode;
}

export function User({ name, icon = <Astronaut /> }: UserProps) {
  return <Stack direction="vertical">
    <Box textAlign="center" py="$4" mb="$6">
      <Text color={useColorModeValue("$gray700", "$white")} fontSize="$lg" fontWeight="$medium">{name}</Text>
    </Box>
  </Stack>
}
