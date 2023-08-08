import { base58Encode, TPrivateKey } from '@waves/ts-lib-crypto';
import { allure } from 'allure-mocha/runtime';
import {
  Account,
  Asset,
  Contract,
  invoke,
  LONG,
  NetworkConfig,
  transfer as uTransfer,
} from '@pepe-team/waves-sc-test-utils';
import { getEnvironment } from 'relax-env-json';
import {
  broadcast,
  IDataParams,
  waitForTx,
  data as wavesData,
  IInvokeScriptParams,
  invokeScript,
  transfer,
  nodeInteraction,
} from '@waves/waves-transactions';
import { fetchDetails } from '@waves/node-api-js/cjs/api-node/assets';
const env = getEnvironment();

/** Type for step callback */
type StepCallback = (...args: any[]) => void;

let multisigContract: Contract;
let techUser: Account;

export const setSteps = function (contract: Contract, user: Account) {
  multisigContract = contract;
  techUser = user;
};

export const getMultisigContract = function (): Contract {
  return multisigContract;
};

export const getTechUser = function (): Account {
  return techUser;
};

export const setTxMultisig = async function (
  contractAddress: string,
  txid: string,
  owners: Account[]
) {
  for (let i = 0; i < owners.length; i++) {
    await invoke(
      {
        dApp: multisigContract.dApp,
        call: {
          function: 'confirmTransaction',
          args: [
            { type: 'string', value: contractAddress },
            { type: 'string', value: base58Encode(txid) },
          ],
        },
        payment: [{ assetId: null, amount: env.network.invokeFee }],
      },
      owners[i].privateKey,
      env.network
    );
  }
};

export const setTxSign = async function (
  contractAddress: string,
  txid: string,
  value = true
) {
  let invokeData: IInvokeScriptParams<LONG>;
  switch (multisigContract.name) {
    case 'multisig':
      invokeData = {
        dApp: multisigContract.dApp,
        call: {
          function: 'confirmTransaction',
          args: [
            { type: 'string', value: contractAddress },
            { type: 'string', value: base58Encode(txid) },
          ],
        },
      };
      break;
    default:
      invokeData = {
        dApp: multisigContract.dApp,
        call: {
          function: 'setMultisigParams',
          args: [
            { type: 'string', value: contractAddress },
            { type: 'string', value: base58Encode(txid) },
            { type: 'boolean', value: value },
          ],
        },
      };
  }
  await invoke(invokeData, techUser.privateKey, env.network);
};

export const sendTransaction = async function (tx: any) {
  await broadcast(tx, env.network.nodeAPI);
  const txMined = await waitForTx(tx.id, {
    apiBase: env.network.nodeAPI,
    timeout: env.network.nodeTimeout,
  });
  if (txMined.applicationStatus !== 'succeeded') {
    throw new Error('Transaction failed!');
  }
};

export const prepareDataTx = async function (
  contract: Contract,
  data: IDataParams
) {
  return wavesData(
    {
      data: data.data,
      fee: env.network.invokeFee,
      additionalFee: env.network.additionalFee,
      senderPublicKey: contract.publicKey,
      chainId: env.network.chainID,
    },
    contract.privateKey
  );
};

export const prepareInvokeTx = function (
  params: IInvokeScriptParams<LONG>,
  privateKey: TPrivateKey
) {
  return invokeScript(
    {
      dApp: params.dApp,
      feeAssetId: params.feeAssetId || null,
      call: params.call,
      payment: params.payment,
      fee: params.fee || env.network.invokeFee,
      additionalFee: params.additionalFee,
      chainId: params.chainId || env.network.chainID,
    },
    privateKey
  );
};

export const setSignedContext = async function (
  contract: Contract,
  data: IDataParams
) {
  const tx = await prepareDataTx(contract, data);
  await setTxSign(contract.dApp, tx.id);
  return await sendTransaction(tx);
};

export type Sender = {
  address: string;
  publicKey: string;
  privateKey: string;
};

export const signedTransfer = async function (
  sender: Sender,
  recpAddress: string,
  amount: number,
  assetId: string | null = null
) {
  const tx = transfer(
    {
      recipient: recpAddress,
      amount: amount,
      assetId: assetId,
      fee: env.network.transferFee,
      feeAssetId: null,
      chainId: env.network.chainID,
      senderPublicKey: sender.publicKey,
    },
    { privateKey: sender.privateKey }
  );
  await setTxSign(sender.address, tx.id);
  await sendTransaction(tx);
};

export const setInt = async function (
  contract: Contract,
  user: Account,
  value: LONG
) {
  const params: IInvokeScriptParams<LONG> = {
    dApp: contract.dApp,
    call: {
      function: 'bigintToBinary',
      args: [{ type: 'integer', value: value }],
    },
    payment: [{ assetId: null, amount: env.network.invokeFee }],
  };
  return await invoke(params, user.privateKey, env.network);
};

export const setTCClaim = async function (
  contract_: Contract,
  isRightCaller_: boolean,
  reward_: number,
  compensation_ = env.network.invokeFee,
  fee_ = 0,
  adminAddress_ = multisigContract.dApp
) {
  await invoke(
    {
      dApp: contract_.dApp,
      call: {
        function: 'setClaim',
        args: [
          { type: 'boolean', value: isRightCaller_ },
          { type: 'integer', value: reward_ },
          { type: 'integer', value: compensation_ },
          { type: 'integer', value: fee_ },
          { type: 'string', value: adminAddress_ },
        ],
      },
    },
    { privateKey: contract_.privateKey },
    env.network
  );
};

export const setTCStake = async function (
  contract_: Contract,
  isRightCaller_: boolean
) {
  await invoke(
    {
      dApp: contract_.dApp,
      call: {
        function: 'setStake',
        args: [{ type: 'boolean', value: isRightCaller_ }],
      },
    },
    { privateKey: contract_.privateKey },
    env.network
  );
};

export const resetMintData = async function (techContract_: Contract) {
  return await invoke(
    {
      dApp: techContract_.dApp,
      call: { function: 'resetMintData' },
    },
    techUser.privateKey,
    env.network
  );
};

/**
 * MOVE TO UTILS!!!
 */
export const getAssetInfo = async function (assetId_: string) {
  return await fetchDetails(env.network.nodeAPI, assetId_);
};

export const getAssetContractBalance = async (
  asset: Asset | string,
  account: Contract,
  network: NetworkConfig
): Promise<number> => {
  const assetBalance = await nodeInteraction.assetBalance(
    typeof asset == 'string' ? asset : asset.assetId,
    account.dApp,
    network.nodeAPI
  );
  return parseInt(assetBalance.toString());
};

export const concatenateBytes = (dataArray: Uint8Array[]): Uint8Array => {
  let size = 0;
  dataArray.forEach((i) => {
    size = size + i.length;
  });
  const result = new Uint8Array(size);
  let itemSize = 0;
  for (let i = 0; i < dataArray.length; i++) {
    result.set(dataArray[i], itemSize);
    itemSize = itemSize + dataArray[i].length;
  }
  return result;
};

export const numToUint8Array = (num: number): Uint8Array => {
  const arr = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    arr[i] = num % 256;
    num = Math.floor(num / 256);
  }
  return arr;
};

export const setEventMock = async function (
  chain_: number,
  id_: number,
  result_: boolean,
  techContract_: Contract
) {
  return await invoke(
    {
      dApp: techContract_.dApp,
      call: {
        function: 'setEventConfirmationParams',
        args: [
          { type: 'integer', value: chain_ },
          { type: 'integer', value: id_ },
          { type: 'boolean', value: result_ },
        ],
      },
    },
    techUser.privateKey,
    env.network
  );
};

export const setEventTypeMock = async function (
  chain_: number,
  id_: number,
  type_: string,
  techContract_: Contract
) {
  return await invoke(
    {
      dApp: techContract_.dApp,
      call: {
        function: 'setEventType',
        args: [
          { type: 'integer', value: chain_ },
          { type: 'integer', value: id_ },
          { type: 'string', value: type_ },
        ],
      },
    },
    techUser.privateKey,
    env.network
  );
};

export const setEventDataMock = async function (
  chain_: number,
  id_: number,
  data_: string,
  techContract_: Contract
) {
  return await invoke(
    {
      dApp: techContract_.dApp,
      call: {
        function: 'setEventData',
        args: [
          { type: 'integer', value: chain_ },
          { type: 'integer', value: id_ },
          { type: 'string', value: data_ },
        ],
      },
    },
    techUser.privateKey,
    env.network
  );
};

export const checkEventConfirmation = async function (
  chain_: number,
  id_: number,
  address_: string,
  techContract_: Contract
) {
  return await invoke(
    {
      dApp: techContract_.dApp,
      call: {
        function: 'checkEventConfirmation',
        args: [
          { type: 'integer', value: id_ },
          { type: 'integer', value: chain_ },
          { type: 'string', value: address_ },
        ],
      },
    },
    techUser.privateKey,
    env.network
  );
};

export const checkRawData = async function (
  chain_: number,
  id_: number,
  address_: string,
  techContract_: Contract
) {
  return await invoke(
    {
      dApp: techContract_.dApp,
      call: {
        function: 'checkRawData',
        args: [
          { type: 'integer', value: id_ },
          { type: 'integer', value: chain_ },
          { type: 'string', value: address_ },
        ],
      },
    },
    techUser.privateKey,
    env.network
  );
};

export const resetReleaseTokens = async function (techContract_: Contract) {
  return await invoke(
    {
      dApp: techContract_.dApp,
      call: {
        function: 'resetReleaseTokens',
      },
    },
    techUser.privateKey,
    env.network
  );
};

export const sendMoneyToContract = async function (
  sender_: Account,
  recipient_: Contract,
  amount_: number,
  assetId_: string | null = null
) {
  await uTransfer(
    {
      recipient: recipient_.dApp,
      assetId: assetId_,
      amount: amount_,
    },
    sender_.privateKey,
    env.network
  );
};

/**
 * TO ALLURE STEPS!!!
 */
export const stepCatchErrorWithMessage = async function (
  message: string,
  callback: StepCallback
) {
  let result = false;
  let errMessage = '';
  await allure.step(message, async () => {
    console.log('\n[STEP] ' + message);
    try {
      await callback();
    } catch(err: any) {
      result = true;
      errMessage = err.message;
    }
    console.log('Step complete');
  });
  return {
    isError: result,
    message: errMessage
  };
};
