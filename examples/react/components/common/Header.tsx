import {
  Link,
  Box,
  Button,
  Icon,
  Text,
  useTheme,
  useColorModeValue,
} from '@interchain-ui/react';
import { dependencies } from '@/config';

const stacks = ['Cosmos Kit', 'Next.js', 'fundjs'];

const stargazejs = dependencies[0];

export function Header() {
  const { theme, setTheme } = useTheme();

  const toggleColorMode = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <>
      <Box display="flex" justifyContent="end" mb="$1">
        <Button
          intent="secondary"
          size="sm"
          attributes={{
            paddingX: 0,
          }}
          onClick={toggleColorMode}
        >
          <Icon name={useColorModeValue('moonLine', 'sunLine')} />
        </Button>
      </Box>

      <Box textAlign="center">
        <Text
          as="h1"
          fontWeight="$extrabold"
          fontSize={{ mobile: '$2xl', tablet: '$5xl' }}
          attributes={{
            marginBottom: '$1',
          }}
        >
          Payment Streams Example UI
        </Text>
      </Box>
    </>
  );
}
