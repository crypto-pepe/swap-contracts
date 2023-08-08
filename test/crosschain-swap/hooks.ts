import {
  Account,
  Asset,
  Contract,
  createContracts,
  getLastBlockId,
  initAccounts,
  initAssets,
  setAssetsForAccounts,
} from '@pepe-team/waves-sc-test-utils';
import { Context } from 'mocha';
import { getEnvironment } from 'relax-env-json';
import { setSignedContext, setSteps } from '../../steps/common';
import {
  deployMultisigContract,
  setAdditionalContract,
  setTechContract,
} from '../../steps/hooks.common';
import { setContract as setSwapContract } from '../../steps/crosschain.swap';
const env = getEnvironment();

export type TestContext = Mocha.Context & Context;
export type InjectableContext = Readonly<{
  accounts: Account[];
  assets: Asset[];
  contracts: Contract[];
  start_block: string;
}>;

// eslint-disable-next-line @typescript-eslint/no-var-requires
const initData = require('./data/init.json');
const rootSeed: string = initData.rootSeed;

export const mochaHooks = async (): Promise<Mocha.RootHookObject> => {
  return {
    async beforeAll(this: Mocha.Context) {
      const assets = await initAssets(env.assets, rootSeed, env.network);
      console.table(assets);

      const accounts = await initAccounts(
        rootSeed,
        env.accounts,
        env.amountPerAccount,
        env.network
      );
      await setAssetsForAccounts(
        rootSeed,
        accounts,
        assets,
        env.amountPerAsset,
        env.network
      );
      console.table(accounts);

      const init_contracts = createContracts(
        rootSeed,
        env.contracts,
        env.network,
        accounts.length + 1
      );
      const contracts: Contract[] = [];
      const techContract = await setTechContract(
        init_contracts,
        rootSeed,
        'test/crosschain-swap/'
      );
      contracts.push(techContract);
      // set mock contract
      setSteps(techContract, accounts.filter((a) => a.name == 'tech_acc')[0]);

      // Deploy crosschain swap contract
      contracts.push(
        // eslint-disable-next-line prettier/prettier
        // await deployMultisigContract(init_contracts, 'crosschain_swap', rootSeed)
        await setAdditionalContract(init_contracts, rootSeed, '', 'crosschain_swap')
      );
      // eslint-disable-next-line prettier/prettier
      setSwapContract(contracts.filter((f) => f.name == 'crosschain_swap')[0]);

      // Deploy math contract
      // const mathContract = await setAdditionalContract(
      //   init_contracts,
      //   rootSeed,
      //   'test/swap/',
      //   'math'
      // );
      // contracts.push(mathContract);

      console.table(contracts);

      const context: InjectableContext = {
        accounts: accounts,
        assets: assets,
        contracts: contracts,
        start_block: await getLastBlockId(env.network),
      };
      Object.assign(this, context);
    },
  };
};
