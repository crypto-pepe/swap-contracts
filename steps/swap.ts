import { Account, Contract, invoke } from '@pepe-team/waves-sc-test-utils';
import { prepareInvokeTx, sendTransaction, setTxSign } from './common';
import { getEnvironment } from 'relax-env-json';
const env = getEnvironment();

let contract: Contract;

export const setContract = (contract_: Contract) => {
  contract = contract_;
};

export const flipTick = async (
  tick_: number,
  sender_: Account | Contract = contract,
  contract_: Contract = contract
) => {
  // eslint-disable-next-line prettier/prettier
  const privateKey = typeof sender_.privateKey === 'string' ? { privateKey: sender_.privateKey } : sender_.privateKey;
  //   const tx = prepareInvokeTx(
  await invoke(
    {
      dApp: contract.dApp,
      call: {
        function: 'flipTick',
        args: [
          { type: 'integer', value: tick_ },
        ],
      },
    },
    privateKey,
    env.network
  );
//   await setTxSign(contract_.dApp, tx.id);
//   await sendTransaction(tx);
};

export const crossTick = async (
  tick_: number,
  feeGrowthGlobal0_: number,
  feeGrowthGlobal1_: number,
  sender_: Account | Contract = contract,
  contract_: Contract = contract
) => {
  // eslint-disable-next-line prettier/prettier
  const privateKey = typeof sender_.privateKey === 'string' ? { privateKey: sender_.privateKey } : sender_.privateKey;
  const tx = prepareInvokeTx(
    {
      dApp: contract.dApp,
      call: {
        function: 'crossTick',
        args: [
          { type: 'integer', value: tick_ },
          { type: 'integer', value: feeGrowthGlobal0_ },
          { type: 'integer', value: feeGrowthGlobal1_ },
        ],
      },
    },
    privateKey
  );
  await setTxSign(contract_.dApp, tx.id);
  await sendTransaction(tx);
};

export const updateTick = async (
  tick_: number,
  tickCurrent_: number,
  liquidityDelta_: number,
  feeGrowthGlobal0_: number,
  feeGrowthGlobal1_: number,
  upper_: boolean,
  maxLiquidity_: number,
  sender_: Account | Contract = contract,
  contract_: Contract = contract
) => {
  // eslint-disable-next-line prettier/prettier
  const privateKey = typeof sender_.privateKey === 'string' ? { privateKey: sender_.privateKey } : sender_.privateKey;
  const tx = prepareInvokeTx(
    {
      dApp: contract.dApp,
      call: {
        function: 'updateTick',
        args: [
          { type: 'integer', value: tick_ },
          { type: 'integer', value: tickCurrent_ },
          { type: 'integer', value: liquidityDelta_ },
          { type: 'integer', value: feeGrowthGlobal0_ },
          { type: 'integer', value: feeGrowthGlobal1_ },
          { type: 'boolean', value: upper_ },
          { type: 'integer', value: maxLiquidity_ },
        ],
      },
    },
    privateKey
  );
  await setTxSign(contract_.dApp, tx.id);
  await sendTransaction(tx);
};

export const init = async (
  initTick_: number,
  token0_: string,
  token1_: string,
  lpFeeRate_: number,
  protocolFeeRate_: number,
  tickSpacing_: number,
  sender_: Account | Contract = contract,
  contract_: Contract = contract
) => {
  // eslint-disable-next-line prettier/prettier
  const privateKey = typeof sender_.privateKey === 'string' ? { privateKey: sender_.privateKey } : sender_.privateKey;
  await invoke(
    {
      dApp: contract_.dApp,
      call: {
        function: 'init',
        args: [
          { type: 'integer', value: initTick_ },
          { type: 'string', value: token0_ },
          { type: 'string', value: token1_ },
          { type: 'integer', value: lpFeeRate_ },
          { type: 'integer', value: protocolFeeRate_ },
          { type: 'integer', value: tickSpacing_ },
        ],
      },
    },
    privateKey,
    env.network
  );
};

export const mint = async (
  recipient_: string,
  tickLower_: number,
  tickUpper_: number,
  amount_: number,
  payment_: any[] = [],
  sender_: Account | Contract = contract,
  contract_: Contract = contract
) => {
  // eslint-disable-next-line prettier/prettier
  const privateKey = typeof sender_.privateKey === 'string' ? { privateKey: sender_.privateKey } : sender_.privateKey;
  await invoke(
    {
      dApp: contract_.dApp,
      call: {
        function: 'mint',
        args: [
          { type: 'string', value: recipient_ },
          { type: 'integer', value: tickLower_ },
          { type: 'integer', value: tickUpper_ },
          { type: 'integer', value: amount_ },
        ],
      },
      payment: payment_
    },
    privateKey,
    env.network
  );
};

export const burn = async (
  tickLower_: number,
  tickUpper_: number,
  amount_: number,
  sender_: Account | Contract = contract,
  contract_: Contract = contract
) => {
  // eslint-disable-next-line prettier/prettier
  const privateKey = typeof sender_.privateKey === 'string' ? { privateKey: sender_.privateKey } : sender_.privateKey;
  await invoke(
    {
      dApp: contract_.dApp,
      call: {
        function: 'burn',
        args: [
          { type: 'integer', value: tickLower_ },
          { type: 'integer', value: tickUpper_ },
          { type: 'integer', value: amount_ },
        ],
      },
    },
    privateKey,
    env.network
  );
};

export const collect = async (
  recipient_: string,
  tickLower_: number,
  tickUpper_: number,
  amount0_: number,
  amount1_: number,
  sender_: Account | Contract = contract,
  contract_: Contract = contract
) => {
  // eslint-disable-next-line prettier/prettier
  const privateKey = typeof sender_.privateKey === 'string' ? { privateKey: sender_.privateKey } : sender_.privateKey;
  await invoke(
    {
      dApp: contract_.dApp,
      call: {
        function: 'collect',
        args: [
          { type: 'string', value: recipient_ },
          { type: 'integer', value: tickLower_ },
          { type: 'integer', value: tickUpper_ },
          { type: 'integer', value: amount0_ },
          { type: 'integer', value: amount1_ },
        ],
      },
    },
    privateKey,
    env.network
  );
};

export const swap = async (
  recipient_: string,
  zeroForOne_: boolean,
  amountSpecified_: number,
  sqrtPriceLimitX96Str_: string,
  payment_: any[] = [],
  sender_: Account | Contract = contract,
  contract_: Contract = contract
) => {
  // eslint-disable-next-line prettier/prettier
  const privateKey = typeof sender_.privateKey === 'string' ? { privateKey: sender_.privateKey } : sender_.privateKey;
  await invoke(
    {
      dApp: contract_.dApp,
      call: {
        function: 'swap',
        args: [
          { type: 'string', value: recipient_ },
          { type: 'boolean', value: zeroForOne_ },
          { type: 'integer', value: amountSpecified_ },
          { type: 'string', value: sqrtPriceLimitX96Str_ },
        ],
      },
      payment: payment_,
    },
    privateKey,
    env.network
  );
};
