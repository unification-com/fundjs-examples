import {
  Box,
  Text,
  Stack,
} from "@interchain-ui/react";
import logo from '../../public/unification_icon_white_plain_100x100.png'

export function Header() {

  return (
    <>
      <Box
        textAlign="center"
        display={"flex"}
        alignItems={"center"}
        justifyContent={"center"}
        gap={"10px"}
      >
        <Box>
          <Stack direction="horizontal" >
            <img src={logo.src} alt="Logo" width={75} height={75} />
            <Text
                as="h1"
                fontWeight="$extrabold"
                fontSize={{mobile: "$2xl", tablet: "$10xl"}}
                attributes={{
                  marginBottom: "$1",
                }}
            >
              Payment Streams
            </Text>
          </Stack>
        </Box>
      </Box>
    </>
  );
}
