import "dotenv/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
// import "@nomiclabs/hardhat-truffle5";
import "@nomiclabs/hardhat-web3";
import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";

import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.4",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      {
        version: "0.6.12",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    // hardhat: {
    //   mining: {
    //     auto: false,
    //     interval: [12000, 15000],
    //   },
    //   initialBaseFeePerGas: 0, // workaround from https://github.com/sc-forks/solidity-coverage/issues/652#issuecomment-896330136 . Remove when that issue is closed.
    //   accounts: {
    //     mnemonic: "test test test test test test test test test test test test",
    //     count: 10,
    //     accountsBalance: "100000000000000000000000000",
    //   },
    //   forking: {
    //     url: "http://10.2.10.1:9991",
    //     // url: process.env.MAINNET_ALCHEMY_URL || '',
    //   },
    //   chainId: 1,
    // },
    kovan: {
      url: process.env.KOVAN_URL || "",
      accounts: [
        "03642949b9cb67c193234f76bf9c5630e720191b639466acccc98f5e4c9697b8",
        "e5b2fbd2e667c55e62bf4e6eba32eb2c5c69f84cb1e38eabb5687c5874bab7ab",
      ],
    },
    rinkeby: {
      url: `https://rinkeby.infura.io/v3/${process.env.INFURA_KEY}`,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
    mainnet: {
      url: "http://127.0.0.1:9991",
    },
  },
  // typechain: {
  //   target: 'truffle-v5',
  // },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
